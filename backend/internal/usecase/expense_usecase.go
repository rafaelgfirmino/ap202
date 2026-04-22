package usecase

import (
	"context"
	"errors"
	"fmt"
	"math"
	"sort"
	"strings"
	"time"

	"ap202/internal/domain"
	"ap202/internal/ports/output"
)

type ExpenseUseCase struct {
	repo            output.ExpenseRepository
	authorizer      output.AssociationRepository
	condominiumRepo output.CondominiumRepository
}

func NewExpenseUseCase(repo output.ExpenseRepository, authorizer output.AssociationRepository, condominiumRepo output.CondominiumRepository) *ExpenseUseCase {
	return &ExpenseUseCase{
		repo:            repo,
		authorizer:      authorizer,
		condominiumRepo: condominiumRepo,
	}
}

func (uc *ExpenseUseCase) CreateExpense(ctx context.Context, personID int64, condominiumCode string, input domain.CreateExpenseInput) (*domain.Expense, error) {
	condominiumID, err := uc.authorize(ctx, personID, condominiumCode)
	if err != nil {
		return nil, err
	}

	input = input.Normalize()
	if err := input.Validate(); err != nil {
		return nil, err
	}

	expenseDate, err := time.Parse("2006-01-02", input.ExpenseDate)
	if err != nil {
		return nil, domain.ErrExpenseDateInvalid
	}
	referenceMonth, err := parseReferenceMonth(input.ReferenceMonth)
	if err != nil {
		return nil, err
	}

	if input.Scope == domain.ExpenseScopeUnit && input.UnitID != nil {
		ok, err := uc.repo.UnitBelongsToCondominium(ctx, condominiumID, *input.UnitID)
		if err != nil {
			return nil, fmt.Errorf("failed to validate unit condominium ownership: %w", err)
		}
		if !ok {
			return nil, domain.ErrUnitNotInCondominium
		}
	}
	if input.Scope == domain.ExpenseScopeGroup && input.GroupID != nil {
		group, err := uc.repo.GetUnitGroupByID(ctx, condominiumID, *input.GroupID)
		if err != nil {
			return nil, fmt.Errorf("failed to validate group condominium ownership: %w", err)
		}
		if group == nil {
			return nil, domain.ErrGroupNotInCondominium
		}
	}

	amountCents := int64(math.Round(input.Amount * 100))
	expense := &domain.Expense{
		CondominiumID:  condominiumID,
		GroupID:        input.GroupID,
		UnitID:         input.UnitID,
		Scope:          input.Scope,
		Type:           input.Type,
		Category:       input.Category,
		Description:    input.Description,
		AmountCentavos: amountCents,
		ExpenseDate:    expenseDate.UTC(),
		ReferenceMonth: referenceMonth,
		ReceiptURL:     input.ReceiptURL,
		Reversed:       false,
		CreatedBy:      personID,
		CreatedAt:      time.Now().UTC(),
	}

	if err := uc.repo.CreateExpense(ctx, expense); err != nil {
		return nil, err
	}

	return expense, nil
}

func (uc *ExpenseUseCase) ListExpenses(ctx context.Context, personID int64, condominiumCode string, month string, scope string) ([]domain.Expense, error) {
	condominiumID, err := uc.authorize(ctx, personID, condominiumCode)
	if err != nil {
		return nil, err
	}

	referenceMonth, err := parseReferenceMonth(month)
	if err != nil {
		return nil, err
	}
	scope = strings.TrimSpace(scope)
	if scope != "" {
		s := domain.ExpenseScope(scope)
		if !s.IsValid() {
			return nil, domain.ErrExpenseScopeInvalid
		}
	}

	return uc.repo.ListExpenses(ctx, condominiumID, referenceMonth, scope)
}

func (uc *ExpenseUseCase) ReverseExpense(ctx context.Context, personID int64, condominiumCode string, expenseID int64) (*domain.Expense, error) {
	condominiumID, err := uc.authorize(ctx, personID, condominiumCode)
	if err != nil {
		return nil, err
	}

	original, err := uc.repo.GetExpenseByID(ctx, condominiumID, expenseID)
	if err != nil {
		return nil, err
	}
	if original.Reversed {
		return nil, domain.ErrExpenseAlreadyReversed
	}

	now := time.Now().UTC()
	reversalID := original.ID
	reversal := &domain.Expense{
		CondominiumID:  original.CondominiumID,
		GroupID:        original.GroupID,
		UnitID:         original.UnitID,
		Scope:          original.Scope,
		Type:           original.Type,
		Category:       original.Category,
		Description:    fmt.Sprintf("ESTORNO - %s", original.Description),
		AmountCentavos: original.AmountCentavos,
		ExpenseDate:    now,
		ReferenceMonth: original.ReferenceMonth,
		ReceiptURL:     original.ReceiptURL,
		Reversed:       true,
		ReversalOfID:   &reversalID,
		CreatedBy:      personID,
		CreatedAt:      now,
	}

	if err := uc.repo.ReverseExpense(ctx, original, reversal); err != nil {
		return nil, err
	}
	return reversal, nil
}

func (uc *ExpenseUseCase) GetClosingPreview(ctx context.Context, personID int64, condominiumCode string, month string) (*domain.ClosingPreview, error) {
	condominiumID, err := uc.authorize(ctx, personID, condominiumCode)
	if err != nil {
		return nil, err
	}
	referenceMonth, err := parseReferenceMonth(month)
	if err != nil {
		return nil, err
	}
	return uc.buildPreview(ctx, condominiumID, referenceMonth)
}

func (uc *ExpenseUseCase) CloseMonth(ctx context.Context, personID int64, condominiumCode string, input domain.CloseMonthInput) (*domain.ClosingPreview, error) {
	condominiumID, err := uc.authorize(ctx, personID, condominiumCode)
	if err != nil {
		return nil, err
	}
	if err := input.Validate(); err != nil {
		return nil, err
	}
	referenceMonth, err := parseReferenceMonth(input.ReferenceMonth)
	if err != nil {
		return nil, err
	}

	existing, err := uc.repo.GetClosingByMonth(ctx, condominiumID, referenceMonth)
	if err != nil {
		return nil, err
	}
	if existing != nil && existing.Status == domain.ClosingStatusClosed {
		return nil, domain.ErrClosingAlreadyClosed
	}

	preview, err := uc.buildPreview(ctx, condominiumID, referenceMonth)
	if err != nil {
		return nil, err
	}

	if err := uc.repo.PersistClosing(ctx, output.PersistClosingInput{
		CondominiumID:         condominiumID,
		ReferenceMonth:        referenceMonth,
		TotalExpensesCents:    preview.TotalExpensesCents,
		TotalExtraIncomeCents: preview.TotalExtraIncome,
		ReserveFundTotalCents: preview.ReserveFundTotal,
		FeeRule:               preview.FeeRule,
		ClosedBy:              personID,
		Items:                 preview.Items,
	}); err != nil {
		return nil, err
	}

	return preview, nil
}

func (uc *ExpenseUseCase) ReopenMonth(ctx context.Context, personID int64, condominiumCode string, month string) error {
	condominiumID, err := uc.authorize(ctx, personID, condominiumCode)
	if err != nil {
		return err
	}
	referenceMonth, err := parseReferenceMonth(month)
	if err != nil {
		return err
	}

	exists, err := uc.repo.GetClosingByMonth(ctx, condominiumID, referenceMonth)
	if err != nil {
		return err
	}
	if exists == nil {
		return domain.ErrClosingNotFound
	}

	hasGenerated, err := uc.repo.HasAnyGeneratedBoleto(ctx, condominiumID, referenceMonth)
	if err != nil {
		return fmt.Errorf("failed to check generated boletos before reopening: %w", err)
	}
	if hasGenerated {
		return domain.ErrBoletoAlreadyGenerated
	}

	return uc.repo.ReopenClosing(ctx, condominiumID, referenceMonth)
}

func (uc *ExpenseUseCase) GetReserveFundSetting(ctx context.Context, personID int64, condominiumCode string) (*domain.ReserveFundSetting, error) {
	condominiumID, err := uc.authorize(ctx, personID, condominiumCode)
	if err != nil {
		return nil, err
	}
	setting, err := uc.repo.GetReserveFundSetting(ctx, condominiumID)
	if err != nil {
		return nil, err
	}
	if setting == nil {
		return &domain.ReserveFundSetting{
			CondominiumID: condominiumID,
			Mode:          domain.ReserveFundModePercent,
			ValueCentavos: 1000,
			Active:        false,
		}, nil
	}
	return setting, nil
}

func (uc *ExpenseUseCase) UpdateReserveFundSetting(ctx context.Context, personID int64, condominiumCode string, input domain.UpdateReserveFundInput) (*domain.ReserveFundSetting, error) {
	condominiumID, err := uc.authorize(ctx, personID, condominiumCode)
	if err != nil {
		return nil, err
	}
	if err := input.Validate(); err != nil {
		return nil, err
	}

	setting := &domain.ReserveFundSetting{
		CondominiumID: condominiumID,
		Mode:          input.Mode,
		ValueCentavos: int64(math.Round(input.Value * 100)),
		Active:        input.Active,
		UpdatedAt:     time.Now().UTC(),
	}
	if err := uc.repo.UpsertReserveFundSetting(ctx, setting); err != nil {
		return nil, err
	}
	return setting, nil
}

func (uc *ExpenseUseCase) buildPreview(ctx context.Context, condominiumID int64, referenceMonth time.Time) (*domain.ClosingPreview, error) {
	condominium, err := uc.condominiumRepo.GetByID(ctx, condominiumID)
	if err != nil {
		return nil, err
	}
	if !condominium.FeeRule.IsValid() {
		return nil, domain.ErrInvalidFeeRule
	}

	units, err := uc.repo.ListActiveUnitsForClosing(ctx, condominiumID)
	if err != nil {
		return nil, err
	}
	if len(units) == 0 {
		return nil, domain.ErrNoUnitsToCharge
	}

	expenses, err := uc.repo.ListNonReversedExpensesByMonth(ctx, condominiumID, referenceMonth)
	if err != nil {
		return nil, err
	}

	generalTotal := int64(0)
	totalExtraIncome := int64(0)
	groupTotals := map[int64]int64{}
	unitTotals := map[int64]int64{}
	groupRefs := map[int64]*output.UnitGroupRef{}

	for _, expense := range expenses {
		switch expense.Type {
		case domain.ExpenseTypeExtraIncome:
			totalExtraIncome += expense.AmountCentavos
			continue
		case domain.ExpenseTypeExpense:
		default:
			continue
		}

		switch expense.Scope {
		case domain.ExpenseScopeGeneral:
			generalTotal += expense.AmountCentavos
		case domain.ExpenseScopeGroup:
			if expense.GroupID == nil {
				return nil, domain.ErrGroupIDRequired
			}
			groupTotals[*expense.GroupID] += expense.AmountCentavos
			if _, ok := groupRefs[*expense.GroupID]; !ok {
				groupRef, err := uc.repo.GetUnitGroupByID(ctx, condominiumID, *expense.GroupID)
				if err != nil {
					return nil, err
				}
				if groupRef == nil {
					return nil, domain.ErrGroupNotInCondominium
				}
				groupRefs[*expense.GroupID] = groupRef
			}
		case domain.ExpenseScopeUnit:
			if expense.UnitID == nil {
				return nil, domain.ErrUnitIDRequired
			}
			unitTotals[*expense.UnitID] += expense.AmountCentavos
		}
	}

	items := make([]domain.ClosingUnitCharge, len(units))
	indexByUnitID := make(map[int64]int, len(units))
	weights := make([]float64, len(units))
	for i, unit := range units {
		indexByUnitID[unit.UnitID] = i
		items[i] = domain.ClosingUnitCharge{UnitID: unit.UnitID, UnitCode: unit.UnitCode}
		if unit.IdealFraction != nil {
			weights[i] = *unit.IdealFraction
		}
	}

	switch condominium.FeeRule {
	case domain.FeeRuleEqual:
		alloc := allocateEqual(generalTotal, len(units))
		for i := range items {
			items[i].GeneralShareCents = alloc[i]
		}
	case domain.FeeRuleProportional:
		if generalTotal > 0 {
			alloc, err := allocateProportional(generalTotal, weights)
			if err != nil {
				return nil, err
			}
			for i := range items {
				items[i].GeneralShareCents = alloc[i]
			}
		}
	}

	for groupID, total := range groupTotals {
		ref := groupRefs[groupID]
		memberIndexes := make([]int, 0)
		memberWeights := make([]float64, 0)
		for i, unit := range units {
			if unit.GroupType == ref.GroupType && unit.GroupName == ref.Name {
				memberIndexes = append(memberIndexes, i)
				if unit.IdealFraction != nil {
					memberWeights = append(memberWeights, *unit.IdealFraction)
				} else {
					memberWeights = append(memberWeights, 0)
				}
			}
		}
		if len(memberIndexes) == 0 {
			continue
		}

		var groupAlloc []int64
		switch condominium.FeeRule {
		case domain.FeeRuleEqual:
			groupAlloc = allocateEqual(total, len(memberIndexes))
		case domain.FeeRuleProportional:
			alloc, err := allocateProportional(total, memberWeights)
			if err != nil {
				return nil, err
			}
			groupAlloc = alloc
		}

		for i, unitIndex := range memberIndexes {
			items[unitIndex].GroupShareCents += groupAlloc[i]
		}
	}

	for unitID, direct := range unitTotals {
		if idx, ok := indexByUnitID[unitID]; ok {
			items[idx].DirectChargeCents += direct
		}
	}

	setting, err := uc.repo.GetReserveFundSetting(ctx, condominiumID)
	if err != nil {
		return nil, err
	}
	if setting != nil && setting.Active {
		switch setting.Mode {
		case domain.ReserveFundModeFixed:
			for i := range items {
				items[i].ReserveShareCents = setting.ValueCentavos
			}
		case domain.ReserveFundModePercent:
			alloc, err := allocatePercentageByBase(items, setting.ValueCentavos)
			if err != nil {
				return nil, err
			}
			for i := range items {
				items[i].ReserveShareCents = alloc[i]
			}
		}
	}

	reserveTotal := int64(0)
	totalExpenses := int64(0)
	for i := range items {
		items[i].TotalAmountCents =
			items[i].GeneralShareCents +
				items[i].GroupShareCents +
				items[i].DirectChargeCents +
				items[i].ReserveShareCents
		reserveTotal += items[i].ReserveShareCents
		totalExpenses += items[i].GeneralShareCents + items[i].GroupShareCents + items[i].DirectChargeCents
	}

	return &domain.ClosingPreview{
		ReferenceMonth:     referenceMonth.Format("2006-01"),
		FeeRule:            condominium.FeeRule,
		TotalExpensesCents: totalExpenses,
		TotalExtraIncome:   totalExtraIncome,
		ReserveFundTotal:   reserveTotal,
		Items:              items,
	}, nil
}

func (uc *ExpenseUseCase) authorize(ctx context.Context, personID int64, code string) (int64, error) {
	condominiumID, err := uc.condominiumRepo.FindIDByCode(ctx, code)
	if err != nil {
		return 0, err
	}
	allowed, err := uc.authorizer.HasActiveManagerAssociation(ctx, personID, condominiumID)
	if err != nil {
		return 0, fmt.Errorf("failed to check manager association: %w", err)
	}
	if !allowed {
		return 0, domain.ErrForbidden
	}
	return condominiumID, nil
}

func parseReferenceMonth(month string) (time.Time, error) {
	month = strings.TrimSpace(month)
	if month == "" {
		return time.Time{}, domain.ErrReferenceMonthInvalid
	}
	parsed, err := time.Parse("2006-01", month)
	if err != nil {
		return time.Time{}, domain.ErrReferenceMonthInvalid
	}
	return time.Date(parsed.Year(), parsed.Month(), 1, 0, 0, 0, 0, time.UTC), nil
}

func allocateEqual(total int64, count int) []int64 {
	if count <= 0 {
		return []int64{}
	}
	base := total / int64(count)
	remainder := total % int64(count)
	result := make([]int64, count)
	for i := 0; i < count; i++ {
		result[i] = base
		if int64(i) < remainder {
			result[i]++
		}
	}
	return result
}

func allocateProportional(total int64, weights []float64) ([]int64, error) {
	if len(weights) == 0 {
		return []int64{}, nil
	}
	sum := 0.0
	for _, w := range weights {
		if w < 0 {
			return nil, domain.ErrIdealFractionRequired
		}
		sum += w
	}
	if sum <= 0 {
		return nil, domain.ErrIdealFractionRequired
	}

	type remainderItem struct {
		index     int
		remainder float64
	}
	result := make([]int64, len(weights))
	remainders := make([]remainderItem, 0, len(weights))
	allocated := int64(0)

	for i, w := range weights {
		exact := (float64(total) * w) / sum
		floor := int64(math.Floor(exact))
		result[i] = floor
		allocated += floor
		remainders = append(remainders, remainderItem{index: i, remainder: exact - float64(floor)})
	}

	remaining := total - allocated
	sort.SliceStable(remainders, func(i, j int) bool {
		return remainders[i].remainder > remainders[j].remainder
	})
	for i := int64(0); i < remaining; i++ {
		result[remainders[i%int64(len(remainders))].index]++
	}
	return result, nil
}

func allocatePercentageByBase(items []domain.ClosingUnitCharge, percentValueCents int64) ([]int64, error) {
	// percentValueCents stores percent with 2 decimals.
	// Example: 10.00% => 1000.
	if len(items) == 0 {
		return []int64{}, nil
	}
	type remainderItem struct {
		index     int
		remainder float64
	}
	alloc := make([]int64, len(items))
	remainders := make([]remainderItem, 0, len(items))
	total := int64(0)
	allocated := int64(0)

	baseForItem := make([]int64, len(items))
	for _, item := range items {
		base := item.GeneralShareCents + item.GroupShareCents + item.DirectChargeCents
		total += base
	}
	for i := range items {
		baseForItem[i] = items[i].GeneralShareCents + items[i].GroupShareCents + items[i].DirectChargeCents
	}
	for i := range items {
		exact := (float64(baseForItem[i]) * float64(percentValueCents)) / 10000.0
		floor := int64(math.Floor(exact))
		alloc[i] = floor
		allocated += floor
		remainders = append(remainders, remainderItem{index: i, remainder: exact - float64(floor)})
	}
	target := int64(math.Round((float64(total) * float64(percentValueCents)) / 10000.0))
	remaining := target - allocated
	if remaining < 0 {
		return nil, errors.New("invalid reserve allocation")
	}
	sort.SliceStable(remainders, func(i, j int) bool {
		return remainders[i].remainder > remainders[j].remainder
	})
	for i := int64(0); i < remaining; i++ {
		alloc[remainders[i%int64(len(remainders))].index]++
	}
	return alloc, nil
}
