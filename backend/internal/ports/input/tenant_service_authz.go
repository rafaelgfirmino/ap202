package input

import (
	"context"

	"ap202/internal/domain"
)

type TenantService interface {
	Setup(ctx context.Context, tenantID int64) ([]domain.Role, error)
}
