package output

import (
	"context"

	"ap202/internal/domain"

	"github.com/google/uuid"
)

type AssignmentRepository interface {
	Assign(ctx context.Context, assignment *domain.UserRole) error
	Revoke(ctx context.Context, userID int64, roleID uuid.UUID, tenantID int64) error
	ListByUser(ctx context.Context, userID int64) ([]domain.UserRole, error)
}
