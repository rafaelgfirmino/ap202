package http

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	httpmiddleware "ap202/internal/adapters/input/http/middleware"
	"ap202/internal/domain"
)

type mockHealthService struct{}

func (m *mockHealthService) CheckHealth() map[string]interface{} {
	return map[string]interface{}{
		"status": "up",
		"postgres": map[string]string{
			"status":  "up",
			"message": "It's healthy",
		},
	}
}

type mockCondominiumService struct{}

func (m *mockCondominiumService) CreateCondominium(_ context.Context, _ domain.CreateCondominiumRequest) (*domain.Condominium, error) {
	return &domain.Condominium{ID: 1, Code: "ABCD123", Name: "Test"}, nil
}

func (m *mockCondominiumService) ListCondominiums(_ context.Context) ([]domain.Condominium, error) {
	return []domain.Condominium{{ID: 1, Code: "ABCD123", Name: "Test"}}, nil
}

func (m *mockCondominiumService) ListCondominiumsByPersonID(_ context.Context, _ int64) ([]domain.Condominium, error) {
	return []domain.Condominium{{ID: 1, Code: "ABCD123", Name: "Test"}}, nil
}

func (m *mockCondominiumService) GetCondominiumByID(_ context.Context, id int64) (*domain.Condominium, error) {
	return &domain.Condominium{ID: id, Code: "ABCD123", Name: "Test"}, nil
}

func (m *mockCondominiumService) GetCondominiumByCode(_ context.Context, _ int64, code string) (*domain.Condominium, error) {
	return &domain.Condominium{ID: 1, Code: code, Name: "Test"}, nil
}

func (m *mockCondominiumService) UpdateFeeRule(_ context.Context, _ int64, code string, feeRule domain.FeeRule) (*domain.Condominium, error) {
	return &domain.Condominium{ID: 1, Code: code, Name: "Test", FeeRule: feeRule}, nil
}

func (m *mockCondominiumService) UpdateLandArea(_ context.Context, _ int64, code string, landArea *float64) (*domain.Condominium, error) {
	return &domain.Condominium{ID: 1, Code: code, Name: "Test", LandArea: landArea}, nil
}

type mockUnitService struct{}

func (m *mockUnitService) Create(_ context.Context, _ int64, _ string, _ domain.CreateUnitInput) (*domain.Unit, error) {
	return &domain.Unit{ID: 1, CondominiumID: 1, Identifier: "101", Active: true}, nil
}

func (m *mockUnitService) List(_ context.Context, _ int64, _ string) ([]domain.Unit, error) {
	return []domain.Unit{{ID: 1, CondominiumID: 1, Identifier: "101", Active: true}}, nil
}

func (m *mockUnitService) GetByID(_ context.Context, _ int64, _ string, id int64) (*domain.Unit, error) {
	return &domain.Unit{ID: id, CondominiumID: 1, Identifier: "101", Active: true}, nil
}

func (m *mockUnitService) UpdatePrivateArea(_ context.Context, _ int64, _ string, id int64, input domain.UpdateUnitPrivateAreaInput) (*domain.Unit, error) {
	return &domain.Unit{ID: id, CondominiumID: 1, Identifier: "101", PrivateArea: input.PrivateArea, Active: true}, nil
}

func (m *mockUnitService) Delete(_ context.Context, _ int64, _ string, _ int64) error {
	return nil
}

type mockUnitGroupService struct{}

func (m *mockUnitGroupService) Create(_ context.Context, _ int64, _ string, input domain.CreateUnitGroupInput) (*domain.UnitGroup, error) {
	return &domain.UnitGroup{ID: 1, CondominiumID: 1, GroupType: input.GroupType, Name: input.Name, Floors: input.Floors, Active: true}, nil
}

func (m *mockUnitGroupService) List(_ context.Context, _ int64, _ string) ([]domain.UnitGroup, error) {
	floors := 12
	return []domain.UnitGroup{{ID: 1, CondominiumID: 1, GroupType: "block", Name: "A", Floors: &floors, Active: true}}, nil
}

func (m *mockUnitGroupService) Update(_ context.Context, _ int64, _ string, id int64, input domain.UpdateUnitGroupInput) (*domain.UnitGroup, error) {
	return &domain.UnitGroup{ID: id, CondominiumID: 1, GroupType: input.GroupType, Name: input.Name, Floors: input.Floors, Active: true}, nil
}

func (m *mockUnitGroupService) Delete(_ context.Context, _ int64, _ string, _ int64) error {
	return nil
}

type mockMemberService struct{}

func (m *mockMemberService) Add(_ context.Context, _ int64, _ string, _ string, _ domain.AddMemberInput) (*domain.Member, error) {
	return &domain.Member{BondID: 1, UserID: 1, UnitID: 1, Name: "Test User", Email: "test@example.com", Role: "owner", Active: true}, nil
}

func (m *mockMemberService) List(_ context.Context, _ int64, _ string, _ string) ([]domain.Member, error) {
	return []domain.Member{{BondID: 1, UserID: 1, UnitID: 1, Name: "Test User", Email: "test@example.com", Role: "owner", Active: true}}, nil
}

func (m *mockMemberService) Remove(_ context.Context, _ int64, _ string, _ string, _ int64) error {
	return nil
}

type mockChargeService struct{}

func (m *mockChargeService) Create(_ context.Context, _ int64, _ string, _ domain.CreateChargeInput) (*domain.Charge, error) {
	return &domain.Charge{ID: 1, CondominiumID: 1, TotalAmountCentavos: 10000, FeeRule: domain.FeeRuleEqual}, nil
}

type mockExpenseService struct{}

func (m *mockExpenseService) CreateExpense(_ context.Context, _ int64, _ string, _ domain.CreateExpenseInput) (*domain.Expense, error) {
	return &domain.Expense{ID: 1, CondominiumID: 1, Scope: domain.ExpenseScopeGeneral, Type: domain.ExpenseTypeExpense}, nil
}

func (m *mockExpenseService) ListExpenses(_ context.Context, _ int64, _ string, _ string, _ string) ([]domain.Expense, error) {
	return []domain.Expense{}, nil
}

func (m *mockExpenseService) ReverseExpense(_ context.Context, _ int64, _ string, _ int64) (*domain.Expense, error) {
	return &domain.Expense{ID: 2, CondominiumID: 1, Reversed: true}, nil
}

func (m *mockExpenseService) GetClosingPreview(_ context.Context, _ int64, _ string, month string) (*domain.ClosingPreview, error) {
	return &domain.ClosingPreview{ReferenceMonth: month}, nil
}

func (m *mockExpenseService) CloseMonth(_ context.Context, _ int64, _ string, input domain.CloseMonthInput) (*domain.ClosingPreview, error) {
	return &domain.ClosingPreview{ReferenceMonth: input.ReferenceMonth}, nil
}

func (m *mockExpenseService) ReopenMonth(_ context.Context, _ int64, _ string, _ string) error {
	return nil
}

func (m *mockExpenseService) GetReserveFundSetting(_ context.Context, _ int64, _ string) (*domain.ReserveFundSetting, error) {
	return &domain.ReserveFundSetting{CondominiumID: 1, Mode: domain.ReserveFundModePercent, ValueCentavos: 1000, Active: true}, nil
}

func (m *mockExpenseService) UpdateReserveFundSetting(_ context.Context, _ int64, _ string, input domain.UpdateReserveFundInput) (*domain.ReserveFundSetting, error) {
	return &domain.ReserveFundSetting{CondominiumID: 1, Mode: input.Mode, ValueCentavos: int64(input.Value * 100), Active: input.Active}, nil
}

type mockUserService struct{}

func (m *mockUserService) FindOrCreate(_ context.Context, externalAuthID, firstName, lastName, email string) (*domain.User, error) {
	return &domain.User{ID: 1, ExternalAuthID: &externalAuthID, FirstName: firstName, LastName: lastName, Name: firstName + " " + lastName, Email: email}, nil
}

func (m *mockUserService) GetByID(_ context.Context, id int64) (*domain.User, error) {
	return &domain.User{ID: id, FirstName: "Test", LastName: "User", Name: "Test User", Email: "test@example.com"}, nil
}

func newTestServer() *HTTPServer {
	return NewHTTPServer(8080, &httpmiddleware.AuthMiddleware{}, &mockHealthService{}, &mockCondominiumService{}, &mockUnitService{}, &mockUnitGroupService{}, &mockChargeService{}, &mockExpenseService{}, &mockMemberService{}, &mockUserService{})
}

func TestHTTPServer_HelloWorldHandler(t *testing.T) {
	server := newTestServer()

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	w := httptest.NewRecorder()

	server.homeHandler.HelloWorld(w, req)

	res := w.Result()
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		t.Errorf("expected status OK; got %v", res.Status)
	}

	var response map[string]string
	if err := json.NewDecoder(res.Body).Decode(&response); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if response["message"] != "Hello World" {
		t.Errorf("expected message 'Hello World'; got %v", response["message"])
	}
}

func TestHTTPServer_healthHandler(t *testing.T) {
	server := newTestServer()

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	w := httptest.NewRecorder()

	server.healthHandler.Health(w, req)

	res := w.Result()
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		t.Errorf("expected status OK; got %v", res.Status)
	}

	var response map[string]interface{}
	if err := json.NewDecoder(res.Body).Decode(&response); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if response["status"] != "up" {
		t.Errorf("expected status 'up'; got %v", response["status"])
	}

	pg, ok := response["postgres"].(map[string]interface{})
	if !ok {
		t.Fatal("expected 'postgres' key in response")
	}

	if pg["status"] != "up" {
		t.Errorf("expected postgres status 'up'; got %v", pg["status"])
	}
}
