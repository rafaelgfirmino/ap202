package output

import (
	"context"
	"time"

	"ap202/internal/domain"
)

type ClosingUnit struct {
	UnitID        int64
	UnitCode      string
	GroupType     string
	GroupName     string
	IdealFraction *float64
}

type UnitGroupRef struct {
	ID        int64
	GroupType string
	Name      string
}

type ClosingRecord struct {
	ID             int64
	ReferenceMonth time.Time
	Status         domain.ClosingStatus
}

type PersistClosingInput struct {
	CondominiumID         int64
	ReferenceMonth        time.Time
	TotalExpensesCents    int64
	TotalExtraIncomeCents int64
	ReserveFundTotalCents int64
	FeeRule               domain.FeeRule
	ClosedBy              int64
	Items                 []domain.ClosingUnitCharge
}

type ExpenseRepository interface {
	CreateExpense(ctx context.Context, expense *domain.Expense) error
	ListExpenses(ctx context.Context, condominiumID int64, month time.Time, scope string) ([]domain.Expense, error)
	GetExpenseByID(ctx context.Context, condominiumID int64, expenseID int64) (*domain.Expense, error)
	ReverseExpense(ctx context.Context, original *domain.Expense, reversal *domain.Expense) error

	GetReserveFundSetting(ctx context.Context, condominiumID int64) (*domain.ReserveFundSetting, error)
	UpsertReserveFundSetting(ctx context.Context, setting *domain.ReserveFundSetting) error

	UnitBelongsToCondominium(ctx context.Context, condominiumID, unitID int64) (bool, error)
	GetUnitGroupByID(ctx context.Context, condominiumID, groupID int64) (*UnitGroupRef, error)
	ListActiveUnitsForClosing(ctx context.Context, condominiumID int64) ([]ClosingUnit, error)
	ListNonReversedExpensesByMonth(ctx context.Context, condominiumID int64, referenceMonth time.Time) ([]domain.Expense, error)

	GetClosingByMonth(ctx context.Context, condominiumID int64, referenceMonth time.Time) (*ClosingRecord, error)
	PersistClosing(ctx context.Context, input PersistClosingInput) error
	HasAnyGeneratedBoleto(ctx context.Context, condominiumID int64, referenceMonth time.Time) (bool, error)
	ReopenClosing(ctx context.Context, condominiumID int64, referenceMonth time.Time) error
}
