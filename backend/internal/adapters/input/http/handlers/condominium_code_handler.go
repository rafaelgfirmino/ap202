package handlers

import (
	"errors"
	"log"
	"net/http"

	"ap202/internal/authctx"
	"ap202/internal/domain"
)

func (h *CondominiumHandler) GetByCode(w http.ResponseWriter, r *http.Request) {
	personID, ok := authctx.UserIDFromContext(r.Context())
	if !ok || personID <= 0 {
		writeJSON(w, http.StatusUnauthorized, map[string]string{
			"error":   "unauthorized",
			"message": "Invalid or missing token.",
		})
		return
	}

	code := r.PathValue("code")
	condo, err := h.service.GetCondominiumByCode(r.Context(), personID, code)
	if err != nil {
		log.Printf("failed to get condominium by code %s: %v", code, err)
		switch {
		case errors.Is(err, domain.ErrCondominiumNotFound):
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "condominium_not_found", "message": "Condominium not found."})
		case errors.Is(err, domain.ErrForbidden):
			writeJSON(w, http.StatusForbidden, map[string]string{"error": "forbidden", "message": "You do not have permission to access this condominium."})
		default:
			writeJSON(w, http.StatusUnprocessableEntity, map[string]string{"error": err.Error()})
		}
		return
	}

	writeJSON(w, http.StatusOK, condo)
}
