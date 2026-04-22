package postgres

import (
	"context"
	"fmt"
	"testing"
	"time"

	"ap202/internal/ports/output"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/modules/postgres"
	"github.com/testcontainers/testcontainers-go/wait"
)

func TestPostgresAdapter_Health(t *testing.T) {
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

	connStr, err := pgContainer.ConnectionString(ctx, "sslmode=disable")
	if err != nil {
		t.Fatal(err)
	}

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
	defer adapter.Close()

	fmt.Println(connStr)

	health := adapter.Health()

	if health["status"] != "up" {
		t.Errorf("expected status to be up, got %s", health["status"])
	}

	if health["message"] != "It's healthy" {
		t.Errorf("expected message to be 'It's healthy', got %s", health["message"])
	}
}
