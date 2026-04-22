package usecase

import (
	"context"
	"errors"
	"testing"

	"ap202/internal/authctx"
	"ap202/internal/domain"
)

func TestChargeUseCase_Create_Success(t *testing.T) {
	chargeRepo := &mockChargeRepo{}
	condoRepo := &mockCondoRepo{
		getByIDResult: &domain.Condominium{ID: 1, FeeRule: domain.FeeRuleEqual},
	}
	uc := NewChargeUseCase(chargeRepo, condoRepo, nil)

	charge, err := uc.Create(authctx.WithUser(context.Background(), &domain.User{ID: 10}), 10, "ABC1234", domain.CreateChargeInput{
		Description:         "Taxa ordinaria",
		TotalAmountCentavos: 10001,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if charge.FeeRule != domain.FeeRuleEqual {
		t.Fatalf("expected fee rule equal, got %s", charge.FeeRule)
	}
	if chargeRepo.created == nil {
		t.Fatal("expected charge to be forwarded to repository")
	}
	if chargeRepo.created.TotalAmountCentavos != 10001 {
		t.Fatalf("expected 10001 centavos, got %d", chargeRepo.created.TotalAmountCentavos)
	}
}

func TestChargeUseCase_Create_InvalidAmount(t *testing.T) {
	uc := NewChargeUseCase(&mockChargeRepo{}, &mockCondoRepo{
		getByIDResult: &domain.Condominium{ID: 1, FeeRule: domain.FeeRuleEqual},
	}, nil)

	_, err := uc.Create(context.Background(), 10, "ABC1234", domain.CreateChargeInput{})
	if !errors.Is(err, domain.ErrChargeTotalAmountInvalid) {
		t.Fatalf("expected invalid charge total amount, got %v", err)
	}
}

func TestChargeUseCase_Create_Forbidden(t *testing.T) {
	uc := NewChargeUseCase(&mockChargeRepo{}, &mockCondoRepo{}, &mockDeniedAuthorizer{})

	_, err := uc.Create(authctx.WithUser(context.Background(), &domain.User{ID: 10}), 10, "ABC1234", domain.CreateChargeInput{
		TotalAmountCentavos: 100,
	})
	if !errors.Is(err, domain.ErrForbidden) {
		t.Fatalf("expected forbidden, got %v", err)
	}
}

type mockDeniedAuthorizer struct{}

func (m *mockDeniedAuthorizer) Authorize(ctx context.Context, _ string, _ string) (context.Context, int64, error) {
	return ctx, 0, domain.ErrForbidden
}
