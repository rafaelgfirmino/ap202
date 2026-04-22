package usecase

import (
	"context"
	"fmt"
	"time"

	"ap202/internal/domain"
	"ap202/internal/ports/output"
)

type UnitGroupUseCase struct {
	repo            output.UnitGroupRepository
	unitRepo        output.UnitRepository
	authorizer      output.AssociationRepository
	condominiumRepo output.CondominiumRepository
}

func NewUnitGroupUseCase(repo output.UnitGroupRepository, unitRepo output.UnitRepository, authorizer output.AssociationRepository, condominiumRepo output.CondominiumRepository) *UnitGroupUseCase {
	return &UnitGroupUseCase{
		repo:            repo,
		unitRepo:        unitRepo,
		authorizer:      authorizer,
		condominiumRepo: condominiumRepo,
	}
}

func (uc *UnitGroupUseCase) Create(ctx context.Context, personID int64, code string, input domain.CreateUnitGroupInput) (*domain.UnitGroup, error) {
	condominiumID, err := uc.authorize(ctx, personID, code)
	if err != nil {
		return nil, err
	}

	input = input.Normalize()
	if err := input.Validate(); err != nil {
		return nil, err
	}

	exists, err := uc.repo.Exists(ctx, condominiumID, input.GroupType, input.Name)
	if err != nil {
		return nil, fmt.Errorf("failed to check unit group existence: %w", err)
	}
	if exists {
		return nil, domain.ErrUnitGroupAlreadyExists
	}

	group := &domain.UnitGroup{
		CondominiumID: condominiumID,
		GroupType:     input.GroupType,
		Name:          input.Name,
		Floors:        input.Floors,
		Active:        true,
		CreatedAt:     time.Now().UTC(),
	}

	if err := uc.repo.Create(ctx, group); err != nil {
		return nil, err
	}

	return group, nil
}

func (uc *UnitGroupUseCase) List(ctx context.Context, personID int64, code string) ([]domain.UnitGroup, error) {
	condominiumID, err := uc.authorize(ctx, personID, code)
	if err != nil {
		return nil, err
	}

	groups, err := uc.repo.List(ctx, condominiumID)
	if err != nil {
		return nil, fmt.Errorf("failed to list unit groups: %w", err)
	}
	if len(groups) == 0 {
		defaultGroup := &domain.UnitGroup{
			CondominiumID: condominiumID,
			GroupType:     "block",
			Name:          "A",
			Active:        true,
			CreatedAt:     time.Now().UTC(),
		}

		if err := uc.repo.Create(ctx, defaultGroup); err != nil && err != domain.ErrUnitGroupAlreadyExists {
			return nil, fmt.Errorf("failed to create default unit group: %w", err)
		}

		groups, err = uc.repo.List(ctx, condominiumID)
		if err != nil {
			return nil, fmt.Errorf("failed to list unit groups after default creation: %w", err)
		}
	}

	return groups, nil
}

func (uc *UnitGroupUseCase) Update(ctx context.Context, personID int64, code string, id int64, input domain.UpdateUnitGroupInput) (*domain.UnitGroup, error) {
	condominiumID, err := uc.authorize(ctx, personID, code)
	if err != nil {
		return nil, err
	}

	input = input.Normalize()
	if err := input.Validate(); err != nil {
		return nil, err
	}

	current, err := uc.repo.GetByID(ctx, condominiumID, id)
	if err != nil {
		return nil, err
	}

	if current.GroupType != input.GroupType || current.Name != input.Name {
		exists, err := uc.repo.ExistsExcludingID(ctx, condominiumID, id, input.GroupType, input.Name)
		if err != nil {
			return nil, fmt.Errorf("failed to check unit group existence on update: %w", err)
		}
		if exists {
			return nil, domain.ErrUnitGroupAlreadyExists
		}
	}

	group, err := uc.repo.Update(ctx, condominiumID, id, input)
	if err != nil {
		return nil, err
	}

	return group, nil
}

func (uc *UnitGroupUseCase) Delete(ctx context.Context, personID int64, code string, id int64) error {
	condominiumID, err := uc.authorize(ctx, personID, code)
	if err != nil {
		return err
	}

	group, err := uc.repo.GetByID(ctx, condominiumID, id)
	if err != nil {
		return err
	}

	exists, err := uc.unitRepo.ExistsByGroup(ctx, condominiumID, group.GroupType, group.Name)
	if err != nil {
		return fmt.Errorf("failed to check linked units for group deletion: %w", err)
	}
	if exists {
		return domain.ErrUnitGroupHasUnits
	}

	if err := uc.repo.Delete(ctx, condominiumID, id); err != nil {
		return err
	}

	return nil
}

func (uc *UnitGroupUseCase) authorize(ctx context.Context, personID int64, code string) (int64, error) {
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
