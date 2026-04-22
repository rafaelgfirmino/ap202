package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"ap202/internal/domain"

	"github.com/google/uuid"
)

type AuthzRoleRepository struct {
	db *sql.DB
}

func NewAuthzRoleRepository(db *sql.DB) *AuthzRoleRepository {
	return &AuthzRoleRepository{db: db}
}

func (r *AuthzRoleRepository) Create(ctx context.Context, role *domain.Role) error {
	if role.ID == uuid.Nil {
		role.ID = uuid.New()
	}

	_, err := r.db.ExecContext(ctx, `
		INSERT INTO roles (id, tenant_id, template_id, name, description, scope, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
	`, role.ID, nullableInt64(role.TenantID), nullableUUID(role.TemplateID), role.Name, role.Description, role.Scope, role.CreatedAt, role.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to insert role: %w", err)
	}

	return nil
}

func (r *AuthzRoleRepository) List(ctx context.Context, tenantID *int64) ([]domain.Role, error) {
	query := `
		SELECT id, tenant_id, template_id, name, description, scope, created_at, updated_at
		FROM roles
	`
	var rows *sql.Rows
	var err error
	if tenantID == nil {
		query += ` ORDER BY scope, name`
		rows, err = r.db.QueryContext(ctx, query)
	} else {
		query += ` WHERE tenant_id = $1 OR tenant_id IS NULL ORDER BY scope, name`
		rows, err = r.db.QueryContext(ctx, query, *tenantID)
	}
	if err != nil {
		return nil, fmt.Errorf("failed to list roles: %w", err)
	}
	defer rows.Close()

	var roles []domain.Role
	for rows.Next() {
		role, err := scanRole(rows)
		if err != nil {
			return nil, err
		}
		roles = append(roles, role)
	}

	return roles, rows.Err()
}

func (r *AuthzRoleRepository) ListRoots(ctx context.Context) ([]domain.Role, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, tenant_id, template_id, name, description, scope, created_at, updated_at
		FROM roles
		WHERE tenant_id IS NULL
		ORDER BY name
	`)
	if err != nil {
		return nil, fmt.Errorf("failed to list root roles: %w", err)
	}
	defer rows.Close()

	var roles []domain.Role
	for rows.Next() {
		role, err := scanRole(rows)
		if err != nil {
			return nil, err
		}
		roles = append(roles, role)
	}
	return roles, rows.Err()
}

func (r *AuthzRoleRepository) ListByTemplateID(ctx context.Context, templateID uuid.UUID) ([]domain.Role, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, tenant_id, template_id, name, description, scope, created_at, updated_at
		FROM roles
		WHERE template_id = $1
		ORDER BY created_at, name
	`, templateID)
	if err != nil {
		return nil, fmt.Errorf("failed to list role instances by template_id: %w", err)
	}
	defer rows.Close()

	var roles []domain.Role
	for rows.Next() {
		role, err := scanRole(rows)
		if err != nil {
			return nil, err
		}
		roles = append(roles, role)
	}
	return roles, rows.Err()
}

func (r *AuthzRoleRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.Role, error) {
	row := r.db.QueryRowContext(ctx, `
		SELECT id, tenant_id, template_id, name, description, scope, created_at, updated_at
		FROM roles
		WHERE id = $1
	`, id)

	role, err := scanRole(row)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrRoleNotFound
		}
		return nil, err
	}

	return &role, nil
}

func (r *AuthzRoleRepository) GetByName(ctx context.Context, name string, tenantID *int64) (*domain.Role, error) {
	var row *sql.Row
	if tenantID == nil {
		row = r.db.QueryRowContext(ctx, `
			SELECT id, tenant_id, template_id, name, description, scope, created_at, updated_at
			FROM roles
			WHERE name = $1 AND tenant_id IS NULL
		`, name)
	} else {
		row = r.db.QueryRowContext(ctx, `
			SELECT id, tenant_id, template_id, name, description, scope, created_at, updated_at
			FROM roles
			WHERE name = $1 AND tenant_id = $2
		`, name, *tenantID)
	}

	role, err := scanRole(row)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrRoleNotFound
		}
		return nil, err
	}

	return &role, nil
}

func (r *AuthzRoleRepository) Delete(ctx context.Context, id uuid.UUID) error {
	result, err := r.db.ExecContext(ctx, `DELETE FROM roles WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("failed to delete role: %w", err)
	}

	if affected, _ := result.RowsAffected(); affected == 0 {
		return domain.ErrRoleNotFound
	}

	return nil
}

func (r *AuthzRoleRepository) AssignPermission(ctx context.Context, roleID, permissionID uuid.UUID) error {
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO role_permissions (role_id, permission_id, created_at)
		VALUES ($1,$2,NOW())
		ON CONFLICT (role_id, permission_id) DO NOTHING
	`, roleID, permissionID)
	if err != nil {
		return fmt.Errorf("failed to assign permission to role: %w", err)
	}

	return nil
}

func (r *AuthzRoleRepository) RemovePermission(ctx context.Context, roleID, permissionID uuid.UUID) error {
	_, err := r.db.ExecContext(ctx, `
		DELETE FROM role_permissions
		WHERE role_id = $1 AND permission_id = $2
	`, roleID, permissionID)
	if err != nil {
		return fmt.Errorf("failed to remove permission from role: %w", err)
	}

	return nil
}

type roleScanner interface {
	Scan(dest ...any) error
}

func scanRole(scanner roleScanner) (domain.Role, error) {
	var role domain.Role
	var tenantID sql.NullInt64
	var templateID sql.NullString

	err := scanner.Scan(
		&role.ID,
		&tenantID,
		&templateID,
		&role.Name,
		&role.Description,
		&role.Scope,
		&role.CreatedAt,
		&role.UpdatedAt,
	)
	if err != nil {
		return domain.Role{}, err
	}

	if tenantID.Valid {
		role.TenantID = &tenantID.Int64
	}
	if templateID.Valid {
		parsed, err := uuid.Parse(templateID.String)
		if err != nil {
			return domain.Role{}, fmt.Errorf("failed to parse role template_id: %w", err)
		}
		role.TemplateID = &parsed
	}

	return role, nil
}

func nullableUUID(id *uuid.UUID) any {
	if id == nil {
		return nil
	}
	return *id
}

func nullableInt64(id *int64) any {
	if id == nil {
		return nil
	}
	return *id
}
