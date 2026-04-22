package handlers

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"

	"ap202/internal/authctx"
	"ap202/internal/domain"
	"ap202/internal/domain/vo"
	"ap202/internal/ports/input"
)

type UnitHandler struct {
	service input.UnitService
}

func NewUnitHandler(service input.UnitService) *UnitHandler {
	return &UnitHandler{service: service}
}

func (h *UnitHandler) Create(w http.ResponseWriter, r *http.Request) {
	personID, ok := authctx.UserIDFromContext(r.Context())
	if !ok || personID <= 0 {
		writeJSON(w, http.StatusUnauthorized, map[string]string{
			"error":   "unauthorized",
			"message": "Invalid or missing token.",
		})
		return
	}

	var req domain.CreateUnitInput
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error":   "invalid_request",
			"message": "Invalid request body.",
		})
		return
	}

	unit, err := h.service.Create(r.Context(), personID, r.PathValue("code"), req)
	if err != nil {
		h.writeError(w, err)
		return
	}

	writeJSON(w, http.StatusCreated, unit)
}

func (h *UnitHandler) List(w http.ResponseWriter, r *http.Request) {
	personID, ok := authctx.UserIDFromContext(r.Context())
	if !ok || personID <= 0 {
		writeJSON(w, http.StatusUnauthorized, map[string]string{
			"error":   "unauthorized",
			"message": "Invalid or missing token.",
		})
		return
	}

	units, err := h.service.List(r.Context(), personID, r.PathValue("code"))
	if err != nil {
		h.writeError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"data":  units,
		"total": len(units),
	})
}

func (h *UnitHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	personID, ok := authctx.UserIDFromContext(r.Context())
	if !ok || personID <= 0 {
		writeJSON(w, http.StatusUnauthorized, map[string]string{
			"error":   "unauthorized",
			"message": "Invalid or missing token.",
		})
		return
	}

	unitID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || unitID <= 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error":   "invalid_unit_id",
			"message": "Invalid unit id.",
		})
		return
	}

	unit, err := h.service.GetByID(r.Context(), personID, r.PathValue("code"), unitID)
	if err != nil {
		h.writeError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, unit)
}

func (h *UnitHandler) UpdatePrivateArea(w http.ResponseWriter, r *http.Request) {
	personID, ok := authctx.UserIDFromContext(r.Context())
	if !ok || personID <= 0 {
		writeJSON(w, http.StatusUnauthorized, map[string]string{
			"error":   "unauthorized",
			"message": "Invalid or missing token.",
		})
		return
	}

	unitID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || unitID <= 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error":   "invalid_unit_id",
			"message": "Invalid unit id.",
		})
		return
	}

	var req domain.UpdateUnitPrivateAreaInput
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error":   "invalid_request",
			"message": "Invalid request body.",
		})
		return
	}

	unit, err := h.service.UpdatePrivateArea(r.Context(), personID, r.PathValue("code"), unitID, req)
	if err != nil {
		h.writeError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, unit)
}

func (h *UnitHandler) Delete(w http.ResponseWriter, r *http.Request) {
	personID, ok := authctx.UserIDFromContext(r.Context())
	if !ok || personID <= 0 {
		writeJSON(w, http.StatusUnauthorized, map[string]string{
			"error":   "unauthorized",
			"message": "Invalid or missing token.",
		})
		return
	}

	unitID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || unitID <= 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error":   "invalid_unit_id",
			"message": "Invalid unit id.",
		})
		return
	}

	if err := h.service.Delete(r.Context(), personID, r.PathValue("code"), unitID); err != nil {
		h.writeError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *UnitHandler) writeError(w http.ResponseWriter, err error) {
	log.Printf("unit handler error: %v", err)

	switch {
	case errors.Is(err, domain.ErrCondominiumNotFound):
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "condominium_not_found", "message": "Condominium not found."})
	case errors.Is(err, domain.ErrForbidden):
		writeJSON(w, http.StatusForbidden, map[string]string{"error": "forbidden", "message": "You do not have permission to access this condominium."})
	case errors.Is(err, domain.ErrUnitNotFound):
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "unit_not_found", "message": "Unit not found."})
	case errors.Is(err, domain.ErrUnitIdentifierDuplicate):
		writeJSON(w, http.StatusConflict, map[string]string{"error": "unit_identifier_duplicate", "message": "A unit with this group name and identifier already exists in this condominium."})
	case errors.Is(err, domain.ErrUnitGroupMustBeRegistered):
		writeJSON(w, http.StatusUnprocessableEntity, map[string]string{"error": "unit_group_must_be_registered", "message": "The selected unit group must be previously registered."})
	case errors.Is(err, domain.ErrUnitFloorInvalid):
		writeJSON(w, http.StatusUnprocessableEntity, map[string]string{"error": "unit_floor_invalid", "message": "The selected floor is invalid for this unit group."})
	case errors.Is(err, domain.ErrUnitHasCharges):
		writeJSON(w, http.StatusConflict, map[string]string{"error": "unit_has_charges", "message": "This unit already has charges and cannot be deleted."})
	case errors.Is(err, vo.ErrBuiltAreaZero):
		writeJSON(w, http.StatusUnprocessableEntity, map[string]string{"error": "built_area_zero", "message": "Built area sum is zero — cannot calculate ideal fraction."})
	case errors.Is(err, vo.ErrPrivateAreaRequired):
		writeJSON(w, http.StatusUnprocessableEntity, map[string]string{"error": "private_area_required", "message": "Private area is required to calculate ideal fraction."})
	case errors.Is(err, domain.ErrUnitGroupInvalid):
		writeJSON(w, http.StatusUnprocessableEntity, map[string]string{"error": "unit_group_invalid", "message": "group_type e group_name sao obrigatorios (max 20 caracteres). Valores permitidos para group_type: block, tower, sector, court, phase."})
	case errors.Is(err, domain.ErrUnitCodeTooLong):
		writeJSON(w, http.StatusUnprocessableEntity, map[string]string{"error": "unit_code_too_long", "message": "The generated unit code exceeds the maximum allowed length."})
	case errors.Is(err, domain.ErrUnitIdentifierRequired):
		writeJSON(w, http.StatusUnprocessableEntity, map[string]string{"error": "unit_identifier_required", "message": "Unit identifier is required and must have at most 20 characters."})
	case errors.Is(err, domain.ErrUnitIdentifierInvalid):
		writeJSON(w, http.StatusUnprocessableEntity, map[string]string{"error": "unit_identifier_invalid", "message": "Unit identifier must contain only numbers."})
	default:
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal_error", "message": "Internal server error."})
	}
}
