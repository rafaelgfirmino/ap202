package handlers

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"
	"strings"

	"ap202/internal/authctx"
	"ap202/internal/domain"
	"ap202/internal/ports/input"
)

type CondominiumHandler struct {
	service input.CondominiumService
}

func NewCondominiumHandler(service input.CondominiumService) *CondominiumHandler {
	return &CondominiumHandler{service: service}
}

func (h *CondominiumHandler) ListMine(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	personID, ok := authctx.UserIDFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{
			"error":   "unauthorized",
			"message": "Invalid or missing token.",
		})
		return
	}

	condos, err := h.service.ListCondominiumsByPersonID(r.Context(), personID)
	if err != nil {
		log.Printf("failed to list condominiums by user %d: %v", personID, err)
		writeJSON(w, http.StatusUnprocessableEntity, map[string]string{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, condos)
}

func (h *CondominiumHandler) Create(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		h.listOrGetByID(w, r)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if _, ok := authctx.UserFromContext(r.Context()); !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{
			"error":   "unauthorized",
			"message": "Invalid or missing token.",
		})
		return
	}

	var req domain.CreateCondominiumRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}

	condo, err := h.service.CreateCondominium(r.Context(), req)
	if err != nil {
		log.Printf("failed to create condominium: %v", err)
		writeJSON(w, http.StatusUnprocessableEntity, map[string]string{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusCreated, condo)
}

func (h *CondominiumHandler) listOrGetByID(w http.ResponseWriter, r *http.Request) {
	idParam := r.URL.Query().Get("id")
	if idParam != "" {
		h.getByID(w, r, idParam)
		return
	}

	condos, err := h.service.ListCondominiums(r.Context())
	if err != nil {
		log.Printf("failed to list condominiums: %v", err)
		writeJSON(w, http.StatusUnprocessableEntity, map[string]string{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, condos)
}

func (h *CondominiumHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	idParam := strings.TrimPrefix(r.URL.Path, "/condominiums/")
	h.getByID(w, r, idParam)
}

func (h *CondominiumHandler) getByID(w http.ResponseWriter, r *http.Request, idParam string) {
	id, err := strconv.ParseInt(idParam, 10, 64)
	if err != nil || id <= 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid condominium id"})
		return
	}

	condo, err := h.service.GetCondominiumByID(r.Context(), id)
	if err != nil {
		log.Printf("failed to get condominium %d: %v", id, err)
		if errors.Is(err, domain.ErrCondominiumNotFound) {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": err.Error()})
			return
		}
		writeJSON(w, http.StatusUnprocessableEntity, map[string]string{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, condo)
}

func (h *CondominiumHandler) UpdateFeeRule(w http.ResponseWriter, r *http.Request) {
	personID, ok := authctx.UserIDFromContext(r.Context())
	if !ok || personID <= 0 {
		writeJSON(w, http.StatusUnauthorized, map[string]string{
			"error":   "unauthorized",
			"message": "Invalid or missing token.",
		})
		return
	}

	var req domain.UpdateFeeRuleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error":   "invalid_request",
			"message": "Invalid request body.",
		})
		return
	}

	condo, err := h.service.UpdateFeeRule(r.Context(), personID, r.PathValue("code"), req.FeeRule)
	if err != nil {
		log.Printf("failed to update condominium fee rule: %v", err)
		switch {
		case errors.Is(err, domain.ErrCondominiumNotFound):
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "condominium_not_found", "message": "Condominium not found."})
		case errors.Is(err, domain.ErrForbidden):
			writeJSON(w, http.StatusForbidden, map[string]string{"error": "forbidden", "message": "You do not have permission to access this condominium."})
		case errors.Is(err, domain.ErrInvalidFeeRule):
			writeJSON(w, http.StatusUnprocessableEntity, map[string]string{"error": "invalid_fee_rule", "message": "Fee rule must be equal or proportional."})
		case errors.Is(err, domain.ErrFeeRuleImmutable):
			writeJSON(w, http.StatusConflict, map[string]string{"error": "fee_rule_immutable", "message": "Fee rule cannot be changed after charges are registered."})
		default:
			writeJSON(w, http.StatusUnprocessableEntity, map[string]string{"error": err.Error()})
		}
		return
	}

	writeJSON(w, http.StatusOK, condo)
}

func (h *CondominiumHandler) UpdateLandArea(w http.ResponseWriter, r *http.Request) {
	personID, ok := authctx.UserIDFromContext(r.Context())
	if !ok || personID <= 0 {
		writeJSON(w, http.StatusUnauthorized, map[string]string{
			"error":   "unauthorized",
			"message": "Invalid or missing token.",
		})
		return
	}

	var req domain.UpdateLandAreaRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error":   "invalid_request",
			"message": "Invalid request body.",
		})
		return
	}

	condo, err := h.service.UpdateLandArea(r.Context(), personID, r.PathValue("code"), req.LandArea)
	if err != nil {
		log.Printf("failed to update condominium land area: %v", err)
		switch {
		case errors.Is(err, domain.ErrCondominiumNotFound):
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "condominium_not_found", "message": "Condominium not found."})
		case errors.Is(err, domain.ErrForbidden):
			writeJSON(w, http.StatusForbidden, map[string]string{"error": "forbidden", "message": "You do not have permission to access this condominium."})
		default:
			writeJSON(w, http.StatusUnprocessableEntity, map[string]string{"error": "invalid_land_area", "message": err.Error()})
		}
		return
	}

	writeJSON(w, http.StatusOK, condo)
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		log.Printf("failed to write JSON response: %v", err)
	}
}
