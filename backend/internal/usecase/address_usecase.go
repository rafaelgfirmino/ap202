package usecase

import (
	"context"
	"fmt"

	"ap202/internal/domain"
	"ap202/internal/ports/output"
)

type AddressUseCase struct {
	zipCodeLookup output.ZipCodeLookupRepository
}

func NewAddressUseCase(zipCodeLookup output.ZipCodeLookupRepository) *AddressUseCase {
	return &AddressUseCase{zipCodeLookup: zipCodeLookup}
}

func (uc *AddressUseCase) LookupAddressByZipCode(ctx context.Context, zipCode string) (*domain.ZipCodeAddress, error) {
	if uc.zipCodeLookup == nil {
		return nil, fmt.Errorf("zip code lookup not configured")
	}

	cleanZipCode := cleanDigits(zipCode)
	if len(cleanZipCode) != 8 {
		return nil, domain.ErrInvalidZipCode
	}

	address, err := uc.zipCodeLookup.LookupAddressByZipCode(ctx, cleanZipCode)
	if err != nil {
		return nil, err
	}

	return address, nil
}
