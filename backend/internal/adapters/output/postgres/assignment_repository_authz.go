package postgres

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"

	"ap202/internal/domain"

	"github.com/google/uuid"
)

type AuthzAssignmentRepository struct {
	db *sql.DB
}

func NewAuthzAssignmentRepository(db *sql.DB) *AuthzAssignmentRepository {
	return &AuthzAssignmentRepository{db: db}
}

func (r *AuthzAssignmentRepository) Assign(ctx context.Context, assignment *domain.UserRole) error {
	if assignment.ID == uuid.Nil {
		assignment.ID = uuid.New()
	}

	attributes, err := json.Marshal(assignment.Attributes)
	if err != nil {
		return fmt.Errorf("failed to marshal assignment attributes: %w", err)
	}

	_, err = r.db.ExecContext(ctx, `
		INSERT INTO user_roles (id, user_id, role_id, tenant_id, attributes, created_at)
		VALUES ($1,$2,$3,$4,$5,$6)
		ON CONFLICT (user_id, role_id, tenant_id)
		DO UPDATE SET attributes = EXCLUDED.attributes
	`, assignment.ID, assignment.UserID, assignment.RoleID, assignment.TenantID, attributes, assignment.CreatedAt)
	if err != nil {
		return fmt.Errorf("failed to assign role to user: %w", err)
	}

	return nil
}

func (r *AuthzAssignmentRepository) Revoke(ctx context.Context, userID int64, roleID uuid.UUID, tenantID int64) error {
	_, err := r.db.ExecContext(ctx, `
		DELETE FROM user_roles
		WHERE user_id = $1 AND role_id = $2 AND tenant_id = $3
	`, userID, roleID, tenantID)
	if err != nil {
		return fmt.Errorf("failed to revoke role from user: %w", err)
	}

	return nil
}

func (r *AuthzAssignmentRepository) ListByUser(ctx context.Context, userID int64) ([]domain.UserRole, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, user_id, role_id, tenant_id, attributes, created_at
		FROM user_roles
		WHERE user_id = $1
		ORDER BY created_at DESC
	`, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to list user roles: %w", err)
	}
	defer rows.Close()

	var assignments []domain.UserRole
	for rows.Next() {
		var assignment domain.UserRole
		var rawAttributes []byte
		if err := rows.Scan(
			&assignment.ID,
			&assignment.UserID,
			&assignment.RoleID,
			&assignment.TenantID,
			&rawAttributes,
			&assignment.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan user role: %w", err)
		}
		if len(rawAttributes) > 0 {
			if err := json.Unmarshal(rawAttributes, &assignment.Attributes); err != nil {
				return nil, fmt.Errorf("failed to unmarshal user role attributes: %w", err)
			}
		}
		if assignment.Attributes == nil {
			assignment.Attributes = map[string]string{}
		}
		assignments = append(assignments, assignment)
	}

	return assignments, rows.Err()
}
