package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"ap202/internal/adapters/output/postgres/sqlcgen"
	"ap202/internal/domain"
	"github.com/jackc/pgx/v5/pgconn"
)

type AssociationRepository struct {
	queries *sqlcgen.Queries
}

func NewAssociationRepository(db *sql.DB) *AssociationRepository {
	return &AssociationRepository{queries: sqlcgen.New(db)}
}

func (r *AssociationRepository) HasActiveManagerAssociation(ctx context.Context, personID, condominiumID int64) (bool, error) {
	exists, err := r.queries.HasActiveManagerAssociation(ctx, sqlcgen.HasActiveManagerAssociationParams{
		PersonID:      personID,
		CondominiumID: condominiumID,
	})
	if err != nil {
		return false, fmt.Errorf("failed to query active association: %w", err)
	}

	return exists, nil
}

func (r *AssociationRepository) CreateBond(ctx context.Context, tx *sql.Tx, bond *domain.Bond) error {
	qtx := r.queries.WithTx(tx)
	bondID, err := qtx.CreateBond(ctx, sqlcgen.CreateBondParams{
		PersonID:      bond.UserID,
		CondominiumID: bond.CondominiumID,
		UnitID:        sql.NullInt64{Int64: *bond.UnitID, Valid: bond.UnitID != nil},
		Role:          bond.Role,
		Active:        bond.Active,
		StartDate:     bond.StartDate,
		EndDate:       toNullTime(bond.EndDate),
		CreatedAt:     bond.CreatedAt,
	})
	if err != nil {
		if isAssociationUniqueViolation(err, "idx_association_active_unique_link") {
			return domain.ErrMemberAlreadyLinked
		}
		return fmt.Errorf("failed to create bond: %w", err)
	}
	bond.ID = bondID

	return nil
}

func (r *AssociationRepository) DeactivateBond(ctx context.Context, bondID int64, condominiumID int64, unitID int64, endDate time.Time) error {
	affected, err := r.queries.DeactivateBond(ctx, sqlcgen.DeactivateBondParams{
		ID:            bondID,
		CondominiumID: condominiumID,
		UnitID:        sql.NullInt64{Int64: unitID, Valid: true},
		EndDate:       sql.NullTime{Time: endDate, Valid: true},
	})
	if err != nil {
		return fmt.Errorf("failed to deactivate bond: %w", err)
	}
	if affected == 0 {
		return domain.ErrBondNotFound
	}

	return nil
}

func (r *AssociationRepository) ListMembersByUnitID(ctx context.Context, unitID int64) ([]domain.Member, error) {
	rows, err := r.queries.ListMembersByUnitID(ctx, sql.NullInt64{Int64: unitID, Valid: true})
	if err != nil {
		return nil, fmt.Errorf("failed to list members by unit: %w", err)
	}

	members := make([]domain.Member, 0, len(rows))
	for _, row := range rows {
		member := domain.Member{
			BondID:    row.ID,
			UserID:    row.PersonID,
			Name:      row.Name,
			Email:     row.Email,
			Role:      row.Role,
			Active:    row.Active,
			StartDate: row.StartDate,
			CreatedAt: row.CreatedAt,
		}
		if row.UnitID.Valid {
			member.UnitID = row.UnitID.Int64
		}
		if row.EndDate.Valid {
			member.EndDate = &row.EndDate.Time
		}
		members = append(members, member)
	}

	return members, nil
}

func isAssociationUniqueViolation(err error, constraint string) bool {
	var pgErr *pgconn.PgError
	if !errors.As(err, &pgErr) {
		return false
	}
	return pgErr.Code == "23505" && pgErr.ConstraintName == constraint
}
