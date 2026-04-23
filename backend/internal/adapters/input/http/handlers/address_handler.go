package handlers

import (
	"errors"
	"log"
	"net/http"

	"ap202/internal/authctx"
	"ap202/internal/domain"
	"ap202/internal/ports/input"
)

type AddressHandler struct {
	service input.AddressService
}

func NewAddressHandler(service input.AddressService) *AddressHandler {
	return &AddressHandler{service: service}
}

func (h *AddressHandler) LookupByZipCode(w http.ResponseWriter, r *http.Request) {
	if _, ok := authctx.UserFromContext(r.Context()); !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{
			"error":   "unauthorized",
			"message": "Invalid or missing token.",
		})
		return
	}

	address, err := h.service.LookupAddressByZipCode(r.Context(), r.PathValue("zipCode"))
	if err != nil {
		log.Printf("failed to lookup zip code %s: %v", r.PathValue("zipCode"), err)
		switch {
		case errors.Is(err, domain.ErrInvalidZipCode):
			writeJSON(w, http.StatusBadRequest, map[string]string{
				"error":   "invalid_zip_code",
				"message": "CEP deve conter 8 numeros.",
			})
		case errors.Is(err, domain.ErrZipCodeNotFound):
			writeJSON(w, http.StatusNotFound, map[string]string{
				"error":   "zip_code_not_found",
				"message": "CEP nao encontrado.",
			})
		default:
			writeJSON(w, http.StatusUnprocessableEntity, map[string]string{
				"error":   "zip_code_lookup_failed",
				"message": "Nao foi possivel buscar o CEP.",
			})
		}
		return
	}

	writeJSON(w, http.StatusOK, address)
}
