package handlers

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"

	"ap202/internal/domain"
	"ap202/internal/ports/input"

	"github.com/google/uuid"
)

type PermissionHandler struct {
	service input.PermissionService
}

func NewPermissionHandler(service input.PermissionService) *PermissionHandler {
	return &PermissionHandler{service: service}
}

func (h *PermissionHandler) Create(w http.ResponseWriter, r *http.Request) {
	var permission domain.Permission
	if err := json.NewDecoder(r.Body).Decode(&permission); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid_request", "message": "Invalid request body."})
		return
	}

	created, err := h.service.Create(r.Context(), &permission)
	if err != nil {
		h.writeError(w, err)
		return
	}

	writeJSON(w, http.StatusCreated, created)
}

func (h *PermissionHandler) List(w http.ResponseWriter, r *http.Request) {
	permissions, err := h.service.List(r.Context())
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal_error", "message": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, permissions)
}

func (h *PermissionHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid_permission_id", "message": "Permission id must be a valid UUID."})
		return
	}

	permission, err := h.service.GetByID(r.Context(), id)
	if err != nil {
		h.writeError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, permission)
}

func (h *PermissionHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid_permission_id", "message": "Permission id must be a valid UUID."})
		return
	}

	if err := h.service.Delete(r.Context(), id); err != nil {
		h.writeError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *PermissionHandler) Sync(w http.ResponseWriter, r *http.Request) {
	var items []domain.PermissionSyncItem
	if err := json.NewDecoder(r.Body).Decode(&items); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid_request", "message": "Invalid request body."})
		return
	}

	if err := h.service.Sync(r.Context(), items); err != nil {
		h.writeError(w, err)
		return
	}

	writeJSON(w, http.StatusAccepted, map[string]string{"status": "synced"})
}

func (h *PermissionHandler) writeError(w http.ResponseWriter, err error) {
	log.Printf("permission handler error: %v", err)

	switch {
	case errors.Is(err, domain.ErrPermissionAlreadyExists):
		writeJSON(w, http.StatusConflict, map[string]string{"error": "permission_already_exists", "message": "Permission already exists."})
	case errors.Is(err, domain.ErrPermissionNotFound):
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "permission_not_found", "message": "Permission not found."})
	case errors.Is(err, domain.ErrPermissionMicroserviceEmpty), errors.Is(err, domain.ErrPermissionResourceEmpty), errors.Is(err, domain.ErrPermissionActionEmpty):
		writeJSON(w, http.StatusUnprocessableEntity, map[string]string{"error": "invalid_permission", "message": err.Error()})
	default:
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal_error", "message": "Internal server error."})
	}
}
