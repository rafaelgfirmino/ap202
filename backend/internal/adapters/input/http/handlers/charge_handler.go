package handlers

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"

	"ap202/internal/authctx"
	"ap202/internal/domain"
	"ap202/internal/domain/vo"
	"ap202/internal/ports/input"
)

type ChargeHandler struct {
	service input.ChargeService
}

func NewChargeHandler(service input.ChargeService) *ChargeHandler {
	return &ChargeHandler{service: service}
}

func (h *ChargeHandler) Create(w http.ResponseWriter, r *http.Request) {
	personID, ok := authctx.UserIDFromContext(r.Context())
	if !ok || personID <= 0 {
		writeJSON(w, http.StatusUnauthorized, map[string]string{
			"error":   "unauthorized",
			"message": "Invalid or missing token.",
		})
		return
	}

	var req domain.CreateChargeInput
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error":   "invalid_request",
			"message": "Invalid request body.",
		})
		return
	}

	charge, err := h.service.Create(r.Context(), personID, r.PathValue("code"), req)
	if err != nil {
		h.writeError(w, err)
		return
	}

	writeJSON(w, http.StatusCreated, charge)
}

func (h *ChargeHandler) writeError(w http.ResponseWriter, err error) {
	log.Printf("charge handler error: %v", err)

	switch {
	case errors.Is(err, domain.ErrCondominiumNotFound):
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "condominium_not_found", "message": "Condominium not found."})
	case errors.Is(err, domain.ErrForbidden):
		writeJSON(w, http.StatusForbidden, map[string]string{"error": "forbidden", "message": "You do not have permission to access this condominium."})
	case errors.Is(err, domain.ErrChargeTotalAmountInvalid):
		writeJSON(w, http.StatusUnprocessableEntity, map[string]string{"error": "invalid_total_amount_centavos", "message": "Total amount centavos must be greater than zero."})
	case errors.Is(err, domain.ErrNoUnitsToCharge):
		writeJSON(w, http.StatusUnprocessableEntity, map[string]string{"error": "no_units_to_charge", "message": "At least one active unit is required to allocate the charge."})
	case errors.Is(err, domain.ErrFractionsSumZero):
		writeJSON(w, http.StatusUnprocessableEntity, map[string]string{"error": "fractions_sum_zero", "message": "The sum of fractions is zero."})
	case errors.Is(err, domain.ErrInvalidFeeRule):
		writeJSON(w, http.StatusUnprocessableEntity, map[string]string{"error": "invalid_fee_rule", "message": "The condominium fee rule is invalid."})
	case errors.Is(err, vo.ErrPrivateAreaRequired):
		writeJSON(w, http.StatusUnprocessableEntity, map[string]string{"error": "private_area_required", "message": "Private area is required for units without an ideal fraction."})
	default:
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal_error", "message": "Internal server error."})
	}
}
