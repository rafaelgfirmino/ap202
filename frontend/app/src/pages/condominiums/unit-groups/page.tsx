import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@clerk/react-router';
import { KTDataTable } from '@keenthemes/ktui';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Pencil, Search, Trash2 } from 'lucide-react';

type Unit = {
  id: number;
  group_type?: string;
  group_name?: string;
};

type UnitListResponse = {
  data: Unit[] | null;
  total: number;
};

type UnitGroupType = 'block' | 'tower' | 'sector' | 'court' | 'phase';

type UnitGroup = {
  id: number;
  condominium_id: number;
  group_type: UnitGroupType;
  name: string;
  floors?: number | null;
  active: boolean;
};

type UnitGroupListResponse = {
  data: UnitGroup[] | null;
  total: number;
};

type UnitGroupRow = UnitGroup & {
  units_total: number;
  floors_label: string;
  units_label: string;
  initials: string;
  accent_class: string;
};

const unitGroupTypeOptions: Array<{ value: UnitGroupType; label: string }> = [
  { value: 'block', label: 'Bloco' },
  { value: 'tower', label: 'Torre' },
  { value: 'sector', label: 'Setor' },
  { value: 'court', label: 'Quadra' },
  { value: 'phase', label: 'Fase' },
];

function getUnitGroupTypeLabel(value?: string) {
  return unitGroupTypeOptions.find((option) => option.value === value)?.label ?? value ?? '';
}

function getGroupInitials(groupType: string, name: string) {
  return `${getUnitGroupTypeLabel(groupType).charAt(0)}${name.charAt(0)}`.toUpperCase();
}

function getAccentClass(groupType: string) {
  switch (groupType) {
    case 'block':
      return 'bg-primary/10 text-primary';
    case 'tower':
      return 'bg-success/10 text-success';
    case 'sector':
      return 'bg-warning/10 text-warning';
    case 'court':
      return 'bg-destructive/10 text-destructive';
    case 'phase':
      return 'bg-mono/10 text-mono';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export function CondominiumUnitGroupsPage() {
  const { code = '' } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<UnitGroup[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [typeFilter, setTypeFilter] = useState<'all' | UnitGroupType>('all');
  const [sortOrder, setSortOrder] = useState<'name_asc' | 'name_desc' | 'units_desc'>('name_asc');
  const [deletingGroupId, setDeletingGroupId] = useState<number | null>(null);
  const datatableRef = useRef<KTDataTable | null>(null);

  useEffect(() => {
    async function loadData() {
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

        if (!groupsResponse.ok) {
          const payload = await groupsResponse.json().catch(() => null);
          throw new Error(payload?.message || 'Falha ao carregar grupos de unidades.');
        }

        if (!unitsResponse.ok) {
          const payload = await unitsResponse.json().catch(() => null);
          throw new Error(payload?.message || 'Falha ao carregar unidades.');
        }

        const groupsJson = (await groupsResponse.json()) as UnitGroupListResponse;
        const unitsJson = (await unitsResponse.json()) as UnitListResponse;
        setGroups(Array.isArray(groupsJson.data) ? groupsJson.data : []);
        setUnits(Array.isArray(unitsJson.data) ? unitsJson.data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar grupos de unidades.');
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [code, getToken, navigate]);

  const groupsWithTotals = useMemo<UnitGroupRow[]>(
    () =>
      groups.map((group) => {
        const unitsTotal = units.filter((unit) => unit.group_type === group.group_type && unit.group_name === group.name).length;

        return {
          ...group,
          units_total: unitsTotal,
          floors_label: group.floors != null ? `${group.floors} ${group.floors === 1 ? 'andar' : 'andares'}` : 'Nao informado',
          units_label: `${unitsTotal} ${unitsTotal === 1 ? 'unidade' : 'unidades'}`,
          initials: getGroupInitials(group.group_type, group.name),
          accent_class: getAccentClass(group.group_type),
        };
      }),
    [groups, units],
  );

  const filteredGroups = useMemo(() => {
    const next = typeFilter === 'all' ? [...groupsWithTotals] : groupsWithTotals.filter((group) => group.group_type === typeFilter);

    next.sort((a, b) => {
      if (sortOrder === 'name_desc') {
        return `${b.group_type}-${b.name}`.localeCompare(`${a.group_type}-${a.name}`);
      }
      if (sortOrder === 'units_desc') {
        return b.units_total - a.units_total || `${a.group_type}-${a.name}`.localeCompare(`${b.group_type}-${b.name}`);
      }
      return `${a.group_type}-${a.name}`.localeCompare(`${b.group_type}-${b.name}`);
    });

    return next;
  }, [groupsWithTotals, sortOrder, typeFilter]);

  const totalUnitsLinked = useMemo(
    () => groupsWithTotals.reduce((sum, group) => sum + group.units_total, 0),
    [groupsWithTotals],
  );

  useEffect(() => {
    if (loading) {
      return;
    }

    let cancelled = false;
    let instance: KTDataTable | null = null;
    let frameId = 0;

    frameId = window.requestAnimationFrame(() => {
      if (cancelled) {
        return;
      }

      const element = document.getElementById('condominium-unit-groups-kt-datatable');
      if (!element) {
        return;
      }

      const existingInstance = KTDataTable.getInstance(element);
      if (existingInstance) {
        datatableRef.current = existingInstance;
        return;
      }

      instance = new KTDataTable(element, {
        pageSize: 10,
        stateSave: true,
        info: '{start} - {end} de {total}',
        infoEmpty: 'Nenhum grupo cadastrado ainda.',
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
        // Ignore KTUI teardown errors during route transitions.
      } finally {
        if (datatableRef.current === instance) {
          datatableRef.current = null;
        }
      }
    };
  }, [code, loading]);

  async function onDeleteGroup(groupId: number) {
    const confirmed = window.confirm('Deseja realmente excluir este grupo?');
    if (!confirmed) {
      return;
    }

    try {
      setDeletingGroupId(groupId);
      setError(null);

      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/condominiums/${code}/unit-groups/${groupId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || 'Falha ao excluir grupo.');
      }

      setGroups((current) => current.filter((group) => group.id !== groupId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir grupo.');
    } finally {
      setDeletingGroupId(null);
    }
  }

  return (
    <div id="condominium-unit-groups-page" className="space-y-5">
      <div id="condominium-unit-groups-header" className="space-y-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/condominiums">Condominios</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={`/condominiums/${code}`}>{code}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Cadastro de grupos</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div id="condominium-unit-groups-header-actions" className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <h1 id="condominium-unit-groups-title" className="text-2xl font-semibold tracking-tight">Cadastro de grupos</h1>
            <p id="condominium-unit-groups-description" className="text-sm text-muted-foreground">
              Consulte os grupos cadastrados, veja quantas unidades existem em cada um e entre direto na lista filtrada.
            </p>
          </div>
          <div id="condominium-unit-groups-header-buttons" className="flex flex-col gap-2 sm:flex-row">
            <Button id="condominium-unit-groups-create-button" asChild variant="primary">
              <Link to={`/condominiums/${code}/unit-groups/create`}>Cadastrar grupo</Link>
            </Button>
            <Button id="condominium-unit-groups-back-button" asChild variant="outline">
              <Link to={`/condominiums/${code}`}>Voltar ao condominio</Link>
            </Button>
          </div>
        </div>
      </div>

      <div id="condominium-unit-groups-board" className="overflow-hidden rounded-2xl border border-border bg-background text-foreground shadow-sm">
        <div id="condominium-unit-groups-board-header" className="space-y-6 px-5 py-5 md:px-6">
          <div id="condominium-unit-groups-list-count" className="text-sm text-muted-foreground">
            Total de grupos: <span className="font-semibold text-foreground">{groupsWithTotals.length}</span>
            {'  '}
            Unidades vinculadas: <span className="font-semibold text-foreground">{totalUnitsLinked}</span>
          </div>

          <div id="condominium-unit-groups-list-actions" className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div id="condominium-unit-groups-filters" className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div id="condominium-unit-groups-search-wrapper" className="relative min-w-0 lg:min-w-72">
                <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="condominium-unit-groups-search-input"
                  type="text"
                  placeholder="Buscar grupos..."
                  className="h-10 border-border bg-background ps-9 text-foreground placeholder:text-muted-foreground"
                  data-kt-datatable-search="#condominium-unit-groups-kt-datatable"
                />
              </div>

              <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as 'all' | UnitGroupType)}>
                <SelectTrigger id="condominium-unit-groups-type-filter" className="h-10 min-w-40 border-border bg-background text-foreground">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {unitGroupTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as 'name_asc' | 'name_desc' | 'units_desc')}>
                <SelectTrigger id="condominium-unit-groups-sort-order" className="h-10 min-w-44 border-border bg-background text-foreground">
                  <SelectValue placeholder="Ordenacao" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name_asc">Nome A-Z</SelectItem>
                  <SelectItem value="name_desc">Nome Z-A</SelectItem>
                  <SelectItem value="units_desc">Mais unidades</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button id="condominium-unit-groups-units-button" asChild variant="outline">
              <Link to={`/condominiums/${code}/units`}>Ver unidades</Link>
            </Button>
          </div>
        </div>

        {loading ? (
          <div id="condominium-unit-groups-loading" className="space-y-3 px-5 pb-5 md:px-6">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        ) : (
          <div
            id="condominium-unit-groups-kt-datatable"
            className="kt-card-table border-t border-border"
            data-kt-datatable="true"
            data-kt-datatable-page-size="10"
            data-kt-datatable-state-save="true"
          >
            <div className="kt-table-wrapper kt-scrollable">
              <table id="condominium-unit-groups-table" className="kt-table min-w-full" data-kt-datatable-table="true">
                <thead className="bg-muted/40">
                  <tr>
                    <th scope="col" className="min-w-72 border-border text-muted-foreground" data-kt-datatable-column="group">
                      <span className="kt-table-col">
                        <span className="kt-table-col-label">Grupo</span>
                        <span className="kt-table-col-sort"></span>
                      </span>
                    </th>
                    <th scope="col" className="w-40 border-border text-muted-foreground" data-kt-datatable-column="type">
                      <span className="kt-table-col">
                        <span className="kt-table-col-label">Tipo</span>
                        <span className="kt-table-col-sort"></span>
                      </span>
                    </th>
                    <th scope="col" className="w-40 border-border text-muted-foreground" data-kt-datatable-column="floors">
                      <span className="kt-table-col">
                        <span className="kt-table-col-label">Andares</span>
                        <span className="kt-table-col-sort"></span>
                      </span>
                    </th>
                    <th scope="col" className="w-40 border-border text-muted-foreground" data-kt-datatable-column="units">
                      <span className="kt-table-col">
                        <span className="kt-table-col-label">Unidades</span>
                        <span className="kt-table-col-sort"></span>
                      </span>
                    </th>
                    <th scope="col" className="w-32 border-border text-muted-foreground" data-kt-datatable-column="status">
                      <span className="kt-table-col">
                        <span className="kt-table-col-label">Status</span>
                        <span className="kt-table-col-sort"></span>
                      </span>
                    </th>
                    <th scope="col" className="w-40 border-border text-muted-foreground" data-kt-datatable-column="activity">
                      <span className="kt-table-col">
                        <span className="kt-table-col-label">Atualizacao</span>
                        <span className="kt-table-col-sort"></span>
                      </span>
                    </th>
                    <th scope="col" className="w-56 border-border text-muted-foreground" data-kt-datatable-column="actions">
                      <span className="kt-table-col">
                        <span className="kt-table-col-label">Acoes</span>
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGroups.map((group) => (
                    <tr key={group.id} id={`condominium-unit-group-row-${group.id}`}>
                      <td className="border-border bg-background">
                        <div id={`condominium-unit-group-table-label-${group.id}`} className="flex items-center gap-3">
                          <div
                            id={`condominium-unit-group-avatar-${group.id}`}
                            className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ring-1 ring-inset ring-border ${group.accent_class}`}
                          >
                            {group.initials}
                          </div>
                          <div className="space-y-1">
                            <div className="font-medium text-foreground">
                              {getUnitGroupTypeLabel(group.group_type)} {group.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {group.floors != null
                                ? `${group.floors_label} cadastrados para este grupo.`
                                : 'Sem quantidade de andares informada.'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="border-border bg-background">
                        <div id={`condominium-unit-group-table-type-${group.id}`} className="text-sm text-foreground">
                          {getUnitGroupTypeLabel(group.group_type)}
                        </div>
                      </td>
                      <td className="border-border bg-background">
                        <div id={`condominium-unit-group-table-floors-${group.id}`} className="text-sm text-foreground">
                          {group.floors_label}
                        </div>
                      </td>
                      <td className="border-border bg-background">
                        <div id={`condominium-unit-group-table-units-${group.id}`} className="text-sm font-medium text-foreground">
                          {group.units_label}
                        </div>
                      </td>
                      <td className="border-border bg-background">
                        <span
                          id={`condominium-unit-group-status-${group.id}`}
                          className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-400"
                        >
                          Ativo
                        </span>
                      </td>
                      <td className="border-border bg-background">
                        <div id={`condominium-unit-group-activity-${group.id}`} className="text-sm text-muted-foreground">
                          {group.units_total > 0 ? 'Com unidades' : 'Novo grupo'}
                        </div>
                      </td>
                      <td className="border-border bg-background text-end">
                        <div id={`condominium-unit-group-actions-${group.id}`} className="flex items-center justify-end gap-2">
                          <Link
                            id={`condominium-unit-group-edit-link-${group.id}`}
                            to={`/condominiums/${code}/unit-groups/${group.id}/edit`}
                            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
                          >
                            <Pencil className="size-4" />
                            Editar
                          </Link>
                          {group.units_total === 0 ? (
                            <button
                              id={`condominium-unit-group-delete-button-${group.id}`}
                              type="button"
                              onClick={() => void onDeleteGroup(group.id)}
                              disabled={deletingGroupId === group.id}
                              className="inline-flex h-9 items-center gap-2 rounded-lg border border-destructive/20 px-3 text-sm text-destructive transition hover:bg-destructive/5 disabled:opacity-60"
                            >
                              <Trash2 className="size-4" />
                              {deletingGroupId === group.id ? 'Excluindo...' : 'Excluir'}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div id="condominium-unit-groups-kt-datatable-footer" className="flex flex-col gap-3 border-t border-border bg-background px-4 py-3 md:flex-row md:items-center md:justify-between">
              <div
                id="condominium-unit-groups-kt-datatable-info"
                data-kt-datatable-info="true"
                className="text-sm text-muted-foreground"
              />
              <div id="condominium-unit-groups-kt-datatable-controls" className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <select
                  id="condominium-unit-groups-kt-datatable-size"
                  data-kt-datatable-size="true"
                  className="kt-select min-w-24 border-border bg-background text-foreground"
                />
                <div
                  id="condominium-unit-groups-kt-datatable-pagination"
                  data-kt-datatable-pagination="true"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {error ? (
        <div id="condominium-unit-groups-error" className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}
    </div>
  );
}
