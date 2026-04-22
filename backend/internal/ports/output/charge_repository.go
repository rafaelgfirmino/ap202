package output

import (
	"context"

	"ap202/internal/domain"
)

type ChargeRepository interface {
	Create(ctx context.Context, charge *domain.Charge) error
	HasChargesForCondominium(ctx context.Context, condominiumID int64) (bool, error)
}
