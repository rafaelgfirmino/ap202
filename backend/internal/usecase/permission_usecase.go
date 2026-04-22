package usecase

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"ap202/internal/domain"
	"ap202/internal/ports/output"
	"ap202/internal/seed"

	"github.com/google/uuid"
)

type PermissionUseCase struct {
	repo            output.PermissionRepository
	roleRepo        output.RoleRepository
	bundleRepo      output.AuthorizationBundleRepository
	bundleRefresher output.BundleRefresher
}

func NewPermissionUseCase(
	repo output.PermissionRepository,
	roleRepo output.RoleRepository,
	bundleRepo output.AuthorizationBundleRepository,
	bundleRefresher output.BundleRefresher,
) *PermissionUseCase {
	return &PermissionUseCase{
		repo:            repo,
		roleRepo:        roleRepo,
		bundleRepo:      bundleRepo,
		bundleRefresher: bundleRefresher,
	}
}

func (uc *PermissionUseCase) EnsureSeedPermissions(ctx context.Context) error {
	if err := uc.Sync(ctx, seed.PermissionSeeds); err != nil {
		return fmt.Errorf("failed to seed permissions: %w", err)
	}
	return nil
}

func (uc *PermissionUseCase) Create(ctx context.Context, permission *domain.Permission) (*domain.Permission, error) {
	if err := validatePermission(permission); err != nil {
		return nil, err
	}

	if _, err := uc.repo.GetByKey(ctx, permission.Microservice, permission.Resource, permission.Action); err == nil {
		return nil, domain.ErrPermissionAlreadyExists
	} else if !errors.Is(err, domain.ErrPermissionNotFound) {
		return nil, fmt.Errorf("failed to validate permission uniqueness: %w", err)
	}

	now := time.Now().UTC()
	permission.ID = uuid.New()
	permission.CreatedAt = now
	permission.UpdatedAt = now

	if err := uc.repo.Create(ctx, permission); err != nil {
		return nil, fmt.Errorf("failed to create permission: %w", err)
	}

	_ = uc.bundleRefresher.Refresh(ctx)
	return permission, nil
}

func (uc *PermissionUseCase) List(ctx context.Context) ([]domain.Permission, error) {
	return uc.repo.List(ctx)
}

func (uc *PermissionUseCase) GetByID(ctx context.Context, id uuid.UUID) (*domain.Permission, error) {
	if id == uuid.Nil {
		return nil, domain.ErrPermissionNotFound
	}
	return uc.repo.GetByID(ctx, id)
}

func (uc *PermissionUseCase) Delete(ctx context.Context, id uuid.UUID) error {
	if id == uuid.Nil {
		return domain.ErrPermissionNotFound
	}
	if err := uc.repo.Delete(ctx, id); err != nil {
		return err
	}
	_ = uc.bundleRefresher.Refresh(ctx)
	return nil
}

func (uc *PermissionUseCase) Sync(ctx context.Context, items []domain.PermissionSyncItem) error {
	now := time.Now().UTC()

	for _, item := range items {
		permission := &domain.Permission{
			ID:           uuid.New(),
			Microservice: item.Microservice,
			Resource:     item.Resource,
			Action:       item.Action,
			Description:  item.Description,
			Conditions:   item.Conditions,
			CreatedAt:    now,
			UpdatedAt:    now,
		}
		if err := validatePermission(permission); err != nil {
			return err
		}

		if existing, err := uc.repo.GetByKey(ctx, permission.Microservice, permission.Resource, permission.Action); err == nil {
			permission.ID = existing.ID
			permission.CreatedAt = existing.CreatedAt
		} else if !errors.Is(err, domain.ErrPermissionNotFound) {
			return fmt.Errorf("failed to lookup permission during sync: %w", err)
		}

		if err := uc.repo.Upsert(ctx, permission); err != nil {
			return fmt.Errorf("failed to upsert permission during sync: %w", err)
		}

		for _, roleName := range item.SuggestedRoles {
			roleName = strings.TrimSpace(roleName)
			if roleName == "" {
				continue
			}

			role, err := uc.roleRepo.GetByName(ctx, roleName, nil)
			if err == nil {
				if err := uc.roleRepo.AssignPermission(ctx, role.ID, permission.ID); err != nil {
					return fmt.Errorf("failed to assign synced permission to role %s: %w", roleName, err)
				}
				continue
			}
			if !errors.Is(err, domain.ErrRoleNotFound) {
				return fmt.Errorf("failed to lookup suggested role %s: %w", roleName, err)
			}
			if err := uc.bundleRepo.StorePendingRoleLink(ctx, permission.Name, roleName); err != nil {
				return fmt.Errorf("failed to store pending role suggestion: %w", err)
			}
		}
	}

	_ = uc.bundleRefresher.Refresh(ctx)
	return nil
}

func validatePermission(permission *domain.Permission) error {
	permission.Normalize()
	switch {
	case permission.Microservice == "":
		return domain.ErrPermissionMicroserviceEmpty
	case permission.Resource == "":
		return domain.ErrPermissionResourceEmpty
	case permission.Action == "":
		return domain.ErrPermissionActionEmpty
	default:
		return nil
	}
}
