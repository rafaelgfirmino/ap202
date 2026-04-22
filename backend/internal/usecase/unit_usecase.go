package usecase

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"ap202/internal/domain"
	"ap202/internal/domain/vo"
	"ap202/internal/ports/output"
)

type UnitUseCase struct {
	unitRepo        output.UnitRepository
	unitGroupRepo   output.UnitGroupRepository
	authorizer      output.AssociationRepository
	condominiumRepo output.CondominiumRepository
}

func NewUnitUseCase(unitRepo output.UnitRepository, unitGroupRepo output.UnitGroupRepository, authorizer output.AssociationRepository, condominiumRepo output.CondominiumRepository) *UnitUseCase {
	return &UnitUseCase{
		unitRepo:        unitRepo,
		unitGroupRepo:   unitGroupRepo,
		authorizer:      authorizer,
		condominiumRepo: condominiumRepo,
	}
}

func (uc *UnitUseCase) Create(ctx context.Context, personID int64, code string, input domain.CreateUnitInput) (*domain.Unit, error) {
	condominiumID, err := uc.authorize(ctx, personID, code)
	if err != nil {
		return nil, err
	}

	input = input.Normalize()
	if err := input.Validate(); err != nil {
		return nil, err
	}
	if input.GroupType != "" && input.GroupName != "" {
		exists, err := uc.unitGroupRepo.Exists(ctx, condominiumID, input.GroupType, input.GroupName)
		if err != nil {
			return nil, fmt.Errorf("failed to validate registered unit group: %w", err)
		}
		if !exists {
			return nil, domain.ErrUnitGroupMustBeRegistered
		}

		groups, err := uc.unitGroupRepo.List(ctx, condominiumID)
		if err != nil {
			return nil, fmt.Errorf("failed to load unit groups for floor validation: %w", err)
		}

		for _, group := range groups {
			if group.GroupType == input.GroupType && group.Name == input.GroupName && group.Floors != nil {
				floorValue, err := strconv.Atoi(strings.TrimSpace(input.Floor))
				if err != nil || floorValue < 1 || floorValue > *group.Floors {
					return nil, domain.ErrUnitFloorInvalid
				}
				break
			}
		}
	}

	exists, err := uc.unitRepo.ExistsByGroupNameAndIdentifier(ctx, condominiumID, input.GroupName, input.Identifier)
	if err != nil {
		return nil, fmt.Errorf("failed to check unit group and identifier uniqueness: %w", err)
	}
	if exists {
		return nil, domain.ErrUnitIdentifierDuplicate
	}

	unitCode, err := vo.NewUnitCode(code, input.GroupName, input.Identifier)
	if err != nil {
		if errors.Is(err, vo.ErrUnitCodeIdentifierRequired) {
			return nil, domain.ErrUnitIdentifierRequired
		}
		if errors.Is(err, vo.ErrUnitCodeTooLong) {
			return nil, domain.ErrUnitCodeTooLong
		}
		return nil, err
	}

	now := time.Now().UTC()
	unit := &domain.Unit{
		CondominiumID: condominiumID,
		Code:          unitCode.String(),
		Identifier:    input.Identifier,
		GroupType:     input.GroupType,
		GroupName:     input.GroupName,
		Floor:         input.Floor,
		Description:   input.Description,
		PrivateArea:   input.PrivateArea,
		Active:        true,
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	if err := uc.unitRepo.Create(ctx, unit); err != nil {
		return nil, err
	}

	return unit, nil
}

func (uc *UnitUseCase) List(ctx context.Context, personID int64, code string) ([]domain.Unit, error) {
	condominiumID, err := uc.authorize(ctx, personID, code)
	if err != nil {
		return nil, err
	}

	units, err := uc.unitRepo.List(ctx, condominiumID)
	if err != nil {
		return nil, fmt.Errorf("failed to list units: %w", err)
	}

	return units, nil
}

func (uc *UnitUseCase) GetByID(ctx context.Context, personID int64, code string, unitID int64) (*domain.Unit, error) {
	if unitID <= 0 {
		return nil, domain.ErrUnitNotFound
	}

	condominiumID, err := uc.authorize(ctx, personID, code)
	if err != nil {
		return nil, err
	}

	unit, err := uc.unitRepo.FindByID(ctx, unitID, condominiumID)
	if err != nil {
		return nil, fmt.Errorf("failed to get unit: %w", err)
	}

	return unit, nil
}

func (uc *UnitUseCase) UpdatePrivateArea(ctx context.Context, personID int64, code string, unitID int64, input domain.UpdateUnitPrivateAreaInput) (*domain.Unit, error) {
	if unitID <= 0 {
		return nil, domain.ErrUnitNotFound
	}

	condominiumID, err := uc.authorize(ctx, personID, code)
	if err != nil {
		return nil, err
	}

	if err := input.Validate(); err != nil {
		return nil, err
	}

	unit, err := uc.unitRepo.UpdatePrivateArea(ctx, unitID, condominiumID, input.PrivateArea)
	if err != nil {
		return nil, err
	}

	return unit, nil
}

func (uc *UnitUseCase) Delete(ctx context.Context, personID int64, code string, unitID int64) error {
	if unitID <= 0 {
		return domain.ErrUnitNotFound
	}

	condominiumID, err := uc.authorize(ctx, personID, code)
	if err != nil {
		return err
	}

	if err := uc.unitRepo.Delete(ctx, unitID, condominiumID); err != nil {
		return err
	}

	return nil
}

func (uc *UnitUseCase) authorize(ctx context.Context, personID int64, code string) (int64, error) {
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
