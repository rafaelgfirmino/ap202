package domain

import (
	"errors"
	"strings"
	"time"
)

var (
	ErrInvalidFeeRule           = errors.New("invalid fee rule")
	ErrFeeRuleImmutable         = errors.New("fee rule cannot be changed after charges are registered")
	ErrChargeTotalAmountInvalid = errors.New("total amount centavos must be greater than zero")
	ErrNoUnitsToCharge          = errors.New("no active units available for charge allocation")
	ErrFractionsSumZero         = errors.New("fraction sum is zero")
)

// Charge representa uma cobranca a ser rateada entre as unidades de um condominio.
type CreateChargeInput struct {
	Description         string `json:"description"`
	TotalAmountCentavos int64  `json:"total_amount_centavos"`
}

func (i CreateChargeInput) Normalize() CreateChargeInput {
	i.Description = strings.TrimSpace(i.Description)
	return i
}

func (i CreateChargeInput) Validate() error {
	if i.TotalAmountCentavos <= 0 {
		return ErrChargeTotalAmountInvalid
	}
	if len(i.Description) > 200 {
		return errors.New("description must have at most 200 characters")
	}
	return nil
}

type Charge struct {
	ID                  int64        `json:"id"`
	CondominiumID       int64        `json:"condominium_id"`
	Description         string       `json:"description"`
	TotalAmountCentavos int64        `json:"total_amount_centavos"`
	FeeRule             FeeRule      `json:"fee_rule"`
	CreatedBy           int64        `json:"created_by"`
	CreatedAt           time.Time    `json:"created_at"`
	Items               []UnitCharge `json:"items"`
}

type UnitCharge struct {
	ID             int64     `json:"id"`
	ChargeID       int64     `json:"charge_id"`
	UnitID         int64     `json:"unit_id"`
	UnitCode       string    `json:"unit_code"`
	AmountCentavos int64     `json:"amount_centavos"`
	CreatedAt      time.Time `json:"created_at"`
	IdealFraction  *float64  `json:"ideal_fraction,omitempty"`
	PrivateArea    *float64  `json:"private_area,omitempty"`
}
