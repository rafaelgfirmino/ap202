package http

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"ap202/internal/adapters/input/http/handlers"
	httpmiddleware "ap202/internal/adapters/input/http/middleware"
	"ap202/internal/adapters/output/postgres"
	"ap202/internal/ports"
	"ap202/internal/ports/input"
	"ap202/internal/ports/output"
	"ap202/internal/usecase"
)

type HTTPServer struct {
	port               int
	authMiddleware     *httpmiddleware.AuthMiddleware
	homeHandler        *handlers.HomeHandler
	healthHandler      *handlers.HealthHandler
	condominiumHandler *handlers.CondominiumHandler
	unitHandler        *handlers.UnitHandler
	unitGroupHandler   *handlers.UnitGroupHandler
	chargeHandler      *handlers.ChargeHandler
	expenseHandler     *handlers.ExpenseHandler
	memberHandler      *handlers.MemberHandler
	userHandler        *handlers.UserHandler
}

func NewHTTPServer(
	port int,
	authMiddleware *httpmiddleware.AuthMiddleware,
	healthService input.HealthService,
	condominiumService input.CondominiumService,
	unitService input.UnitService,
	unitGroupService input.UnitGroupService,
	chargeService input.ChargeService,
	expenseService input.ExpenseService,
	memberService input.MemberService,
	userService input.UserService,
) *HTTPServer {
	return &HTTPServer{
		port:               port,
		authMiddleware:     authMiddleware,
		homeHandler:        handlers.NewHomeHandler(),
		healthHandler:      handlers.NewHealthHandler(healthService),
		condominiumHandler: handlers.NewCondominiumHandler(condominiumService),
		unitHandler:        handlers.NewUnitHandler(unitService),
		unitGroupHandler:   handlers.NewUnitGroupHandler(unitGroupService),
		chargeHandler:      handlers.NewChargeHandler(chargeService),
		expenseHandler:     handlers.NewExpenseHandler(expenseService),
		memberHandler:      handlers.NewMemberHandler(memberService),
		userHandler:        handlers.NewUserHandler(userService),
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
	condoUseCase := usecase.NewCondominiumUseCaseWithAuthAndCharges(condoRepo, authorizationRepo, chargeRepo)

	// Unit repository and use case
	unitRepo := postgres.NewUnitRepository(postgresAdapter.DB())
	unitUseCase := usecase.NewUnitUseCase(unitRepo, unitGroupRepo, authorizationRepo, condoRepo)

	// Unit group use case
	unitGroupUseCase := usecase.NewUnitGroupUseCase(unitGroupRepo, unitRepo, authorizationRepo, condoRepo)

	// Charge use case
	chargeUseCase := usecase.NewChargeUseCase(chargeRepo, authorizationRepo, condoRepo)

	// Expense repository and use case
	expenseRepo := postgres.NewExpenseRepository(postgresAdapter.DB())
	expenseUseCase := usecase.NewExpenseUseCase(expenseRepo, authorizationRepo, condoRepo)

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

	httpServer := NewHTTPServer(
		port,
		authMiddleware,
		healthUseCase,
		condoUseCase,
		unitUseCase,
		unitGroupUseCase,
		chargeUseCase,
		expenseUseCase,
		memberUseCase,
		userUseCase,
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
