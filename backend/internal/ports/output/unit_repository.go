package output

import (
	"context"

	"ap202/internal/domain"
)

type UnitRepository interface {
	Create(ctx context.Context, unit *domain.Unit) error
	List(ctx context.Context, condominiumID int64) ([]domain.Unit, error)
	FindByID(ctx context.Context, id int64, condominiumID int64) (*domain.Unit, error)
	FindByGroupNameAndIdentifier(ctx context.Context, condominiumID int64, groupName, identifier string) (*domain.Unit, error)
	ExistsByGroupNameAndIdentifier(ctx context.Context, condominiumID int64, groupName, identifier string) (bool, error)
	BelongsToCondominium(ctx context.Context, unitID int64, condominiumID int64) (bool, error)
	UpdatePrivateArea(ctx context.Context, unitID int64, condominiumID int64, privateArea *float64) (*domain.Unit, error)
	Delete(ctx context.Context, unitID int64, condominiumID int64) error
	ExistsByGroup(ctx context.Context, condominiumID int64, groupType, groupName string) (bool, error)
}
