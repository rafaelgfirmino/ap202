package input

import (
	"context"

	"ap202/internal/domain"
)

type CondominiumService interface {
	CreateCondominium(ctx context.Context, req domain.CreateCondominiumRequest) (*domain.Condominium, error)
	ListCondominiums(ctx context.Context) ([]domain.Condominium, error)
	ListCondominiumsByPersonID(ctx context.Context, personID int64) ([]domain.Condominium, error)
	GetCondominiumByID(ctx context.Context, id int64) (*domain.Condominium, error)
	GetCondominiumByCode(ctx context.Context, personID int64, code string) (*domain.Condominium, error)
	UpdateFeeRule(ctx context.Context, personID int64, code string, feeRule domain.FeeRule) (*domain.Condominium, error)
	UpdateLandArea(ctx context.Context, personID int64, code string, landArea *float64) (*domain.Condominium, error)
}
