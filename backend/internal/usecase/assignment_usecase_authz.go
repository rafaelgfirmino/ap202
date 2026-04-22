package usecase

import (
	"context"
	"fmt"
	"time"

	"ap202/internal/domain"
	"ap202/internal/ports/output"

	"github.com/google/uuid"
)

type AuthzAssignmentUseCase struct {
	repo            output.AssignmentRepository
	roleRepo        output.RoleRepository
	bundleRefresher output.BundleRefresher
}

func NewAuthzAssignmentUseCase(
	repo output.AssignmentRepository,
	roleRepo output.RoleRepository,
	bundleRefresher output.BundleRefresher,
) *AuthzAssignmentUseCase {
	return &AuthzAssignmentUseCase{
		repo:            repo,
		roleRepo:        roleRepo,
		bundleRefresher: bundleRefresher,
	}
}

func (uc *AuthzAssignmentUseCase) Assign(ctx context.Context, assignment *domain.UserRole) (*domain.UserRole, error) {
	if assignment.UserID <= 0 || assignment.RoleID == uuid.Nil {
		return nil, domain.ErrUserRoleNotFound
	}
	if assignment.TenantID <= 0 {
		return nil, domain.ErrTenantIDRequired
	}

	role, err := uc.roleRepo.GetByID(ctx, assignment.RoleID)
	if err != nil {
		return nil, err
	}

	if role.IsTemplate() && !IsGlobalAssignableRole(role) {
		return nil, domain.ErrRoleTemplateNotAssignable
	}
	if role.TenantID != nil && *role.TenantID != assignment.TenantID {
		return nil, domain.ErrInvalidTenantAssignment
	}

	if assignment.Attributes == nil {
		assignment.Attributes = map[string]string{}
	}
	assignment.ID = uuid.New()
	assignment.CreatedAt = time.Now().UTC()

	if err := uc.repo.Assign(ctx, assignment); err != nil {
		return nil, fmt.Errorf("failed to assign role: %w", err)
	}

	_ = uc.bundleRefresher.Refresh(ctx)
	return assignment, nil
}

func (uc *AuthzAssignmentUseCase) Revoke(ctx context.Context, userID int64, roleID uuid.UUID, tenantID int64) error {
	if err := uc.repo.Revoke(ctx, userID, roleID, tenantID); err != nil {
		return err
	}
	_ = uc.bundleRefresher.Refresh(ctx)
	return nil
}

func (uc *AuthzAssignmentUseCase) ListByUser(ctx context.Context, userID int64) ([]domain.UserRole, error) {
	if userID <= 0 {
		return nil, domain.ErrUserRoleNotFound
	}
	return uc.repo.ListByUser(ctx, userID)
}
