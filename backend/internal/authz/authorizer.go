package authz

import (
	"context"
	"errors"
	"fmt"

	"ap202/internal/authctx"
)

var (
	ErrUnauthorized         = errors.New("unauthorized")
	ErrUserMissingContext   = errors.New("user_id not found in context")
	ErrTenantMissingContext = errors.New("tenant_id not found in context")
)

type options struct {
	resource   map[string]any
	attributes map[string]any
}

type Option func(*options)

func WithResource(resource map[string]any) Option {
	return func(o *options) {
		o.resource = resource
	}
}

func WithAttributes(attributes map[string]string) Option {
	return func(o *options) {
		if len(attributes) == 0 {
			return
		}
		o.attributes = make(map[string]any, len(attributes))
		for key, value := range attributes {
			o.attributes[key] = value
		}
	}
}

type Authorizer struct {
	evaluator Evaluator
}

func NewAuthorizer(evaluator Evaluator) *Authorizer {
	return &Authorizer{evaluator: evaluator}
}

func (a *Authorizer) Require(ctx context.Context, permission string, opts ...Option) error {
	cfg := options{}
	for _, opt := range opts {
		opt(&cfg)
	}

	userID, ok := authctx.UserIDFromContext(ctx)
	if !ok {
		return ErrUserMissingContext
	}

	tenantID, ok := authctx.TenantIDFromContext(ctx)
	if !ok {
		return ErrTenantMissingContext
	}

	result, err := a.evaluator.Evaluate(ctx, Input{
		UserID:     userID,
		TenantID:   tenantID,
		Permission: permission,
		Resource:   cfg.resource,
		Attributes: cfg.attributes,
	})
	if err != nil {
		return fmt.Errorf("authorization check failed: %w", err)
	}
	if !result.Allow {
		return ErrUnauthorized
	}

	return nil
}
