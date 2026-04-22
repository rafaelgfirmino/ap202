package postgres

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"

	"ap202/internal/domain"

	"github.com/google/uuid"
)

type PermissionRepository struct {
	db *sql.DB
}

func NewPermissionRepository(db *sql.DB) *PermissionRepository {
	return &PermissionRepository{db: db}
}

func (r *PermissionRepository) Create(ctx context.Context, permission *domain.Permission) error {
	if permission.ID == uuid.Nil {
		permission.ID = uuid.New()
	}

	conditions, err := json.Marshal(permission.Conditions)
	if err != nil {
		return fmt.Errorf("failed to marshal permission conditions: %w", err)
	}

	_, err = r.db.ExecContext(ctx, `
		INSERT INTO permissions (
			id, microservice, resource, action, name, description, conditions, created_at, updated_at
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
	`, permission.ID, permission.Microservice, permission.Resource, permission.Action, permission.Name, permission.Description, conditions, permission.CreatedAt, permission.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to insert permission: %w", err)
	}

	return nil
}

func (r *PermissionRepository) List(ctx context.Context) ([]domain.Permission, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, microservice, resource, action, name, description, conditions, created_at, updated_at
		FROM permissions
		ORDER BY name
	`)
	if err != nil {
		return nil, fmt.Errorf("failed to list permissions: %w", err)
	}
	defer rows.Close()

	var permissions []domain.Permission
	for rows.Next() {
		permission, err := scanPermission(rows)
		if err != nil {
			return nil, err
		}
		permissions = append(permissions, permission)
	}

	return permissions, rows.Err()
}

func (r *PermissionRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.Permission, error) {
	row := r.db.QueryRowContext(ctx, `
		SELECT id, microservice, resource, action, name, description, conditions, created_at, updated_at
		FROM permissions
		WHERE id = $1
	`, id)

	permission, err := scanPermission(row)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrPermissionNotFound
		}
		return nil, err
	}

	return &permission, nil
}

func (r *PermissionRepository) GetByKey(ctx context.Context, microservice, resource, action string) (*domain.Permission, error) {
	row := r.db.QueryRowContext(ctx, `
		SELECT id, microservice, resource, action, name, description, conditions, created_at, updated_at
		FROM permissions
		WHERE microservice = $1 AND resource = $2 AND action = $3
	`, microservice, resource, action)

	permission, err := scanPermission(row)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrPermissionNotFound
		}
		return nil, err
	}

	return &permission, nil
}

func (r *PermissionRepository) Delete(ctx context.Context, id uuid.UUID) error {
	result, err := r.db.ExecContext(ctx, `DELETE FROM permissions WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("failed to delete permission: %w", err)
	}

	if affected, _ := result.RowsAffected(); affected == 0 {
		return domain.ErrPermissionNotFound
	}

	return nil
}

func (r *PermissionRepository) Upsert(ctx context.Context, permission *domain.Permission) error {
	if permission.ID == uuid.Nil {
		permission.ID = uuid.New()
	}

	conditions, err := json.Marshal(permission.Conditions)
	if err != nil {
		return fmt.Errorf("failed to marshal permission conditions: %w", err)
	}

	_, err = r.db.ExecContext(ctx, `
		INSERT INTO permissions (
			id, microservice, resource, action, name, description, conditions, created_at, updated_at
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
		ON CONFLICT (microservice, resource, action)
		DO UPDATE SET
			name = EXCLUDED.name,
			description = EXCLUDED.description,
			conditions = EXCLUDED.conditions,
			updated_at = EXCLUDED.updated_at
	`, permission.ID, permission.Microservice, permission.Resource, permission.Action, permission.Name, permission.Description, conditions, permission.CreatedAt, permission.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to upsert permission: %w", err)
	}

	return nil
}

type permissionScanner interface {
	Scan(dest ...any) error
}

func scanPermission(scanner permissionScanner) (domain.Permission, error) {
	var permission domain.Permission
	var rawConditions []byte

	err := scanner.Scan(
		&permission.ID,
		&permission.Microservice,
		&permission.Resource,
		&permission.Action,
		&permission.Name,
		&permission.Description,
		&rawConditions,
		&permission.CreatedAt,
		&permission.UpdatedAt,
	)
	if err != nil {
		return domain.Permission{}, err
	}

	if len(rawConditions) > 0 {
		if err := json.Unmarshal(rawConditions, &permission.Conditions); err != nil {
			return domain.Permission{}, fmt.Errorf("failed to unmarshal permission conditions: %w", err)
		}
	}
	if permission.Conditions == nil {
		permission.Conditions = map[string]string{}
	}

	return permission, nil
}
