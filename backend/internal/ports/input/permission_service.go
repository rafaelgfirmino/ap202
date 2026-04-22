package input

import (
	"context"

	"ap202/internal/domain"

	"github.com/google/uuid"
)

type PermissionService interface {
	Create(ctx context.Context, permission *domain.Permission) (*domain.Permission, error)
	List(ctx context.Context) ([]domain.Permission, error)
	GetByID(ctx context.Context, id uuid.UUID) (*domain.Permission, error)
	Delete(ctx context.Context, id uuid.UUID) error
	Sync(ctx context.Context, items []domain.PermissionSyncItem) error
}
