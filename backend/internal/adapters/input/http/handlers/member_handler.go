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

type MemberHandler struct {
	service input.MemberService
}

func NewMemberHandler(service input.MemberService) *MemberHandler {
	return &MemberHandler{service: service}
}

func (h *MemberHandler) Add(w http.ResponseWriter, r *http.Request) {
	userID, ok := authctx.UserIDFromContext(r.Context())
	if !ok || userID <= 0 {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized", "message": "Invalid or missing token."})
		return
	}

	unitCode := r.PathValue("unit_code")
	if unitCode == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid_unit_code", "message": "Invalid unit code."})
		return
	}

	var req domain.AddMemberInput
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid_request", "message": "Invalid request body."})
		return
	}

	member, err := h.service.Add(r.Context(), userID, r.PathValue("code"), unitCode, req)
	if err != nil {
		h.writeError(w, err)
		return
	}

	writeJSON(w, http.StatusCreated, member)
}

func (h *MemberHandler) List(w http.ResponseWriter, r *http.Request) {
	userID, ok := authctx.UserIDFromContext(r.Context())
	if !ok || userID <= 0 {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized", "message": "Invalid or missing token."})
		return
	}

	unitCode := r.PathValue("unit_code")
	if unitCode == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid_unit_code", "message": "Invalid unit code."})
		return
	}

	members, err := h.service.List(r.Context(), userID, r.PathValue("code"), unitCode)
	if err != nil {
		h.writeError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"data": members, "total": len(members)})
}

func (h *MemberHandler) Remove(w http.ResponseWriter, r *http.Request) {
	userID, ok := authctx.UserIDFromContext(r.Context())
	if !ok || userID <= 0 {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized", "message": "Invalid or missing token."})
		return
	}

	unitCode := r.PathValue("unit_code")
	if unitCode == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid_unit_code", "message": "Invalid unit code."})
		return
	}

	bondID, err := strconv.ParseInt(r.PathValue("bond_id"), 10, 64)
	if err != nil || bondID <= 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid_bond_id", "message": "Invalid bond id."})
		return
	}

	if err := h.service.Remove(r.Context(), userID, r.PathValue("code"), unitCode, bondID); err != nil {
		h.writeError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *MemberHandler) writeError(w http.ResponseWriter, err error) {
	log.Printf("member handler error: %v", err)

	switch {
	case errors.Is(err, domain.ErrCondominiumNotFound):
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "condominium_not_found", "message": "Condominium not found."})
	case errors.Is(err, domain.ErrUnitNotFound):
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "unit_not_found", "message": "Unit not found."})
	case errors.Is(err, domain.ErrBondNotFound):
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "bond_not_found", "message": "Bond not found."})
	case errors.Is(err, domain.ErrMemberNotFound):
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "member_not_found", "message": "Member not found."})
	case errors.Is(err, domain.ErrMemberAlreadyLinked):
		writeJSON(w, http.StatusConflict, map[string]string{"error": "member_already_linked", "message": "This member already has an active link with the same role for this unit."})
	case errors.Is(err, domain.ErrInvalidMemberRole):
		writeJSON(w, http.StatusUnprocessableEntity, map[string]string{"error": "invalid_member_role", "message": "Role must be owner or tenant."})
	case errors.Is(err, domain.ErrNameRequired):
		writeJSON(w, http.StatusUnprocessableEntity, map[string]string{"error": "name_required", "message": "Name is required."})
	case errors.Is(err, domain.ErrEmailRequired):
		writeJSON(w, http.StatusUnprocessableEntity, map[string]string{"error": "email_required", "message": "Email is required."})
	default:
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal_error", "message": "Internal server error."})
	}
}
