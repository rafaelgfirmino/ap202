package authctx

import (
	"context"

	"ap202/internal/domain"
)

type contextKey string

const (
	userIDKey contextKey = "user_id"
	userKey   contextKey = "user"
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
