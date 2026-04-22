package handlers

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"

	"ap202/internal/domain"
	"ap202/internal/ports/input"

	"github.com/google/uuid"
)

type AssignmentHandler struct {
	service input.AssignmentService
}

func NewAssignmentHandler(service input.AssignmentService) *AssignmentHandler {
	return &AssignmentHandler{service: service}
}

func (h *AssignmentHandler) Assign(w http.ResponseWriter, r *http.Request) {
	var assignment domain.UserRole
	if err := json.NewDecoder(r.Body).Decode(&assignment); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid_request", "message": "Invalid request body."})
		return
	}

	created, err := h.service.Assign(r.Context(), &assignment)
	if err != nil {
		h.writeError(w, err)
		return
	}

	writeJSON(w, http.StatusCreated, created)
}

func (h *AssignmentHandler) Revoke(w http.ResponseWriter, r *http.Request) {
	userID, err := strconv.ParseInt(r.URL.Query().Get("user_id"), 10, 64)
	if err != nil || userID <= 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid_user_id", "message": "user_id must be a valid integer."})
		return
	}
	roleID, err := uuid.Parse(r.URL.Query().Get("role_id"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid_role_id", "message": "role_id must be a valid UUID."})
		return
	}
	tenantID, err := strconv.ParseInt(r.URL.Query().Get("tenant_id"), 10, 64)
	if err != nil || tenantID <= 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid_tenant_id", "message": "tenant_id must be a valid integer."})
		return
	}

	if err := h.service.Revoke(r.Context(), userID, roleID, tenantID); err != nil {
		h.writeError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *AssignmentHandler) ListByUser(w http.ResponseWriter, r *http.Request) {
	userID, err := strconv.ParseInt(r.PathValue("userID"), 10, 64)
	if err != nil || userID <= 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid_user_id", "message": "User id must be a valid integer."})
		return
	}

	assignments, err := h.service.ListByUser(r.Context(), userID)
	if err != nil {
		h.writeError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, assignments)
}

func (h *AssignmentHandler) writeError(w http.ResponseWriter, err error) {
	log.Printf("assignment handler error: %v", err)

	switch {
	case errors.Is(err, domain.ErrRoleNotFound):
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "role_not_found", "message": "Role not found."})
	case errors.Is(err, domain.ErrTenantIDRequired), errors.Is(err, domain.ErrInvalidTenantAssignment), errors.Is(err, domain.ErrRoleTemplateNotAssignable):
		writeJSON(w, http.StatusUnprocessableEntity, map[string]string{"error": "invalid_assignment", "message": err.Error()})
	default:
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal_error", "message": "Internal server error."})
	}
}
