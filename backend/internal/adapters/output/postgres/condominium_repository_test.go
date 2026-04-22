package postgres

import (
	"context"
	"database/sql"
	"testing"
	"time"

	"ap202/internal/domain"
	"ap202/internal/domain/vo"
	"ap202/internal/ports/output"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/pressly/goose/v3"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/modules/postgres"
	"github.com/testcontainers/testcontainers-go/wait"
)

func setupTestDB(t *testing.T) *sql.DB {
	t.Helper()
	ctx := context.Background()

	pgContainer, err := postgres.Run(ctx,
		"postgres:16-alpine",
		postgres.WithDatabase("test-db"),
		postgres.WithUsername("postgres"),
		postgres.WithPassword("postgres"),
		testcontainers.WithWaitStrategy(
			wait.ForLog("database system is ready to accept connections").
				WithOccurrence(2).WithStartupTimeout(5*time.Second)),
	)
	if err != nil {
		t.Skipf("skipping postgres integration test: %v", err)
	}

	t.Cleanup(func() {
		if err := pgContainer.Terminate(ctx); err != nil {
			t.Fatalf("failed to terminate pgContainer: %s", err)
		}
	})

	host, err := pgContainer.Host(ctx)
	if err != nil {
		t.Fatal(err)
	}

	port, err := pgContainer.MappedPort(ctx, "5432")
	if err != nil {
		t.Fatal(err)
	}

	config := output.DatabaseConfig{
		Database: "test-db",
		Password: "postgres",
		Username: "postgres",
		Port:     port.Port(),
		Host:     host,
		Schema:   "public",
	}

	adapter, err := NewPostgresAdapter(config)
	if err != nil {
		t.Fatalf("failed to create postgres adapter: %v", err)
	}
	t.Cleanup(func() { adapter.Close() })

	db := adapter.DB()

	goose.SetBaseFS(nil)
	if err := goose.SetDialect("postgres"); err != nil {
		t.Fatalf("failed to set goose dialect: %v", err)
	}

	migrationsDir := "migrations"
	if err := goose.Up(db, migrationsDir); err != nil {
		t.Fatalf("failed to run migrations: %v", err)
	}

	t.Cleanup(func() {
		if err := goose.Down(db, migrationsDir); err != nil {
			t.Logf("failed to rollback migrations: %v", err)
		}
	})

	return db
}

func TestCondominiumRepository_Create(t *testing.T) {
	db := setupTestDB(t)
	repo := NewCondominiumRepository(db)
	ctx := context.Background()
	personID := insertTestUser(t, ctx, db)

	now := time.Now()
	condo := &domain.Condominium{
		Code:  "ABCD123",
		Name:  "Condomínio Teste",
		Phone: "11999999999",
		Email: "teste@condo.com",
		Address: vo.Address{
			Street:       "Rua Teste",
			Number:       "100",
			Neighborhood: "Centro",
			City:         "São Paulo",
			State:        "SP",
			ZipCode:      "01000000",
			Latitude:     -23.55,
			Longitude:    -46.63,
		},
		Status: domain.StatusActive,
		CNPJs: []domain.CondominiumCNPJ{
			{CNPJ: "11222333000181", RazaoSocial: "Condo Teste LTDA", Descricao: "CNPJ principal", Principal: true, Ativo: true, DataInicio: &now, CreatedAt: now},
		},
		CreatedAt: now,
		UpdatedAt: now,
	}

	err := repo.Create(ctx, condo, personID)
	if err != nil {
		t.Fatalf("failed to create condominium: %v", err)
	}

	if condo.ID == 0 {
		t.Error("expected condominium ID to be set")
	}
	if condo.CNPJs[0].ID == 0 {
		t.Error("expected CNPJ ID to be set")
	}
	if condo.CNPJs[0].CondominiumID != condo.ID {
		t.Error("expected CNPJ condominium_id to match")
	}
	assertAssociationExists(t, ctx, db, personID, condo.ID)
}

func TestCondominiumRepository_ExistsByCode(t *testing.T) {
	db := setupTestDB(t)
	repo := NewCondominiumRepository(db)
	ctx := context.Background()
	personID := insertTestUser(t, ctx, db)

	exists, err := repo.ExistsByCode(ctx, "ZZZZ999")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if exists {
		t.Error("expected code not to exist")
	}

	now := time.Now()
	condo := &domain.Condominium{
		Code:  "XYZW456",
		Name:  "Test",
		Phone: "11999",
		Email: "t@t.com",
		Address: vo.Address{
			Street:       "R",
			Number:       "1",
			Neighborhood: "C",
			City:         "SP",
			State:        "SP",
			ZipCode:      "01000",
		},
		Status: domain.StatusActive,
		CNPJs: []domain.CondominiumCNPJ{
			{CNPJ: "11222333000181", RazaoSocial: "Test LTDA", Principal: true, Ativo: true, DataInicio: &now, CreatedAt: now},
		},
		CreatedAt: now,
		UpdatedAt: now,
	}
	if err := repo.Create(ctx, condo, personID); err != nil {
		t.Fatalf("failed to create: %v", err)
	}

	exists, err = repo.ExistsByCode(ctx, "XYZW456")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !exists {
		t.Error("expected code to exist")
	}
}

func TestCondominiumRepository_ExistsByCNPJ(t *testing.T) {
	db := setupTestDB(t)
	repo := NewCondominiumRepository(db)
	ctx := context.Background()
	personID := insertTestUser(t, ctx, db)

	exists, err := repo.ExistsByCNPJ(ctx, "99999999000199")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if exists {
		t.Error("expected CNPJ not to exist")
	}

	now := time.Now()
	condo := &domain.Condominium{
		Code:  "MNPQ789",
		Name:  "Test",
		Phone: "11999",
		Email: "t@t.com",
		Address: vo.Address{
			Street:       "R",
			Number:       "1",
			Neighborhood: "C",
			City:         "SP",
			State:        "SP",
			ZipCode:      "01000",
		},
		Status: domain.StatusActive,
		CNPJs: []domain.CondominiumCNPJ{
			{CNPJ: "11222333000181", RazaoSocial: "Test LTDA", Principal: true, Ativo: true, DataInicio: &now, CreatedAt: now},
		},
		CreatedAt: now,
		UpdatedAt: now,
	}
	if err := repo.Create(ctx, condo, personID); err != nil {
		t.Fatalf("failed to create: %v", err)
	}

	exists, err = repo.ExistsByCNPJ(ctx, "11222333000181")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !exists {
		t.Error("expected CNPJ to exist")
	}
}

func TestCondominiumRepository_Create_MultipleCNPJs(t *testing.T) {
	db := setupTestDB(t)
	repo := NewCondominiumRepository(db)
	ctx := context.Background()
	personID := insertTestUser(t, ctx, db)

	now := time.Now()
	condo := &domain.Condominium{
		Code:  "FGHJ321",
		Name:  "Multi CNPJ Condo",
		Phone: "11999999999",
		Email: "multi@condo.com",
		Address: vo.Address{
			Street:       "Rua Multi",
			Number:       "200",
			Neighborhood: "Jardim",
			City:         "Rio",
			State:        "RJ",
			ZipCode:      "20000000",
		},
		Status: domain.StatusActive,
		CNPJs: []domain.CondominiumCNPJ{
			{CNPJ: "11222333000181", RazaoSocial: "Matriz LTDA", Descricao: "CNPJ principal", Principal: true, Ativo: true, DataInicio: &now, CreatedAt: now},
			{CNPJ: "12345678000195", RazaoSocial: "Filial LTDA", Descricao: "Fundo de reserva", Principal: false, Ativo: true, DataInicio: &now, CreatedAt: now},
		},
		CreatedAt: now,
		UpdatedAt: now,
	}

	err := repo.Create(ctx, condo, personID)
	if err != nil {
		t.Fatalf("failed to create condominium with multiple CNPJs: %v", err)
	}

	if condo.ID == 0 {
		t.Error("expected condominium ID to be set")
	}
	if len(condo.CNPJs) != 2 {
		t.Errorf("expected 2 CNPJs, got %d", len(condo.CNPJs))
	}
	for i, c := range condo.CNPJs {
		if c.ID == 0 {
			t.Errorf("expected CNPJ[%d] ID to be set", i)
		}
	}
}

func insertTestUser(t *testing.T, ctx context.Context, db *sql.DB) int64 {
	t.Helper()

	var id int64
	err := db.QueryRowContext(ctx, `
		INSERT INTO users (external_auth_id, first_name, last_name, name, email, criado_em, atualizado_em)
		VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
		RETURNING id
	`, "ext_test_user", "Test", "User", "Test User", "test-user@example.com").Scan(&id)
	if err != nil {
		t.Fatalf("failed to insert test user: %v", err)
	}

	return id
}

func assertAssociationExists(t *testing.T, ctx context.Context, db *sql.DB, personID, condominiumID int64) {
	t.Helper()

	var role string
	var active bool
	var unitID sql.NullInt64
	err := db.QueryRowContext(ctx, `
		SELECT role, active, unit_id
		FROM association
		WHERE person_id = $1 AND condominium_id = $2
	`, personID, condominiumID).Scan(&role, &active, &unitID)
	if err != nil {
		t.Fatalf("failed to query association: %v", err)
	}
	if role != "manager" {
		t.Fatalf("expected role manager, got %s", role)
	}
	if !active {
		t.Fatal("expected association to be active")
	}
	if unitID.Valid {
		t.Fatal("expected association unit_id to be null")
	}
}
