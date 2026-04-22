package postgres

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"

	"ap202/internal/ports/output"
	"ap202/internal/seed"
)

type AuthorizationBundleRepository struct {
	db *sql.DB
}

func NewAuthorizationBundleRepository(db *sql.DB) *AuthorizationBundleRepository {
	return &AuthorizationBundleRepository{db: db}
}

func (r *AuthorizationBundleRepository) ListBundlePermissions(ctx context.Context) (map[string]map[string]any, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT name, resource, action, conditions
		FROM permissions
		ORDER BY name
	`)
	if err != nil {
		return nil, fmt.Errorf("failed to list bundle permissions: %w", err)
	}
	defer rows.Close()

	data := make(map[string]map[string]any)
	for rows.Next() {
		var name string
		var resource string
		var action string
		var rawConditions []byte
		if err := rows.Scan(&name, &resource, &action, &rawConditions); err != nil {
			return nil, fmt.Errorf("failed to scan bundle permission: %w", err)
		}

		conditions := map[string]string{}
		if len(rawConditions) > 0 {
			if err := json.Unmarshal(rawConditions, &conditions); err != nil {
				return nil, fmt.Errorf("failed to unmarshal bundle permission conditions: %w", err)
			}
		}

		data[name] = map[string]any{
			"resource":   resource,
			"action":     action,
			"conditions": conditions,
		}
	}

	return data, rows.Err()
}

func (r *AuthorizationBundleRepository) ListBundleRoles(ctx context.Context) ([]output.AuthorizationRoleBundle, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT
			r.id,
			r.name,
			r.tenant_id,
			r.template_id,
			COALESCE(array_to_json(array_agg(p.name ORDER BY p.name) FILTER (WHERE p.name IS NOT NULL)), '[]'::json) AS permissions
		FROM roles r
		LEFT JOIN role_permissions rp ON rp.role_id = COALESCE(r.template_id, r.id)
		LEFT JOIN permissions p ON p.id = rp.permission_id
		GROUP BY r.id, r.name, r.tenant_id, r.template_id
		ORDER BY r.name, r.id
	`)
	if err != nil {
		return nil, fmt.Errorf("failed to list bundle roles: %w", err)
	}
	defer rows.Close()

	var roles []output.AuthorizationRoleBundle
	for rows.Next() {
		var role output.AuthorizationRoleBundle
		var tenantID sql.NullInt64
		var templateID sql.NullString
		var permissions []byte
		if err := rows.Scan(&role.ID, &role.Name, &tenantID, &templateID, &permissions); err != nil {
			return nil, fmt.Errorf("failed to scan bundle role: %w", err)
		}
		if tenantID.Valid {
			role.TenantID = &tenantID.Int64
		}
		if err := json.Unmarshal(permissions, &role.Permissions); err != nil {
			return nil, fmt.Errorf("failed to unmarshal role permissions: %w", err)
		}

		isTenantInstance := tenantID.Valid
		isGlobalDirect := !tenantID.Valid && !templateID.Valid && seed.IsGlobalRoleName(role.Name)
		if !isTenantInstance && !isGlobalDirect {
			continue
		}

		roles = append(roles, role)
	}

	return roles, rows.Err()
}

func (r *AuthorizationBundleRepository) ListBundleUserRoles(ctx context.Context) ([]output.AuthorizationUserRoleBundle, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT user_id, role_id, tenant_id, attributes
		FROM user_roles
		ORDER BY user_id, created_at
	`)
	if err != nil {
		return nil, fmt.Errorf("failed to list bundle user roles: %w", err)
	}
	defer rows.Close()

	var assignments []output.AuthorizationUserRoleBundle
	for rows.Next() {
		var assignment output.AuthorizationUserRoleBundle
		var rawAttributes []byte
		if err := rows.Scan(&assignment.UserID, &assignment.RoleID, &assignment.TenantID, &rawAttributes); err != nil {
			return nil, fmt.Errorf("failed to scan bundle user role: %w", err)
		}
		if len(rawAttributes) > 0 {
			if err := json.Unmarshal(rawAttributes, &assignment.Attributes); err != nil {
				return nil, fmt.Errorf("failed to unmarshal bundle user role attributes: %w", err)
			}
		}
		if assignment.Attributes == nil {
			assignment.Attributes = map[string]string{}
		}
		assignments = append(assignments, assignment)
	}

	return assignments, rows.Err()
}

func (r *AuthorizationBundleRepository) StorePendingRoleLink(ctx context.Context, permissionName, roleName string) error {
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO pending_role_permissions (permission_name, role_name, created_at)
		VALUES ($1, $2, NOW())
		ON CONFLICT (permission_name, role_name) DO NOTHING
	`, permissionName, roleName)
	if err != nil {
		return fmt.Errorf("failed to store pending role link: %w", err)
	}
	return nil
}

func (r *AuthorizationBundleRepository) ListPendingRoleLinks(ctx context.Context) ([]output.AuthorizationPendingRole, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT permission_name, role_name
		FROM pending_role_permissions
		ORDER BY created_at DESC
	`)
	if err != nil {
		return nil, fmt.Errorf("failed to list pending role links: %w", err)
	}
	defer rows.Close()

	var pending []output.AuthorizationPendingRole
	for rows.Next() {
		var item output.AuthorizationPendingRole
		if err := rows.Scan(&item.Permission, &item.RoleName); err != nil {
			return nil, fmt.Errorf("failed to scan pending role link: %w", err)
		}
		pending = append(pending, item)
	}

	return pending, rows.Err()
}
