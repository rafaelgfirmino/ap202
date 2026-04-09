import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@clerk/react-router';
import { KTDataTable } from '@keenthemes/ktui';
import { AlertCircle, RotateCcw, Search } from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { isValidExpenseMonth, upsertExpenseMonth } from './month-store';

type ExpenseScope = 'general' | 'group' | 'unit';
type ExpenseType = 'expense' | 'extra_income';
type UnitGroupType = 'block' | 'tower' | 'sector' | 'court' | 'phase';

type Unit = {
  id: number;
  code: string;
  identifier?: string;
};

type UnitGroup = {
  id: number;
  group_type: UnitGroupType;
  name: string;
};

type UnitListResponse = { data: Unit[] | null };
type UnitGroupListResponse = { data: UnitGroup[] | null };

type Expense = {
  id: number;
  group_id: number | null;
  unit_id: number | null;
  scope: ExpenseScope;
  type: ExpenseType;
  category: string;
  description: string;
  amount_centavos: number;
  expense_date: string;
  reversed: boolean;
  reversal_of_id: number | null;
};

type ExpenseListResponse = {
  data: Expense[] | null;
};

type ClosingItem = {
  unit_id: number;
  unit_code: string;
  general_share_centavos: number;
  group_share_centavos: number;
  direct_charge_centavos: number;
  reserve_fund_share_centavos: number;
  total_amount_centavos: number;
};

type ClosingPreview = {
  reference_month: string;
  fee_rule: 'equal' | 'proportional' | '';
  total_expenses_centavos: number;
  total_extra_income_centavos: number;
  reserve_fund_total_centavos: number;
  items: ClosingItem[];
};

const typeOptions: Array<{ value: ExpenseType; label: string }> = [
  { value: 'expense', label: 'Despesa' },
  { value: 'extra_income', label: 'Receita extra' },
];

const scopeOptions: Array<{ value: ExpenseScope; label: string }> = [
  { value: 'general', label: 'Geral' },
  { value: 'group', label: 'Grupo' },
  { value: 'unit', label: 'Unidade' },
];

const expenseCategories: Array<{ value: string; label: string }> = [
  { value: 'water', label: 'Agua' },
  { value: 'electricity', label: 'Energia' },
  { value: 'gas', label: 'Gas' },
  { value: 'cleaning', label: 'Limpeza' },
  { value: 'maintenance', label: 'Manutencao' },
  { value: 'insurance', label: 'Seguro' },
  { value: 'administration', label: 'Administracao' },
  { value: 'security', label: 'Seguranca' },
  { value: 'elevator', label: 'Elevador' },
  { value: 'other', label: 'Outros' },
];

const extraIncomeCategories: Array<{ value: string; label: string }> = [
  { value: 'common_area_rental', label: 'Aluguel de area comum' },
  { value: 'fine', label: 'Multa' },
  { value: 'other_income', label: 'Outras receitas' },
];

function toMonthInputValue(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function formatCurrencyFromCents(value?: number | null) {
  const amount = value ?? 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount / 100);
}

function formatDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

function getTypeLabel(type: ExpenseType) {
  return typeOptions.find((item) => item.value === type)?.label ?? type;
}

function getScopeLabel(scope: ExpenseScope) {
  return scopeOptions.find((item) => item.value === scope)?.label ?? scope;
}

function getCategoryLabel(type: ExpenseType, category: string) {
  const list = type === 'extra_income' ? extraIncomeCategories : expenseCategories;
  return list.find((item) => item.value === category)?.label ?? category;
}

function resolveUnitIdentifier(unit: Unit | undefined, unitCode: string) {
  if (unit?.identifier) {
    return unit.identifier;
  }

  const numericToken = unitCode.match(/\d+/)?.[0];
  return numericToken || unitCode;
}

function getGroupTypeLabel(groupType?: string) {
  switch (groupType) {
    case 'block':
      return 'Bloco';
    case 'tower':
      return 'Torre';
    case 'sector':
      return 'Setor';
    case 'court':
      return 'Quadra';
    case 'phase':
      return 'Fase';
    default:
      return groupType ?? '';
  }
}

export function CondominiumExpensesPage() {
  const { code = '', month = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const referenceMonth = isValidExpenseMonth(month) ? month : toMonthInputValue();

  const [loadingReferenceData, setLoadingReferenceData] = useState(true);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [groups, setGroups] = useState<UnitGroup[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [preview, setPreview] = useState<ClosingPreview | null>(null);

  const [loadingPreview, setLoadingPreview] = useState(false);
  const [closingMonth, setClosingMonth] = useState(false);
  const [reopeningMonth, setReopeningMonth] = useState(false);
  const [reversingExpenseId, setReversingExpenseId] = useState<number | null>(null);
  const [expensePendingReverse, setExpensePendingReverse] = useState<Expense | null>(null);
  const [scopeFilter, setScopeFilter] = useState<'all' | ExpenseScope>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | ExpenseType>('all');
  const [groupFilter, setGroupFilter] = useState<'all' | string>('all');
  const datatableRef = useRef<KTDataTable | null>(null);

  async function getApiErrorPayload(response: Response) {
    return await response.json().catch(() => null) as { message?: string; error?: string } | null;
  }

  async function getApiErrorMessage(response: Response, fallback: string) {
    const payload = await getApiErrorPayload(response);
    if (payload?.error === 'closing_already_closed') {
      return 'Essa competência já está fechada. Use "Reabrir mês" para recalcular.';
    }
    if (payload?.error === 'boleto_already_generated') {
      return 'Não é possível reabrir: já existe boleto gerado para esta competência.';
    }
    return payload?.message || fallback;
  }
  const visibleExpenses = useMemo(
    () => expenses.filter((expense) => expense.reversal_of_id == null),
    [expenses],
  );

  const filteredExpenses = useMemo(
    () => visibleExpenses.filter((expense) => {
      const typeMatches = typeFilter === 'all' || expense.type === typeFilter;
      const scopeMatches = scopeFilter === 'all' || expense.scope === scopeFilter;
      const groupMatches = scopeFilter !== 'group'
        || groupFilter === 'all'
        || String(expense.group_id ?? '') === groupFilter;
      return typeMatches && scopeMatches && groupMatches;
    }),
    [groupFilter, scopeFilter, typeFilter, visibleExpenses],
  );

  useEffect(() => {
    if (scopeFilter !== 'group') {
      setGroupFilter('all');
    }
  }, [scopeFilter]);

  const totalReversed = useMemo(
    () => visibleExpenses.filter((expense) => expense.reversed).length,
    [visibleExpenses],
  );

  useEffect(() => {
    upsertExpenseMonth(code, referenceMonth);
  }, [code, referenceMonth]);

  useEffect(() => {
    if (searchParams.get('preview') !== '1') {
      return;
    }

    void onPreviewClosing().finally(() => {
      const next = new URLSearchParams(searchParams);
      next.delete('preview');
      setSearchParams(next, { replace: true });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    async function loadReferenceData() {
      try {
        setLoadingReferenceData(true);
        setError(null);
        const token = await getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
        const [groupsResponse, unitsResponse] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/v1/condominiums/${code}/unit-groups`, { headers }),
          fetch(`${import.meta.env.VITE_API_URL}/api/v1/condominiums/${code}/units`, { headers }),
        ]);

        if (groupsResponse.status === 404 || unitsResponse.status === 404) {
          navigate('/condominiums', { replace: true });
          return;
        }

        if (!groupsResponse.ok || !unitsResponse.ok) throw new Error('Falha ao carregar dados da tela de despesas.');
        const groupsJson = (await groupsResponse.json()) as UnitGroupListResponse;
        const unitsJson = (await unitsResponse.json()) as UnitListResponse;
        setGroups(Array.isArray(groupsJson.data) ? groupsJson.data : []);
        setUnits(Array.isArray(unitsJson.data) ? unitsJson.data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados da tela de despesas.');
      } finally {
        setLoadingReferenceData(false);
      }
    }

    void loadReferenceData();
  }, [code, getToken, navigate]);

  useEffect(() => {
    async function loadExpenses() {
      try {
        setLoadingExpenses(true);
        setError(null);
        const token = await getToken();
        const params = new URLSearchParams({ month: referenceMonth });
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/condominiums/${code}/expenses?${params.toString()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (response.status === 404) {
          navigate('/condominiums', { replace: true });
          return;
        }
        if (!response.ok) throw new Error('Falha ao carregar despesas.');
        const payload = (await response.json()) as ExpenseListResponse;
        setExpenses(Array.isArray(payload.data) ? payload.data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar despesas.');
      } finally {
        setLoadingExpenses(false);
      }
    }

    void loadExpenses();
  }, [code, getToken, navigate, referenceMonth]);

  useEffect(() => {
    if (loadingExpenses) return;
    let cancelled = false;
    let instance: KTDataTable | null = null;
    let frameId = 0;

    frameId = window.requestAnimationFrame(() => {
      if (cancelled) return;
      const element = document.getElementById('condominium-expenses-kt-datatable');
      if (!element) return;
      const existing = KTDataTable.getInstance(element);
      if (existing) {
        existing.update();
        datatableRef.current = existing;
        return;
      }
      instance = new KTDataTable(element, {
        pageSize: 10,
        stateSave: true,
        info: '{start} - {end} de {total}',
        infoEmpty: 'Nenhum lançamento para a competência.',
      });
      datatableRef.current = instance;
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
      try {
        if (instance && datatableRef.current === instance) datatableRef.current.dispose();
      } catch {
        // ignore
      } finally {
        if (datatableRef.current === instance) datatableRef.current = null;
      }
    };
  }, [filteredExpenses, loadingExpenses, referenceMonth]);

  async function refreshExpensesAndPreview() {
    const token = await getToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    const params = new URLSearchParams({ month: referenceMonth });
    const [expensesResponse, previewResponse] = await Promise.all([
      fetch(`${import.meta.env.VITE_API_URL}/api/v1/condominiums/${code}/expenses?${params.toString()}`, { headers }),
      fetch(`${import.meta.env.VITE_API_URL}/api/v1/condominiums/${code}/closing/preview?month=${referenceMonth}`, { headers }),
    ]);
    if (expensesResponse.ok) {
      const expensesJson = (await expensesResponse.json()) as ExpenseListResponse;
      setExpenses(Array.isArray(expensesJson.data) ? expensesJson.data : []);
    }
    if (previewResponse.ok) {
      const previewJson = (await previewResponse.json()) as ClosingPreview;
      setPreview(previewJson);
    }
  }

  async function onReverseExpense(expense: Expense) {
    setReversingExpenseId(expense.id);
    setError(null);
    setSuccess(null);
    try {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/condominiums/${code}/expenses/${expense.id}/reverse`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, 'Falha ao estornar lançamento.'));
      }
      setSuccess('Lançamento estornado com sucesso.');
      setExpensePendingReverse(null);
      await refreshExpensesAndPreview();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao estornar lançamento.');
    } finally {
      setReversingExpenseId(null);
    }
  }

  async function onPreviewClosing() {
    setLoadingPreview(true);
    setError(null);
    try {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/condominiums/${code}/closing/preview?month=${referenceMonth}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, 'Falha ao gerar prévia do fechamento.'));
      }
      const payload = (await response.json()) as ClosingPreview;
      setPreview(payload);
      setSuccess('Prévia do fechamento atualizada.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar prévia do fechamento.');
    } finally {
      setLoadingPreview(false);
    }
  }

  async function onCloseMonth() {
    setClosingMonth(true);
    setError(null);
    setSuccess(null);
    try {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/condominiums/${code}/closing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ reference_month: referenceMonth }),
      });
      if (!response.ok) {
        const payload = await getApiErrorPayload(response);
        if (response.status === 409 && payload?.error === 'closing_already_closed') {
          await refreshExpensesAndPreview();
          setSuccess('Essa competência já está fechada.');
          return;
        }
        throw new Error(await getApiErrorMessage(response, 'Falha ao fechar o mês.'));
      }
      const payload = (await response.json()) as ClosingPreview;
      setPreview(payload);
      setSuccess('Mês fechado com sucesso.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fechar o mês.');
    } finally {
      setClosingMonth(false);
    }
  }

  async function onReopenMonth() {
    setReopeningMonth(true);
    setError(null);
    setSuccess(null);
    try {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/condominiums/${code}/closing/${referenceMonth}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, 'Falha ao reabrir o mês.'));
      }
      setSuccess('Mês reaberto com sucesso.');
      await onPreviewClosing();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao reabrir o mês.');
    } finally {
      setReopeningMonth(false);
    }
  }

  return (
    <div id="condominium-expenses-page" className="space-y-5">
      <div id="condominium-expenses-header" className="space-y-3">
        <Breadcrumb id="condominium-expenses-breadcrumb">
          <BreadcrumbList id="condominium-expenses-breadcrumb-list">
            <BreadcrumbItem id="condominium-expenses-breadcrumb-condominiums">
              <BreadcrumbLink asChild><Link to="/condominiums">Condomínios</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator id="condominium-expenses-breadcrumb-separator-1" />
            <BreadcrumbItem id="condominium-expenses-breadcrumb-condominium">
              <BreadcrumbLink asChild><Link to={`/condominiums/${code}`}>{code}</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator id="condominium-expenses-breadcrumb-separator-2" />
            <BreadcrumbItem id="condominium-expenses-breadcrumb-months">
              <BreadcrumbLink asChild><Link to={`/condominiums/${code}/expenses`}>Meses</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator id="condominium-expenses-breadcrumb-separator-3" />
            <BreadcrumbItem id="condominium-expenses-breadcrumb-page">
              <BreadcrumbPage>{referenceMonth}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div id="condominium-expenses-header-actions" className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div id="condominium-expenses-header-text" className="space-y-1">
            <h1 id="condominium-expenses-title" className="text-2xl font-semibold tracking-tight">Lançamentos da competência {referenceMonth}</h1>
            <p id="condominium-expenses-description" className="text-sm text-muted-foreground">
              Consulte os lançamentos, faça estorno quando necessário e execute o fechamento mensal.
            </p>
          </div>
          <div id="condominium-expenses-header-buttons" className="flex flex-wrap gap-2">
            <Button id="condominium-expenses-create-button" asChild variant="primary">
              <Link to={`/condominiums/${code}/expenses/${referenceMonth}/create`}>Criar despesa</Link>
            </Button>
            <Button id="condominium-expenses-months-button" asChild variant="outline">
              <Link to={`/condominiums/${code}/expenses`}>Voltar para meses</Link>
            </Button>
          </div>
        </div>
      </div>

      <Card id="condominium-expenses-closing-card">
        <CardHeader id="condominium-expenses-closing-card-header">
          <CardTitle id="condominium-expenses-closing-card-title">Fechamento mensal</CardTitle>
        </CardHeader>
        <CardContent id="condominium-expenses-closing-card-content" className="space-y-4">
          <div id="condominium-expenses-closing-actions" className="flex flex-wrap gap-2">
            <Button id="condominium-expenses-closing-preview-button" variant="outline" onClick={() => void onPreviewClosing()} disabled={loadingPreview}>{loadingPreview ? 'Calculando...' : 'Gerar prévia'}</Button>
            <Button id="condominium-expenses-closing-close-button" variant="primary" onClick={() => void onCloseMonth()} disabled={closingMonth}>{closingMonth ? 'Fechando...' : 'Fechar mês'}</Button>
            <Button id="condominium-expenses-closing-reopen-button" variant="outline" onClick={() => void onReopenMonth()} disabled={reopeningMonth}>{reopeningMonth ? 'Reabrindo...' : 'Reabrir mês'}</Button>
          </div>

          {preview ? (
            <div id="condominium-expenses-closing-summary" className="grid gap-2 rounded-xl border border-border bg-muted/20 p-3 text-sm">
              <div id="condominium-expenses-closing-summary-fee-rule" className="flex justify-between gap-3"><span className="text-muted-foreground">Regra de rateio</span><span className="font-medium">{preview.fee_rule === 'proportional' ? 'Proporcional' : 'Igualitário'}</span></div>
              <div id="condominium-expenses-closing-summary-total-expenses" className="flex justify-between gap-3"><span className="text-muted-foreground">Total despesas</span><span className="font-medium">{formatCurrencyFromCents(preview.total_expenses_centavos)}</span></div>
              <div id="condominium-expenses-closing-summary-extra-income" className="flex justify-between gap-3"><span className="text-muted-foreground">Total receita extra</span><span className="font-medium">{formatCurrencyFromCents(preview.total_extra_income_centavos)}</span></div>
              <div id="condominium-expenses-closing-summary-reserve" className="flex justify-between gap-3"><span className="text-muted-foreground">Fundo de reserva</span><span className="font-medium">{formatCurrencyFromCents(preview.reserve_fund_total_centavos)}</span></div>
            </div>
          ) : (
            <div id="condominium-expenses-closing-empty" className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">Gere a prévia para visualizar os valores por unidade antes de fechar o mês.</div>
          )}
        </CardContent>
      </Card>

      <div id="condominium-expenses-list-board" className="overflow-hidden rounded-2xl border border-border bg-background text-foreground shadow-sm">
        <div id="condominium-expenses-list-board-header" className="space-y-6 px-5 py-5 md:px-6">
          <div id="condominium-expenses-list-title-group" className="space-y-1">
            <h2 id="condominium-expenses-list-title" className="text-base font-semibold">Lançamentos</h2>
            <div id="condominium-expenses-list-subtitle" className="text-sm text-muted-foreground">
              Competência: <span className="font-medium text-foreground">{referenceMonth}</span>
            </div>
          </div>
          <div id="condominium-expenses-list-count" className="text-sm text-muted-foreground">
            Total de lançamentos: <span className="font-semibold text-foreground">{visibleExpenses.length}</span>
            {'  '}
            Estornados: <span className="font-semibold text-foreground">{totalReversed}</span>
          </div>
          <div id="condominium-expenses-list-actions" className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div id="condominium-expenses-filters" className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div id="condominium-expenses-search-group" className="space-y-1">
                <Label htmlFor="condominium-expenses-search-input" className="text-xs text-muted-foreground">Buscar</Label>
                <div id="condominium-expenses-search-input-wrapper" className="relative min-w-0 lg:min-w-72">
                  <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="condominium-expenses-search-input"
                    type="text"
                    placeholder="Buscar lançamentos..."
                    data-kt-datatable-search="#condominium-expenses-kt-datatable"
                    className="h-10 border-border bg-background ps-9 text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>
              <div id="condominium-expenses-type-filter-group" className="space-y-1">
                <Label htmlFor="condominium-expenses-type-filter" className="text-xs text-muted-foreground">Tipo</Label>
                <select
                  id="condominium-expenses-type-filter"
                  className="kt-select h-10 min-w-40 border-border bg-background text-foreground"
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value as 'all' | ExpenseType)}
                >
                  <option id="condominium-expenses-type-filter-all" value="all">Todos</option>
                  <option id="condominium-expenses-type-filter-expense" value="expense">Despesa</option>
                  <option id="condominium-expenses-type-filter-extra-income" value="extra_income">Receita extra</option>
                </select>
              </div>
              <div id="condominium-expenses-scope-filter-group" className="space-y-1">
                <Label htmlFor="condominium-expenses-scope-filter" className="text-xs text-muted-foreground">Escopo</Label>
                <select
                  id="condominium-expenses-scope-filter"
                  className="kt-select h-10 min-w-40 border-border bg-background text-foreground"
                  value={scopeFilter}
                  onChange={(event) => setScopeFilter(event.target.value as 'all' | ExpenseScope)}
                >
                  <option id="condominium-expenses-scope-filter-all" value="all">Todos</option>
                  <option id="condominium-expenses-scope-filter-general" value="general">Geral</option>
                  <option id="condominium-expenses-scope-filter-group" value="group">Grupo</option>
                  <option id="condominium-expenses-scope-filter-unit" value="unit">Unidade</option>
                </select>
              </div>
              {scopeFilter === 'group' ? (
                <div id="condominium-expenses-group-filter-group" className="space-y-1">
                  <Label htmlFor="condominium-expenses-group-filter" className="text-xs text-muted-foreground">Grupo</Label>
                  <select
                    id="condominium-expenses-group-filter"
                    className="kt-select h-10 min-w-48 border-border bg-background text-foreground"
                    value={groupFilter}
                    onChange={(event) => setGroupFilter(event.target.value)}
                  >
                    <option id="condominium-expenses-group-filter-all" value="all">Todos os grupos</option>
                    {groups.map((group) => (
                      <option
                        id={`condominium-expenses-group-filter-option-${group.id}`}
                        key={group.id}
                        value={String(group.id)}
                      >
                        {`${getGroupTypeLabel(group.group_type)} ${group.name}`}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>
            <div id="condominium-expenses-toolbar-actions" className="flex flex-col gap-2 sm:flex-row">
              <Button id="condominium-expenses-create-toolbar-button" asChild variant="outline">
                <Link to={`/condominiums/${code}/expenses/${referenceMonth}/create`}>Criar despesa</Link>
              </Button>
            </div>
          </div>
        </div>

        {loadingReferenceData || loadingExpenses ? (
          <div id="condominium-expenses-list-loading" className="space-y-3 px-5 py-5">
            <Skeleton id="condominium-expenses-list-loading-1" className="h-14 w-full rounded-xl" />
            <Skeleton id="condominium-expenses-list-loading-2" className="h-14 w-full rounded-xl" />
            <Skeleton id="condominium-expenses-list-loading-3" className="h-14 w-full rounded-xl" />
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div id="condominium-expenses-empty" className="border-t border-border px-5 py-6 text-sm text-muted-foreground md:px-6">
            Nenhum lançamento encontrado para os filtros selecionados.
          </div>
        ) : (
          <div id="condominium-expenses-kt-datatable" className="kt-card-table border-t border-border" data-kt-datatable="true" data-kt-datatable-page-size="10" data-kt-datatable-state-save="true">
            <div id="condominium-expenses-table-wrapper" className="kt-table-wrapper kt-scrollable">
              <table id="condominium-expenses-table" className="kt-table min-w-full" data-kt-datatable-table="true">
                <thead id="condominium-expenses-table-head" className="bg-muted/40">
                  <tr id="condominium-expenses-table-head-row">
                    <th id="condominium-expenses-col-type" scope="col" className="w-36 border-border" data-kt-datatable-column="type"><span className="kt-table-col"><span className="kt-table-col-label">Tipo</span><span className="kt-table-col-sort"></span></span></th>
                    <th id="condominium-expenses-col-scope" scope="col" className="w-40 border-border" data-kt-datatable-column="scope"><span className="kt-table-col"><span className="kt-table-col-label">Escopo</span><span className="kt-table-col-sort"></span></span></th>
                    <th id="condominium-expenses-col-description" scope="col" className="min-w-72 border-border" data-kt-datatable-column="description"><span className="kt-table-col"><span className="kt-table-col-label">Descrição</span><span className="kt-table-col-sort"></span></span></th>
                    <th id="condominium-expenses-col-amount" scope="col" className="w-40 border-border" data-kt-datatable-column="amount"><span className="kt-table-col"><span className="kt-table-col-label">Valor</span><span className="kt-table-col-sort"></span></span></th>
                    <th id="condominium-expenses-col-date" scope="col" className="w-36 border-border" data-kt-datatable-column="date"><span className="kt-table-col"><span className="kt-table-col-label">Data</span><span className="kt-table-col-sort"></span></span></th>
                    <th id="condominium-expenses-col-status" scope="col" className="w-36 border-border" data-kt-datatable-column="status"><span className="kt-table-col"><span className="kt-table-col-label">Status</span><span className="kt-table-col-sort"></span></span></th>
                    <th id="condominium-expenses-col-actions" scope="col" className="w-44 border-border" data-kt-datatable-column="actions"><span className="kt-table-col"><span className="kt-table-col-label">Ações</span></span></th>
                  </tr>
                </thead>
                <tbody id="condominium-expenses-table-body">
                  {filteredExpenses.map((expense) => {
                    const canReverse = !expense.reversed && expense.reversal_of_id == null;
                    const group = groups.find((item) => item.id === expense.group_id);
                    const unit = units.find((item) => item.id === expense.unit_id);
                    return (
                      <tr key={expense.id} id={`condominium-expense-row-${expense.id}`}>
                        <td id={`condominium-expense-type-${expense.id}`} className="border-border bg-background"><Badge appearance="light" variant={expense.type === 'expense' ? 'destructive' : 'success'} size="sm">{getTypeLabel(expense.type)}</Badge></td>
                        <td id={`condominium-expense-scope-${expense.id}`} className="border-border bg-background text-sm">
                          <div id={`condominium-expense-scope-content-${expense.id}`} className="space-y-1">
                            <div id={`condominium-expense-scope-label-${expense.id}`} className="font-medium text-foreground">{getScopeLabel(expense.scope)}</div>
                            {expense.scope === 'group' && group ? <div id={`condominium-expense-scope-reference-${expense.id}`} className="text-xs text-muted-foreground">{`${getGroupTypeLabel(group.group_type)} ${group.name}`}</div> : null}
                            {expense.scope === 'unit' && unit ? <div id={`condominium-expense-scope-unit-${expense.id}`} className="text-xs text-muted-foreground">{unit.code}</div> : null}
                          </div>
                        </td>
                        <td id={`condominium-expense-description-${expense.id}`} className="border-border bg-background">
                          <div id={`condominium-expense-description-content-${expense.id}`} className="space-y-1">
                            <div id={`condominium-expense-description-text-${expense.id}`} className="text-sm font-medium text-foreground">{expense.description}</div>
                            <div id={`condominium-expense-category-${expense.id}`} className="text-xs text-muted-foreground">{getCategoryLabel(expense.type, expense.category)}</div>
                          </div>
                        </td>
                        <td id={`condominium-expense-amount-${expense.id}`} className="border-border bg-background text-sm font-semibold text-foreground">{formatCurrencyFromCents(expense.amount_centavos)}</td>
                        <td id={`condominium-expense-date-${expense.id}`} className="border-border bg-background text-sm text-foreground">{formatDate(expense.expense_date)}</td>
                        <td id={`condominium-expense-status-${expense.id}`} className="border-border bg-background">
                          <Badge appearance="light" variant={expense.reversed ? 'warning' : 'primary'} size="sm">
                            {expense.reversed ? 'Estornado' : 'Ativo'}
                          </Badge>
                        </td>
                        <td id={`condominium-expense-actions-${expense.id}`} className="border-border bg-background text-end">
                          <div id={`condominium-expense-actions-wrapper-${expense.id}`} className="inline-flex justify-end">
                            <button
                              id={`condominium-expense-reverse-button-${expense.id}`}
                              type="button"
                              className="kt-btn kt-btn-sm kt-btn-icon kt-btn-outline"
                              onClick={() => setExpensePendingReverse(expense)}
                              disabled={!canReverse || reversingExpenseId === expense.id}
                              aria-label="Estornar lançamento"
                              data-kt-tooltip={`#condominium-expense-reverse-tooltip-${expense.id}`}
                              data-kt-tooltip-placement="bottom-start"
                            >
                              <RotateCcw id={`condominium-expense-reverse-icon-${expense.id}`} className="size-4" />
                            </button>
                            <div id={`condominium-expense-reverse-tooltip-${expense.id}`} className="kt-tooltip">
                              {!canReverse ? 'Lançamento já estornado' : reversingExpenseId === expense.id ? 'Estornando...' : 'Estornar lançamento'}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div id="condominium-expenses-kt-datatable-footer" className="kt-datatable-toolbar border-t border-border bg-background">
              <div id="condominium-expenses-kt-datatable-length" className="kt-datatable-length">
                Mostrar
                <select id="condominium-expenses-kt-datatable-size" className="kt-select kt-select-sm w-16" name="perpage" data-kt-datatable-size="true" />
                por pagina
              </div>
              <div id="condominium-expenses-kt-datatable-info-wrapper" className="kt-datatable-info">
                <span id="condominium-expenses-kt-datatable-info" data-kt-datatable-info="true" />
                <div id="condominium-expenses-kt-datatable-pagination" className="kt-datatable-pagination" data-kt-datatable-pagination="true" />
              </div>
            </div>
          </div>
        )}
      </div>

      {preview ? (
        <Card id="condominium-expenses-preview-table-card">
          <CardHeader id="condominium-expenses-preview-table-header">
            <CardTitle id="condominium-expenses-preview-table-title">Prévia por unidade</CardTitle>
          </CardHeader>
          <CardContent id="condominium-expenses-preview-table-content" className="overflow-x-auto">
            <table id="condominium-expenses-preview-table" className="min-w-full divide-y divide-border text-sm">
              <thead id="condominium-expenses-preview-table-head" className="bg-muted/40 text-left text-muted-foreground">
                <tr id="condominium-expenses-preview-table-head-row">
                  <th id="condominium-expenses-preview-col-unit" className="px-3 py-2">Unidade</th>
                  <th id="condominium-expenses-preview-col-general" className="px-3 py-2">Rateio geral</th>
                  <th id="condominium-expenses-preview-col-group" className="px-3 py-2">Rateio grupo</th>
                  <th id="condominium-expenses-preview-col-direct" className="px-3 py-2">Despesa direta</th>
                  <th id="condominium-expenses-preview-col-reserve" className="px-3 py-2">Fundo reserva</th>
                  <th id="condominium-expenses-preview-col-total" className="px-3 py-2">Total</th>
                </tr>
              </thead>
              <tbody id="condominium-expenses-preview-table-body" className="divide-y divide-border">
                {preview.items.map((item) => {
                  const unit = units.find((unitItem) => unitItem.id === item.unit_id);
                  const unitIdentifier = resolveUnitIdentifier(unit, item.unit_code);

                  return (
                    <tr id={`condominium-expenses-preview-row-${item.unit_id}`} key={item.unit_id}>
                      <td id={`condominium-expenses-preview-unit-${item.unit_id}`} className="px-3 py-2">
                        <div id={`condominium-expenses-preview-unit-identifier-${item.unit_id}`} className="font-medium text-foreground">
                          {unitIdentifier}
                        </div>
                        <div id={`condominium-expenses-preview-unit-code-${item.unit_id}`} className="text-xs text-muted-foreground">
                          Código: {item.unit_code}
                        </div>
                      </td>
                    <td id={`condominium-expenses-preview-general-${item.unit_id}`} className="px-3 py-2 text-foreground">{formatCurrencyFromCents(item.general_share_centavos)}</td>
                    <td id={`condominium-expenses-preview-group-${item.unit_id}`} className="px-3 py-2 text-foreground">{formatCurrencyFromCents(item.group_share_centavos)}</td>
                    <td id={`condominium-expenses-preview-direct-${item.unit_id}`} className="px-3 py-2 text-foreground">{formatCurrencyFromCents(item.direct_charge_centavos)}</td>
                    <td id={`condominium-expenses-preview-reserve-${item.unit_id}`} className="px-3 py-2 text-foreground">{formatCurrencyFromCents(item.reserve_fund_share_centavos)}</td>
                    <td id={`condominium-expenses-preview-total-${item.unit_id}`} className="px-3 py-2 font-semibold text-foreground">{formatCurrencyFromCents(item.total_amount_centavos)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : null}

      {error ? (
        <div id="condominium-expenses-error" className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4" />
          <span id="condominium-expenses-error-text">{error}</span>
        </div>
      ) : null}
      {success ? (
        <div id="condominium-expenses-success" className="rounded-lg border border-success/20 bg-success/5 px-4 py-3 text-sm text-success">
          {success}
        </div>
      ) : null}

      <AlertDialog open={Boolean(expensePendingReverse)} onOpenChange={(open) => !open && setExpensePendingReverse(null)}>
        <AlertDialogContent id="condominium-expenses-reverse-dialog">
          <AlertDialogHeader id="condominium-expenses-reverse-dialog-header">
            <AlertDialogTitle id="condominium-expenses-reverse-dialog-title">Confirmar estorno</AlertDialogTitle>
            <AlertDialogDescription id="condominium-expenses-reverse-dialog-description">Esse lançamento ficará marcado como estornado e será criada uma reversão. Deseja continuar?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter id="condominium-expenses-reverse-dialog-footer">
            <AlertDialogCancel id="condominium-expenses-reverse-dialog-cancel">Cancelar</AlertDialogCancel>
            <AlertDialogAction id="condominium-expenses-reverse-dialog-confirm" onClick={() => { if (expensePendingReverse) void onReverseExpense(expensePendingReverse); }}>Confirmar estorno</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
