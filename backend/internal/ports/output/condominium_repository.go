package output

import (
	"context"

	"ap202/internal/domain"
)

type CondominiumRepository interface {
	Create(ctx context.Context, condominium *domain.Condominium, personID int64) error
	List(ctx context.Context) ([]domain.Condominium, error)
	ListByPersonID(ctx context.Context, personID int64) ([]domain.Condominium, error)
	GetByID(ctx context.Context, id int64) (*domain.Condominium, error)
	FindIDByCode(ctx context.Context, code string) (int64, error)
	ExistsByCode(ctx context.Context, code string) (bool, error)
	ExistsByCNPJ(ctx context.Context, cnpj string) (bool, error)
	UpdateFeeRule(ctx context.Context, condominiumID int64, feeRule domain.FeeRule) error
	UpdateLandArea(ctx context.Context, condominiumID int64, landArea *float64) error
}
