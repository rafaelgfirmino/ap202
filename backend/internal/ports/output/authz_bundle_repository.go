package output

import (
	"context"

	"github.com/google/uuid"
)

type AuthorizationRoleBundle struct {
	ID          uuid.UUID
	Name        string
	TenantID    *int64
	Permissions []string
}

type AuthorizationUserRoleBundle struct {
	UserID     int64
	RoleID     uuid.UUID
	TenantID   int64
	Attributes map[string]string
}

type AuthorizationPendingRole struct {
	Permission string
	RoleName   string
}

type AuthorizationBundleRepository interface {
	ListBundlePermissions(ctx context.Context) (map[string]map[string]any, error)
	ListBundleRoles(ctx context.Context) ([]AuthorizationRoleBundle, error)
	ListBundleUserRoles(ctx context.Context) ([]AuthorizationUserRoleBundle, error)
	StorePendingRoleLink(ctx context.Context, permissionName, roleName string) error
	ListPendingRoleLinks(ctx context.Context) ([]AuthorizationPendingRole, error)
}
