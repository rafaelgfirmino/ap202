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

type AuthzRoleUseCase struct {
	repo            output.RoleRepository
	permissionRepo  output.PermissionRepository
	bundleRefresher output.BundleRefresher
}

func NewAuthzRoleUseCase(
	repo output.RoleRepository,
	permissionRepo output.PermissionRepository,
	bundleRefresher output.BundleRefresher,
) *AuthzRoleUseCase {
	return &AuthzRoleUseCase{
		repo:            repo,
		permissionRepo:  permissionRepo,
		bundleRefresher: bundleRefresher,
	}
}

func (uc *AuthzRoleUseCase) EnsureSeedRoles(ctx context.Context) error {
	now := time.Now().UTC()

	for _, seeded := range seed.GlobalRoles {
		if _, err := uc.repo.GetByName(ctx, seeded.Name, nil); err == nil {
			continue
		}
		role := &domain.Role{
			ID:          uuid.New(),
			Name:        seeded.Name,
			Description: seeded.Description,
			Scope:       seeded.Scope,
			CreatedAt:   now,
			UpdatedAt:   now,
		}
		role.Normalize()
		if err := uc.repo.Create(ctx, role); err != nil {
			return fmt.Errorf("failed to create global seed role %s: %w", seeded.Name, err)
		}
	}

	for _, seeded := range seed.RoleTemplates {
		if _, err := uc.repo.GetByName(ctx, seeded.Name, nil); err == nil {
			continue
		}
		role := &domain.Role{
			ID:          uuid.New(),
			Name:        seeded.Name,
			Description: seeded.Description,
			Scope:       domain.RoleScope(nil),
			CreatedAt:   now,
			UpdatedAt:   now,
		}
		role.Normalize()
		if err := uc.repo.Create(ctx, role); err != nil {
			return fmt.Errorf("failed to create template seed role %s: %w", seeded.Name, err)
		}
	}

	return nil
}

func (uc *AuthzRoleUseCase) Create(ctx context.Context, role *domain.Role) (*domain.Role, error) {
	role.Normalize()
	if role.Name == "" {
		return nil, domain.ErrRoleNameRequired
	}

	if role.IsInstance() && role.TemplateID == nil {
		return nil, domain.ErrRoleInstanceAssignmentOnly
	}

	now := time.Now().UTC()
	role.ID = uuid.New()
	role.CreatedAt = now
	role.UpdatedAt = now

	if err := uc.repo.Create(ctx, role); err != nil {
		return nil, fmt.Errorf("failed to create role: %w", err)
	}

	_ = uc.bundleRefresher.Refresh(ctx)
	return role, nil
}

func (uc *AuthzRoleUseCase) List(ctx context.Context, tenantID *int64) ([]domain.Role, error) {
	return uc.repo.List(ctx, tenantID)
}

func (uc *AuthzRoleUseCase) GetByID(ctx context.Context, id uuid.UUID) (*domain.Role, error) {
	if id == uuid.Nil {
		return nil, domain.ErrRoleNotFound
	}
	return uc.repo.GetByID(ctx, id)
}

func (uc *AuthzRoleUseCase) Delete(ctx context.Context, id uuid.UUID) error {
	if id == uuid.Nil {
		return domain.ErrRoleNotFound
	}
	if err := uc.repo.Delete(ctx, id); err != nil {
		return err
	}
	_ = uc.bundleRefresher.Refresh(ctx)
	return nil
}

func (uc *AuthzRoleUseCase) AssignPermission(ctx context.Context, roleID, permissionID uuid.UUID) error {
	role, err := uc.repo.GetByID(ctx, roleID)
	if err != nil {
		return err
	}
	if _, err := uc.permissionRepo.GetByID(ctx, permissionID); err != nil {
		return err
	}
	if role.IsInstance() {
		return domain.ErrRoleTemplateRequired
	}
	if err := uc.repo.AssignPermission(ctx, roleID, permissionID); err != nil {
		return err
	}
	_ = uc.bundleRefresher.Refresh(ctx)
	return nil
}

func (uc *AuthzRoleUseCase) RemovePermission(ctx context.Context, roleID, permissionID uuid.UUID) error {
	role, err := uc.repo.GetByID(ctx, roleID)
	if err != nil {
		return err
	}
	if role.IsInstance() {
		return domain.ErrRoleTemplateRequired
	}
	if err := uc.repo.RemovePermission(ctx, roleID, permissionID); err != nil {
		return err
	}
	_ = uc.bundleRefresher.Refresh(ctx)
	return nil
}

func IsGlobalAssignableRole(role *domain.Role) bool {
	return role.TenantID == nil && role.TemplateID == nil && seed.IsGlobalRoleName(role.Name)
}
