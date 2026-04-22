package handlers

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"

	"ap202/internal/authctx"
	"ap202/internal/domain"
	"ap202/internal/ports/input"
)

type UnitGroupHandler struct {
	service input.UnitGroupService
}

func NewUnitGroupHandler(service input.UnitGroupService) *UnitGroupHandler {
	return &UnitGroupHandler{service: service}
}

func (h *UnitGroupHandler) Create(w http.ResponseWriter, r *http.Request) {
	personID, ok := authctx.UserIDFromContext(r.Context())
	if !ok || personID <= 0 {
		writeJSON(w, http.StatusUnauthorized, map[string]string{
			"error":   "unauthorized",
			"message": "Invalid or missing token.",
		})
		return
	}

	var req domain.CreateUnitGroupInput
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error":   "invalid_request",
			"message": "Invalid request body.",
		})
		return
	}

	group, err := h.service.Create(r.Context(), personID, r.PathValue("code"), req)
	if err != nil {
		h.writeError(w, err)
		return
	}

	writeJSON(w, http.StatusCreated, group)
}

func (h *UnitGroupHandler) List(w http.ResponseWriter, r *http.Request) {
	personID, ok := authctx.UserIDFromContext(r.Context())
	if !ok || personID <= 0 {
		writeJSON(w, http.StatusUnauthorized, map[string]string{
			"error":   "unauthorized",
			"message": "Invalid or missing token.",
		})
		return
	}

	groups, err := h.service.List(r.Context(), personID, r.PathValue("code"))
	if err != nil {
		h.writeError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"data":  groups,
		"total": len(groups),
	})
}

func (h *UnitGroupHandler) Update(w http.ResponseWriter, r *http.Request) {
	personID, ok := authctx.UserIDFromContext(r.Context())
	if !ok || personID <= 0 {
		writeJSON(w, http.StatusUnauthorized, map[string]string{
			"error":   "unauthorized",
			"message": "Invalid or missing token.",
		})
		return
	}

	var req domain.UpdateUnitGroupInput
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error":   "invalid_request",
			"message": "Invalid request body.",
		})
		return
	}

	id, err := parseIDParam(r.PathValue("id"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error":   "invalid_id",
			"message": "Invalid unit group id.",
		})
		return
	}

	group, err := h.service.Update(r.Context(), personID, r.PathValue("code"), id, req)
	if err != nil {
		h.writeError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, group)
}

func (h *UnitGroupHandler) Delete(w http.ResponseWriter, r *http.Request) {
	personID, ok := authctx.UserIDFromContext(r.Context())
	if !ok || personID <= 0 {
		writeJSON(w, http.StatusUnauthorized, map[string]string{
			"error":   "unauthorized",
			"message": "Invalid or missing token.",
		})
		return
	}

	id, err := parseIDParam(r.PathValue("id"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error":   "invalid_id",
			"message": "Invalid unit group id.",
		})
		return
	}

	if err := h.service.Delete(r.Context(), personID, r.PathValue("code"), id); err != nil {
		h.writeError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *UnitGroupHandler) writeError(w http.ResponseWriter, err error) {
	log.Printf("unit group handler error: %v", err)

	switch {
	case errors.Is(err, domain.ErrCondominiumNotFound):
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "condominium_not_found", "message": "Condominium not found."})
	case errors.Is(err, domain.ErrForbidden):
		writeJSON(w, http.StatusForbidden, map[string]string{"error": "forbidden", "message": "You do not have permission to access this condominium."})
	case errors.Is(err, domain.ErrUnitGroupAlreadyExists):
		writeJSON(w, http.StatusConflict, map[string]string{"error": "unit_group_already_exists", "message": "This unit group already exists in this condominium."})
	case errors.Is(err, domain.ErrUnitGroupNotFound):
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "unit_group_not_found", "message": "Unit group not found."})
	case errors.Is(err, domain.ErrUnitGroupNameRequired):
		writeJSON(w, http.StatusUnprocessableEntity, map[string]string{"error": "unit_group_name_required", "message": "Unit group name is required and must have at most 20 characters."})
	case errors.Is(err, domain.ErrUnitGroupFloorsInvalid):
		writeJSON(w, http.StatusUnprocessableEntity, map[string]string{"error": "unit_group_floors_invalid", "message": "Unit group floors must be greater than or equal to zero."})
	case errors.Is(err, domain.ErrUnitGroupHasUnits):
		writeJSON(w, http.StatusConflict, map[string]string{"error": "unit_group_has_units", "message": "This unit group has linked units and cannot be deleted."})
	case errors.Is(err, domain.ErrUnitGroupInvalid):
		writeJSON(w, http.StatusUnprocessableEntity, map[string]string{"error": "unit_group_invalid", "message": "group_type must be one of: block, tower, sector, court, phase."})
	default:
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal_error", "message": "Internal server error."})
	}
}

func parseIDParam(value string) (int64, error) {
	return strconv.ParseInt(value, 10, 64)
}
