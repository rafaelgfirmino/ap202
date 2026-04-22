package handlers

import (
	"errors"
	"log"
	"net/http"

	"ap202/internal/authctx"
	"ap202/internal/domain"
	"ap202/internal/ports/input"
)

type UserHandler struct {
	service input.UserService
}

func NewUserHandler(service input.UserService) *UserHandler {
	return &UserHandler{service: service}
}

func (h *UserHandler) Me(w http.ResponseWriter, r *http.Request) {
	userID, ok := authctx.UserIDFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{
			"error":   "unauthorized",
			"message": "Token inválido ou ausente.",
		})
		return
	}

	user, err := h.service.GetByID(r.Context(), userID)
	if err != nil {
		log.Printf("failed to get authenticated user %d: %v", userID, err)
		if errors.Is(err, domain.ErrUserNotFound) {
			writeJSON(w, http.StatusNotFound, map[string]string{
				"error":   "user_not_found",
				"message": "User não encontrada.",
			})
			return
		}
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error":   "internal_error",
			"message": "Erro interno do servidor.",
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"id":         user.ID,
		"first_name": user.FirstName,
		"last_name":  user.LastName,
		"name":       user.Name,
		"email":      user.Email,
		"created_at": user.CreatedAt,
	})
}
