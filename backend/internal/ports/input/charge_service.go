package input

import (
	"context"

	"ap202/internal/domain"
)

type ChargeService interface {
	Create(ctx context.Context, personID int64, condominiumCode string, input domain.CreateChargeInput) (*domain.Charge, error)
}
