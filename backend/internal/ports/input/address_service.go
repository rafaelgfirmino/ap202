package input

import (
	"context"

	"ap202/internal/domain"
)

type AddressService interface {
	LookupAddressByZipCode(ctx context.Context, zipCode string) (*domain.ZipCodeAddress, error)
}
