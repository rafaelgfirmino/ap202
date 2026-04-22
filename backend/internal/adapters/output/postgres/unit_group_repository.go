package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"ap202/internal/domain"
	"github.com/jackc/pgx/v5/pgconn"
)

type UnitGroupRepository struct {
	db *sql.DB
}

func NewUnitGroupRepository(db *sql.DB) *UnitGroupRepository {
	return &UnitGroupRepository{db: db}
}

func (r *UnitGroupRepository) Create(ctx context.Context, group *domain.UnitGroup) error {
	const query = `
		INSERT INTO condominium_unit_groups (condominium_id, group_type, name, floors, active, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id
	`

	if err := r.db.QueryRowContext(
		ctx,
		query,
		group.CondominiumID,
		group.GroupType,
		group.Name,
		group.Floors,
		group.Active,
		group.CreatedAt,
	).Scan(&group.ID); err != nil {
		if isUnitGroupUniqueViolation(err) {
			return domain.ErrUnitGroupAlreadyExists
		}
		return fmt.Errorf("failed to create unit group: %w", err)
	}

	return nil
}

func (r *UnitGroupRepository) List(ctx context.Context, condominiumID int64) ([]domain.UnitGroup, error) {
	const query = `
		SELECT id, condominium_id, group_type, name, floors, active, created_at
		FROM condominium_unit_groups
		WHERE condominium_id = $1
		  AND active = TRUE
		ORDER BY group_type ASC, name ASC, id ASC
	`

	rows, err := r.db.QueryContext(ctx, query, condominiumID)
	if err != nil {
		return nil, fmt.Errorf("failed to list unit groups: %w", err)
	}
	defer rows.Close()

	var groups []domain.UnitGroup
	for rows.Next() {
		var group domain.UnitGroup
		if err := rows.Scan(&group.ID, &group.CondominiumID, &group.GroupType, &group.Name, &group.Floors, &group.Active, &group.CreatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan unit group: %w", err)
		}
		groups = append(groups, group)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to iterate unit groups: %w", err)
	}

	return groups, nil
}

func (r *UnitGroupRepository) GetByID(ctx context.Context, condominiumID int64, id int64) (*domain.UnitGroup, error) {
	const query = `
		SELECT id, condominium_id, group_type, name, floors, active, created_at
		FROM condominium_unit_groups
		WHERE condominium_id = $1
		  AND id = $2
		  AND active = TRUE
	`

	var group domain.UnitGroup
	if err := r.db.QueryRowContext(ctx, query, condominiumID, id).Scan(
		&group.ID,
		&group.CondominiumID,
		&group.GroupType,
		&group.Name,
		&group.Floors,
		&group.Active,
		&group.CreatedAt,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrUnitGroupNotFound
		}
		return nil, fmt.Errorf("failed to get unit group: %w", err)
	}

	return &group, nil
}

func (r *UnitGroupRepository) Exists(ctx context.Context, condominiumID int64, groupType, name string) (bool, error) {
	const query = `
		SELECT EXISTS (
			SELECT 1
			FROM condominium_unit_groups
			WHERE condominium_id = $1
			  AND group_type = $2
			  AND name = $3
			  AND active = TRUE
		)
	`

	var exists bool
	if err := r.db.QueryRowContext(ctx, query, condominiumID, groupType, name).Scan(&exists); err != nil {
		return false, fmt.Errorf("failed to check unit group existence: %w", err)
	}

	return exists, nil
}

func (r *UnitGroupRepository) ExistsExcludingID(ctx context.Context, condominiumID int64, id int64, groupType, name string) (bool, error) {
	const query = `
		SELECT EXISTS (
			SELECT 1
			FROM condominium_unit_groups
			WHERE condominium_id = $1
			  AND id <> $2
			  AND group_type = $3
			  AND name = $4
			  AND active = TRUE
		)
	`

	var exists bool
	if err := r.db.QueryRowContext(ctx, query, condominiumID, id, groupType, name).Scan(&exists); err != nil {
		return false, fmt.Errorf("failed to check unit group existence excluding current id: %w", err)
	}

	return exists, nil
}

func (r *UnitGroupRepository) Update(ctx context.Context, condominiumID int64, id int64, input domain.UpdateUnitGroupInput) (*domain.UnitGroup, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	const selectQuery = `
		SELECT id, condominium_id, group_type, name, floors, active, created_at
		FROM condominium_unit_groups
		WHERE condominium_id = $1
		  AND id = $2
		  AND active = TRUE
	`

	var current domain.UnitGroup
	if err := tx.QueryRowContext(ctx, selectQuery, condominiumID, id).Scan(
		&current.ID,
		&current.CondominiumID,
		&current.GroupType,
		&current.Name,
		&current.Floors,
		&current.Active,
		&current.CreatedAt,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrUnitGroupNotFound
		}
		return nil, fmt.Errorf("failed to load current unit group: %w", err)
	}

	const updateGroupQuery = `
		UPDATE condominium_unit_groups
		SET group_type = $3,
		    name = $4,
		    floors = $5
		WHERE condominium_id = $1
		  AND id = $2
	`

	if _, err := tx.ExecContext(ctx, updateGroupQuery, condominiumID, id, input.GroupType, input.Name, input.Floors); err != nil {
		if isUnitGroupUniqueViolation(err) {
			return nil, domain.ErrUnitGroupAlreadyExists
		}
		return nil, fmt.Errorf("failed to update unit group: %w", err)
	}

	if current.GroupType != input.GroupType || current.Name != input.Name {
		const updateUnitsQuery = `
			UPDATE units
			SET group_type = $4,
			    group_name = $5,
			    updated_at = NOW()
			WHERE condominium_id = $1
			  AND group_type = $2
			  AND group_name = $3
		`

		if _, err := tx.ExecContext(ctx, updateUnitsQuery, condominiumID, current.GroupType, current.Name, input.GroupType, input.Name); err != nil {
			return nil, fmt.Errorf("failed to update linked units group data: %w", err)
		}
	}

	var updated domain.UnitGroup
	if err := tx.QueryRowContext(ctx, selectQuery, condominiumID, id).Scan(
		&updated.ID,
		&updated.CondominiumID,
		&updated.GroupType,
		&updated.Name,
		&updated.Floors,
		&updated.Active,
		&updated.CreatedAt,
	); err != nil {
		return nil, fmt.Errorf("failed to reload updated unit group: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit unit group update: %w", err)
	}

	return &updated, nil
}

func (r *UnitGroupRepository) Delete(ctx context.Context, condominiumID int64, id int64) error {
	const query = `
		UPDATE condominium_unit_groups
		SET active = FALSE
		WHERE condominium_id = $1
		  AND id = $2
		  AND active = TRUE
	`

	result, err := r.db.ExecContext(ctx, query, condominiumID, id)
	if err != nil {
		return fmt.Errorf("failed to delete unit group: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to inspect unit group delete result: %w", err)
	}
	if rowsAffected == 0 {
		return domain.ErrUnitGroupNotFound
	}

	return nil
}

func isUnitGroupUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}
