package usecase

import (
	"context"
	"fmt"
	"sync"

	"ap202/internal/authz"
	"ap202/internal/ports/output"
)

type AuthorizationBundleUseCase struct {
	repo   output.AuthorizationBundleRepository
	engine authz.ReloadableEvaluator

	mu      sync.Mutex
	running bool
}

func NewAuthorizationBundleUseCase(repo output.AuthorizationBundleRepository, engine authz.ReloadableEvaluator) *AuthorizationBundleUseCase {
	return &AuthorizationBundleUseCase{repo: repo, engine: engine}
}

func (uc *AuthorizationBundleUseCase) Refresh(ctx context.Context) error {
	uc.mu.Lock()
	if uc.running {
		uc.mu.Unlock()
		return nil
	}
	uc.running = true
	uc.mu.Unlock()

	go func() {
		defer func() {
			uc.mu.Lock()
			uc.running = false
			uc.mu.Unlock()
		}()
		_ = uc.Rebuild(ctx)
	}()

	return nil
}

func (uc *AuthorizationBundleUseCase) Rebuild(ctx context.Context) error {
	data, err := uc.BuildData(ctx)
	if err != nil {
		return err
	}
	if err := uc.engine.Reload(ctx, data); err != nil {
		return fmt.Errorf("failed to reload authorization engine: %w", err)
	}
	return nil
}

func (uc *AuthorizationBundleUseCase) BuildData(ctx context.Context) (*authz.BundleData, error) {
	permissions, err := uc.repo.ListBundlePermissions(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to load bundle permissions: %w", err)
	}

	roles, err := uc.repo.ListBundleRoles(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to load bundle roles: %w", err)
	}

	assignments, err := uc.repo.ListBundleUserRoles(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to load bundle user roles: %w", err)
	}

	return &authz.BundleData{
		Permissions: permissions,
		Roles:       buildRoleData(roles),
		UserRoles:   buildUserRoleData(assignments),
	}, nil
}

func buildRoleData(roles []output.AuthorizationRoleBundle) map[string]map[string]any {
	data := make(map[string]map[string]any, len(roles))
	for _, role := range roles {
		item := map[string]any{
			"name":        role.Name,
			"permissions": role.Permissions,
		}
		if role.TenantID != nil {
			item["tenant_id"] = *role.TenantID
		} else {
			item["tenant_id"] = nil
		}
		data[role.ID.String()] = item
	}
	return data
}

func buildUserRoleData(assignments []output.AuthorizationUserRoleBundle) map[string][]map[string]any {
	data := make(map[string][]map[string]any)
	for _, assignment := range assignments {
		key := fmt.Sprintf("%d", assignment.UserID)
		data[key] = append(data[key], map[string]any{
			"role_id":    assignment.RoleID.String(),
			"tenant_id":  assignment.TenantID,
			"attributes": assignment.Attributes,
		})
	}
	return data
}
