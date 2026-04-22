package authz_test

import (
	"context"

	"ap202/internal/authctx"
	"ap202/internal/authz"
	"ap202/internal/domain"
)

type RepasseRepository interface {
	Create(ctx context.Context, input CreateRepasseInput) error
}

type CreateRepasseInput struct {
	OwnerID    string
	UnidadeID  string
	Attributes map[string]string
}

type CreateRepasseUseCase struct {
	authorizer *authz.Authorizer
	repo       RepasseRepository
}

func (uc *CreateRepasseUseCase) Execute(ctx context.Context, input CreateRepasseInput) error {
	if err := uc.authorizer.Require(
		ctx,
		"repasse-svc:repasse:create",
		authz.WithResource(map[string]any{
			"owner_id":   input.OwnerID,
			"unidade_id": input.UnidadeID,
		}),
		authz.WithAttributes(input.Attributes),
	); err != nil {
		return err
	}

	return uc.repo.Create(ctx, input)
}

func ExampleAuthorizer_Require() {
	ctx := context.Background()
	ctx = authctx.WithUser(ctx, &domain.User{ID: 42})
	ctx = authctx.WithTenantID(ctx, 101)
	_ = ctx
}

func ExampleNewHTTPClient() {
	_ = authz.NewHTTPClient("http://opa:8181", nil)
}
