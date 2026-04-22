package output

import (
	"context"

	"ap202/internal/domain"

	"github.com/google/uuid"
)

type RoleRepository interface {
	Create(ctx context.Context, role *domain.Role) error
	List(ctx context.Context, tenantID *int64) ([]domain.Role, error)
	ListRoots(ctx context.Context) ([]domain.Role, error)
	ListByTemplateID(ctx context.Context, templateID uuid.UUID) ([]domain.Role, error)
	GetByID(ctx context.Context, id uuid.UUID) (*domain.Role, error)
	GetByName(ctx context.Context, name string, tenantID *int64) (*domain.Role, error)
	Delete(ctx context.Context, id uuid.UUID) error
	AssignPermission(ctx context.Context, roleID, permissionID uuid.UUID) error
	RemovePermission(ctx context.Context, roleID, permissionID uuid.UUID) error
}
