import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/react-router';
import { Lock, PencilLine } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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

function Field({
  label,
  value,
  className,
}: {
  label: string;
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

  const [data, setData] = useState<Condominium | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadCondominium() {
      try {
        setLoading(true);
        setError(null);

        const token = await getToken();
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/condominiums/${code}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (response.status === 404) {
          navigate('/condominiums', { replace: true });
          return;
        }

        if (!response.ok) {
          throw new Error('Falha ao carregar condomínio');
        }

        const json = (await response.json()) as Condominium;
        if (mounted) {
          selectCondominium(json.code);
          setData(json);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Erro inesperado');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadCondominium();

    return () => {
      mounted = false;
    };
  }, [code, getToken, navigate]);

  const showEqualFeeHint = data?.fee_rule === 'equal';

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
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

          <div className="flex flex-wrap items-center gap-3">
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

        <Button variant="primary" className="w-full lg:w-auto" disabled>
          <PencilLine />
          Editar
        </Button>
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
                    <div className="text-sm text-muted-foreground">Unidades</div>
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

          <Card>
            <CardHeader>
              <CardTitle>Rateio e áreas</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="grid gap-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <div className="space-y-5">
                  <Field label="Regra de rateio" value={<FeeRuleBadge feeRule={data?.fee_rule} />} />
                  <Field label="Área do terreno" value={formatArea(data?.land_area)} />
                  <Field label="Área construída" value={formatBuiltArea(data?.built_area_sum)} />
                  <Field
                    label="Fracao ideal"
                    value={
                      data?.fee_rule === 'equal'
                        ? 'N/A'
                        : <span className="italic text-muted-foreground">Disponível por unidade</span>
                    }
                  />

                  {showEqualFeeHint && (
                    <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                      Para usar rateio proporcional informe a área do terreno e a área privativa de cada unidade.
                    </div>
                  )}
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
