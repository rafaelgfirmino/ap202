package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"ap202/internal/adapters/output/postgres/sqlcgen"
	"ap202/internal/domain"
	"ap202/internal/domain/vo"
	"github.com/jackc/pgx/v5/pgconn"
)

type UnitRepository struct {
	db      *sql.DB
	queries *sqlcgen.Queries
}

func NewUnitRepository(db *sql.DB) *UnitRepository {
	return &UnitRepository{db: db, queries: sqlcgen.New(db)}
}

func (r *UnitRepository) Create(ctx context.Context, unit *domain.Unit) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	qtx := r.queries.WithTx(tx)

	id, err := qtx.CreateUnit(ctx, sqlcgen.CreateUnitParams{
		CondominiumID: unit.CondominiumID,
		Code:          unit.Code,
		Identifier:    unit.Identifier,
		GroupType:     nullString(unit.GroupType),
		GroupName:     nullString(unit.GroupName),
		Floor:         nullString(unit.Floor),
		Description:   nullString(unit.Description),
		PrivateArea:   toNullFloat64(unit.PrivateArea),
		Active:        unit.Active,
		CreatedAt:     unit.CreatedAt,
		UpdatedAt:     unit.UpdatedAt,
	})
	if err != nil {
		if isUniqueViolation(err) {
			return domain.ErrUnitIdentifierDuplicate
		}
		return fmt.Errorf("failed to create unit: %w", err)
	}
	unit.ID = id

	if unit.Active && unit.PrivateArea != nil {
		if err := qtx.UpdateCondominiumBuiltAreaSumDelta(ctx, sqlcgen.UpdateCondominiumBuiltAreaSumDeltaParams{
			ID:           unit.CondominiumID,
			BuiltAreaSum: *unit.PrivateArea,
		}); err != nil {
			return fmt.Errorf("failed to update condominium built area sum: %w", err)
		}
	}

	if err := recalculateIdealFractionsWithQueries(ctx, qtx, unit.CondominiumID); err != nil {
		return err
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

func (r *UnitRepository) List(ctx context.Context, condominiumID int64) ([]domain.Unit, error) {
	rows, err := r.queries.ListUnitsByCondominiumID(ctx, condominiumID)
	if err != nil {
		return nil, fmt.Errorf("failed to list units: %w", err)
	}

	units := make([]domain.Unit, 0, len(rows))
	for _, row := range rows {
		mapped := mapSQLCUnit(row)
		if !mapped.Active {
			continue
		}
		units = append(units, mapped)
	}

	return units, nil
}

func (r *UnitRepository) FindByID(ctx context.Context, id int64, condominiumID int64) (*domain.Unit, error) {
	unit, err := r.queries.GetUnitByIDAndCondominiumID(ctx, sqlcgen.GetUnitByIDAndCondominiumIDParams{
		ID:            id,
		CondominiumID: condominiumID,
	})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrUnitNotFound
		}
		return nil, fmt.Errorf("failed to get unit: %w", err)
	}

	mapped := mapSQLCUnit(unit)
	return &mapped, nil
}

func (r *UnitRepository) FindByGroupNameAndIdentifier(ctx context.Context, condominiumID int64, groupName, identifier string) (*domain.Unit, error) {
	unit, err := r.queries.GetUnitByGroupNameAndIdentifier(ctx, sqlcgen.GetUnitByGroupNameAndIdentifierParams{
		CondominiumID: condominiumID,
		GroupName:     nullString(groupName),
		Identifier:    identifier,
	})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrUnitNotFound
		}
		return nil, fmt.Errorf("failed to get unit by group name and identifier: %w", err)
	}

	mapped := mapSQLCUnit(unit)
	return &mapped, nil
}

func (r *UnitRepository) ExistsByGroupNameAndIdentifier(ctx context.Context, condominiumID int64, groupName, identifier string) (bool, error) {
	exists, err := r.queries.ExistsUnitByGroupNameAndIdentifier(ctx, sqlcgen.ExistsUnitByGroupNameAndIdentifierParams{
		CondominiumID: condominiumID,
		GroupName:     nullString(groupName),
		Identifier:    identifier,
	})
	if err != nil {
		return false, fmt.Errorf("failed to check unit group and identifier existence: %w", err)
	}

	return exists, nil
}

func (r *UnitRepository) BelongsToCondominium(ctx context.Context, unitID int64, condominiumID int64) (bool, error) {
	exists, err := r.queries.UnitBelongsToCondominium(ctx, sqlcgen.UnitBelongsToCondominiumParams{
		ID:            unitID,
		CondominiumID: condominiumID,
	})
	if err != nil {
		return false, fmt.Errorf("failed to validate unit condominium ownership: %w", err)
	}

	return exists, nil
}

func (r *UnitRepository) ExistsByGroup(ctx context.Context, condominiumID int64, groupType, groupName string) (bool, error) {
	const query = `
		SELECT EXISTS (
			SELECT 1
			FROM units
			WHERE condominium_id = $1
			  AND group_type = $2
			  AND group_name = $3
			  AND active = TRUE
		)
	`

	var exists bool
	if err := r.db.QueryRowContext(ctx, query, condominiumID, groupType, groupName).Scan(&exists); err != nil {
		return false, fmt.Errorf("failed to check units by group: %w", err)
	}

	return exists, nil
}

func (r *UnitRepository) UpdatePrivateArea(ctx context.Context, unitID int64, condominiumID int64, privateArea *float64) (*domain.Unit, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	qtx := r.queries.WithTx(tx)
	current, err := qtx.GetUnitByIDAndCondominiumID(ctx, sqlcgen.GetUnitByIDAndCondominiumIDParams{
		ID:            unitID,
		CondominiumID: condominiumID,
	})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrUnitNotFound
		}
		return nil, fmt.Errorf("failed to load unit for private area update: %w", err)
	}

	if err := qtx.UpdateUnitPrivateArea(ctx, sqlcgen.UpdateUnitPrivateAreaParams{
		ID:          unitID,
		PrivateArea: toNullFloat64(privateArea),
		UpdatedAt:   currentTimeUTC(),
	}); err != nil {
		return nil, fmt.Errorf("failed to update unit private area: %w", err)
	}

	if current.Active {
		var previousArea float64
		if current.PrivateArea.Valid {
			previousArea = current.PrivateArea.Float64
		}

		var nextArea float64
		if privateArea != nil {
			nextArea = *privateArea
		}

		delta := nextArea - previousArea
		if delta != 0 {
			if err := qtx.UpdateCondominiumBuiltAreaSumDelta(ctx, sqlcgen.UpdateCondominiumBuiltAreaSumDeltaParams{
				ID:           condominiumID,
				BuiltAreaSum: delta,
			}); err != nil {
				return nil, fmt.Errorf("failed to update condominium built area sum delta: %w", err)
			}
		}
	}

	if err := recalculateIdealFractionsWithQueries(ctx, qtx, condominiumID); err != nil {
		return nil, err
	}

	updated, err := qtx.GetUnitByIDAndCondominiumID(ctx, sqlcgen.GetUnitByIDAndCondominiumIDParams{
		ID:            unitID,
		CondominiumID: condominiumID,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to reload updated unit: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit unit private area update: %w", err)
	}

	mapped := mapSQLCUnit(updated)
	return &mapped, nil
}

func (r *UnitRepository) Delete(ctx context.Context, unitID int64, condominiumID int64) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	qtx := r.queries.WithTx(tx)
	current, err := qtx.GetUnitByIDAndCondominiumID(ctx, sqlcgen.GetUnitByIDAndCondominiumIDParams{
		ID:            unitID,
		CondominiumID: condominiumID,
	})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return domain.ErrUnitNotFound
		}
		return fmt.Errorf("failed to load unit for delete: %w", err)
	}

	const deleteQuery = `
		DELETE FROM units
		WHERE id = $1 AND condominium_id = $2
	`
	if _, err := tx.ExecContext(ctx, deleteQuery, unitID, condominiumID); err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23503" {
			return domain.ErrUnitHasCharges
		}
		return fmt.Errorf("failed to delete unit: %w", err)
	}

	if current.Active && current.PrivateArea.Valid {
		if err := qtx.UpdateCondominiumBuiltAreaSumDelta(ctx, sqlcgen.UpdateCondominiumBuiltAreaSumDeltaParams{
			ID:           condominiumID,
			BuiltAreaSum: -current.PrivateArea.Float64,
		}); err != nil {
			return fmt.Errorf("failed to update condominium built area sum delta: %w", err)
		}
	}

	activeUnits, err := qtx.ListActiveUnitsForIdealFractionRecalc(ctx, condominiumID)
	if err != nil {
		return fmt.Errorf("failed to list active units after delete: %w", err)
	}
	if len(activeUnits) == 0 {
		const resetBuiltAreaSumQuery = `
			UPDATE condominiums
			SET built_area_sum = 0
			WHERE id = $1
		`
		if _, err := tx.ExecContext(ctx, resetBuiltAreaSumQuery, condominiumID); err != nil {
			return fmt.Errorf("failed to reset condominium built area sum: %w", err)
		}
	} else {
		if err := recalculateIdealFractionsWithQueries(ctx, qtx, condominiumID); err != nil {
			return err
		}
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit unit delete: %w", err)
	}

	return nil
}

func mapSQLCUnit(unit sqlcgen.Unit) domain.Unit {
	mapped := domain.Unit{
		ID:            unit.ID,
		CondominiumID: unit.CondominiumID,
		Code:          unit.Code,
		Identifier:    unit.Identifier,
		Active:        unit.Active,
		CreatedAt:     unit.CreatedAt,
		UpdatedAt:     unit.UpdatedAt,
	}
	if unit.PrivateArea.Valid {
		mapped.PrivateArea = &unit.PrivateArea.Float64
	}
	if unit.IdealFraction.Valid {
		mapped.IdealFraction = &unit.IdealFraction.Float64
	}
	if unit.GroupType.Valid {
		mapped.GroupType = unit.GroupType.String
	}
	if unit.GroupName.Valid {
		mapped.GroupName = unit.GroupName.String
	}
	if unit.Floor.Valid {
		mapped.Floor = unit.Floor.String
	}
	if unit.Description.Valid {
		mapped.Description = unit.Description.String
	}
	return mapped
}

func recalculateIdealFractionsWithQueries(ctx context.Context, qtx *sqlcgen.Queries, condominiumID int64) error {
	areas, err := qtx.GetCondominiumAreasForUnitCalc(ctx, condominiumID)
	if err != nil {
		return fmt.Errorf("failed to get condominium areas for calc: %w", err)
	}

	if areas.BuiltAreaSum == 0 {
		return vo.ErrBuiltAreaZero
	}

	units, err := qtx.ListActiveUnitsForIdealFractionRecalc(ctx, condominiumID)
	if err != nil {
		return fmt.Errorf("failed to list active units for recalc: %w", err)
	}

	for _, u := range units {
		if !u.PrivateArea.Valid {
			return vo.ErrPrivateAreaRequired
		}

		calc, err := vo.CalculateIdealFraction(u.PrivateArea.Float64, areas.BuiltAreaSum)
		if err != nil {
			return err
		}
		if err := qtx.UpdateUnitIdealFraction(ctx, sqlcgen.UpdateUnitIdealFractionParams{
			ID:            u.ID,
			IdealFraction: sql.NullFloat64{Float64: calc, Valid: true},
		}); err != nil {
			return fmt.Errorf("failed to update unit ideal fraction: %w", err)
		}
	}

	return nil
}

func currentTimeUTC() time.Time {
	return time.Now().UTC()
}

func nullString(value string) sql.NullString {
	value = strings.TrimSpace(value)
	if value == "" {
		return sql.NullString{}
	}
	return sql.NullString{String: value, Valid: true}
}

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}
