package output

import (
	"context"

	"ap202/internal/domain"
)

type ZipCodeLookupRepository interface {
	LookupAddressByZipCode(ctx context.Context, zipCode string) (*domain.ZipCodeAddress, error)
}
