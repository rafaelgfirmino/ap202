package input

import (
	"context"

	"ap202/internal/domain"
)

type ExpenseService interface {
	CreateExpense(ctx context.Context, personID int64, condominiumCode string, input domain.CreateExpenseInput) (*domain.Expense, error)
	ListExpenses(ctx context.Context, personID int64, condominiumCode string, month string, scope string) ([]domain.Expense, error)
	ReverseExpense(ctx context.Context, personID int64, condominiumCode string, expenseID int64) (*domain.Expense, error)
	GetClosingPreview(ctx context.Context, personID int64, condominiumCode string, month string) (*domain.ClosingPreview, error)
	CloseMonth(ctx context.Context, personID int64, condominiumCode string, input domain.CloseMonthInput) (*domain.ClosingPreview, error)
	ReopenMonth(ctx context.Context, personID int64, condominiumCode string, month string) error
	GetReserveFundSetting(ctx context.Context, personID int64, condominiumCode string) (*domain.ReserveFundSetting, error)
	UpdateReserveFundSetting(ctx context.Context, personID int64, condominiumCode string, input domain.UpdateReserveFundInput) (*domain.ReserveFundSetting, error)
}
