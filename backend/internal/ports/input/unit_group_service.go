package input

import (
	"context"

	"ap202/internal/domain"
)

type UnitGroupService interface {
	Create(ctx context.Context, personID int64, code string, input domain.CreateUnitGroupInput) (*domain.UnitGroup, error)
	List(ctx context.Context, personID int64, code string) ([]domain.UnitGroup, error)
	Update(ctx context.Context, personID int64, code string, id int64, input domain.UpdateUnitGroupInput) (*domain.UnitGroup, error)
	Delete(ctx context.Context, personID int64, code string, id int64) error
}
