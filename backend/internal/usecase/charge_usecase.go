package usecase

import (
	"context"
	"fmt"
	"time"

	"ap202/internal/domain"
	"ap202/internal/ports/output"
)

type ChargeUseCase struct {
	chargeRepo      output.ChargeRepository
	authorizer      output.AssociationRepository
	condominiumRepo output.CondominiumRepository
}

func NewChargeUseCase(chargeRepo output.ChargeRepository, authorizer output.AssociationRepository, condominiumRepo output.CondominiumRepository) *ChargeUseCase {
	return &ChargeUseCase{
		chargeRepo:      chargeRepo,
		authorizer:      authorizer,
		condominiumRepo: condominiumRepo,
	}
}

func (uc *ChargeUseCase) Create(ctx context.Context, personID int64, condominiumCode string, input domain.CreateChargeInput) (*domain.Charge, error) {
	condominiumID, err := uc.authorize(ctx, personID, condominiumCode)
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

func (uc *ChargeUseCase) authorize(ctx context.Context, personID int64, code string) (int64, error) {
	condominiumID, err := uc.condominiumRepo.FindIDByCode(ctx, code)
	if err != nil {
		return 0, err
	}

	allowed, err := uc.authorizer.HasActiveManagerAssociation(ctx, personID, condominiumID)
	if err != nil {
		return 0, fmt.Errorf("failed to check manager association: %w", err)
	}
	if !allowed {
		return 0, domain.ErrForbidden
	}

	return condominiumID, nil
}
