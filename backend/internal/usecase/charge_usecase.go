package usecase

import (
	"context"
	"fmt"
	"time"

	"ap202/internal/authz"
	"ap202/internal/domain"
	"ap202/internal/ports/output"
)

type ChargeUseCase struct {
	chargeRepo      output.ChargeRepository
	condominiumRepo output.CondominiumRepository
	guard           authz.CondominiumAuthorizer
}

func NewChargeUseCase(chargeRepo output.ChargeRepository, condominiumRepo output.CondominiumRepository, guard authz.CondominiumAuthorizer) *ChargeUseCase {
	if guard == nil {
		guard = authz.NewCondominiumGuard(nil, condominiumRepo)
	}

	return &ChargeUseCase{
		chargeRepo:      chargeRepo,
		condominiumRepo: condominiumRepo,
		guard:           guard,
	}
}

func (uc *ChargeUseCase) Create(ctx context.Context, personID int64, condominiumCode string, input domain.CreateChargeInput) (*domain.Charge, error) {
	ctx, condominiumID, err := uc.guard.Authorize(ctx, condominiumCode, "financeiro-svc:boleto:create")
	if err != nil {
		return nil, err
	}

	input = input.Normalize()
	if err := input.Validate(); err != nil {
		return nil, err
	}

	condominium, err := uc.condominiumRepo.GetByID(ctx, condominiumID)
	if err != nil {
		return nil, fmt.Errorf("failed to get condominium for charge creation: %w", err)
	}

	now := time.Now().UTC()
	charge := &domain.Charge{
		CondominiumID:       condominiumID,
		Description:         input.Description,
		TotalAmountCentavos: input.TotalAmountCentavos,
		FeeRule:             condominium.FeeRule,
		CreatedBy:           personID,
		CreatedAt:           now,
	}

	if !charge.FeeRule.IsValid() {
		return nil, domain.ErrInvalidFeeRule
	}

	if err := uc.chargeRepo.Create(ctx, charge); err != nil {
		return nil, err
	}

	return charge, nil
}
