package domain

import (
	"errors"
	"strings"
	"time"
)

var (
	ErrExpenseNotFound           = errors.New("expense not found")
	ErrExpenseScopeInvalid       = errors.New("expense scope is invalid")
	ErrExpenseTypeInvalid        = errors.New("expense type is invalid")
	ErrExpenseCategoryRequired   = errors.New("expense category is required")
	ErrExpenseDescriptionInvalid = errors.New("expense description is invalid")
	ErrExpenseAmountInvalid      = errors.New("expense amount is invalid")
	ErrExpenseDateInvalid        = errors.New("expense date is invalid")
	ErrReferenceMonthInvalid     = errors.New("reference month is invalid")
	ErrGroupIDRequired           = errors.New("group id is required for group scope")
	ErrUnitIDRequired            = errors.New("unit id is required for unit scope")
	ErrScopeCombinationInvalid   = errors.New("scope combination is invalid")
	ErrExpenseAlreadyReversed    = errors.New("expense already reversed")
	ErrClosingAlreadyClosed      = errors.New("monthly closing already closed")
	ErrClosingNotFound           = errors.New("monthly closing not found")
	ErrBoletoAlreadyGenerated    = errors.New("boleto already generated")
	ErrReserveFundModeInvalid    = errors.New("reserve fund mode is invalid")
	ErrReserveFundValueInvalid   = errors.New("reserve fund value is invalid")
	ErrMonthRequired             = errors.New("month is required")
	ErrUnitNotInCondominium      = errors.New("unit does not belong to condominium")
	ErrGroupNotInCondominium     = errors.New("group does not belong to condominium")
	ErrIdealFractionRequired     = errors.New("ideal fraction is required for proportional calculations")
)

type ExpenseScope string
type ExpenseType string
type ReserveFundMode string
type ClosingStatus string

const (
	ExpenseScopeGeneral ExpenseScope = "general"
	ExpenseScopeGroup   ExpenseScope = "group"
	ExpenseScopeUnit    ExpenseScope = "unit"

	ExpenseTypeExpense     ExpenseType = "expense"
	ExpenseTypeExtraIncome ExpenseType = "extra_income"

	ReserveFundModePercent ReserveFundMode = "percent"
	ReserveFundModeFixed   ReserveFundMode = "fixed"

	ClosingStatusOpen   ClosingStatus = "open"
	ClosingStatusClosed ClosingStatus = "closed"
)

func (s ExpenseScope) IsValid() bool {
	return s == ExpenseScopeGeneral || s == ExpenseScopeGroup || s == ExpenseScopeUnit
}

func (t ExpenseType) IsValid() bool {
	return t == ExpenseTypeExpense || t == ExpenseTypeExtraIncome
}

func (m ReserveFundMode) IsValid() bool {
	return m == ReserveFundModePercent || m == ReserveFundModeFixed
}

type Expense struct {
	ID             int64        `json:"id"`
	CondominiumID  int64        `json:"condominium_id"`
	GroupID        *int64       `json:"group_id"`
	UnitID         *int64       `json:"unit_id"`
	Scope          ExpenseScope `json:"scope"`
	Type           ExpenseType  `json:"type"`
	Category       string       `json:"category"`
	Description    string       `json:"description"`
	AmountCentavos int64        `json:"amount_centavos"`
	ExpenseDate    time.Time    `json:"expense_date"`
	ReferenceMonth time.Time    `json:"reference_month"`
	ReceiptURL     *string      `json:"receipt_url"`
	Reversed       bool         `json:"reversed"`
	ReversalOfID   *int64       `json:"reversal_of_id"`
	CreatedBy      int64        `json:"created_by"`
	CreatedAt      time.Time    `json:"created_at"`
}

type CreateExpenseInput struct {
	Scope          ExpenseScope `json:"scope"`
	Type           ExpenseType  `json:"type"`
	Category       string       `json:"category"`
	Description    string       `json:"description"`
	Amount         float64      `json:"amount"`
	ExpenseDate    string       `json:"expense_date"`
	ReferenceMonth string       `json:"reference_month"`
	ReceiptURL     *string      `json:"receipt_url"`
	GroupID        *int64       `json:"group_id"`
	UnitID         *int64       `json:"unit_id"`
}

func (i CreateExpenseInput) Normalize() CreateExpenseInput {
	i.Category = strings.TrimSpace(i.Category)
	i.Description = strings.TrimSpace(i.Description)
	if i.ReceiptURL != nil {
		trimmed := strings.TrimSpace(*i.ReceiptURL)
		i.ReceiptURL = &trimmed
	}
	return i
}

func (i CreateExpenseInput) Validate() error {
	if !i.Scope.IsValid() {
		return ErrExpenseScopeInvalid
	}
	if !i.Type.IsValid() {
		return ErrExpenseTypeInvalid
	}
	if i.Category == "" {
		return ErrExpenseCategoryRequired
	}
	if i.Description == "" || len(i.Description) > 300 {
		return ErrExpenseDescriptionInvalid
	}
	if i.Amount <= 0 {
		return ErrExpenseAmountInvalid
	}
	if strings.TrimSpace(i.ExpenseDate) == "" {
		return ErrExpenseDateInvalid
	}
	if strings.TrimSpace(i.ReferenceMonth) == "" {
		return ErrReferenceMonthInvalid
	}

	switch i.Scope {
	case ExpenseScopeGeneral:
		if i.GroupID != nil || i.UnitID != nil {
			return ErrScopeCombinationInvalid
		}
	case ExpenseScopeGroup:
		if i.GroupID == nil {
			return ErrGroupIDRequired
		}
		if i.UnitID != nil {
			return ErrScopeCombinationInvalid
		}
	case ExpenseScopeUnit:
		if i.UnitID == nil {
			return ErrUnitIDRequired
		}
		if i.GroupID != nil {
			return ErrScopeCombinationInvalid
		}
	}

	if i.Type == ExpenseTypeExtraIncome && i.Scope != ExpenseScopeGeneral {
		return ErrScopeCombinationInvalid
	}

	return nil
}

type ReserveFundSetting struct {
	ID            int64           `json:"id"`
	CondominiumID int64           `json:"condominium_id"`
	Mode          ReserveFundMode `json:"mode"`
	ValueCentavos int64           `json:"value_centavos"`
	Active        bool            `json:"active"`
	UpdatedAt     time.Time       `json:"updated_at"`
}

type UpdateReserveFundInput struct {
	Mode   ReserveFundMode `json:"mode"`
	Value  float64         `json:"value"`
	Active bool            `json:"active"`
}

func (i UpdateReserveFundInput) Validate() error {
	if !i.Mode.IsValid() {
		return ErrReserveFundModeInvalid
	}
	if i.Value <= 0 {
		return ErrReserveFundValueInvalid
	}
	return nil
}

type ClosingUnitCharge struct {
	UnitID            int64  `json:"unit_id"`
	UnitCode          string `json:"unit_code"`
	GeneralShareCents int64  `json:"general_share_centavos"`
	GroupShareCents   int64  `json:"group_share_centavos"`
	DirectChargeCents int64  `json:"direct_charge_centavos"`
	ReserveShareCents int64  `json:"reserve_fund_share_centavos"`
	TotalAmountCents  int64  `json:"total_amount_centavos"`
}

type ClosingPreview struct {
	ReferenceMonth     string              `json:"reference_month"`
	FeeRule            FeeRule             `json:"fee_rule"`
	TotalExpensesCents int64               `json:"total_expenses_centavos"`
	TotalExtraIncome   int64               `json:"total_extra_income_centavos"`
	ReserveFundTotal   int64               `json:"reserve_fund_total_centavos"`
	Items              []ClosingUnitCharge `json:"items"`
}

type CloseMonthInput struct {
	ReferenceMonth string `json:"reference_month"`
}

func (i CloseMonthInput) Validate() error {
	if strings.TrimSpace(i.ReferenceMonth) == "" {
		return ErrMonthRequired
	}
	return nil
}
