import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@clerk/react-router';
import { KTDataTable } from '@keenthemes/ktui';
import { CheckCheck, Eye, FolderOpen, Plus, Search } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { isValidExpenseMonth, readClosedExpenseMonths, readExpenseMonths, upsertClosedExpenseMonth, upsertExpenseMonth } from '../month-store';

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(month: string) {
  const [year, monthNumber] = month.split('-').map(Number);
  const date = new Date(year, (monthNumber || 1) - 1, 1);
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date);
}

export function CondominiumExpenseMonthsPage() {
  const { code = '' } = useParams();
  const { getToken } = useAuth();
  const [months, setMonths] = useState<string[]>([]);
  const [closedMonths, setClosedMonths] = useState<string[]>([]);
  const [monthDraft, setMonthDraft] = useState(currentMonth());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [closingMonth, setClosingMonth] = useState<string | null>(null);
  const datatableRef = useRef<KTDataTable | null>(null);

  const openMonths = useMemo(
    () => months.filter((month) => !closedMonths.includes(month)).length,
    [closedMonths, months],
  );

  useEffect(() => {
    setMonths(readExpenseMonths(code));
    setClosedMonths(readClosedExpenseMonths(code));
  }, [code]);

  useEffect(() => {
    let cancelled = false;
    let instance: KTDataTable | null = null;
    let frameId = 0;

    frameId = window.requestAnimationFrame(() => {
      if (cancelled) return;
      const element = document.getElementById('condominium-expense-months-kt-datatable');
      if (!element) return;

      const existingInstance = KTDataTable.getInstance(element);
      if (existingInstance) {
        existingInstance.update();
        datatableRef.current = existingInstance;
        return;
      }

      instance = new KTDataTable(element, {
        pageSize: 10,
        stateSave: true,
        info: '{start} - {end} de {total}',
        infoEmpty: 'Nenhuma competência criada ainda.',
      });
      datatableRef.current = instance;
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
      try {
        if (instance && datatableRef.current === instance) {
          datatableRef.current.dispose();
        }
      } catch {
        // Ignore KTUI teardown issues during route transitions.
      } finally {
        if (datatableRef.current === instance) {
          datatableRef.current = null;
        }
      }
    };
  }, [closedMonths, months]);

  function onCreateMonth() {
    setError(null);
    setSuccess(null);
    if (!isValidExpenseMonth(monthDraft)) {
      setError('Informe uma competência válida no formato AAAA-MM.');
      return;
    }

    const next = upsertExpenseMonth(code, monthDraft);
    setMonths(next);
    setSuccess(`Competência ${monthDraft} criada com sucesso.`);
  }

  async function onCloseBalancete(month: string) {
    setClosingMonth(month);
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
        body: JSON.stringify({ reference_month: month }),
      });

      if (response.ok) {
        const nextClosed = upsertClosedExpenseMonth(code, month);
        setClosedMonths(nextClosed);
        setSuccess(`Balancete da competência ${month} fechado com sucesso.`);
        return;
      }

      const payload = await response.json().catch(() => null) as { error?: string; message?: string } | null;
      if (response.status === 409 && payload?.error === 'closing_already_closed') {
        const nextClosed = upsertClosedExpenseMonth(code, month);
        setClosedMonths(nextClosed);
        setSuccess(`A competência ${month} já estava fechada.`);
        return;
      }

      throw new Error(payload?.message || 'Falha ao fechar balancete.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fechar balancete.');
    } finally {
      setClosingMonth(null);
    }
  }

  return (
    <div id="condominium-expense-months-page" className="space-y-5">
      <div id="condominium-expense-months-header" className="space-y-3">
        <Breadcrumb id="condominium-expense-months-breadcrumb">
          <BreadcrumbList id="condominium-expense-months-breadcrumb-list">
            <BreadcrumbItem id="condominium-expense-months-breadcrumb-condominiums">
              <BreadcrumbLink asChild>
                <Link to="/condominiums">Condomínios</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator id="condominium-expense-months-breadcrumb-separator-1" />
            <BreadcrumbItem id="condominium-expense-months-breadcrumb-condominium">
              <BreadcrumbLink asChild>
                <Link to={`/condominiums/${code}`}>{code}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator id="condominium-expense-months-breadcrumb-separator-2" />
            <BreadcrumbItem id="condominium-expense-months-breadcrumb-page">
              <BreadcrumbPage>Lançar despesa</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div id="condominium-expense-months-header-actions" className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div id="condominium-expense-months-header-text" className="space-y-1">
            <h1 id="condominium-expense-months-title" className="text-2xl font-semibold tracking-tight">Lançamentos por mês</h1>
            <p id="condominium-expense-months-description" className="text-sm text-muted-foreground">
              Consulte competências já criadas, acesse a prévia e faça o fechamento de balancete.
            </p>
          </div>
          <div id="condominium-expense-months-header-buttons" className="flex gap-2">
            <Button id="condominium-expense-months-back-button" asChild variant="outline">
              <Link to={`/condominiums/${code}`}>Voltar ao condomínio</Link>
            </Button>
          </div>
        </div>
      </div>

      <div id="condominium-expense-months-board" className="overflow-hidden rounded-2xl border border-border bg-background text-foreground shadow-sm">
        <div id="condominium-expense-months-board-header" className="space-y-6 px-5 py-5 md:px-6">
          <div id="condominium-expense-months-list-summary" className="text-sm text-muted-foreground">
            Total de competências: <span className="font-semibold text-foreground">{months.length}</span>
            {'  '}
            Abertas: <span className="font-semibold text-foreground">{openMonths}</span>
            {'  '}
            Fechadas: <span className="font-semibold text-foreground">{closedMonths.length}</span>
          </div>

          <div id="condominium-expense-months-list-toolbar" className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div id="condominium-expense-months-search-wrapper" className="relative min-w-0 lg:min-w-72">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="condominium-expense-months-search-input"
                type="text"
                placeholder="Buscar competências..."
                className="h-10 border-border bg-background ps-9 text-foreground placeholder:text-muted-foreground"
                data-kt-datatable-search="#condominium-expense-months-kt-datatable"
              />
            </div>

            <div id="condominium-expense-months-toolbar-actions" className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div id="condominium-expense-months-create-input-group" className="space-y-1">
                <label id="condominium-expense-months-create-input-label" htmlFor="condominium-expense-months-create-input" className="text-xs text-muted-foreground">
                  Nova competência
                </label>
                <Input
                  id="condominium-expense-months-create-input"
                  type="month"
                  value={monthDraft}
                  onChange={(event) => setMonthDraft(event.target.value)}
                  className="h-10 sm:w-44"
                />
              </div>
              <Button id="condominium-expense-months-create-button" variant="outline" onClick={onCreateMonth}>
                <Plus className="size-4" />
                Criar mês
              </Button>
            </div>
          </div>
        </div>

        {months.length === 0 ? (
          <div id="condominium-expense-months-empty" className="border-t border-border px-5 py-6 text-sm text-muted-foreground md:px-6">
            Nenhuma competência criada ainda.
          </div>
        ) : (
          <div
            id="condominium-expense-months-kt-datatable"
            className="kt-card-table border-t border-border"
            data-kt-datatable="true"
            data-kt-datatable-page-size="10"
            data-kt-datatable-state-save="true"
          >
            <div id="condominium-expense-months-table-wrapper" className="kt-table-wrapper kt-scrollable">
              <table id="condominium-expense-months-table" className="kt-table min-w-full" data-kt-datatable-table="true">
                <thead id="condominium-expense-months-table-head" className="bg-muted/40">
                  <tr id="condominium-expense-months-table-head-row">
                    <th id="condominium-expense-months-col-month" scope="col" className="min-w-56 border-border text-muted-foreground" data-kt-datatable-column="month">
                      <span className="kt-table-col"><span className="kt-table-col-label">Competência</span><span className="kt-table-col-sort"></span></span>
                    </th>
                    <th id="condominium-expense-months-col-reference" scope="col" className="w-52 border-border text-muted-foreground" data-kt-datatable-column="label">
                      <span className="kt-table-col"><span className="kt-table-col-label">Referência</span><span className="kt-table-col-sort"></span></span>
                    </th>
                    <th id="condominium-expense-months-col-status" scope="col" className="w-40 border-border text-muted-foreground" data-kt-datatable-column="status">
                      <span className="kt-table-col"><span className="kt-table-col-label">Balancete</span><span className="kt-table-col-sort"></span></span>
                    </th>
                    <th id="condominium-expense-months-col-actions" scope="col" className="w-48 border-border text-muted-foreground" data-kt-datatable-column="actions">
                      <span className="kt-table-col"><span className="kt-table-col-label">Ações</span></span>
                    </th>
                  </tr>
                </thead>
                <tbody id="condominium-expense-months-table-body">
                  {months.map((month) => {
                    const closed = closedMonths.includes(month);
                    return (
                      <tr id={`condominium-expense-month-row-${month}`} key={month}>
                        <td id={`condominium-expense-month-cell-month-${month}`} className="border-border bg-background">
                          <div id={`condominium-expense-month-cell-month-content-${month}`} className="font-medium text-foreground">{month}</div>
                        </td>
                        <td id={`condominium-expense-month-cell-label-${month}`} className="border-border bg-background text-sm capitalize text-foreground">
                          {formatMonthLabel(month)}
                        </td>
                        <td id={`condominium-expense-month-cell-status-${month}`} className="border-border bg-background">
                          <span
                            id={`condominium-expense-month-status-badge-${month}`}
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                              closed
                                ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-400'
                                : 'border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/80 dark:text-amber-400'
                            }`}
                          >
                            {closed ? 'Fechado' : 'Aberto'}
                          </span>
                        </td>
                        <td id={`condominium-expense-month-cell-actions-${month}`} className="border-border bg-background text-end">
                          <div id={`condominium-expense-month-actions-${month}`} className="inline-flex flex-wrap justify-end gap-2">
                            <Link
                              id={`condominium-expense-month-open-button-${month}`}
                              to={`/condominiums/${code}/expenses/${month}`}
                              className="kt-btn kt-btn-sm kt-btn-icon kt-btn-outline"
                              aria-label="Abrir lançamentos"
                              data-kt-tooltip={`#condominium-expense-month-open-tooltip-${month}`}
                              data-kt-tooltip-placement="bottom-start"
                            >
                              <FolderOpen id={`condominium-expense-month-open-icon-${month}`} className="size-4" />
                            </Link>
                            <div id={`condominium-expense-month-open-tooltip-${month}`} className="kt-tooltip">
                              Abrir lançamentos
                            </div>

                            <Link
                              id={`condominium-expense-month-preview-button-${month}`}
                              to={`/condominiums/${code}/expenses/${month}?preview=1`}
                              className="kt-btn kt-btn-sm kt-btn-icon kt-btn-outline"
                              aria-label="Ver prévia"
                              data-kt-tooltip={`#condominium-expense-month-preview-tooltip-${month}`}
                              data-kt-tooltip-placement="bottom-start"
                            >
                              <Eye id={`condominium-expense-month-preview-icon-${month}`} className="size-4" />
                            </Link>
                            <div id={`condominium-expense-month-preview-tooltip-${month}`} className="kt-tooltip">
                              Ver prévia
                            </div>

                            <button
                              id={`condominium-expense-month-close-button-${month}`}
                              type="button"
                              className={`kt-btn kt-btn-sm kt-btn-icon ${closed ? 'kt-btn-outline' : 'kt-btn-primary'}`}
                              onClick={() => void onCloseBalancete(month)}
                              disabled={closingMonth === month || closed}
                              aria-label={closed ? 'Balancete fechado' : 'Fechar balancete'}
                              data-kt-tooltip={`#condominium-expense-month-close-tooltip-${month}`}
                              data-kt-tooltip-placement="bottom-start"
                            >
                              <CheckCheck id={`condominium-expense-month-close-icon-${month}`} className="size-4" />
                            </button>
                            <div id={`condominium-expense-month-close-tooltip-${month}`} className="kt-tooltip">
                              {closingMonth === month ? 'Fechando...' : closed ? 'Balancete fechado' : 'Fechar balancete'}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div id="condominium-expense-months-kt-datatable-footer" className="kt-datatable-toolbar border-t border-border bg-background">
              <div id="condominium-expense-months-kt-datatable-length" className="kt-datatable-length">
                Mostrar
                <select id="condominium-expense-months-kt-datatable-size" className="kt-select kt-select-sm w-16" name="perpage" data-kt-datatable-size="true" />
                por pagina
              </div>
              <div id="condominium-expense-months-kt-datatable-info-wrapper" className="kt-datatable-info">
                <span id="condominium-expense-months-kt-datatable-info" data-kt-datatable-info="true" />
                <div id="condominium-expense-months-kt-datatable-pagination" className="kt-datatable-pagination" data-kt-datatable-pagination="true" />
              </div>
            </div>
          </div>
        )}
      </div>

      {error ? (
        <div id="condominium-expense-months-error" className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      {success ? (
        <div id="condominium-expense-months-success" className="rounded-lg border border-success/20 bg-success/5 px-4 py-3 text-sm text-success">
          {success}
        </div>
      ) : null}
      {months.length > 0 && datatableRef.current == null ? (
        <div id="condominium-expense-months-datatable-initializing" className="sr-only">
          <Skeleton className="h-0 w-0" />
        </div>
      ) : null}
    </div>
  );
}
