package handlers

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"ap202/internal/domain"
)

type mockAddressService struct {
	result *domain.ZipCodeAddress
	err    error
}

func (m *mockAddressService) LookupAddressByZipCode(_ context.Context, _ string) (*domain.ZipCodeAddress, error) {
	return m.result, m.err
}

func TestAddressHandler_LookupByZipCode_Success(t *testing.T) {
	handler := NewAddressHandler(&mockAddressService{
		result: &domain.ZipCodeAddress{
			ZipCode:      "01001000",
			Street:       "Praça da Sé",
			Neighborhood: "Sé",
			City:         "São Paulo",
			State:        "SP",
		},
	})

	req := authenticatedRequest(httptest.NewRequest(http.MethodGet, "/api/v1/address/zip-code/01001000", nil))
	req.SetPathValue("zipCode", "01001000")
	w := httptest.NewRecorder()

	handler.LookupByZipCode(w, req)

	if w.Result().StatusCode != http.StatusOK {
		t.Errorf("expected status 200, got %d", w.Result().StatusCode)
	}
}

func TestAddressHandler_LookupByZipCode_NotFound(t *testing.T) {
	handler := NewAddressHandler(&mockAddressService{err: domain.ErrZipCodeNotFound})

	req := authenticatedRequest(httptest.NewRequest(http.MethodGet, "/api/v1/address/zip-code/99999999", nil))
	req.SetPathValue("zipCode", "99999999")
	w := httptest.NewRecorder()

	handler.LookupByZipCode(w, req)

	if w.Result().StatusCode != http.StatusNotFound {
		t.Errorf("expected status 404, got %d", w.Result().StatusCode)
	}
}

func TestAddressHandler_LookupByZipCode_InvalidZipCode(t *testing.T) {
	handler := NewAddressHandler(&mockAddressService{err: domain.ErrInvalidZipCode})

	req := authenticatedRequest(httptest.NewRequest(http.MethodGet, "/api/v1/address/zip-code/123", nil))
	req.SetPathValue("zipCode", "123")
	w := httptest.NewRecorder()

	handler.LookupByZipCode(w, req)

	if w.Result().StatusCode != http.StatusBadRequest {
		t.Errorf("expected status 400, got %d", w.Result().StatusCode)
	}
}
