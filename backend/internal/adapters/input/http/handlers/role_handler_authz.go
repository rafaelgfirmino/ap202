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

type RoleHandler struct {
	service input.RoleService
}

func NewRoleHandler(service input.RoleService) *RoleHandler {
	return &RoleHandler{service: service}
}

func (h *RoleHandler) Create(w http.ResponseWriter, r *http.Request) {
	var role domain.Role
	if err := json.NewDecoder(r.Body).Decode(&role); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid_request", "message": "Invalid request body."})
		return
	}

	created, err := h.service.Create(r.Context(), &role)
	if err != nil {
		h.writeError(w, err)
		return
	}

	writeJSON(w, http.StatusCreated, created)
}

func (h *RoleHandler) List(w http.ResponseWriter, r *http.Request) {
	var tenantID *int64
	if raw := r.URL.Query().Get("tenant_id"); raw != "" {
		parsed, err := strconv.ParseInt(raw, 10, 64)
		if err != nil || parsed <= 0 {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid_tenant_id", "message": "tenant_id must be a valid integer."})
			return
		}
		tenantID = &parsed
	}

	roles, err := h.service.List(r.Context(), tenantID)
	if err != nil {
		h.writeError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, roles)
}

func (h *RoleHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid_role_id", "message": "Role id must be a valid UUID."})
		return
	}

	role, err := h.service.GetByID(r.Context(), id)
	if err != nil {
		h.writeError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, role)
}

func (h *RoleHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid_role_id", "message": "Role id must be a valid UUID."})
		return
	}

	if err := h.service.Delete(r.Context(), id); err != nil {
		h.writeError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *RoleHandler) AssignPermission(w http.ResponseWriter, r *http.Request) {
	roleID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid_role_id", "message": "Role id must be a valid UUID."})
		return
	}
	permissionID, err := uuid.Parse(r.PathValue("permissionID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid_permission_id", "message": "Permission id must be a valid UUID."})
		return
	}

	if err := h.service.AssignPermission(r.Context(), roleID, permissionID); err != nil {
		h.writeError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "assigned"})
}

func (h *RoleHandler) RemovePermission(w http.ResponseWriter, r *http.Request) {
	roleID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid_role_id", "message": "Role id must be a valid UUID."})
		return
	}
	permissionID, err := uuid.Parse(r.PathValue("permissionID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid_permission_id", "message": "Permission id must be a valid UUID."})
		return
	}

	if err := h.service.RemovePermission(r.Context(), roleID, permissionID); err != nil {
		h.writeError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *RoleHandler) writeError(w http.ResponseWriter, err error) {
	log.Printf("role handler error: %v", err)

	switch {
	case errors.Is(err, domain.ErrRoleNotFound):
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "role_not_found", "message": "Role not found."})
	case errors.Is(err, domain.ErrPermissionNotFound):
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "permission_not_found", "message": "Permission not found."})
	case errors.Is(err, domain.ErrRoleNameRequired), errors.Is(err, domain.ErrRoleTemplateRequired), errors.Is(err, domain.ErrRoleInstanceAssignmentOnly):
		writeJSON(w, http.StatusUnprocessableEntity, map[string]string{"error": "invalid_role", "message": err.Error()})
	default:
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal_error", "message": "Internal server error."})
	}
}
