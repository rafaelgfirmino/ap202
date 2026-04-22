package input

import (
	"context"

	"ap202/internal/domain"
)

type UnitService interface {
	Create(ctx context.Context, personID int64, code string, input domain.CreateUnitInput) (*domain.Unit, error)
	List(ctx context.Context, personID int64, code string) ([]domain.Unit, error)
	GetByID(ctx context.Context, personID int64, code string, unitID int64) (*domain.Unit, error)
	UpdatePrivateArea(ctx context.Context, personID int64, code string, unitID int64, input domain.UpdateUnitPrivateAreaInput) (*domain.Unit, error)
	Delete(ctx context.Context, personID int64, code string, unitID int64) error
}
