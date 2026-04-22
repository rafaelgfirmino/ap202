package handlers

import (
	"errors"
	"log"
	"net/http"
	"strconv"

	"ap202/internal/domain"
	"ap202/internal/ports/input"
)

type TenantHandler struct {
	service input.TenantService
}

func NewTenantHandler(service input.TenantService) *TenantHandler {
	return &TenantHandler{service: service}
}

func (h *TenantHandler) Setup(w http.ResponseWriter, r *http.Request) {
	tenantID, err := strconv.ParseInt(r.PathValue("tenantID"), 10, 64)
	if err != nil || tenantID <= 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid_tenant_id", "message": "Tenant id must be a valid integer."})
		return
	}

	roles, err := h.service.Setup(r.Context(), tenantID)
	if err != nil {
		h.writeError(w, err)
		return
	}

	response := make([]map[string]string, 0, len(roles))
	for _, role := range roles {
		item := map[string]string{"name": role.Name}
		if role.TenantID != nil {
			item["tenant_id"] = strconv.FormatInt(*role.TenantID, 10)
		}
		response = append(response, item)
	}

	writeJSON(w, http.StatusOK, map[string]any{"roles_created": response})
}

func (h *TenantHandler) writeError(w http.ResponseWriter, err error) {
	log.Printf("tenant handler error: %v", err)

	switch {
	case errors.Is(err, domain.ErrTenantIDRequired):
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "tenant_id_required", "message": err.Error()})
	default:
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal_error", "message": "Internal server error."})
	}
}
