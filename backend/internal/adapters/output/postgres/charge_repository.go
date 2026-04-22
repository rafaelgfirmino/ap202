package postgres

import (
	"context"
	"database/sql"
	"fmt"

	"ap202/internal/domain"
	"ap202/internal/domain/vo"
)

type ChargeRepository struct {
	db *sql.DB
}

func NewChargeRepository(db *sql.DB) *ChargeRepository {
	return &ChargeRepository{db: db}
}

func (r *ChargeRepository) Create(ctx context.Context, charge *domain.Charge) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	chargeID, err := r.insertCharge(ctx, tx, charge)
	if err != nil {
		return err
	}
	charge.ID = chargeID

	switch charge.FeeRule {
	case domain.FeeRuleEqual:
		if err := r.ensureUnitsAvailable(ctx, tx, charge.CondominiumID); err != nil {
			return err
		}
		charge.Items, err = r.insertEqualUnitCharges(ctx, tx, charge)
	case domain.FeeRuleProportional:
		if err := r.validateProportionalAllocation(ctx, tx, charge.CondominiumID); err != nil {
			return err
		}
		charge.Items, err = r.insertProportionalUnitCharges(ctx, tx, charge)
	default:
		return domain.ErrInvalidFeeRule
	}
	if err != nil {
		return err
	}

	if err := r.ensureChargeSum(ctx, tx, charge.ID, charge.TotalAmountCentavos); err != nil {
		return err
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit charge transaction: %w", err)
	}

	return nil
}

func (r *ChargeRepository) HasChargesForCondominium(ctx context.Context, condominiumID int64) (bool, error) {
	const query = `
		SELECT EXISTS (
			SELECT 1
			FROM charges
			WHERE condominium_id = $1
		)
	`

	var exists bool
	if err := r.db.QueryRowContext(ctx, query, condominiumID).Scan(&exists); err != nil {
		return false, fmt.Errorf("failed to check charges for condominium: %w", err)
	}
	return exists, nil
}

func (r *ChargeRepository) insertCharge(ctx context.Context, tx *sql.Tx, charge *domain.Charge) (int64, error) {
	const query = `
		INSERT INTO charges (condominium_id, description, total_amount_centavos, fee_rule_snapshot, created_by, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id
	`

	var id int64
	if err := tx.QueryRowContext(
		ctx,
		query,
		charge.CondominiumID,
		charge.Description,
		charge.TotalAmountCentavos,
		string(charge.FeeRule),
		charge.CreatedBy,
		charge.CreatedAt,
	).Scan(&id); err != nil {
		return 0, fmt.Errorf("failed to insert charge: %w", err)
	}

	return id, nil
}

func (r *ChargeRepository) ensureUnitsAvailable(ctx context.Context, tx *sql.Tx, condominiumID int64) error {
	const query = `
		WITH active_units AS (
			SELECT id
			FROM units
			WHERE condominium_id = $1
			  AND active = TRUE
		)
		SELECT COUNT(*)::bigint
		FROM active_units
	`

	var totalUnits int64
	if err := tx.QueryRowContext(ctx, query, condominiumID).Scan(&totalUnits); err != nil {
		return fmt.Errorf("failed to count active units: %w", err)
	}
	if totalUnits == 0 {
		return domain.ErrNoUnitsToCharge
	}

	return nil
}

func (r *ChargeRepository) validateProportionalAllocation(ctx context.Context, tx *sql.Tx, condominiumID int64) error {
	const query = `
		WITH active_units AS (
			SELECT ideal_fraction, private_area
			FROM units
			WHERE condominium_id = $1
			  AND active = TRUE
		),
		stats AS (
			SELECT
				COUNT(*)::bigint AS total_units,
				COUNT(*) FILTER (WHERE ideal_fraction IS NULL AND private_area IS NULL)::bigint AS missing_basis_units,
				COALESCE(SUM(CASE WHEN ideal_fraction IS NULL THEN private_area::numeric END), 0::numeric) AS fallback_area_sum,
				COALESCE(SUM(CASE WHEN ideal_fraction IS NOT NULL THEN ideal_fraction::numeric END), 0::numeric) AS direct_fraction_sum
			FROM active_units
		)
		SELECT
			total_units,
			missing_basis_units,
			((direct_fraction_sum + CASE WHEN fallback_area_sum > 0::numeric THEN 1::numeric ELSE 0::numeric END) > 0::numeric) AS has_fraction_sum
		FROM stats
	`

	var (
		totalUnits     int64
		missingBasis   int64
		hasFractionSum bool
	)
	if err := tx.QueryRowContext(ctx, query, condominiumID).Scan(&totalUnits, &missingBasis, &hasFractionSum); err != nil {
		return fmt.Errorf("failed to validate proportional allocation: %w", err)
	}

	if totalUnits == 0 {
		return domain.ErrNoUnitsToCharge
	}
	if missingBasis > 0 {
		return vo.ErrPrivateAreaRequired
	}
	if !hasFractionSum {
		return domain.ErrFractionsSumZero
	}

	return nil
}

func (r *ChargeRepository) insertEqualUnitCharges(ctx context.Context, tx *sql.Tx, charge *domain.Charge) ([]domain.UnitCharge, error) {
	const query = `
		WITH active_units AS (
			SELECT
				id,
				ROW_NUMBER() OVER (ORDER BY id ASC) AS row_num,
				COUNT(*) OVER () AS total_units
			FROM units
			WHERE condominium_id = $1
			  AND active = TRUE
		),
		base AS (
			SELECT
				id,
				row_num,
				($3::bigint / total_units)::bigint AS base_amount,
				($3::bigint % total_units)::bigint AS remainder
			FROM active_units
		),
		inserted AS (
			INSERT INTO unit_charges (charge_id, unit_id, amount_centavos, created_at)
			SELECT
				$2,
				id,
				base_amount + CASE WHEN row_num <= remainder THEN 1 ELSE 0 END,
				$4
			FROM base
			ORDER BY id ASC
			RETURNING id, charge_id, unit_id, amount_centavos, created_at
		)
		SELECT inserted.id, inserted.charge_id, inserted.unit_id, units.code, inserted.amount_centavos, inserted.created_at
		FROM inserted
		JOIN units ON units.id = inserted.unit_id
		ORDER BY inserted.unit_id ASC
	`

	return queryInsertedUnitCharges(ctx, tx, query, charge.CondominiumID, charge.ID, charge.TotalAmountCentavos, charge.CreatedAt)
}

func (r *ChargeRepository) insertProportionalUnitCharges(ctx context.Context, tx *sql.Tx, charge *domain.Charge) ([]domain.UnitCharge, error) {
	const query = `
		WITH active_units AS (
			SELECT
				id,
				ideal_fraction::numeric AS ideal_fraction,
				private_area::numeric AS private_area
			FROM units
			WHERE condominium_id = $1
			  AND active = TRUE
		),
		fallback_area AS (
			SELECT COALESCE(SUM(private_area), 0::numeric) AS sum_area
			FROM active_units
			WHERE ideal_fraction IS NULL
		),
		raw_fractions AS (
			SELECT
				u.id,
				COALESCE(
					u.ideal_fraction,
					CASE
						WHEN f.sum_area > 0::numeric AND u.private_area IS NOT NULL
							THEN u.private_area / f.sum_area
						ELSE NULL
					END
				) AS raw_fraction
			FROM active_units u
			CROSS JOIN fallback_area f
		),
		normalized AS (
			SELECT
				id,
				raw_fraction,
				raw_fraction / SUM(raw_fraction) OVER () AS normalized_fraction
			FROM raw_fractions
		),
		floored AS (
			SELECT
				id,
				normalized_fraction,
				FLOOR(($3::numeric) * normalized_fraction)::bigint AS amount_centavos
			FROM normalized
		),
		diff AS (
			SELECT ($3::bigint - COALESCE(SUM(amount_centavos), 0::bigint))::bigint AS remainder
			FROM floored
		),
		ranked AS (
			SELECT
				f.id,
				f.normalized_fraction,
				f.amount_centavos,
				d.remainder,
				ROW_NUMBER() OVER (ORDER BY f.normalized_fraction DESC, f.id ASC) AS row_num
			FROM floored f
			CROSS JOIN diff d
		),
		inserted AS (
			INSERT INTO unit_charges (charge_id, unit_id, amount_centavos, created_at)
			SELECT
				$2,
				id,
				amount_centavos + CASE WHEN row_num <= remainder THEN 1 ELSE 0 END,
				$4
			FROM ranked
			ORDER BY id ASC
			RETURNING id, charge_id, unit_id, amount_centavos, created_at
		)
		SELECT inserted.id, inserted.charge_id, inserted.unit_id, units.code, inserted.amount_centavos, inserted.created_at
		FROM inserted
		JOIN units ON units.id = inserted.unit_id
		ORDER BY inserted.unit_id ASC
	`

	return queryInsertedUnitCharges(ctx, tx, query, charge.CondominiumID, charge.ID, charge.TotalAmountCentavos, charge.CreatedAt)
}

func (r *ChargeRepository) ensureChargeSum(ctx context.Context, tx *sql.Tx, chargeID int64, expectedTotal int64) error {
	const query = `
		WITH totals AS (
			SELECT COALESCE(SUM(amount_centavos), 0)::bigint AS allocated_total
			FROM unit_charges
			WHERE charge_id = $1
		)
		SELECT allocated_total
		FROM totals
	`

	var allocatedTotal int64
	if err := tx.QueryRowContext(ctx, query, chargeID).Scan(&allocatedTotal); err != nil {
		return fmt.Errorf("failed to verify allocated charge sum: %w", err)
	}
	if allocatedTotal != expectedTotal {
		return fmt.Errorf("allocated sum mismatch: expected %d, got %d", expectedTotal, allocatedTotal)
	}
	return nil
}

func queryInsertedUnitCharges(ctx context.Context, tx *sql.Tx, query string, condominiumID, chargeID, totalAmount int64, createdAt any) ([]domain.UnitCharge, error) {
	rows, err := tx.QueryContext(ctx, query, condominiumID, chargeID, totalAmount, createdAt)
	if err != nil {
		return nil, fmt.Errorf("failed to insert unit charges: %w", err)
	}
	defer rows.Close()

	var items []domain.UnitCharge
	for rows.Next() {
		var item domain.UnitCharge
		if err := rows.Scan(&item.ID, &item.ChargeID, &item.UnitID, &item.UnitCode, &item.AmountCentavos, &item.CreatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan inserted unit charge: %w", err)
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to iterate inserted unit charges: %w", err)
	}

	return items, nil
}
