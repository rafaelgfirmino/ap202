package output

import (
	"context"
	"database/sql"
	"time"

	"ap202/internal/domain"
)

type MemberRepository interface {
	CreateBond(ctx context.Context, tx *sql.Tx, bond *domain.Bond) error
	DeactivateBond(ctx context.Context, bondID int64, condominiumID int64, unitID int64, endDate time.Time) error
	ListMembersByUnitID(ctx context.Context, unitID int64) ([]domain.Member, error)
}
