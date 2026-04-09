import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/react-router';
import { CircleHelp, Lock, PencilLine } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useCondominiumContext } from '@/contexts/condominium-context';
import { cn } from '@/lib/utils';

type Condominium = {
  id: number;
  code: string;
  name: string;
  phone: string;
  email: string;
  fee_rule?: 'equal' | 'proportional' | null;
  land_area: number | null;
  built_area_sum: number;
  total_units?: number | null;
  active_residents?: number | null;
  monthly_default_rate?: number | null;
  cash_balance?: number | null;
  status: 'active' | 'inactive' | 'suspended';
  address: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zip_code: string;
    latitude?: number | null;
    longitude?: number | null;
  };
  cnpjs: Array<{
    id: number;
    condominium_id: number;
    cnpj: string;
    razao_social: string;
    descricao: string;
    principal: boolean;
    ativo: boolean;
    data_inicio?: string | null;
    data_fim?: string | null;
    created_at?: string;
  }>;
  created_at: string;
  updated_at: string;
};

type UnitListResponse = {
  data: Array<{ id: number }> | null;
  total: number;
};

type ReserveFundMode = 'percent' | 'fixed';

type ReserveFundSetting = {
  id: number;
  condominium_id: number;
  mode: ReserveFundMode;
  value_centavos: number;
  active: boolean;
  updated_at: string;
};

type ExpenseType = 'expense' | 'extra_income';

type FinancialExpense = {
  id: number;
  type: ExpenseType;
  amount_centavos: number;
  reversed: boolean;
  reversal_of_id: number | null;
};

type ExpenseListResponse = {
  data: FinancialExpense[] | null;
  total: number;
};

type ClosingPreview = {
  reference_month: string;
  fee_rule: 'equal' | 'proportional' | '';
  total_expenses_centavos: number;
  total_extra_income_centavos: number;
  reserve_fund_total_centavos: number;
};

function formatPhone(value?: string | null) {
  if (!value) return 'Não informado';

  const digits = value.replace(/\D/g, '');
  if (digits.length === 11) {
    return digits.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  }
  if (digits.length === 10) {
    return digits.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  }
  return value;
}

function formatZipCode(value?: string | null) {
  if (!value) return 'Não informado';
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 8) return value;
  return digits.replace(/^(\d{5})(\d{3})$/, '$1-$2');
}

function formatDate(value?: string | null) {
  if (!value) return 'Não informado';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Não informado';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function formatDateTime(value?: string | null) {
  if (!value) return 'Não informado';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Não informado';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatArea(value?: number | null) {
  if (value == null) {
    return <span className="italic text-muted-foreground">Não informada</span>;
  }

  return `${new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)} m²`;
}

function formatBuiltArea(value?: number | null) {
  if (!value) {
    return <span className="italic text-muted-foreground">Não calculada</span>;
  }

  return formatArea(value);
}

function formatCurrency(value?: number | null) {
  if (value == null) {
    return <span className="italic text-muted-foreground">Não disponível</span>;
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatPercent(value?: number | null) {
  if (value == null) {
    return <span className="italic text-muted-foreground">Não disponível</span>;
  }

  return `${new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)}%`;
}

function formatNumber(value?: number | null) {
  if (value == null) {
    return <span className="italic text-muted-foreground">Não disponível</span>;
  }

  return new Intl.NumberFormat('pt-BR').format(value);
}

function formatCurrencyFromCents(value?: number | null) {
  if (value == null) {
    return <span className="italic text-muted-foreground">Não disponível</span>;
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value / 100);
}

function toAreaInputValue(value?: number | null) {
  if (value == null) {
    return '';
  }

  return String(value).replace('.', ',');
}

function toMoneyInputValue(valueCentavos?: number | null) {
  if (valueCentavos == null) {
    return '';
  }

  return (valueCentavos / 100).toFixed(2).replace('.', ',');
}

function getCurrentReferenceMonth(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function parseMoneyInput(value: string) {
  const normalized = value.trim().replace(/\s+/g, '').replace(/\./g, '').replace(',', '.');
  if (!normalized) {
    throw new Error('Informe um valor válido para o fundo de reserva.');
  }

  const parsed = Number(normalized);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error('Informe um valor válido maior que zero para o fundo de reserva.');
  }

  return parsed;
}

function parseAreaInput(value: string) {
  const normalized = value.trim().replace(/\s+/g, '').replace(',', '.');
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  if (Number.isNaN(parsed) || parsed < 0) {
    throw new Error('Informe uma área válida maior ou igual a zero.');
  }

  return parsed;
}

function reserveFundModeLabel(value?: ReserveFundMode | null) {
  if (value === 'fixed') return 'Valor fixo (R$)';
  if (value === 'percent') return 'Percentual (%)';
  return 'Não disponível';
}

function Field({
  label,
  value,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status?: Condominium['status'] }) {
  if (status === 'active') {
    return <Badge appearance="light" variant="success" size="sm">Ativo</Badge>;
  }

  if (status === 'inactive') {
    return <Badge appearance="light" variant="destructive" size="sm">Inativo</Badge>;
  }

  if (status === 'suspended') {
    return <Badge appearance="light" variant="warning" size="sm">Suspenso</Badge>;
  }

  return null;
}

function FeeRuleBadge({ feeRule }: { feeRule?: Condominium['fee_rule'] }) {
  if (feeRule === 'equal') {
    return <Badge appearance="light" variant="primary" size="sm">Igualitário</Badge>;
  }

  if (feeRule === 'proportional') {
    return <Badge appearance="light" variant="warning" size="sm">Proporcional</Badge>;
  }

  return <span className="italic text-muted-foreground">Não disponível</span>;
}

function SummaryCardSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Skeleton className="h-20 rounded-xl" />
      <Skeleton className="h-20 rounded-xl" />
      <Skeleton className="h-20 rounded-xl" />
      <Skeleton className="h-20 rounded-xl" />
    </div>
  );
}

export function CondominiumDetailPage() {
  const { code = '' } = useParams();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const { selectCondominium } = useCondominiumContext();
  const currentReferenceMonth = getCurrentReferenceMonth();

  const [data, setData] = useState<Condominium | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingRateio, setEditingRateio] = useState(false);
  const [savingRateio, setSavingRateio] = useState(false);
  const [rateioError, setRateioError] = useState<string | null>(null);
  const [editingAreas, setEditingAreas] = useState(false);
  const [savingAreas, setSavingAreas] = useState(false);
  const [areasError, setAreasError] = useState<string | null>(null);
  const [feeRuleDraft, setFeeRuleDraft] = useState<'equal' | 'proportional'>('equal');
  const [landAreaDraft, setLandAreaDraft] = useState('');
  const [reserveFundSetting, setReserveFundSetting] = useState<ReserveFundSetting | null>(null);
  const [reserveModeDraft, setReserveModeDraft] = useState<ReserveFundMode>('percent');
  const [reserveValueDraft, setReserveValueDraft] = useState('10,00');
  const [reserveActiveDraft, setReserveActiveDraft] = useState(true);
  const [financialLoading, setFinancialLoading] = useState(true);
  const [financialError, setFinancialError] = useState<string | null>(null);
  const [financialExpenses, setFinancialExpenses] = useState<FinancialExpense[]>([]);
  const [financialPreview, setFinancialPreview] = useState<ClosingPreview | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadCondominium() {
      try {
        setLoading(true);
        setError(null);
        setFinancialLoading(true);
        setFinancialError(null);

        const token = await getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
        const expenseMonthParams = new URLSearchParams({ month: currentReferenceMonth });
        const [response, unitsResponse, reserveResponse, expensesResponse, previewResponse] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/v1/condominiums/${code}`, { headers }),
          fetch(`${import.meta.env.VITE_API_URL}/api/v1/condominiums/${code}/units`, { headers }),
          fetch(`${import.meta.env.VITE_API_URL}/api/v1/condominiums/${code}/settings/reserve-fund`, { headers }),
          fetch(`${import.meta.env.VITE_API_URL}/api/v1/condominiums/${code}/expenses?${expenseMonthParams.toString()}`, { headers }),
          fetch(`${import.meta.env.VITE_API_URL}/api/v1/condominiums/${code}/closing/preview?month=${currentReferenceMonth}`, { headers }),
        ]);

        if (response.status === 404) {
          navigate('/condominiums', { replace: true });
          return;
        }

        if (!response.ok) {
          throw new Error('Falha ao carregar condomínio');
        }
        if (!reserveResponse.ok) {
          throw new Error('Falha ao carregar as configurações do fundo de reserva.');
        }

        const json = (await response.json()) as Condominium;
        const reserveJson = (await reserveResponse.json()) as ReserveFundSetting;
        let expensesJson: FinancialExpense[] = [];
        let previewJson: ClosingPreview | null = null;
        let nextFinancialError: string | null = null;

        if (expensesResponse.ok) {
          const expensePayload = (await expensesResponse.json()) as ExpenseListResponse;
          expensesJson = Array.isArray(expensePayload.data) ? expensePayload.data : [];
        } else {
          nextFinancialError = 'Não foi possível carregar o painel financeiro.';
        }

        if (previewResponse.ok) {
          previewJson = (await previewResponse.json()) as ClosingPreview;
        } else if (previewResponse.status !== 422 && previewResponse.status !== 404) {
          nextFinancialError = 'Não foi possível carregar o painel financeiro.';
        }

        let resolvedTotalUnits = json.total_units ?? null;
        if (resolvedTotalUnits == null && unitsResponse.ok) {
          const unitsJson = (await unitsResponse.json()) as UnitListResponse;
          resolvedTotalUnits = unitsJson.total ?? (Array.isArray(unitsJson.data) ? unitsJson.data.length : null);
        }

        if (mounted) {
          selectCondominium(json.code);
          setData({
            ...json,
            total_units: resolvedTotalUnits,
          });
          setFeeRuleDraft(json.fee_rule === 'proportional' ? 'proportional' : 'equal');
          setLandAreaDraft(toAreaInputValue(json.land_area));
          setReserveFundSetting(reserveJson);
          setReserveModeDraft(reserveJson.mode);
          setReserveValueDraft(toMoneyInputValue(reserveJson.value_centavos));
          setReserveActiveDraft(reserveJson.active);
          setFinancialExpenses(expensesJson);
          setFinancialPreview(previewJson);
          setFinancialError(nextFinancialError);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Erro inesperado');
          setFinancialError('Não foi possível carregar o painel financeiro.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setFinancialLoading(false);
        }
      }
    }

    void loadCondominium();

    return () => {
      mounted = false;
    };
  }, [code, currentReferenceMonth, getToken, navigate]);

  const showEqualFeeHint = data?.fee_rule === 'equal';
  const visibleFinancialExpenses = financialExpenses.filter((expense) => expense.reversal_of_id == null);
  const activeFinancialExpenses = visibleFinancialExpenses.filter((expense) => !expense.reversed);
  const reversedFinancialExpensesCount = visibleFinancialExpenses.filter((expense) => expense.reversed).length;
  const calculatedExpensesCents = activeFinancialExpenses
    .filter((expense) => expense.type === 'expense')
    .reduce((sum, expense) => sum + expense.amount_centavos, 0);
  const calculatedExtraIncomeCents = activeFinancialExpenses
    .filter((expense) => expense.type === 'extra_income')
    .reduce((sum, expense) => sum + expense.amount_centavos, 0);
  const monthlyExpensesCents = financialPreview?.total_expenses_centavos ?? calculatedExpensesCents;
  const monthlyExtraIncomeCents = financialPreview?.total_extra_income_centavos ?? calculatedExtraIncomeCents;
  const monthlyReserveFundCents = financialPreview?.reserve_fund_total_centavos ?? 0;
  const monthlyNetCents = monthlyExtraIncomeCents - monthlyExpensesCents - monthlyReserveFundCents;

  async function saveRateioSettings() {
    if (!data) {
      return;
    }

    setSavingRateio(true);
    setRateioError(null);

    try {
      const token = await getToken();
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      if (reserveFundSetting) {
        const parsedReserveValue = parseMoneyInput(reserveValueDraft);
        const nextReserveValueCentavos = Math.round(parsedReserveValue * 100);
        const reserveChanged =
          reserveModeDraft !== reserveFundSetting.mode
          || reserveActiveDraft !== reserveFundSetting.active
          || nextReserveValueCentavos !== reserveFundSetting.value_centavos;

        if (reserveChanged) {
          const reserveResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/condominiums/${data.code}/settings/reserve-fund`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
              mode: reserveModeDraft,
              value: parsedReserveValue,
              active: reserveActiveDraft,
            }),
          });

          if (!reserveResponse.ok) {
            const payload = await reserveResponse.json().catch(() => null);
            throw new Error(payload?.message || 'Falha ao atualizar o fundo de reserva.');
          }

          const reserveUpdated = (await reserveResponse.json()) as ReserveFundSetting;
          setReserveFundSetting(reserveUpdated);
          setReserveModeDraft(reserveUpdated.mode);
          setReserveValueDraft(toMoneyInputValue(reserveUpdated.value_centavos));
          setReserveActiveDraft(reserveUpdated.active);
        }
      }

      setEditingRateio(false);
    } catch (err) {
      setRateioError(err instanceof Error ? err.message : 'Erro ao salvar as configurações de rateio.');
    } finally {
      setSavingRateio(false);
    }
  }

  async function saveAreasSettings() {
    if (!data) {
      return;
    }

    setSavingAreas(true);
    setAreasError(null);

    try {
      const parsedLandArea = parseAreaInput(landAreaDraft);
      const feeRuleChanged = feeRuleDraft !== data.fee_rule;
      const landAreaChanged = parsedLandArea !== data.land_area;

      if (!feeRuleChanged && !landAreaChanged) {
        setEditingAreas(false);
        return;
      }

      const token = await getToken();
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      let updatedData = data;

      if (feeRuleChanged) {
        const feeRuleResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/condominiums/${data.code}/fee-rule`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ fee_rule: feeRuleDraft }),
        });

        if (!feeRuleResponse.ok) {
          const payload = await feeRuleResponse.json().catch(() => null);
          throw new Error(payload?.message || 'Falha ao atualizar a regra de rateio.');
        }

        updatedData = (await feeRuleResponse.json()) as Condominium;
      }

      if (landAreaChanged) {
        const landAreaResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/condominiums/${data.code}/land-area`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ land_area: parsedLandArea }),
        });

        if (!landAreaResponse.ok) {
          const payload = await landAreaResponse.json().catch(() => null);
          throw new Error(payload?.message || 'Falha ao atualizar a área do terreno.');
        }

        updatedData = (await landAreaResponse.json()) as Condominium;
      }

      setData(updatedData);
      setFeeRuleDraft(updatedData.fee_rule === 'proportional' ? 'proportional' : 'equal');
      setLandAreaDraft(toAreaInputValue(updatedData.land_area));
      setEditingAreas(false);
    } catch (err) {
      setAreasError(err instanceof Error ? err.message : 'Erro ao salvar as áreas.');
    } finally {
      setSavingAreas(false);
    }
  }

  return (
    <div id="condominium-detail-page" className="space-y-5">
      <div id="condominium-detail-header" className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div id="condominium-detail-title-block" className="space-y-3">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/condominiums">Condomínios</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {loading ? <Skeleton className="h-4 w-44" /> : <BreadcrumbPage>{data?.name}</BreadcrumbPage>}
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div id="condominium-detail-heading" className="flex flex-wrap items-center gap-3">
            {loading ? (
              <Skeleton className="h-8 w-72" />
            ) : (
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">{data?.name}</h1>
            )}

            {loading ? (
              <Skeleton className="h-6 w-28" />
            ) : (
              <Badge appearance="light" variant="info" size="md" className="gap-1.5 font-mono">
                <Lock className="size-3.5" />
                {data?.code}
              </Badge>
            )}

            {!loading && <StatusBadge status={data?.status} />}
          </div>

          {!loading && (
            <p className="text-sm text-muted-foreground">
              O código é permanente e não pode ser alterado.
            </p>
          )}
        </div>

        <div id="condominium-detail-actions" className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          <Button id="condominium-detail-units-button" asChild variant="outline" className="w-full lg:w-auto">
            <Link to={`/condominiums/${code}/units`}>Unidades</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Dados básicos</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full md:col-span-2" />
                </div>
              ) : (
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Nome" value={data?.name ?? 'Não informado'} />
                  <Field label="Telefone" value={formatPhone(data?.phone)} />
                  <Field label="E-mail" value={data?.email || 'Não informado'} />
                  <Field label="Status" value={<StatusBadge status={data?.status} />} />
                  <Field label="Cadastrado em" value={formatDateTime(data?.created_at)} />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Endereço</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Logradouro" value={data?.address.street || 'Não informado'} />
                  <Field label="Número" value={data?.address.number || 'Não informado'} />
                  <Field label="Bairro" value={data?.address.neighborhood || 'Não informado'} />
                  <Field label="CEP" value={formatZipCode(data?.address.zip_code)} />
                  <Field label="Cidade" value={data?.address.city || 'Não informado'} />
                  <Field label="Estado" value={data?.address.state || 'Não informado'} />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>CNPJs</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-[4.5rem] w-full rounded-xl" />
                  <Skeleton className="h-[4.5rem] w-full rounded-xl" />
                </div>
              ) : data?.cnpjs?.length ? (
                <div className="space-y-3">
                  {data.cnpjs.map((cnpj) => (
                    <div key={cnpj.id} className="rounded-xl border border-border p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1">
                          <div className="font-mono text-sm font-semibold text-foreground">{cnpj.cnpj}</div>
                          <div className="text-sm font-medium text-foreground">{cnpj.razao_social}</div>
                          {cnpj.descricao && (
                            <div className="text-sm text-muted-foreground">{cnpj.descricao}</div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {cnpj.principal && (
                            <Badge appearance="light" variant="info" size="sm">Principal</Badge>
                          )}
                          {!cnpj.ativo && (
                            <Badge appearance="light" variant="outline" size="sm">Inativo</Badge>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <Field label="Inicio" value={formatDate(cnpj.data_inicio)} />
                        <Field
                          label="Encerramento"
                          value={cnpj.ativo ? 'Em vigor' : formatDate(cnpj.data_fim)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm italic text-muted-foreground">Nenhum CNPJ vinculado.</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card id="condominium-detail-financial-dashboard-card">
            <CardHeader id="condominium-detail-financial-dashboard-header">
              <div id="condominium-detail-financial-dashboard-header-row" className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div id="condominium-detail-financial-dashboard-title-group" className="space-y-1">
                  <CardTitle id="condominium-detail-financial-dashboard-title">Dashboard financeiro</CardTitle>
                  <div id="condominium-detail-financial-dashboard-subtitle" className="text-sm text-muted-foreground">
                    Competência atual: {currentReferenceMonth}
                  </div>
                </div>
                <Button id="condominium-detail-financial-dashboard-expenses-button" asChild variant="outline" className="w-full sm:w-auto">
                  <Link to={`/condominiums/${code}/expenses/${currentReferenceMonth}`}>Abrir despesas</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent id="condominium-detail-financial-dashboard-content" className="space-y-4">
              {financialLoading ? (
                <div id="condominium-detail-financial-dashboard-loading" className="grid gap-3 sm:grid-cols-2">
                  <Skeleton id="condominium-detail-financial-dashboard-loading-1" className="h-20 rounded-xl" />
                  <Skeleton id="condominium-detail-financial-dashboard-loading-2" className="h-20 rounded-xl" />
                  <Skeleton id="condominium-detail-financial-dashboard-loading-3" className="h-20 rounded-xl" />
                  <Skeleton id="condominium-detail-financial-dashboard-loading-4" className="h-20 rounded-xl" />
                </div>
              ) : (
                <div id="condominium-detail-financial-dashboard-metrics" className="grid gap-3 sm:grid-cols-2">
                  <div id="condominium-detail-financial-dashboard-expenses-metric" className="rounded-xl border border-border bg-muted/30 p-4">
                    <div id="condominium-detail-financial-dashboard-expenses-label" className="text-sm text-muted-foreground">Despesas do mês</div>
                    <div id="condominium-detail-financial-dashboard-expenses-value" className="mt-2 text-xl font-semibold">{formatCurrencyFromCents(monthlyExpensesCents)}</div>
                  </div>
                  <div id="condominium-detail-financial-dashboard-income-metric" className="rounded-xl border border-border bg-muted/30 p-4">
                    <div id="condominium-detail-financial-dashboard-income-label" className="text-sm text-muted-foreground">Receitas extras</div>
                    <div id="condominium-detail-financial-dashboard-income-value" className="mt-2 text-xl font-semibold">{formatCurrencyFromCents(monthlyExtraIncomeCents)}</div>
                  </div>
                  <div id="condominium-detail-financial-dashboard-reserve-metric" className="rounded-xl border border-border bg-muted/30 p-4">
                    <div id="condominium-detail-financial-dashboard-reserve-label" className="text-sm text-muted-foreground">Fundo de reserva previsto</div>
                    <div id="condominium-detail-financial-dashboard-reserve-value" className="mt-2 text-xl font-semibold">{formatCurrencyFromCents(monthlyReserveFundCents)}</div>
                  </div>
                  <div id="condominium-detail-financial-dashboard-net-metric" className="rounded-xl border border-border bg-muted/30 p-4">
                    <div id="condominium-detail-financial-dashboard-net-label" className="text-sm text-muted-foreground">Resultado mensal</div>
                    <div id="condominium-detail-financial-dashboard-net-value" className="mt-2 text-xl font-semibold">{formatCurrencyFromCents(monthlyNetCents)}</div>
                  </div>
                  <div id="condominium-detail-financial-dashboard-launches-metric" className="rounded-xl border border-border bg-muted/30 p-4">
                    <div id="condominium-detail-financial-dashboard-launches-label" className="text-sm text-muted-foreground">Lançamentos ativos</div>
                    <div id="condominium-detail-financial-dashboard-launches-value" className="mt-2 text-xl font-semibold">{formatNumber(activeFinancialExpenses.length)}</div>
                  </div>
                  <div id="condominium-detail-financial-dashboard-reversed-metric" className="rounded-xl border border-border bg-muted/30 p-4">
                    <div id="condominium-detail-financial-dashboard-reversed-label" className="text-sm text-muted-foreground">Lançamentos estornados</div>
                    <div id="condominium-detail-financial-dashboard-reversed-value" className="mt-2 text-xl font-semibold">{formatNumber(reversedFinancialExpensesCount)}</div>
                  </div>
                </div>
              )}
              {financialError ? (
                <div id="condominium-detail-financial-dashboard-error" className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning-foreground">
                  {financialError}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <SummaryCardSkeleton />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <div className="text-sm text-muted-foreground">Total de Unidades</div>
                    <div className="mt-2 text-xl font-semibold">{formatNumber(data?.total_units)}</div>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <div className="text-sm text-muted-foreground">Moradores</div>
                    <div className="mt-2 text-xl font-semibold">{formatNumber(data?.active_residents)}</div>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <div className="text-sm text-muted-foreground">Inadimplência</div>
                    <div className="mt-2 text-xl font-semibold">{formatPercent(data?.monthly_default_rate)}</div>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <div className="text-sm text-muted-foreground">Saldo caixa</div>
                    <div className="mt-2 text-xl font-semibold">{formatCurrency(data?.cash_balance)}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card id="condominium-detail-rateio-card">
            <CardHeader>
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>Fundo de reserva</CardTitle>
                <Button
                  id="condominium-detail-edit-rateio-button"
                  variant="primary"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    if (!data) {
                      return;
                    }
                    setReserveModeDraft(reserveFundSetting?.mode ?? 'percent');
                    setReserveValueDraft(toMoneyInputValue(reserveFundSetting?.value_centavos ?? 1000));
                    setReserveActiveDraft(reserveFundSetting?.active ?? true);
                    setRateioError(null);
                    setEditingRateio((current) => !current);
                  }}
                  disabled={loading}
                >
                  <PencilLine />
                  {editingRateio ? 'Fechar edição' : 'Editar rateio'}
                </Button>
              </div>
            </CardHeader>
            <CardContent id="condominium-detail-rateio-content">
              {loading ? (
                <div id="condominium-detail-rateio-loading" className="grid gap-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <div id="condominium-detail-rateio-body" className="space-y-5">
                  {editingRateio ? (
                    <div id="condominium-detail-rateio-editor" className="space-y-5 rounded-xl border border-border bg-muted/20 p-4">
                      <div id="condominium-detail-reserve-fund-editor" className="grid gap-5 md:grid-cols-3">
                        <div id="condominium-detail-reserve-fund-mode-editor" className="space-y-1.5">
                          <div className="text-sm text-muted-foreground">Modo do fundo de reserva</div>
                          <Select value={reserveModeDraft} onValueChange={(value) => setReserveModeDraft(value as ReserveFundMode)}>
                            <SelectTrigger id="condominium-detail-reserve-fund-mode-input">
                              <SelectValue placeholder="Selecione o modo" />
                            </SelectTrigger>
                            <SelectContent id="condominium-detail-reserve-fund-mode-content">
                              <SelectItem value="percent">Percentual (%)</SelectItem>
                              <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div id="condominium-detail-reserve-fund-value-editor" className="space-y-1.5">
                          <div className="text-sm text-muted-foreground">Valor</div>
                          <Input
                            id="condominium-detail-reserve-fund-value-input"
                            value={reserveValueDraft}
                            onChange={(event) => setReserveValueDraft(event.target.value)}
                            placeholder={reserveModeDraft === 'percent' ? 'Ex: 10,00' : 'Ex: 35,00'}
                          />
                        </div>

                        <div id="condominium-detail-reserve-fund-active-editor" className="space-y-1.5">
                          <div className="text-sm text-muted-foreground">Situação</div>
                          <Select value={reserveActiveDraft ? 'active' : 'inactive'} onValueChange={(value) => setReserveActiveDraft(value === 'active')}>
                            <SelectTrigger id="condominium-detail-reserve-fund-active-input">
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                            <SelectContent id="condominium-detail-reserve-fund-active-content">
                              <SelectItem value="active">Ativo</SelectItem>
                              <SelectItem value="inactive">Inativo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div id="condominium-detail-rateio-editor-help" className="text-sm text-muted-foreground">
                        A área construída é recalculada automaticamente a partir da área privativa das unidades. O fundo de reserva será aplicado no fechamento mensal.
                      </div>

                      <div id="condominium-detail-rateio-editor-actions" className="flex flex-col gap-3 sm:flex-row">
                        <Button id="condominium-detail-rateio-save-button" variant="primary" onClick={saveRateioSettings} disabled={savingRateio}>
                          {savingRateio ? 'Salvando...' : 'Salvar rateio'}
                        </Button>
                        <Button
                          id="condominium-detail-rateio-cancel-button"
                          variant="outline"
                          onClick={() => {
                            setEditingRateio(false);
                            setRateioError(null);
                            setReserveModeDraft(reserveFundSetting?.mode ?? 'percent');
                            setReserveValueDraft(toMoneyInputValue(reserveFundSetting?.value_centavos ?? 1000));
                            setReserveActiveDraft(reserveFundSetting?.active ?? true);
                          }}
                          disabled={savingRateio}
                        >
                          Cancelar
                        </Button>
                      </div>

                      {rateioError && (
                        <div id="condominium-detail-rateio-error" className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                          {rateioError}
                        </div>
                      )}
                    </div>
                  ) : null}

                  <div id="condominium-detail-rateio-readonly" className="space-y-4">
                    <Field
                      label="Fundo de reserva"
                      value={reserveFundSetting?.active ? <Badge appearance="light" variant="success" size="sm">Ativo</Badge> : <Badge appearance="light" variant="outline" size="sm">Inativo</Badge>}
                    />
                    <Field label="Modo do fundo de reserva" value={reserveFundModeLabel(reserveFundSetting?.mode)} />
                    <Field
                      label="Valor do fundo de reserva"
                      value={
                        reserveFundSetting?.mode === 'percent'
                          ? `${toMoneyInputValue(reserveFundSetting?.value_centavos)}%`
                          : formatCurrencyFromCents(reserveFundSetting?.value_centavos)
                      }
                    />
                    <Field label="Atualizado em" value={formatDateTime(reserveFundSetting?.updated_at)} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card id="condominium-detail-areas-card">
            <CardHeader id="condominium-detail-areas-header">
              <div id="condominium-detail-areas-header-row" className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>Área e rateio</CardTitle>
                <Button
                  id="condominium-detail-edit-areas-button"
                  variant="primary"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    if (!data) {
                      return;
                    }
                    if (editingAreas) {
                      setEditingAreas(false);
                      setAreasError(null);
                      setFeeRuleDraft(data.fee_rule === 'proportional' ? 'proportional' : 'equal');
                      setLandAreaDraft(toAreaInputValue(data.land_area));
                      return;
                    }
                    setFeeRuleDraft(data.fee_rule === 'proportional' ? 'proportional' : 'equal');
                    setLandAreaDraft(toAreaInputValue(data.land_area));
                    setAreasError(null);
                    setEditingAreas(true);
                  }}
                  disabled={loading}
                >
                  <PencilLine />
                  {editingAreas ? 'Fechar edição' : 'Editar áreas'}
                </Button>
              </div>
            </CardHeader>
            <CardContent id="condominium-detail-areas-content">
              {loading ? (
                <div id="condominium-detail-areas-loading" className="grid gap-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <div id="condominium-detail-areas-body" className="space-y-4">
                  <Field label="Regra de rateio" value={<FeeRuleBadge feeRule={data?.fee_rule} />} />
                  {editingAreas ? (
                    <div id="condominium-detail-areas-editor" className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
                      <div id="condominium-detail-areas-fee-rule-editor" className="space-y-1.5">
                        <div className="text-sm text-muted-foreground">Regra de rateio</div>
                        <Select value={feeRuleDraft} onValueChange={(value) => setFeeRuleDraft(value as 'equal' | 'proportional')}>
                          <SelectTrigger id="condominium-detail-areas-fee-rule-input">
                            <SelectValue placeholder="Selecione a regra" />
                          </SelectTrigger>
                          <SelectContent id="condominium-detail-areas-fee-rule-content">
                            <SelectItem value="equal">Igualitário</SelectItem>
                            <SelectItem value="proportional">Proporcional</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div id="condominium-detail-land-area-editor" className="space-y-1.5">
                        <div className="text-sm text-muted-foreground">Área do terreno</div>
                        <Input
                          id="condominium-detail-land-area-input"
                          value={landAreaDraft}
                          onChange={(event) => setLandAreaDraft(event.target.value)}
                          placeholder="Ex: 1200,50"
                        />
                      </div>
                      <div id="condominium-detail-areas-editor-actions" className="flex flex-col gap-3 sm:flex-row">
                        <Button id="condominium-detail-areas-save-button" variant="primary" onClick={saveAreasSettings} disabled={savingAreas}>
                          {savingAreas ? 'Salvando...' : 'Salvar áreas'}
                        </Button>
                        <Button
                          id="condominium-detail-areas-cancel-button"
                          variant="outline"
                          onClick={() => {
                            setEditingAreas(false);
                            setAreasError(null);
                            setFeeRuleDraft(data?.fee_rule === 'proportional' ? 'proportional' : 'equal');
                            setLandAreaDraft(toAreaInputValue(data?.land_area));
                          }}
                          disabled={savingAreas}
                        >
                          Cancelar
                        </Button>
                      </div>
                      {areasError && (
                        <div id="condominium-detail-areas-error" className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                          {areasError}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Field label="Área do terreno" value={formatArea(data?.land_area)} />
                  )}
                  <Field
                    label={
                      <span className="inline-flex items-center gap-1.5">
                        Área construída
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              id="condominium-detail-built-area-tooltip-trigger"
                              type="button"
                              className="inline-flex items-center text-muted-foreground transition-colors hover:text-foreground"
                              aria-label="Explicação sobre área construída"
                            >
                              <CircleHelp className="size-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent id="condominium-detail-built-area-tooltip" side="top" variant="light">
                            Soma automática das áreas privativas das unidades ativas.
                          </TooltipContent>
                        </Tooltip>
                      </span>
                    }
                    value={formatBuiltArea(data?.built_area_sum)}
                  />
                  <Field
                    label="Fracao ideal"
                    value={
                      data?.fee_rule === 'equal'
                        ? 'N/A'
                        : <span className="italic text-muted-foreground">Disponível por unidade</span>
                    }
                  />

                  {showEqualFeeHint && (
                    <div id="condominium-detail-rateio-hint" className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                      Para usar rateio proporcional informe a área privativa de cada unidade. A fração ideal é calculada pela proporção entre as áreas privativas.
                    </div>
                  )}

                  <div id="condominium-detail-rateio-units-link" className="rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                    As áreas privativas são cadastradas por unidade.
                    {' '}
                    <Link className="font-medium text-primary underline underline-offset-4" to={`/condominiums/${code}/units`}>
                      Abrir unidades
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}
