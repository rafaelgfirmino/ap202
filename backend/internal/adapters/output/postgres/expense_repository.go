package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"ap202/internal/domain"
	"ap202/internal/ports/output"
)

type ExpenseRepository struct {
	db *sql.DB
}

func NewExpenseRepository(db *sql.DB) *ExpenseRepository {
	return &ExpenseRepository{db: db}
}

func (r *ExpenseRepository) CreateExpense(ctx context.Context, expense *domain.Expense) error {
	const query = `
		INSERT INTO expenses (
			condominium_id, group_id, unit_id, scope, type, category, description,
			amount, expense_date, reference_month, receipt_url, reversed, reversal_of_id, created_by, created_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7,
			($8::numeric / 100), $9, $10, $11, $12, $13, $14, $15
		)
		RETURNING id
	`
	groupID := sql.NullInt64{}
	if expense.GroupID != nil {
		groupID = sql.NullInt64{Int64: *expense.GroupID, Valid: true}
	}
	unitID := sql.NullInt64{}
	if expense.UnitID != nil {
		unitID = sql.NullInt64{Int64: *expense.UnitID, Valid: true}
	}
	receiptURL := sql.NullString{}
	if expense.ReceiptURL != nil && *expense.ReceiptURL != "" {
		receiptURL = sql.NullString{String: *expense.ReceiptURL, Valid: true}
	}
	reversalOfID := sql.NullInt64{}
	if expense.ReversalOfID != nil {
		reversalOfID = sql.NullInt64{Int64: *expense.ReversalOfID, Valid: true}
	}

	if err := r.db.QueryRowContext(
		ctx,
		query,
		expense.CondominiumID,
		groupID,
		unitID,
		string(expense.Scope),
		string(expense.Type),
		expense.Category,
		expense.Description,
		expense.AmountCentavos,
		expense.ExpenseDate,
		expense.ReferenceMonth,
		receiptURL,
		expense.Reversed,
		reversalOfID,
		expense.CreatedBy,
		expense.CreatedAt,
	).Scan(&expense.ID); err != nil {
		return fmt.Errorf("failed to create expense: %w", err)
	}

	return nil
}

func (r *ExpenseRepository) ListExpenses(ctx context.Context, condominiumID int64, month time.Time, scope string) ([]domain.Expense, error) {
	const baseQuery = `
		SELECT
			id, condominium_id, group_id, unit_id, scope, type, category, description,
			ROUND(amount * 100)::bigint AS amount_centavos,
			expense_date, reference_month, receipt_url, reversed, reversal_of_id, created_by, created_at
		FROM expenses
		WHERE condominium_id = $1
		  AND reference_month = $2
		  AND ($3 = '' OR scope = $3)
		ORDER BY created_at DESC, id DESC
	`
	rows, err := r.db.QueryContext(ctx, baseQuery, condominiumID, month, scope)
	if err != nil {
		return nil, fmt.Errorf("failed to list expenses: %w", err)
	}
	defer rows.Close()

	var expenses []domain.Expense
	for rows.Next() {
		expense, err := scanExpense(rows)
		if err != nil {
			return nil, err
		}
		expenses = append(expenses, expense)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to iterate expenses: %w", err)
	}
	return expenses, nil
}

func (r *ExpenseRepository) GetExpenseByID(ctx context.Context, condominiumID int64, expenseID int64) (*domain.Expense, error) {
	const query = `
		SELECT
			id, condominium_id, group_id, unit_id, scope, type, category, description,
			ROUND(amount * 100)::bigint AS amount_centavos,
			expense_date, reference_month, receipt_url, reversed, reversal_of_id, created_by, created_at
		FROM expenses
		WHERE condominium_id = $1
		  AND id = $2
	`
	row := r.db.QueryRowContext(ctx, query, condominiumID, expenseID)
	expense, err := scanExpense(row)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrExpenseNotFound
		}
		return nil, fmt.Errorf("failed to get expense: %w", err)
	}
	return &expense, nil
}

func (r *ExpenseRepository) ReverseExpense(ctx context.Context, original *domain.Expense, reversal *domain.Expense) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin reverse expense transaction: %w", err)
	}
	defer tx.Rollback()

	const markOriginalQuery = `
		UPDATE expenses
		SET reversed = TRUE
		WHERE id = $1
		  AND condominium_id = $2
		  AND reversed = FALSE
	`
	res, err := tx.ExecContext(ctx, markOriginalQuery, original.ID, original.CondominiumID)
	if err != nil {
		return fmt.Errorf("failed to mark original expense as reversed: %w", err)
	}
	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to read reverse expense rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return domain.ErrExpenseAlreadyReversed
	}

	const insertQuery = `
		INSERT INTO expenses (
			condominium_id, group_id, unit_id, scope, type, category, description,
			amount, expense_date, reference_month, receipt_url, reversed, reversal_of_id, created_by, created_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7,
			($8::numeric / 100), $9, $10, $11, TRUE, $12, $13, $14
		)
		RETURNING id
	`
	groupID := sql.NullInt64{}
	if reversal.GroupID != nil {
		groupID = sql.NullInt64{Int64: *reversal.GroupID, Valid: true}
	}
	unitID := sql.NullInt64{}
	if reversal.UnitID != nil {
		unitID = sql.NullInt64{Int64: *reversal.UnitID, Valid: true}
	}
	receiptURL := sql.NullString{}
	if reversal.ReceiptURL != nil && *reversal.ReceiptURL != "" {
		receiptURL = sql.NullString{String: *reversal.ReceiptURL, Valid: true}
	}
	reversalOfID := sql.NullInt64{}
	if reversal.ReversalOfID != nil {
		reversalOfID = sql.NullInt64{Int64: *reversal.ReversalOfID, Valid: true}
	}
	if err := tx.QueryRowContext(
		ctx,
		insertQuery,
		reversal.CondominiumID,
		groupID,
		unitID,
		string(reversal.Scope),
		string(reversal.Type),
		reversal.Category,
		reversal.Description,
		reversal.AmountCentavos,
		reversal.ExpenseDate,
		reversal.ReferenceMonth,
		receiptURL,
		reversalOfID,
		reversal.CreatedBy,
		reversal.CreatedAt,
	).Scan(&reversal.ID); err != nil {
		return fmt.Errorf("failed to create reversal expense: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit reverse expense transaction: %w", err)
	}

	return nil
}

func (r *ExpenseRepository) GetReserveFundSetting(ctx context.Context, condominiumID int64) (*domain.ReserveFundSetting, error) {
	const query = `
		SELECT id, condominium_id, mode, ROUND(value * 100)::bigint AS value_centavos, active, updated_at
		FROM reserve_fund_settings
		WHERE condominium_id = $1
	`
	var (
		setting       domain.ReserveFundSetting
		mode          string
		valueCentavos int64
	)
	err := r.db.QueryRowContext(ctx, query, condominiumID).Scan(
		&setting.ID,
		&setting.CondominiumID,
		&mode,
		&valueCentavos,
		&setting.Active,
		&setting.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get reserve fund setting: %w", err)
	}
	setting.Mode = domain.ReserveFundMode(mode)
	setting.ValueCentavos = valueCentavos
	return &setting, nil
}

func (r *ExpenseRepository) UpsertReserveFundSetting(ctx context.Context, setting *domain.ReserveFundSetting) error {
	const query = `
		INSERT INTO reserve_fund_settings (condominium_id, mode, value, active, updated_at)
		VALUES ($1, $2, ($3::numeric / 100), $4, $5)
		ON CONFLICT (condominium_id)
		DO UPDATE SET
			mode = EXCLUDED.mode,
			value = EXCLUDED.value,
			active = EXCLUDED.active,
			updated_at = EXCLUDED.updated_at
		RETURNING id
	`
	if err := r.db.QueryRowContext(
		ctx,
		query,
		setting.CondominiumID,
		string(setting.Mode),
		setting.ValueCentavos,
		setting.Active,
		setting.UpdatedAt,
	).Scan(&setting.ID); err != nil {
		return fmt.Errorf("failed to upsert reserve fund setting: %w", err)
	}
	return nil
}

func (r *ExpenseRepository) UnitBelongsToCondominium(ctx context.Context, condominiumID, unitID int64) (bool, error) {
	const query = `
		SELECT EXISTS (
			SELECT 1
			FROM units
			WHERE id = $1
			  AND condominium_id = $2
		)
	`
	var exists bool
	if err := r.db.QueryRowContext(ctx, query, unitID, condominiumID).Scan(&exists); err != nil {
		return false, fmt.Errorf("failed to check unit condominium relation: %w", err)
	}
	return exists, nil
}

func (r *ExpenseRepository) GetUnitGroupByID(ctx context.Context, condominiumID, groupID int64) (*output.UnitGroupRef, error) {
	const query = `
		SELECT id, group_type, name
		FROM condominium_unit_groups
		WHERE id = $1
		  AND condominium_id = $2
		  AND active = TRUE
	`
	var group output.UnitGroupRef
	err := r.db.QueryRowContext(ctx, query, groupID, condominiumID).Scan(&group.ID, &group.GroupType, &group.Name)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get unit group by id: %w", err)
	}
	return &group, nil
}

func (r *ExpenseRepository) ListActiveUnitsForClosing(ctx context.Context, condominiumID int64) ([]output.ClosingUnit, error) {
	const query = `
		SELECT id, code, COALESCE(group_type, ''), COALESCE(group_name, ''), ideal_fraction
		FROM units
		WHERE condominium_id = $1
		  AND active = TRUE
		ORDER BY id ASC
	`
	rows, err := r.db.QueryContext(ctx, query, condominiumID)
	if err != nil {
		return nil, fmt.Errorf("failed to list active units for closing: %w", err)
	}
	defer rows.Close()

	var units []output.ClosingUnit
	for rows.Next() {
		var (
			unit  output.ClosingUnit
			ideal sql.NullFloat64
		)
		if err := rows.Scan(&unit.UnitID, &unit.UnitCode, &unit.GroupType, &unit.GroupName, &ideal); err != nil {
			return nil, fmt.Errorf("failed to scan active unit for closing: %w", err)
		}
		if ideal.Valid {
			unit.IdealFraction = &ideal.Float64
		}
		units = append(units, unit)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to iterate active units for closing: %w", err)
	}
	return units, nil
}

func (r *ExpenseRepository) ListNonReversedExpensesByMonth(ctx context.Context, condominiumID int64, referenceMonth time.Time) ([]domain.Expense, error) {
	const query = `
		SELECT
			id, condominium_id, group_id, unit_id, scope, type, category, description,
			ROUND(amount * 100)::bigint AS amount_centavos,
			expense_date, reference_month, receipt_url, reversed, reversal_of_id, created_by, created_at
		FROM expenses
		WHERE condominium_id = $1
		  AND reference_month = $2
		  AND reversed = FALSE
		ORDER BY id ASC
	`
	rows, err := r.db.QueryContext(ctx, query, condominiumID, referenceMonth)
	if err != nil {
		return nil, fmt.Errorf("failed to list non-reversed expenses by month: %w", err)
	}
	defer rows.Close()

	var expenses []domain.Expense
	for rows.Next() {
		expense, err := scanExpense(rows)
		if err != nil {
			return nil, err
		}
		expenses = append(expenses, expense)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to iterate monthly expenses: %w", err)
	}
	return expenses, nil
}

func (r *ExpenseRepository) GetClosingByMonth(ctx context.Context, condominiumID int64, referenceMonth time.Time) (*output.ClosingRecord, error) {
	const query = `
		SELECT id, reference_month, status
		FROM monthly_closings
		WHERE condominium_id = $1
		  AND reference_month = $2
	`
	var (
		record output.ClosingRecord
		status string
	)
	err := r.db.QueryRowContext(ctx, query, condominiumID, referenceMonth).Scan(&record.ID, &record.ReferenceMonth, &status)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get closing by month: %w", err)
	}
	record.Status = domain.ClosingStatus(status)
	return &record, nil
}

func (r *ExpenseRepository) PersistClosing(ctx context.Context, input output.PersistClosingInput) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin persist closing transaction: %w", err)
	}
	defer tx.Rollback()

	const upsertClosingQuery = `
		INSERT INTO monthly_closings (
			condominium_id, reference_month, total_expenses, total_extra_income,
			reserve_fund_total, fee_rule, status, closed_by, closed_at, created_at
		)
		VALUES (
			$1, $2, ($3::numeric / 100), ($4::numeric / 100),
			($5::numeric / 100), $6, 'closed', $7, NOW(), NOW()
		)
		ON CONFLICT (condominium_id, reference_month)
		DO UPDATE SET
			total_expenses = EXCLUDED.total_expenses,
			total_extra_income = EXCLUDED.total_extra_income,
			reserve_fund_total = EXCLUDED.reserve_fund_total,
			fee_rule = EXCLUDED.fee_rule,
			status = 'closed',
			closed_by = EXCLUDED.closed_by,
			closed_at = NOW()
		RETURNING id
	`
	var closingID int64
	if err := tx.QueryRowContext(
		ctx,
		upsertClosingQuery,
		input.CondominiumID,
		input.ReferenceMonth,
		input.TotalExpensesCents,
		input.TotalExtraIncomeCents,
		input.ReserveFundTotalCents,
		string(input.FeeRule),
		input.ClosedBy,
	).Scan(&closingID); err != nil {
		return fmt.Errorf("failed to upsert monthly closing: %w", err)
	}

	const deleteChargesQuery = `DELETE FROM monthly_unit_charges WHERE monthly_closing_id = $1`
	if _, err := tx.ExecContext(ctx, deleteChargesQuery, closingID); err != nil {
		return fmt.Errorf("failed to clear previous monthly unit charges: %w", err)
	}

	const insertChargeQuery = `
		INSERT INTO monthly_unit_charges (
			monthly_closing_id, unit_id, general_share, group_share, direct_charge,
			reserve_fund_share, total_amount, status, paid_amount, boleto_generated, created_at, updated_at
		) VALUES (
			$1, $2, ($3::numeric / 100), ($4::numeric / 100), ($5::numeric / 100),
			($6::numeric / 100), ($7::numeric / 100), 'pending', 0, FALSE, NOW(), NOW()
		)
	`
	for _, item := range input.Items {
		if _, err := tx.ExecContext(
			ctx,
			insertChargeQuery,
			closingID,
			item.UnitID,
			item.GeneralShareCents,
			item.GroupShareCents,
			item.DirectChargeCents,
			item.ReserveShareCents,
			item.TotalAmountCents,
		); err != nil {
			return fmt.Errorf("failed to insert monthly unit charge: %w", err)
		}
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit persist closing transaction: %w", err)
	}
	return nil
}

func (r *ExpenseRepository) HasAnyGeneratedBoleto(ctx context.Context, condominiumID int64, referenceMonth time.Time) (bool, error) {
	const query = `
		SELECT EXISTS (
			SELECT 1
			FROM monthly_unit_charges muc
			JOIN monthly_closings mc ON mc.id = muc.monthly_closing_id
			WHERE mc.condominium_id = $1
			  AND mc.reference_month = $2
			  AND muc.boleto_generated = TRUE
		)
	`
	var exists bool
	if err := r.db.QueryRowContext(ctx, query, condominiumID, referenceMonth).Scan(&exists); err != nil {
		return false, fmt.Errorf("failed to check generated boletos: %w", err)
	}
	return exists, nil
}

func (r *ExpenseRepository) ReopenClosing(ctx context.Context, condominiumID int64, referenceMonth time.Time) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin reopen closing transaction: %w", err)
	}
	defer tx.Rollback()

	const selectClosingQuery = `
		SELECT id
		FROM monthly_closings
		WHERE condominium_id = $1
		  AND reference_month = $2
	`
	var closingID int64
	if err := tx.QueryRowContext(ctx, selectClosingQuery, condominiumID, referenceMonth).Scan(&closingID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return domain.ErrClosingNotFound
		}
		return fmt.Errorf("failed to load closing for reopen: %w", err)
	}

	const deleteChargesQuery = `DELETE FROM monthly_unit_charges WHERE monthly_closing_id = $1`
	if _, err := tx.ExecContext(ctx, deleteChargesQuery, closingID); err != nil {
		return fmt.Errorf("failed to delete monthly unit charges on reopen: %w", err)
	}

	const reopenClosingQuery = `
		UPDATE monthly_closings
		SET status = 'open',
		    closed_by = NULL,
		    closed_at = NULL
		WHERE id = $1
	`
	if _, err := tx.ExecContext(ctx, reopenClosingQuery, closingID); err != nil {
		return fmt.Errorf("failed to reopen monthly closing: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit reopen closing transaction: %w", err)
	}
	return nil
}

type expenseScanner interface {
	Scan(dest ...any) error
}

func scanExpense(scanner expenseScanner) (domain.Expense, error) {
	var (
		expense      domain.Expense
		groupID      sql.NullInt64
		unitID       sql.NullInt64
		scope        string
		expenseType  string
		receiptURL   sql.NullString
		reversalOfID sql.NullInt64
	)
	if err := scanner.Scan(
		&expense.ID,
		&expense.CondominiumID,
		&groupID,
		&unitID,
		&scope,
		&expenseType,
		&expense.Category,
		&expense.Description,
		&expense.AmountCentavos,
		&expense.ExpenseDate,
		&expense.ReferenceMonth,
		&receiptURL,
		&expense.Reversed,
		&reversalOfID,
		&expense.CreatedBy,
		&expense.CreatedAt,
	); err != nil {
		return domain.Expense{}, err
	}
	expense.Scope = domain.ExpenseScope(scope)
	expense.Type = domain.ExpenseType(expenseType)
	if groupID.Valid {
		expense.GroupID = &groupID.Int64
	}
	if unitID.Valid {
		expense.UnitID = &unitID.Int64
	}
	if receiptURL.Valid {
		expense.ReceiptURL = &receiptURL.String
	}
	if reversalOfID.Valid {
		expense.ReversalOfID = &reversalOfID.Int64
	}
	return expense, nil
}
