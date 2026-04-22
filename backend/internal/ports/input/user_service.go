package input

import (
	"context"

	"ap202/internal/domain"
)

type UserService interface {
	FindOrCreate(ctx context.Context, externalAuthID, firstName, lastName, email string) (*domain.User, error)
	GetByID(ctx context.Context, id int64) (*domain.User, error)
}
