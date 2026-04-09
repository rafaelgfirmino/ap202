import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@clerk/react-router';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { isValidExpenseMonth, upsertExpenseMonth } from '../month-store';

type ExpenseScope = 'general' | 'group' | 'unit';
type ExpenseType = 'expense' | 'extra_income';
type UnitGroupType = 'block' | 'tower' | 'sector' | 'court' | 'phase';

type Unit = {
  id: number;
  code: string;
  group_type?: string;
  group_name?: string;
};

type UnitGroup = {
  id: number;
  group_type: UnitGroupType;
  name: string;
};

type UnitListResponse = { data: Unit[] | null };
type UnitGroupListResponse = { data: UnitGroup[] | null };

const scopeOptions: Array<{ value: ExpenseScope; label: string }> = [
  { value: 'general', label: 'Geral' },
  { value: 'group', label: 'Grupo' },
  { value: 'unit', label: 'Unidade' },
];

const typeOptions: Array<{ value: ExpenseType; label: string }> = [
  { value: 'expense', label: 'Despesa' },
  { value: 'extra_income', label: 'Receita extra' },
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

function parseAmountToNumber(value: string) {
  const normalized = value.trim().replace(/\s+/g, '').replace(/\./g, '').replace(',', '.');
  const parsed = Number(normalized);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error('Informe um valor válido maior que zero.');
  }
  return parsed;
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

export function CondominiumExpenseCreatePage() {
  const { code = '', month = '' } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const referenceMonth = isValidExpenseMonth(month) ? month : toMonthInputValue();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<UnitGroup[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [form, setForm] = useState({
    scope: 'general' as ExpenseScope,
    type: 'expense' as ExpenseType,
    category: 'water',
    description: '',
    amount: '',
    expense_date: new Date().toISOString().slice(0, 10),
    reference_month: referenceMonth,
    receipt_url: '',
    group_id: '',
    unit_id: '',
  });

  const availableCategories = useMemo(
    () => (form.type === 'extra_income' ? extraIncomeCategories : expenseCategories),
    [form.type],
  );

  useEffect(() => {
    if (!availableCategories.find((item) => item.value === form.category)) {
      setForm((current) => ({ ...current, category: availableCategories[0]?.value ?? '' }));
    }
  }, [availableCategories, form.category]);

  useEffect(() => {
    if (form.type === 'extra_income' && form.scope !== 'general') {
      setForm((current) => ({ ...current, scope: 'general', group_id: '', unit_id: '' }));
    }
  }, [form.scope, form.type]);

  useEffect(() => {
    upsertExpenseMonth(code, referenceMonth);
  }, [code, referenceMonth]);

  useEffect(() => {
    async function loadReferenceData() {
      try {
        setLoading(true);
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

        if (!groupsResponse.ok || !unitsResponse.ok) {
          throw new Error('Falha ao carregar dados para o cadastro de despesa.');
        }

        const groupsJson = (await groupsResponse.json()) as UnitGroupListResponse;
        const unitsJson = (await unitsResponse.json()) as UnitListResponse;
        setGroups(Array.isArray(groupsJson.data) ? groupsJson.data : []);
        setUnits(Array.isArray(unitsJson.data) ? unitsJson.data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados para o cadastro de despesa.');
      } finally {
        setLoading(false);
      }
    }

    void loadReferenceData();
  }, [code, getToken, navigate]);

  async function onCreateExpense(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (form.scope === 'group' && !form.group_id) throw new Error('Selecione um grupo para escopo de grupo.');
      if (form.scope === 'unit' && !form.unit_id) throw new Error('Selecione uma unidade para escopo de unidade.');

      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/condominiums/${code}/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          scope: form.scope,
          type: form.type,
          category: form.category,
          description: form.description,
          amount: parseAmountToNumber(form.amount),
          expense_date: form.expense_date,
          reference_month: form.reference_month,
          receipt_url: form.receipt_url.trim() || null,
          group_id: form.scope === 'group' ? Number(form.group_id) : null,
          unit_id: form.scope === 'unit' ? Number(form.unit_id) : null,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || 'Falha ao registrar lançamento.');
      }

      navigate(`/condominiums/${code}/expenses/${form.reference_month}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar lançamento.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div id="condominium-expense-create-page" className="space-y-5">
      <div id="condominium-expense-create-header" className="space-y-3">
        <Breadcrumb id="condominium-expense-create-breadcrumb">
          <BreadcrumbList id="condominium-expense-create-breadcrumb-list">
            <BreadcrumbItem id="condominium-expense-create-breadcrumb-condominiums">
              <BreadcrumbLink asChild><Link to="/condominiums">Condomínios</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator id="condominium-expense-create-breadcrumb-separator-1" />
            <BreadcrumbItem id="condominium-expense-create-breadcrumb-condominium">
              <BreadcrumbLink asChild><Link to={`/condominiums/${code}`}>{code}</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator id="condominium-expense-create-breadcrumb-separator-2" />
            <BreadcrumbItem id="condominium-expense-create-breadcrumb-month">
              <BreadcrumbLink asChild><Link to={`/condominiums/${code}/expenses/${referenceMonth}`}>{referenceMonth}</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator id="condominium-expense-create-breadcrumb-separator-3" />
            <BreadcrumbItem id="condominium-expense-create-breadcrumb-page">
              <BreadcrumbPage>Nova despesa</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div id="condominium-expense-create-header-actions" className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div id="condominium-expense-create-header-text" className="space-y-1">
            <h1 id="condominium-expense-create-title" className="text-2xl font-semibold tracking-tight">Criar lançamento</h1>
            <p id="condominium-expense-create-description" className="text-sm text-muted-foreground">
              Cadastre um novo lançamento para a competência selecionada.
            </p>
          </div>
          <Button id="condominium-expense-create-back-button" asChild variant="outline">
            <Link to={`/condominiums/${code}/expenses/${referenceMonth}`}>Voltar para lançamentos</Link>
          </Button>
        </div>
      </div>

      <Card id="condominium-expense-create-card">
        <CardHeader id="condominium-expense-create-card-header">
          <CardTitle id="condominium-expense-create-card-title">Novo lançamento</CardTitle>
        </CardHeader>
        <CardContent id="condominium-expense-create-card-content">
          {loading ? (
            <div id="condominium-expense-create-loading" className="space-y-3">
              <Skeleton id="condominium-expense-create-loading-1" className="h-10 w-full rounded-md" />
              <Skeleton id="condominium-expense-create-loading-2" className="h-10 w-full rounded-md" />
              <Skeleton id="condominium-expense-create-loading-3" className="h-10 w-full rounded-md" />
              <Skeleton id="condominium-expense-create-loading-4" className="h-10 w-full rounded-md" />
            </div>
          ) : (
            <form id="condominium-expense-create-form" className="grid gap-4" onSubmit={onCreateExpense}>
              <div id="condominium-expense-create-row-1" className="grid gap-4 md:grid-cols-2">
                <div id="condominium-expense-create-type-group" className="space-y-2">
                  <Label htmlFor="condominium-expense-create-type-input">Tipo</Label>
                  <Select
                    value={form.type}
                    onValueChange={(value) => setForm((current) => ({
                      ...current,
                      type: value as ExpenseType,
                      scope: value === 'extra_income' ? 'general' : current.scope,
                      group_id: value === 'extra_income' ? '' : current.group_id,
                      unit_id: value === 'extra_income' ? '' : current.unit_id,
                    }))}
                  >
                    <SelectTrigger id="condominium-expense-create-type-input"><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                    <SelectContent id="condominium-expense-create-type-content">
                      {typeOptions.map((option) => <SelectItem id={`condominium-expense-create-type-${option.value}`} key={option.value} value={option.value}>{option.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div id="condominium-expense-create-scope-group" className="space-y-2">
                  <Label htmlFor="condominium-expense-create-scope-input">Escopo</Label>
                  <Select
                    value={form.scope}
                    onValueChange={(value) => setForm((current) => ({
                      ...current,
                      scope: value as ExpenseScope,
                      group_id: value === 'group' ? current.group_id : '',
                      unit_id: value === 'unit' ? current.unit_id : '',
                    }))}
                    disabled={form.type === 'extra_income'}
                  >
                    <SelectTrigger id="condominium-expense-create-scope-input"><SelectValue placeholder="Selecione o escopo" /></SelectTrigger>
                    <SelectContent id="condominium-expense-create-scope-content">
                      {scopeOptions.map((option) => <SelectItem id={`condominium-expense-create-scope-${option.value}`} key={option.value} value={option.value}>{option.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div id="condominium-expense-create-row-2" className="grid gap-4 md:grid-cols-2">
                <div id="condominium-expense-create-month-group" className="space-y-2">
                  <Label htmlFor="condominium-expense-create-month-input">Mês de lançamento</Label>
                  <Input id="condominium-expense-create-month-input" type="month" value={form.reference_month} onChange={(event) => setForm((current) => ({ ...current, reference_month: event.target.value }))} required />
                </div>
                <div id="condominium-expense-create-date-group" className="space-y-2">
                  <Label htmlFor="condominium-expense-create-date-input">Data do lançamento</Label>
                  <Input id="condominium-expense-create-date-input" type="date" value={form.expense_date} onChange={(event) => setForm((current) => ({ ...current, expense_date: event.target.value }))} required />
                </div>
              </div>

              <div id="condominium-expense-create-row-3" className="grid gap-4 md:grid-cols-2">
                <div id="condominium-expense-create-category-group" className="space-y-2">
                  <Label htmlFor="condominium-expense-create-category-input">Categoria</Label>
                  <Select value={form.category} onValueChange={(value) => setForm((current) => ({ ...current, category: value }))}>
                    <SelectTrigger id="condominium-expense-create-category-input"><SelectValue placeholder="Selecione a categoria" /></SelectTrigger>
                    <SelectContent id="condominium-expense-create-category-content">
                      {availableCategories.map((option) => <SelectItem id={`condominium-expense-create-category-${option.value}`} key={option.value} value={option.value}>{option.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div id="condominium-expense-create-amount-group" className="space-y-2">
                  <Label htmlFor="condominium-expense-create-amount-input">Valor (R$)</Label>
                  <Input id="condominium-expense-create-amount-input" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} placeholder="Ex: 840,00" required />
                </div>
              </div>

              {form.scope === 'group' ? (
                <div id="condominium-expense-create-group-select-group" className="space-y-2">
                  <Label htmlFor="condominium-expense-create-group-input">Grupo</Label>
                  <Select value={form.group_id} onValueChange={(value) => setForm((current) => ({ ...current, group_id: value }))}>
                    <SelectTrigger id="condominium-expense-create-group-input"><SelectValue placeholder="Selecione um grupo" /></SelectTrigger>
                    <SelectContent id="condominium-expense-create-group-content">
                      {groups.map((group) => <SelectItem id={`condominium-expense-create-group-${group.id}`} key={group.id} value={String(group.id)}>{`${getGroupTypeLabel(group.group_type)} ${group.name}`}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              {form.scope === 'unit' ? (
                <div id="condominium-expense-create-unit-select-group" className="space-y-2">
                  <Label htmlFor="condominium-expense-create-unit-input">Unidade</Label>
                  <Select value={form.unit_id} onValueChange={(value) => setForm((current) => ({ ...current, unit_id: value }))}>
                    <SelectTrigger id="condominium-expense-create-unit-input"><SelectValue placeholder="Selecione uma unidade" /></SelectTrigger>
                    <SelectContent id="condominium-expense-create-unit-content">
                      {units.map((unit) => <SelectItem id={`condominium-expense-create-unit-${unit.id}`} key={unit.id} value={String(unit.id)}>{`${unit.code} (${getGroupTypeLabel(unit.group_type)} ${unit.group_name ?? '-'})`}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              <div id="condominium-expense-create-description-group" className="space-y-2">
                <Label htmlFor="condominium-expense-create-description-input">Descrição</Label>
                <Input id="condominium-expense-create-description-input" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Ex: Conta de água - março" required />
              </div>

              <div id="condominium-expense-create-receipt-group" className="space-y-2">
                <Label htmlFor="condominium-expense-create-receipt-input">URL do comprovante (opcional)</Label>
                <Input id="condominium-expense-create-receipt-input" value={form.receipt_url} onChange={(event) => setForm((current) => ({ ...current, receipt_url: event.target.value }))} placeholder="https://..." />
              </div>

              <div id="condominium-expense-create-actions" className="flex justify-end">
                <Button id="condominium-expense-create-submit-button" type="submit" variant="primary" disabled={submitting}>
                  {submitting ? 'Salvando...' : 'Criar despesa'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {error ? (
        <div id="condominium-expense-create-error" className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}
    </div>
  );
}
