package handlers

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"

	"ap202/internal/authctx"
	"ap202/internal/domain"
	"ap202/internal/ports/input"
)

type ExpenseHandler struct {
	service input.ExpenseService
}

func NewExpenseHandler(service input.ExpenseService) *ExpenseHandler {
	return &ExpenseHandler{service: service}
}

func (h *ExpenseHandler) CreateExpense(w http.ResponseWriter, r *http.Request) {
	personID, ok := authctx.UserIDFromContext(r.Context())
	if !ok || personID <= 0 {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized", "message": "Invalid or missing token."})
		return
	}

	var req domain.CreateExpenseInput
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid_request", "message": "Invalid request body."})
		return
	}

	expense, err := h.service.CreateExpense(r.Context(), personID, r.PathValue("code"), req)
	if err != nil {
		h.writeError(w, err)
		return
	}

	writeJSON(w, http.StatusCreated, expense)
}

func (h *ExpenseHandler) ListExpenses(w http.ResponseWriter, r *http.Request) {
	personID, ok := authctx.UserIDFromContext(r.Context())
	if !ok || personID <= 0 {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized", "message": "Invalid or missing token."})
		return
	}

	month := r.URL.Query().Get("month")
	scope := r.URL.Query().Get("scope")
	expenses, err := h.service.ListExpenses(r.Context(), personID, r.PathValue("code"), month, scope)
	if err != nil {
		h.writeError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"data": expenses, "total": len(expenses)})
}

func (h *ExpenseHandler) ReverseExpense(w http.ResponseWriter, r *http.Request) {
	personID, ok := authctx.UserIDFromContext(r.Context())
	if !ok || personID <= 0 {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized", "message": "Invalid or missing token."})
		return
	}

	expenseID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || expenseID <= 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid_expense_id", "message": "Invalid expense id."})
		return
	}

	expense, err := h.service.ReverseExpense(r.Context(), personID, r.PathValue("code"), expenseID)
	if err != nil {
		h.writeError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, expense)
}

func (h *ExpenseHandler) PreviewClosing(w http.ResponseWriter, r *http.Request) {
	personID, ok := authctx.UserIDFromContext(r.Context())
	if !ok || personID <= 0 {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized", "message": "Invalid or missing token."})
		return
	}

	month := r.URL.Query().Get("month")
	preview, err := h.service.GetClosingPreview(r.Context(), personID, r.PathValue("code"), month)
	if err != nil {
		h.writeError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, preview)
}

func (h *ExpenseHandler) CloseMonth(w http.ResponseWriter, r *http.Request) {
	personID, ok := authctx.UserIDFromContext(r.Context())
	if !ok || personID <= 0 {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized", "message": "Invalid or missing token."})
		return
	}

	var req domain.CloseMonthInput
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid_request", "message": "Invalid request body."})
		return
	}

	preview, err := h.service.CloseMonth(r.Context(), personID, r.PathValue("code"), req)
	if err != nil {
		h.writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, preview)
}

func (h *ExpenseHandler) ReopenMonth(w http.ResponseWriter, r *http.Request) {
	personID, ok := authctx.UserIDFromContext(r.Context())
	if !ok || personID <= 0 {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized", "message": "Invalid or missing token."})
		return
	}

	month := r.PathValue("month")
	if err := h.service.ReopenMonth(r.Context(), personID, r.PathValue("code"), month); err != nil {
		h.writeError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *ExpenseHandler) GetReserveFundSetting(w http.ResponseWriter, r *http.Request) {
	personID, ok := authctx.UserIDFromContext(r.Context())
	if !ok || personID <= 0 {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized", "message": "Invalid or missing token."})
		return
	}

	setting, err := h.service.GetReserveFundSetting(r.Context(), personID, r.PathValue("code"))
	if err != nil {
		h.writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, setting)
}

func (h *ExpenseHandler) UpdateReserveFundSetting(w http.ResponseWriter, r *http.Request) {
	personID, ok := authctx.UserIDFromContext(r.Context())
	if !ok || personID <= 0 {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized", "message": "Invalid or missing token."})
		return
	}

	var req domain.UpdateReserveFundInput
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid_request", "message": "Invalid request body."})
		return
	}

	setting, err := h.service.UpdateReserveFundSetting(r.Context(), personID, r.PathValue("code"), req)
	if err != nil {
		h.writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, setting)
}

func (h *ExpenseHandler) writeError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, domain.ErrCondominiumNotFound):
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "condominium_not_found", "message": "Condominium not found."})
	case errors.Is(err, domain.ErrForbidden):
		writeJSON(w, http.StatusForbidden, map[string]string{"error": "forbidden", "message": "You do not have permission to access this condominium."})
	case errors.Is(err, domain.ErrExpenseNotFound):
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "expense_not_found", "message": "Expense not found."})
	case errors.Is(err, domain.ErrExpenseAlreadyReversed):
		writeJSON(w, http.StatusConflict, map[string]string{"error": "expense_already_reversed", "message": "Expense already reversed."})
	case errors.Is(err, domain.ErrExpenseScopeInvalid), errors.Is(err, domain.ErrScopeCombinationInvalid):
		writeJSON(w, http.StatusUnprocessableEntity, map[string]string{"error": "expense_scope_invalid", "message": "Invalid scope and group/unit combination."})
	case errors.Is(err, domain.ErrExpenseTypeInvalid):
		writeJSON(w, http.StatusUnprocessableEntity, map[string]string{"error": "expense_type_invalid", "message": "Expense type must be expense or extra_income."})
	case errors.Is(err, domain.ErrExpenseCategoryRequired), errors.Is(err, domain.ErrExpenseDescriptionInvalid), errors.Is(err, domain.ErrExpenseAmountInvalid), errors.Is(err, domain.ErrExpenseDateInvalid):
		writeJSON(w, http.StatusUnprocessableEntity, map[string]string{"error": "expense_invalid", "message": "Invalid expense payload."})
	case errors.Is(err, domain.ErrReferenceMonthInvalid), errors.Is(err, domain.ErrMonthRequired):
		writeJSON(w, http.StatusUnprocessableEntity, map[string]string{"error": "reference_month_invalid", "message": "Reference month must be in YYYY-MM format."})
	case errors.Is(err, domain.ErrGroupIDRequired):
		writeJSON(w, http.StatusUnprocessableEntity, map[string]string{"error": "group_id_required", "message": "group_id is required for group scope."})
	case errors.Is(err, domain.ErrUnitIDRequired):
		writeJSON(w, http.StatusUnprocessableEntity, map[string]string{"error": "unit_id_required", "message": "unit_id is required for unit scope."})
	case errors.Is(err, domain.ErrUnitNotInCondominium):
		writeJSON(w, http.StatusUnprocessableEntity, map[string]string{"error": "unit_not_in_condominium", "message": "The selected unit does not belong to this condominium."})
	case errors.Is(err, domain.ErrGroupNotInCondominium):
		writeJSON(w, http.StatusUnprocessableEntity, map[string]string{"error": "group_not_in_condominium", "message": "The selected group does not belong to this condominium."})
	case errors.Is(err, domain.ErrReserveFundModeInvalid), errors.Is(err, domain.ErrReserveFundValueInvalid):
		writeJSON(w, http.StatusUnprocessableEntity, map[string]string{"error": "reserve_fund_invalid", "message": "Invalid reserve fund settings payload."})
	case errors.Is(err, domain.ErrClosingAlreadyClosed):
		writeJSON(w, http.StatusConflict, map[string]string{"error": "closing_already_closed", "message": "Monthly closing is already closed."})
	case errors.Is(err, domain.ErrClosingNotFound):
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "closing_not_found", "message": "Monthly closing not found."})
	case errors.Is(err, domain.ErrBoletoAlreadyGenerated):
		writeJSON(w, http.StatusConflict, map[string]string{"error": "boleto_already_generated", "message": "Cannot reopen month with boleto already generated."})
	case errors.Is(err, domain.ErrNoUnitsToCharge):
		writeJSON(w, http.StatusUnprocessableEntity, map[string]string{"error": "no_units_to_charge", "message": "At least one active unit is required for closing."})
	case errors.Is(err, domain.ErrIdealFractionRequired):
		writeJSON(w, http.StatusUnprocessableEntity, map[string]string{"error": "ideal_fraction_required", "message": "All active units must have ideal fraction for proportional calculation."})
	default:
		log.Printf("expense handler internal error: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal_error", "message": "Internal server error."})
	}
}
