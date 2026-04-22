package postgres

import (
	"context"
	"database/sql"
	"testing"
	"time"

	"ap202/internal/domain"
)

func TestChargeRepository_Create_EqualAllocationDistributesRemainder(t *testing.T) {
	db := setupChargeTestDB(t)
	repo := NewChargeRepository(db)
	ctx := context.Background()

	userID := insertTestUser(t, ctx, db)
	condominiumID := insertTestCondominium(t, ctx, db, string(domain.FeeRuleEqual))
	insertTestUnit(t, ctx, db, condominiumID, "UNIT-101", 10, nil)
	insertTestUnit(t, ctx, db, condominiumID, "UNIT-102", 20, nil)
	insertTestUnit(t, ctx, db, condominiumID, "UNIT-103", 30, nil)

	charge := &domain.Charge{
		CondominiumID:       condominiumID,
		Description:         "Taxa igualitaria",
		TotalAmountCentavos: 10001,
		FeeRule:             domain.FeeRuleEqual,
		CreatedBy:           userID,
		CreatedAt:           time.Now().UTC(),
	}

	if err := repo.Create(ctx, charge); err != nil {
		t.Fatalf("failed to create equal charge: %v", err)
	}

	if len(charge.Items) != 3 {
		t.Fatalf("expected 3 unit charges, got %d", len(charge.Items))
	}
	if charge.Items[0].AmountCentavos != 3334 || charge.Items[1].AmountCentavos != 3334 || charge.Items[2].AmountCentavos != 3333 {
		t.Fatalf("unexpected equal allocation: %+v", charge.Items)
	}
}

func TestChargeRepository_Create_ProportionalAllocationUsesHighestFractionForRemainder(t *testing.T) {
	db := setupChargeTestDB(t)
	repo := NewChargeRepository(db)
	ctx := context.Background()

	userID := insertTestUser(t, ctx, db)
	condominiumID := insertTestCondominium(t, ctx, db, string(domain.FeeRuleProportional))
	insertTestUnit(t, ctx, db, condominiumID, "UNIT-201", 60, floatPtr(0.60))
	insertTestUnit(t, ctx, db, condominiumID, "UNIT-202", 40, floatPtr(0.40))

	charge := &domain.Charge{
		CondominiumID:       condominiumID,
		Description:         "Taxa proporcional",
		TotalAmountCentavos: 10001,
		FeeRule:             domain.FeeRuleProportional,
		CreatedBy:           userID,
		CreatedAt:           time.Now().UTC(),
	}

	if err := repo.Create(ctx, charge); err != nil {
		t.Fatalf("failed to create proportional charge: %v", err)
	}

	if len(charge.Items) != 2 {
		t.Fatalf("expected 2 unit charges, got %d", len(charge.Items))
	}
	if charge.Items[0].AmountCentavos != 6001 || charge.Items[1].AmountCentavos != 4000 {
		t.Fatalf("unexpected proportional allocation: %+v", charge.Items)
	}
}

func insertTestCondominium(t *testing.T, ctx context.Context, db *sql.DB, feeRule string) int64 {
	t.Helper()

	var id int64
	err := db.QueryRowContext(ctx, `
		INSERT INTO condominiums (code, name, phone, email, fee_rule, street, number, neighborhood, city, state, zip_code, latitude, longitude, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 0, 0, 'active', NOW(), NOW())
		RETURNING id
	`, "CHG1234", "Condominio Cobranca", "31999999999", "financeiro@condo.com", feeRule, "Rua A", "10", "Centro", "Vicosa", "MG", "36570000").Scan(&id)
	if err != nil {
		t.Fatalf("failed to insert test condominium: %v", err)
	}

	return id
}

func insertTestUnit(t *testing.T, ctx context.Context, db *sql.DB, condominiumID int64, code string, privateArea float64, idealFraction *float64) {
	t.Helper()

	_, err := db.ExecContext(ctx, `
		INSERT INTO units (condominium_id, code, identifier, private_area, ideal_fraction, active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, TRUE, NOW(), NOW())
	`, condominiumID, code, code, privateArea, idealFraction)
	if err != nil {
		t.Fatalf("failed to insert test unit: %v", err)
	}
}

func floatPtr(v float64) *float64 {
	return &v
}

func setupChargeTestDB(t *testing.T) (db *sql.DB) {
	t.Helper()

	defer func() {
		if recovered := recover(); recovered != nil {
			t.Skipf("skipping charge repository integration test: %v", recovered)
		}
	}()

	return setupTestDB(t)
}
