package authctx

import (
	"context"

	"ap202/internal/domain"
)

type contextKey string

const (
	userIDKey          contextKey = "user_id"
	userKey            contextKey = "user"
	tenantKey          contextKey = "tenant_id"
	condominiumIDKey   contextKey = "condominium_id"
	condominiumCodeKey contextKey = "condominium_code"
)

func WithUser(ctx context.Context, user *domain.User) context.Context {
	if user == nil {
		return ctx
	}

	ctx = context.WithValue(ctx, userIDKey, user.ID)
	ctx = context.WithValue(ctx, userKey, user)
	return ctx
}

func UserIDFromContext(ctx context.Context) (int64, bool) {
	userID, ok := ctx.Value(userIDKey).(int64)
	return userID, ok
}

func UserFromContext(ctx context.Context) (*domain.User, bool) {
	user, ok := ctx.Value(userKey).(*domain.User)
	return user, ok
}

func WithTenantID(ctx context.Context, tenantID int64) context.Context {
	if tenantID <= 0 {
		return ctx
	}
	return context.WithValue(ctx, tenantKey, tenantID)
}

func TenantIDFromContext(ctx context.Context) (int64, bool) {
	tenantID, ok := ctx.Value(tenantKey).(int64)
	return tenantID, ok
}

func WithCondominium(ctx context.Context, condominiumID int64, condominiumCode string) context.Context {
	if condominiumID > 0 {
		ctx = context.WithValue(ctx, condominiumIDKey, condominiumID)
		ctx = context.WithValue(ctx, tenantKey, condominiumID)
	}
	if condominiumCode != "" {
		ctx = context.WithValue(ctx, condominiumCodeKey, condominiumCode)
	}
	return ctx
}

func CondominiumIDFromContext(ctx context.Context) (int64, bool) {
	condominiumID, ok := ctx.Value(condominiumIDKey).(int64)
	return condominiumID, ok
}

func CondominiumCodeFromContext(ctx context.Context) (string, bool) {
	code, ok := ctx.Value(condominiumCodeKey).(string)
	return code, ok
}
