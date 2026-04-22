package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"ap202/internal/adapters/output/postgres/sqlcgen"
	"ap202/internal/domain"
)

type UserRepository struct {
	db      *sql.DB
	queries *sqlcgen.Queries
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db, queries: sqlcgen.New(db)}
}

func (r *UserRepository) FindByExternalAuthID(ctx context.Context, externalAuthID string) (*domain.User, error) {
	user, err := r.queries.GetUserByExternalAuthID(ctx, sql.NullString{String: externalAuthID, Valid: externalAuthID != ""})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to query user by external_auth_id: %w", err)
	}

	mapped := mapSQLCUser(user)
	return &mapped, nil
}

func (r *UserRepository) FindByEmail(ctx context.Context, email string) (*domain.User, error) {
	user, err := r.queries.GetUserByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to query user by email: %w", err)
	}

	mapped := mapSQLCUser(user)
	return &mapped, nil
}

func (r *UserRepository) FindByID(ctx context.Context, id int64) (*domain.User, error) {
	user, err := r.queries.GetUserByID(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to query user by id: %w", err)
	}

	mapped := mapSQLCUser(user)
	return &mapped, nil
}

func (r *UserRepository) Create(ctx context.Context, user *domain.User) error {
	return r.createWithQueries(ctx, r.queries, user)
}

func (r *UserRepository) CreateTx(ctx context.Context, tx *sql.Tx, user *domain.User) error {
	return r.createWithQueries(ctx, r.queries.WithTx(tx), user)
}

func (r *UserRepository) UpdateIdentity(ctx context.Context, user *domain.User) error {
	if err := r.queries.UpdateUserIdentity(ctx, sqlcgen.UpdateUserIdentityParams{
		ID:             user.ID,
		ExternalAuthID: nullStringPtr(user.ExternalAuthID),
		FirstName:      user.FirstName,
		LastName:       user.LastName,
		Name:           user.Name,
		Email:          user.Email,
		AtualizadoEm:   user.UpdatedAt,
	}); err != nil {
		return fmt.Errorf("failed to update user identity: %w", err)
	}
	return nil
}

func (r *UserRepository) createWithQueries(ctx context.Context, queries *sqlcgen.Queries, user *domain.User) error {
	id, err := queries.CreateUser(ctx, sqlcgen.CreateUserParams{
		ExternalAuthID: nullStringPtr(user.ExternalAuthID),
		FirstName:      user.FirstName,
		LastName:       user.LastName,
		Name:           user.Name,
		Email:          user.Email,
		CriadoEm:       user.CreatedAt,
		AtualizadoEm:   user.UpdatedAt,
	})
	if err != nil {
		return fmt.Errorf("failed to insert user: %w", err)
	}
	user.ID = id

	return nil
}

func mapSQLCUser(user sqlcgen.User) domain.User {
	var externalAuthID *string
	if user.ExternalAuthID.Valid {
		externalAuthID = &user.ExternalAuthID.String
	}

	return domain.User{
		ID:             user.ID,
		ExternalAuthID: externalAuthID,
		FirstName:      user.FirstName,
		LastName:       user.LastName,
		Name:           user.Name,
		Email:          user.Email,
		CreatedAt:      user.CriadoEm,
		UpdatedAt:      user.AtualizadoEm,
	}
}

func nullStringPtr(value *string) sql.NullString {
	if value == nil {
		return sql.NullString{}
	}
	return nullString(*value)
}
