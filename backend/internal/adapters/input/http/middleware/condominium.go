package middleware

import (
	"context"
	"net/http"

	"ap202/internal/authctx"
	"ap202/internal/domain"
	"ap202/internal/ports/output"
)

type CondominiumMiddleware struct {
	repo output.CondominiumRepository
}

func NewCondominiumMiddleware(repo output.CondominiumRepository) *CondominiumMiddleware {
	return &CondominiumMiddleware{repo: repo}
}

func (m *CondominiumMiddleware) RequireCondominiumCode(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		code := r.PathValue("code")
		if code == "" {
			next.ServeHTTP(w, r)
			return
		}

		condominiumID, err := m.repo.FindIDByCode(r.Context(), code)
		if err != nil {
			status := http.StatusInternalServerError
			message := "Internal server error."
			if err == domain.ErrCondominiumNotFound {
				status = http.StatusNotFound
				message = "Condominium not found."
			}
			writeCondominiumError(w, status, message)
			return
		}

		ctx := authctx.WithCondominium(r.Context(), condominiumID, code)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func writeCondominiumError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_, _ = w.Write([]byte(`{"error":"condominium_context","message":"` + message + `"}`))
}

func WithCondominiumContext(ctx context.Context, condominiumID int64, code string) context.Context {
	return authctx.WithCondominium(ctx, condominiumID, code)
}
