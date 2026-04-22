package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"ap202/internal/authctx"
	"ap202/internal/domain"
)

type mockCondoService struct {
	result             *domain.Condominium
	listResult         []domain.Condominium
	listByPersonResult []domain.Condominium
	err                error
	updatedFeeRule     domain.FeeRule
}

func (m *mockCondoService) CreateCondominium(_ context.Context, _ domain.CreateCondominiumRequest) (*domain.Condominium, error) {
	return m.result, m.err
}

func (m *mockCondoService) ListCondominiums(_ context.Context) ([]domain.Condominium, error) {
	return m.listResult, m.err
}

func (m *mockCondoService) ListCondominiumsByPersonID(_ context.Context, _ int64) ([]domain.Condominium, error) {
	return m.listByPersonResult, m.err
}

func (m *mockCondoService) GetCondominiumByID(_ context.Context, _ int64) (*domain.Condominium, error) {
	return m.result, m.err
}

func (m *mockCondoService) GetCondominiumByCode(_ context.Context, _ int64, _ string) (*domain.Condominium, error) {
	return m.result, m.err
}

func (m *mockCondoService) UpdateFeeRule(_ context.Context, _ int64, _ string, feeRule domain.FeeRule) (*domain.Condominium, error) {
	m.updatedFeeRule = feeRule
	if m.result == nil {
		m.result = &domain.Condominium{}
	}
	m.result.FeeRule = feeRule
	return m.result, m.err
}

func (m *mockCondoService) UpdateLandArea(_ context.Context, _ int64, _ string, landArea *float64) (*domain.Condominium, error) {
	if m.result == nil {
		m.result = &domain.Condominium{}
	}
	m.result.LandArea = landArea
	return m.result, m.err
}

func authenticatedRequest(req *http.Request) *http.Request {
	externalAuthID := "ext_123"
	ctx := authctx.WithUser(req.Context(), &domain.User{
		ID:             1,
		ExternalAuthID: &externalAuthID,
		FirstName:      "Test",
		LastName:       "User",
		Name:           "Test User",
		Email:          "test@example.com",
	})

	return req.WithContext(ctx)
}

func TestCondominiumHandler_Create_Success(t *testing.T) {
	svc := &mockCondoService{
		result: &domain.Condominium{
			ID:   1,
			Code: "ABCD123",
			Name: "Test Condo",
		},
	}
	handler := NewCondominiumHandler(svc)

	body := `{"name":"Test Condo","phone":"11999999999","email":"test@test.com","street":"Rua A","number":"1","neighborhood":"Centro","city":"SP","state":"SP","zip_code":"01000000","cnpjs":[{"cnpj":"11222333000181","razao_social":"Test LTDA","principal":true,"ativo":true}]}`
	req := authenticatedRequest(httptest.NewRequest(http.MethodPost, "/condominiums", bytes.NewBufferString(body)))
	w := httptest.NewRecorder()

	handler.Create(w, req)

	res := w.Result()
	defer res.Body.Close()

	if res.StatusCode != http.StatusCreated {
		t.Errorf("expected status 201, got %d", res.StatusCode)
	}

	var condo domain.Condominium
	if err := json.NewDecoder(res.Body).Decode(&condo); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if condo.Code != "ABCD123" {
		t.Errorf("expected code ABCD123, got %s", condo.Code)
	}
}

func TestCondominiumHandler_Create_List_Success(t *testing.T) {
	handler := NewCondominiumHandler(&mockCondoService{listResult: []domain.Condominium{{ID: 1, Name: "Condo 1"}, {ID: 2, Name: "Condo 2"}}})

	req := httptest.NewRequest(http.MethodGet, "/condominiums", nil)
	w := httptest.NewRecorder()

	handler.Create(w, req)

	if w.Result().StatusCode != http.StatusOK {
		t.Errorf("expected status 200, got %d", w.Result().StatusCode)
	}
}

func TestCondominiumHandler_Create_InvalidBody(t *testing.T) {
	handler := NewCondominiumHandler(&mockCondoService{})

	req := authenticatedRequest(httptest.NewRequest(http.MethodPost, "/condominiums", bytes.NewBufferString("invalid")))
	w := httptest.NewRecorder()

	handler.Create(w, req)

	if w.Result().StatusCode != http.StatusBadRequest {
		t.Errorf("expected status 400, got %d", w.Result().StatusCode)
	}
}

func TestCondominiumHandler_Create_Unauthorized(t *testing.T) {
	handler := NewCondominiumHandler(&mockCondoService{})

	body := `{"name":"Test Condo","phone":"11999999999","email":"test@test.com","street":"Rua A","number":"1","neighborhood":"Centro","city":"SP","state":"SP","zip_code":"01000000","cnpjs":[{"cnpj":"11222333000181","razao_social":"Test LTDA","principal":true,"ativo":true}]}`
	req := httptest.NewRequest(http.MethodPost, "/condominiums", bytes.NewBufferString(body))
	w := httptest.NewRecorder()

	handler.Create(w, req)

	if w.Result().StatusCode != http.StatusUnauthorized {
		t.Errorf("expected status 401, got %d", w.Result().StatusCode)
	}
}

func TestCondominiumHandler_Create_ServiceError(t *testing.T) {
	svc := &mockCondoService{err: errors.New("duplicate CNPJ")}
	handler := NewCondominiumHandler(svc)

	body := `{"name":"Test","phone":"11999","email":"t@t.com","street":"R","number":"1","neighborhood":"C","city":"SP","state":"SP","zip_code":"01000","cnpjs":[{"cnpj":"11222333000181","razao_social":"Test LTDA","principal":true,"ativo":true}]}`
	req := authenticatedRequest(httptest.NewRequest(http.MethodPost, "/condominiums", bytes.NewBufferString(body)))
	w := httptest.NewRecorder()

	handler.Create(w, req)

	if w.Result().StatusCode != http.StatusUnprocessableEntity {
		t.Errorf("expected status 422, got %d", w.Result().StatusCode)
	}
}

func TestCondominiumHandler_GetByID_Success(t *testing.T) {
	svc := &mockCondoService{
		result: &domain.Condominium{
			ID:   1,
			Code: "ABCD123",
			Name: "Test Condo",
		},
	}
	handler := NewCondominiumHandler(svc)

	req := httptest.NewRequest(http.MethodGet, "/condominiums/1", nil)
	w := httptest.NewRecorder()

	handler.GetByID(w, req)

	res := w.Result()
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		t.Errorf("expected status 200, got %d", res.StatusCode)
	}

	var condo domain.Condominium
	if err := json.NewDecoder(res.Body).Decode(&condo); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if condo.ID != 1 {
		t.Errorf("expected id 1, got %d", condo.ID)
	}
}

func TestCondominiumHandler_GetByID_InvalidID(t *testing.T) {
	handler := NewCondominiumHandler(&mockCondoService{})

	req := httptest.NewRequest(http.MethodGet, "/condominiums/abc", nil)
	w := httptest.NewRecorder()

	handler.GetByID(w, req)

	if w.Result().StatusCode != http.StatusBadRequest {
		t.Errorf("expected status 400, got %d", w.Result().StatusCode)
	}
}

func TestCondominiumHandler_GetByID_NotFound(t *testing.T) {
	svc := &mockCondoService{err: domain.ErrCondominiumNotFound}
	handler := NewCondominiumHandler(svc)

	req := httptest.NewRequest(http.MethodGet, "/condominiums/999", nil)
	w := httptest.NewRecorder()

	handler.GetByID(w, req)

	if w.Result().StatusCode != http.StatusNotFound {
		t.Errorf("expected status 404, got %d", w.Result().StatusCode)
	}
}

func TestCondominiumHandler_Create_GetByQueryID_Success(t *testing.T) {
	svc := &mockCondoService{
		result: &domain.Condominium{
			ID:   1,
			Code: "ABCD123",
			Name: "Test Condo",
		},
	}
	handler := NewCondominiumHandler(svc)

	req := httptest.NewRequest(http.MethodGet, "/condominiums?id=1", nil)
	w := httptest.NewRecorder()

	handler.Create(w, req)

	if w.Result().StatusCode != http.StatusOK {
		t.Errorf("expected status 200, got %d", w.Result().StatusCode)
	}
}

func TestCondominiumHandler_Create_List_ServiceError(t *testing.T) {
	handler := NewCondominiumHandler(&mockCondoService{err: errors.New("list error")})

	req := httptest.NewRequest(http.MethodGet, "/condominiums", nil)
	w := httptest.NewRecorder()

	handler.Create(w, req)

	if w.Result().StatusCode != http.StatusUnprocessableEntity {
		t.Errorf("expected status 422, got %d", w.Result().StatusCode)
	}
}

func TestCondominiumHandler_GetByCode_Success(t *testing.T) {
	svc := &mockCondoService{
		result: &domain.Condominium{
			ID:   1,
			Code: "ABCD123",
			Name: "Test Condo",
		},
	}
	handler := NewCondominiumHandler(svc)

	req := authenticatedRequest(httptest.NewRequest(http.MethodGet, "/api/v1/condominiums/ABCD123", nil))
	req.SetPathValue("code", "ABCD123")
	w := httptest.NewRecorder()

	handler.GetByCode(w, req)

	if w.Result().StatusCode != http.StatusOK {
		t.Errorf("expected status 200, got %d", w.Result().StatusCode)
	}
}

func TestCondominiumHandler_GetByCode_Forbidden(t *testing.T) {
	handler := NewCondominiumHandler(&mockCondoService{err: domain.ErrForbidden})

	req := authenticatedRequest(httptest.NewRequest(http.MethodGet, "/api/v1/condominiums/ABCD123", nil))
	req.SetPathValue("code", "ABCD123")
	w := httptest.NewRecorder()

	handler.GetByCode(w, req)

	if w.Result().StatusCode != http.StatusForbidden {
		t.Errorf("expected status 403, got %d", w.Result().StatusCode)
	}
}

func TestCondominiumHandler_GetByCode_Unauthorized(t *testing.T) {
	handler := NewCondominiumHandler(&mockCondoService{})

	req := httptest.NewRequest(http.MethodGet, "/api/v1/condominiums/ABCD123", nil)
	req.SetPathValue("code", "ABCD123")
	w := httptest.NewRecorder()

	handler.GetByCode(w, req)

	if w.Result().StatusCode != http.StatusUnauthorized {
		t.Errorf("expected status 401, got %d", w.Result().StatusCode)
	}
}
