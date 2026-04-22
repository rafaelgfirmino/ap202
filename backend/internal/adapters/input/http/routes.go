package http

import (
	"net/http"

	httpmiddleware "ap202/internal/adapters/input/http/middleware"
)

// RegisterRoutes monta o roteador HTTP principal da aplicacao.
func (s *HTTPServer) RegisterRoutes() http.Handler {
	mux := http.NewServeMux()

	s.registerPublicRoutes(mux)
	s.registerCondominiumRoutes(mux)
	s.registerUnitGroupRoutes(mux)
	s.registerUnitRoutes(mux)
	s.registerChargeRoutes(mux)
	s.registerExpenseRoutes(mux)
	s.registerMemberRoutes(mux)
	s.registerUserRoutes(mux)
	s.registerAuthzRoutes(mux)

	return httpmiddleware.CORS(mux)
}

// registerPublicRoutes registra endpoints publicos e de entrada basica da API.
func (s *HTTPServer) registerPublicRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/", s.homeHandler.HelloWorld)
	mux.HandleFunc("/health", s.healthHandler.Health)
	mux.Handle("GET /condominiums", http.HandlerFunc(s.condominiumHandler.Create))
	mux.Handle("POST /condominiums", s.requireAuth(s.condominiumHandler.Create))
	mux.HandleFunc("/condominiums/", s.condominiumHandler.GetByID)
}

// registerCondominiumRoutes registra operacoes autenticadas do dominio de condominios.
func (s *HTTPServer) registerCondominiumRoutes(mux *http.ServeMux) {
	mux.Handle("GET /api/v1/condominiums/{code}", s.requireCondominiumAuth(s.condominiumHandler.GetByCode))
	mux.Handle("PATCH /api/v1/condominiums/{code}/fee-rule", s.requireCondominiumAuth(s.condominiumHandler.UpdateFeeRule))
	mux.Handle("PATCH /api/v1/condominiums/{code}/land-area", s.requireCondominiumAuth(s.condominiumHandler.UpdateLandArea))
	mux.Handle("GET /api/v1/me/condominiums", s.requireAuth(s.condominiumHandler.ListMine))
}

// registerUnitGroupRoutes registra operacoes autenticadas de grupos de unidades.
func (s *HTTPServer) registerUnitGroupRoutes(mux *http.ServeMux) {
	mux.Handle("POST /api/v1/condominiums/{code}/unit-groups", s.requireCondominiumAuth(s.unitGroupHandler.Create))
	mux.Handle("GET /api/v1/condominiums/{code}/unit-groups", s.requireCondominiumAuth(s.unitGroupHandler.List))
	mux.Handle("PUT /api/v1/condominiums/{code}/unit-groups/{id}", s.requireCondominiumAuth(s.unitGroupHandler.Update))
	mux.Handle("DELETE /api/v1/condominiums/{code}/unit-groups/{id}", s.requireCondominiumAuth(s.unitGroupHandler.Delete))
}

// registerUnitRoutes registra operacoes autenticadas relacionadas as unidades.
func (s *HTTPServer) registerUnitRoutes(mux *http.ServeMux) {
	mux.Handle("POST /api/v1/condominiums/{code}/units", s.requireCondominiumAuth(s.unitHandler.Create))
	mux.Handle("GET /api/v1/condominiums/{code}/units", s.requireCondominiumAuth(s.unitHandler.List))
	mux.Handle("GET /api/v1/condominiums/{code}/units/{id}", s.requireCondominiumAuth(s.unitHandler.GetByID))
	mux.Handle("PATCH /api/v1/condominiums/{code}/units/{id}/private-area", s.requireCondominiumAuth(s.unitHandler.UpdatePrivateArea))
	mux.Handle("DELETE /api/v1/condominiums/{code}/units/{id}", s.requireCondominiumAuth(s.unitHandler.Delete))
}

// registerChargeRoutes registra operacoes autenticadas de lancamento de cobrancas.
func (s *HTTPServer) registerChargeRoutes(mux *http.ServeMux) {
	mux.Handle("POST /api/v1/condominiums/{code}/charges", s.requireCondominiumAuth(s.chargeHandler.Create))
}

// registerExpenseRoutes registra operacoes autenticadas de despesas, fechamento e configuracoes financeiras.
func (s *HTTPServer) registerExpenseRoutes(mux *http.ServeMux) {
	mux.Handle("POST /api/v1/condominiums/{code}/expenses", s.requireCondominiumAuth(s.expenseHandler.CreateExpense))
	mux.Handle("GET /api/v1/condominiums/{code}/expenses", s.requireCondominiumAuth(s.expenseHandler.ListExpenses))
	mux.Handle("POST /api/v1/condominiums/{code}/expenses/{id}/reverse", s.requireCondominiumAuth(s.expenseHandler.ReverseExpense))
	mux.Handle("GET /api/v1/condominiums/{code}/closing/preview", s.requireCondominiumAuth(s.expenseHandler.PreviewClosing))
	mux.Handle("POST /api/v1/condominiums/{code}/closing", s.requireCondominiumAuth(s.expenseHandler.CloseMonth))
	mux.Handle("DELETE /api/v1/condominiums/{code}/closing/{month}", s.requireCondominiumAuth(s.expenseHandler.ReopenMonth))
	mux.Handle("GET /api/v1/condominiums/{code}/settings/reserve-fund", s.requireCondominiumAuth(s.expenseHandler.GetReserveFundSetting))
	mux.Handle("PUT /api/v1/condominiums/{code}/settings/reserve-fund", s.requireCondominiumAuth(s.expenseHandler.UpdateReserveFundSetting))
}

// registerMemberRoutes registra operacoes autenticadas de membros vinculados as unidades.
func (s *HTTPServer) registerMemberRoutes(mux *http.ServeMux) {
	mux.Handle("POST /api/v1/condominiums/{code}/units/{unit_code}/members", s.requireCondominiumAuth(s.memberHandler.Add))
	mux.Handle("GET /api/v1/condominiums/{code}/units/{unit_code}/members", s.requireCondominiumAuth(s.memberHandler.List))
	mux.Handle("DELETE /api/v1/condominiums/{code}/units/{unit_code}/members/{bond_id}", s.requireCondominiumAuth(s.memberHandler.Remove))
}

// registerUserRoutes registra operacoes autenticadas do usuario logado.
func (s *HTTPServer) registerUserRoutes(mux *http.ServeMux) {
	mux.Handle("/api/v1/me", s.requireAuth(s.userHandler.Me))
}

func (s *HTTPServer) registerAuthzRoutes(mux *http.ServeMux) {
	mux.Handle("POST /api/v1/authz/permissions", http.HandlerFunc(s.permissionHandler.Create))
	mux.Handle("GET /api/v1/authz/permissions", http.HandlerFunc(s.permissionHandler.List))
	mux.Handle("POST /api/v1/authz/permissions/sync", http.HandlerFunc(s.permissionHandler.Sync))
	mux.Handle("GET /api/v1/authz/permissions/{id}", http.HandlerFunc(s.permissionHandler.GetByID))
	mux.Handle("DELETE /api/v1/authz/permissions/{id}", http.HandlerFunc(s.permissionHandler.Delete))

	mux.Handle("POST /api/v1/authz/roles", http.HandlerFunc(s.roleHandler.Create))
	mux.Handle("GET /api/v1/authz/roles", http.HandlerFunc(s.roleHandler.List))
	mux.Handle("GET /api/v1/authz/roles/{id}", http.HandlerFunc(s.roleHandler.GetByID))
	mux.Handle("DELETE /api/v1/authz/roles/{id}", http.HandlerFunc(s.roleHandler.Delete))
	mux.Handle("POST /api/v1/authz/roles/{id}/permissions/{permissionID}", http.HandlerFunc(s.roleHandler.AssignPermission))
	mux.Handle("DELETE /api/v1/authz/roles/{id}/permissions/{permissionID}", http.HandlerFunc(s.roleHandler.RemovePermission))

	mux.Handle("POST /api/v1/authz/assignments", http.HandlerFunc(s.assignmentHandler.Assign))
	mux.Handle("DELETE /api/v1/authz/assignments", http.HandlerFunc(s.assignmentHandler.Revoke))
	mux.Handle("GET /api/v1/authz/users/{userID}/roles", http.HandlerFunc(s.assignmentHandler.ListByUser))

	mux.Handle("POST /tenants/{tenantID}/setup", http.HandlerFunc(s.tenantHandler.Setup))
}

// requireAuth aplica o middleware de autenticacao sobre um handler HTTP.
func (s *HTTPServer) requireAuth(handlerFunc http.HandlerFunc) http.Handler {
	return s.authMiddleware.RequireAuth(handlerFunc)
}

func (s *HTTPServer) requireCondominiumAuth(handlerFunc http.HandlerFunc) http.Handler {
	return s.authMiddleware.RequireAuth(s.condominiumMiddleware.RequireCondominiumCode(handlerFunc))
}
