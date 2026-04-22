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
	mux.Handle("GET /api/v1/condominiums/{code}", s.requireAuth(s.condominiumHandler.GetByCode))
	mux.Handle("PATCH /api/v1/condominiums/{code}/fee-rule", s.requireAuth(s.condominiumHandler.UpdateFeeRule))
	mux.Handle("PATCH /api/v1/condominiums/{code}/land-area", s.requireAuth(s.condominiumHandler.UpdateLandArea))
	mux.Handle("GET /api/v1/me/condominiums", s.requireAuth(s.condominiumHandler.ListMine))
}

// registerUnitGroupRoutes registra operacoes autenticadas de grupos de unidades.
func (s *HTTPServer) registerUnitGroupRoutes(mux *http.ServeMux) {
	mux.Handle("POST /api/v1/condominiums/{code}/unit-groups", s.requireAuth(s.unitGroupHandler.Create))
	mux.Handle("GET /api/v1/condominiums/{code}/unit-groups", s.requireAuth(s.unitGroupHandler.List))
	mux.Handle("PUT /api/v1/condominiums/{code}/unit-groups/{id}", s.requireAuth(s.unitGroupHandler.Update))
	mux.Handle("DELETE /api/v1/condominiums/{code}/unit-groups/{id}", s.requireAuth(s.unitGroupHandler.Delete))
}

// registerUnitRoutes registra operacoes autenticadas relacionadas as unidades.
func (s *HTTPServer) registerUnitRoutes(mux *http.ServeMux) {
	mux.Handle("POST /api/v1/condominiums/{code}/units", s.requireAuth(s.unitHandler.Create))
	mux.Handle("GET /api/v1/condominiums/{code}/units", s.requireAuth(s.unitHandler.List))
	mux.Handle("GET /api/v1/condominiums/{code}/units/{id}", s.requireAuth(s.unitHandler.GetByID))
	mux.Handle("PATCH /api/v1/condominiums/{code}/units/{id}/private-area", s.requireAuth(s.unitHandler.UpdatePrivateArea))
	mux.Handle("DELETE /api/v1/condominiums/{code}/units/{id}", s.requireAuth(s.unitHandler.Delete))
}

// registerChargeRoutes registra operacoes autenticadas de lancamento de cobrancas.
func (s *HTTPServer) registerChargeRoutes(mux *http.ServeMux) {
	mux.Handle("POST /api/v1/condominiums/{code}/charges", s.requireAuth(s.chargeHandler.Create))
}

// registerExpenseRoutes registra operacoes autenticadas de despesas, fechamento e configuracoes financeiras.
func (s *HTTPServer) registerExpenseRoutes(mux *http.ServeMux) {
	mux.Handle("POST /api/v1/condominiums/{code}/expenses", s.requireAuth(s.expenseHandler.CreateExpense))
	mux.Handle("GET /api/v1/condominiums/{code}/expenses", s.requireAuth(s.expenseHandler.ListExpenses))
	mux.Handle("POST /api/v1/condominiums/{code}/expenses/{id}/reverse", s.requireAuth(s.expenseHandler.ReverseExpense))
	mux.Handle("GET /api/v1/condominiums/{code}/closing/preview", s.requireAuth(s.expenseHandler.PreviewClosing))
	mux.Handle("POST /api/v1/condominiums/{code}/closing", s.requireAuth(s.expenseHandler.CloseMonth))
	mux.Handle("DELETE /api/v1/condominiums/{code}/closing/{month}", s.requireAuth(s.expenseHandler.ReopenMonth))
	mux.Handle("GET /api/v1/condominiums/{code}/settings/reserve-fund", s.requireAuth(s.expenseHandler.GetReserveFundSetting))
	mux.Handle("PUT /api/v1/condominiums/{code}/settings/reserve-fund", s.requireAuth(s.expenseHandler.UpdateReserveFundSetting))
}

// registerMemberRoutes registra operacoes autenticadas de membros vinculados as unidades.
func (s *HTTPServer) registerMemberRoutes(mux *http.ServeMux) {
	mux.Handle("POST /api/v1/condominiums/{code}/units/{unit_code}/members", s.requireAuth(s.memberHandler.Add))
	mux.Handle("GET /api/v1/condominiums/{code}/units/{unit_code}/members", s.requireAuth(s.memberHandler.List))
	mux.Handle("DELETE /api/v1/condominiums/{code}/units/{unit_code}/members/{bond_id}", s.requireAuth(s.memberHandler.Remove))
}

// registerUserRoutes registra operacoes autenticadas do usuario logado.
func (s *HTTPServer) registerUserRoutes(mux *http.ServeMux) {
	mux.Handle("/api/v1/me", s.requireAuth(s.userHandler.Me))
}

// requireAuth aplica o middleware de autenticacao sobre um handler HTTP.
func (s *HTTPServer) requireAuth(handlerFunc http.HandlerFunc) http.Handler {
	return s.authMiddleware.RequireAuth(handlerFunc)
}
