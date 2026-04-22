package output

import (
	"context"

	"ap202/internal/domain"

	"github.com/google/uuid"
)

type PermissionRepository interface {
	Create(ctx context.Context, permission *domain.Permission) error
	List(ctx context.Context) ([]domain.Permission, error)
	GetByID(ctx context.Context, id uuid.UUID) (*domain.Permission, error)
	GetByKey(ctx context.Context, microservice, resource, action string) (*domain.Permission, error)
	Delete(ctx context.Context, id uuid.UUID) error
	Upsert(ctx context.Context, permission *domain.Permission) error
}
