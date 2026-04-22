package output

import (
	"context"
	"database/sql"

	"ap202/internal/domain"
)

type UserRepository interface {
	FindByExternalAuthID(ctx context.Context, externalAuthID string) (*domain.User, error)
	FindByEmail(ctx context.Context, email string) (*domain.User, error)
	FindByID(ctx context.Context, id int64) (*domain.User, error)
	Create(ctx context.Context, user *domain.User) error
	CreateTx(ctx context.Context, tx *sql.Tx, user *domain.User) error
	UpdateIdentity(ctx context.Context, user *domain.User) error
}
