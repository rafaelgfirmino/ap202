package usecase

import (
	"context"
	"fmt"
	"time"

	"ap202/internal/domain"
	"ap202/internal/ports/output"
	"ap202/internal/seed"

	"github.com/google/uuid"
)

type TenantUseCase struct {
	roleRepo        output.RoleRepository
	bundleRefresher output.BundleRefresher
}

func NewTenantUseCase(roleRepo output.RoleRepository, bundleRefresher output.BundleRefresher) *TenantUseCase {
	return &TenantUseCase{
		roleRepo:        roleRepo,
		bundleRefresher: bundleRefresher,
	}
}

func (uc *TenantUseCase) Setup(ctx context.Context, tenantID int64) ([]domain.Role, error) {
	if tenantID <= 0 {
		return nil, domain.ErrTenantIDRequired
	}

	roots, err := uc.roleRepo.ListRoots(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to load role templates: %w", err)
	}

	now := time.Now().UTC()
	created := make([]domain.Role, 0, len(seed.RoleTemplates))

	for _, root := range roots {
		if seed.IsGlobalRoleName(root.Name) {
			continue
		}

		existing, err := uc.roleRepo.GetByName(ctx, root.Name, &tenantID)
		if err == nil {
			created = append(created, *existing)
			continue
		}
		if err != nil && err != domain.ErrRoleNotFound {
			return nil, fmt.Errorf("failed to check existing tenant role %s: %w", root.Name, err)
		}

		instance := domain.Role{
			ID:          uuid.New(),
			TenantID:    &tenantID,
			TemplateID:  &root.ID,
			Name:        root.Name,
			Description: root.Description,
			Scope:       domain.RoleScope(&tenantID),
			CreatedAt:   now,
			UpdatedAt:   now,
		}

		if err := uc.roleRepo.Create(ctx, &instance); err != nil {
			return nil, fmt.Errorf("failed to create tenant role instance %s: %w", root.Name, err)
		}
		created = append(created, instance)
	}

	_ = uc.bundleRefresher.Refresh(ctx)
	return created, nil
}
