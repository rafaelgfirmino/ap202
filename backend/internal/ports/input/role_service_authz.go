package input

import (
	"context"

	"ap202/internal/domain"

	"github.com/google/uuid"
)

type RoleService interface {
	Create(ctx context.Context, role *domain.Role) (*domain.Role, error)
	List(ctx context.Context, tenantID *int64) ([]domain.Role, error)
	GetByID(ctx context.Context, id uuid.UUID) (*domain.Role, error)
	Delete(ctx context.Context, id uuid.UUID) error
	AssignPermission(ctx context.Context, roleID, permissionID uuid.UUID) error
	RemovePermission(ctx context.Context, roleID, permissionID uuid.UUID) error
}
