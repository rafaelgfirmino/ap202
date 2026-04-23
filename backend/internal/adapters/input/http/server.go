package http

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"time"

	"ap202/internal/adapters/input/http/handlers"
	httpmiddleware "ap202/internal/adapters/input/http/middleware"
	"ap202/internal/adapters/output/postgres"
	"ap202/internal/adapters/output/viacep"
	"ap202/internal/authz"
	"ap202/internal/ports"
	"ap202/internal/ports/input"
	"ap202/internal/ports/output"
	"ap202/internal/usecase"
)

type HTTPServer struct {
	port                  int
	authMiddleware        *httpmiddleware.AuthMiddleware
	condominiumMiddleware *httpmiddleware.CondominiumMiddleware
	homeHandler           *handlers.HomeHandler
	healthHandler         *handlers.HealthHandler
	addressHandler        *handlers.AddressHandler
	condominiumHandler    *handlers.CondominiumHandler
	unitHandler           *handlers.UnitHandler
	unitGroupHandler      *handlers.UnitGroupHandler
	chargeHandler         *handlers.ChargeHandler
	expenseHandler        *handlers.ExpenseHandler
	memberHandler         *handlers.MemberHandler
	userHandler           *handlers.UserHandler
	permissionHandler     *handlers.PermissionHandler
	roleHandler           *handlers.RoleHandler
	assignmentHandler     *handlers.AssignmentHandler
	tenantHandler         *handlers.TenantHandler
}

func NewHTTPServer(
	port int,
	authMiddleware *httpmiddleware.AuthMiddleware,
	condominiumMiddleware *httpmiddleware.CondominiumMiddleware,
	healthService input.HealthService,
	addressService input.AddressService,
	condominiumService input.CondominiumService,
	unitService input.UnitService,
	unitGroupService input.UnitGroupService,
	chargeService input.ChargeService,
	expenseService input.ExpenseService,
	memberService input.MemberService,
	userService input.UserService,
	permissionService input.PermissionService,
	roleService input.RoleService,
	assignmentService input.AssignmentService,
	tenantService input.TenantService,
) *HTTPServer {
	return &HTTPServer{
		port:                  port,
		authMiddleware:        authMiddleware,
		condominiumMiddleware: condominiumMiddleware,
		homeHandler:           handlers.NewHomeHandler(),
		healthHandler:         handlers.NewHealthHandler(healthService),
		addressHandler:        handlers.NewAddressHandler(addressService),
		condominiumHandler:    handlers.NewCondominiumHandler(condominiumService),
		unitHandler:           handlers.NewUnitHandler(unitService),
		unitGroupHandler:      handlers.NewUnitGroupHandler(unitGroupService),
		chargeHandler:         handlers.NewChargeHandler(chargeService),
		expenseHandler:        handlers.NewExpenseHandler(expenseService),
		memberHandler:         handlers.NewMemberHandler(memberService),
		userHandler:           handlers.NewUserHandler(userService),
		permissionHandler:     handlers.NewPermissionHandler(permissionService),
		roleHandler:           handlers.NewRoleHandler(roleService),
		assignmentHandler:     handlers.NewAssignmentHandler(assignmentService),
		tenantHandler:         handlers.NewTenantHandler(tenantService),
	}
}

func NewServer(port int, dbConfig output.DatabaseConfig) (*http.Server, func() error, error) {
	postgresAdapter, err := postgres.NewPostgresAdapter(dbConfig)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to create postgres adapter: %w", err)
	}

	services := []ports.Initializable{
		postgresAdapter,
	}

	for _, svc := range services {
		log.Printf("Initializing %s...", svc.Name())
		if err := svc.Init(); err != nil {
			_ = postgresAdapter.Close()
			return nil, nil, fmt.Errorf("failed to initialize %s: %w", svc.Name(), err)
		}
		log.Printf("%s initialized successfully", svc.Name())
	}

	// Authorization/PAP repositories and use cases
	permissionRepo := postgres.NewPermissionRepository(postgresAdapter.DB())
	authzRoleRepo := postgres.NewAuthzRoleRepository(postgresAdapter.DB())
	authzAssignmentRepo := postgres.NewAuthzAssignmentRepository(postgresAdapter.DB())
	authzBundleRepo := postgres.NewAuthorizationBundleRepository(postgresAdapter.DB())
	authzEngine, err := authz.NewEngine(context.Background(), "policies/authz.rego")
	if err != nil {
		_ = postgresAdapter.Close()
		return nil, nil, fmt.Errorf("failed to create authorization engine: %w", err)
	}
	authzBundleUseCase := usecase.NewAuthorizationBundleUseCase(authzBundleRepo, authzEngine)
	authorizer := authz.NewAuthorizer(authzEngine)
	permissionUseCase := usecase.NewPermissionUseCase(permissionRepo, authzRoleRepo, authzBundleRepo, authzBundleUseCase)
	roleUseCase := usecase.NewAuthzRoleUseCase(authzRoleRepo, permissionRepo, authzBundleUseCase)
	assignmentUseCase := usecase.NewAuthzAssignmentUseCase(authzAssignmentRepo, authzRoleRepo, authzBundleUseCase)
	tenantUseCase := usecase.NewTenantUseCase(authzRoleRepo, authzBundleUseCase)

	if err := roleUseCase.EnsureSeedRoles(context.Background()); err != nil {
		_ = postgresAdapter.Close()
		return nil, nil, fmt.Errorf("failed to seed authorization roles: %w", err)
	}
	if err := permissionUseCase.EnsureSeedPermissions(context.Background()); err != nil {
		_ = postgresAdapter.Close()
		return nil, nil, fmt.Errorf("failed to seed authorization permissions: %w", err)
	}
	if err := authzBundleUseCase.Rebuild(context.Background()); err != nil {
		_ = postgresAdapter.Close()
		return nil, nil, fmt.Errorf("failed to refresh authorization bundle after seeding: %w", err)
	}

	// Health use case
	healthUseCase := usecase.NewHealthUseCase(postgresAdapter)

	// Authorization repository
	authorizationRepo := postgres.NewAssociationRepository(postgresAdapter.DB())

	// Charge repository
	chargeRepo := postgres.NewChargeRepository(postgresAdapter.DB())

	// Unit group repository
	unitGroupRepo := postgres.NewUnitGroupRepository(postgresAdapter.DB())

	// Condominium repository and use case
	condoRepo := postgres.NewCondominiumRepository(postgresAdapter.DB())
	condominiumGuard := authz.NewCondominiumGuard(authorizer, condoRepo)
	zipCodeLookupClient := viacep.NewZipCodeLookupClient(&http.Client{Timeout: 5 * time.Second})
	addressUseCase := usecase.NewAddressUseCase(zipCodeLookupClient)
	condoUseCase := usecase.NewCondominiumUseCaseWithAuthAndCharges(condoRepo, authorizationRepo, chargeRepo)

	// Unit repository and use case
	unitRepo := postgres.NewUnitRepository(postgresAdapter.DB())
	unitUseCase := usecase.NewUnitUseCase(unitRepo, unitGroupRepo, authorizationRepo, condoRepo)

	// Unit group use case
	unitGroupUseCase := usecase.NewUnitGroupUseCase(unitGroupRepo, unitRepo, authorizationRepo, condoRepo)

	// Charge use case
	chargeUseCase := usecase.NewChargeUseCase(chargeRepo, condoRepo, condominiumGuard)

	// Expense repository and use case
	expenseRepo := postgres.NewExpenseRepository(postgresAdapter.DB())
	expenseUseCase := usecase.NewExpenseUseCase(expenseRepo, condoRepo, condominiumGuard)

	// User repository and use case
	userRepo := postgres.NewUserRepository(postgresAdapter.DB())
	userUseCase := usecase.NewUserUseCase(userRepo)

	// Member use case
	memberUseCase := usecase.NewMemberUseCase(postgresAdapter.DB(), authorizationRepo, userRepo, unitRepo, condoRepo)

	// Auth middleware
	authMiddleware, err := httpmiddleware.NewAuthMiddleware(userUseCase)
	if err != nil {
		_ = postgresAdapter.Close()
		return nil, nil, fmt.Errorf("failed to create auth middleware: %w", err)
	}
	condominiumMiddleware := httpmiddleware.NewCondominiumMiddleware(condoRepo)

	httpServer := NewHTTPServer(
		port,
		authMiddleware,
		condominiumMiddleware,
		healthUseCase,
		addressUseCase,
		condoUseCase,
		unitUseCase,
		unitGroupUseCase,
		chargeUseCase,
		expenseUseCase,
		memberUseCase,
		userUseCase,
		permissionUseCase,
		roleUseCase,
		assignmentUseCase,
		tenantUseCase,
	)

	return httpServer.Start(), postgresAdapter.Close, nil
}

func (s *HTTPServer) Start() *http.Server {
	server := &http.Server{
		Addr:         fmt.Sprintf(":%d", s.port),
		Handler:      s.RegisterRoutes(),
		IdleTimeout:  time.Minute,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
	}

	return server
}
