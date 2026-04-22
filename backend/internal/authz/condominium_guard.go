package authz

import (
	"context"
	"errors"
	"fmt"

	"ap202/internal/authctx"
	"ap202/internal/domain"
)

type CondominiumResolver interface {
	FindIDByCode(ctx context.Context, code string) (int64, error)
}

type CondominiumAuthorizer interface {
	Authorize(ctx context.Context, code string, permission string) (context.Context, int64, error)
}

type CondominiumGuard struct {
	authorizer *Authorizer
	resolver   CondominiumResolver
}

func NewCondominiumGuard(authorizer *Authorizer, resolver CondominiumResolver) *CondominiumGuard {
	return &CondominiumGuard{
		authorizer: authorizer,
		resolver:   resolver,
	}
}

func (g *CondominiumGuard) Authorize(ctx context.Context, code string, permission string) (context.Context, int64, error) {
	condominiumID, ok := authctx.CondominiumIDFromContext(ctx)
	if !ok {
		var err error
		condominiumID, err = g.resolver.FindIDByCode(ctx, code)
		if err != nil {
			return ctx, 0, err
		}
		ctx = authctx.WithCondominium(ctx, condominiumID, code)
	}

	if g.authorizer == nil {
		return ctx, condominiumID, nil
	}

	if err := g.authorizer.Require(ctx, permission); err != nil {
		if errors.Is(err, ErrUnauthorized) {
			return ctx, 0, domain.ErrForbidden
		}
		return ctx, 0, fmt.Errorf("failed to authorize condominium action: %w", err)
	}

	return ctx, condominiumID, nil
}
