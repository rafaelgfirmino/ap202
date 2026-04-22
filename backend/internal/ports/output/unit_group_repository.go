package output

import (
	"context"

	"ap202/internal/domain"
)

type UnitGroupRepository interface {
	Create(ctx context.Context, group *domain.UnitGroup) error
	List(ctx context.Context, condominiumID int64) ([]domain.UnitGroup, error)
	GetByID(ctx context.Context, condominiumID int64, id int64) (*domain.UnitGroup, error)
	Exists(ctx context.Context, condominiumID int64, groupType, name string) (bool, error)
	ExistsExcludingID(ctx context.Context, condominiumID int64, id int64, groupType, name string) (bool, error)
	Update(ctx context.Context, condominiumID int64, id int64, input domain.UpdateUnitGroupInput) (*domain.UnitGroup, error)
	Delete(ctx context.Context, condominiumID int64, id int64) error
}
