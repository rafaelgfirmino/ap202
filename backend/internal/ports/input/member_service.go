package input

import (
	"context"

	"ap202/internal/domain"
)

type MemberService interface {
	Add(ctx context.Context, userID int64, code string, unitCode string, input domain.AddMemberInput) (*domain.Member, error)
	List(ctx context.Context, userID int64, code string, unitCode string) ([]domain.Member, error)
	Remove(ctx context.Context, userID int64, code string, unitCode string, bondID int64) error
}
