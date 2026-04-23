package domain

import "errors"

var (
	ErrInvalidZipCode  = errors.New("invalid zip code")
	ErrZipCodeNotFound = errors.New("zip code not found")
)

type ZipCodeAddress struct {
	ZipCode      string `json:"zip_code"`
	Street       string `json:"street"`
	Neighborhood string `json:"neighborhood"`
	City         string `json:"city"`
	State        string `json:"state"`
}
