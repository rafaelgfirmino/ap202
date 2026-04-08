import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@clerk/react-router';
import { KTDataTable } from '@keenthemes/ktui';
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
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';

type Unit = {
  id: number;
  code: string;
  identifier: string;
  group_type?: string;
  group_name?: string;
  floor?: string;
  description?: string;
  private_area?: number | null;
  ideal_fraction?: number | null;
  active: boolean;
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

function formatArea(value?: number | null) {
  if (value == null) {
    return <span className="italic text-muted-foreground">Nao informada</span>;
  }

  return `${new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)} m²`;
}

function formatFraction(value?: number | null) {
  if (value == null) {
    return <span className="italic text-muted-foreground">Nao calculada</span>;
  }

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8,
  }).format(value);
}

function parseOptionalArea(value: string) {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  if (Number.isNaN(parsed) || parsed < 0) {
    throw new Error('Informe uma area privativa valida maior ou igual a zero.');
  }

  return parsed;
}

export function CondominiumUnitsPage() {
  const { code = '' } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUnitId, setEditingUnitId] = useState<number | null>(null);
  const [editingArea, setEditingArea] = useState('');
  const [savingAreaId, setSavingAreaId] = useState<number | null>(null);
  const [deletingUnitId, setDeletingUnitId] = useState<number | null>(null);
  const [unitPendingDelete, setUnitPendingDelete] = useState<Unit | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [groups, setGroups] = useState<UnitGroup[]>([]);
  const datatableRef = useRef<KTDataTable | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const token = await getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
        const [unitsResponse, groupsResponse] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/v1/condominiums/${code}/units`, { headers }),
          fetch(`${import.meta.env.VITE_API_URL}/api/v1/condominiums/${code}/unit-groups`, { headers }),
        ]);

        if (unitsResponse.status === 404 || groupsResponse.status === 404) {
          navigate('/condominiums', { replace: true });
          return;
        }

        if (!unitsResponse.ok) {
          const payload = await unitsResponse.json().catch(() => null);
          throw new Error(payload?.message || 'Falha ao carregar unidades.');
        }

        if (!groupsResponse.ok) {
          const payload = await groupsResponse.json().catch(() => null);
          throw new Error(payload?.message || 'Falha ao carregar grupos de unidades.');
        }

        const unitsJson = (await unitsResponse.json()) as UnitListResponse;
        const groupsJson = (await groupsResponse.json()) as UnitGroupListResponse;
        setUnits(Array.isArray(unitsJson.data) ? unitsJson.data : []);
        setGroups(Array.isArray(groupsJson.data) ? groupsJson.data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar unidades.');
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [code, getToken, navigate]);

  const selectedGroupType = searchParams.get('groupType') ?? '';
  const selectedGroupName = searchParams.get('groupName') ?? '';

  const filteredUnits = useMemo(() => {
    return units.filter((unit) => {
      const matchesGroup = !selectedGroupType || !selectedGroupName
        ? true
        : unit.group_type === selectedGroupType && unit.group_name === selectedGroupName;

      return matchesGroup;
    });
  }, [selectedGroupName, selectedGroupType, units]);

  const selectedGroup = groups.find((group) => group.group_type === selectedGroupType && group.name === selectedGroupName);

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

      const element = document.getElementById('condominium-units-kt-datatable');
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
        infoEmpty: 'Nenhuma unidade cadastrada ainda.',
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

  async function savePrivateArea(unitId: number) {
    setSavingAreaId(unitId);
    setError(null);

    try {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/condominiums/${code}/units/${unitId}/private-area`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          private_area: parseOptionalArea(editingArea),
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || 'Falha ao atualizar a area privativa.');
      }

      const updated = (await response.json()) as Unit;
      setUnits((current) => current.map((item) => (item.id === unitId ? updated : item)));
      setEditingUnitId(null);
      setEditingArea('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar a area privativa.');
    } finally {
      setSavingAreaId(null);
    }
  }

  async function onDeleteUnit(unitId: number) {
    setDeletingUnitId(unitId);
    setError(null);

    try {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/condominiums/${code}/units/${unitId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || 'Falha ao excluir unidade.');
      }

      setUnits((current) => current.filter((unit) => unit.id !== unitId));
      if (editingUnitId === unitId) {
        setEditingUnitId(null);
        setEditingArea('');
      }
      if (unitPendingDelete?.id === unitId) {
        setUnitPendingDelete(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir unidade.');
    } finally {
      setDeletingUnitId(null);
    }
  }

  return (
    <div id="condominium-units-page" className="space-y-5">
      <div id="condominium-units-header" className="space-y-3">
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
              <BreadcrumbPage>Unidades</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div id="condominium-units-header-actions" className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <h1 id="condominium-units-title" className="text-2xl font-semibold tracking-tight">Unidades</h1>
            <p id="condominium-units-description" className="text-sm text-muted-foreground">
              Consulte as unidades cadastradas, filtre por grupo e entre na tela de cadastro quando precisar adicionar uma nova.
            </p>
            {selectedGroupType && selectedGroupName ? (
              <div id="condominium-units-active-filter" className="text-sm text-muted-foreground">
                Filtro ativo: {getUnitGroupTypeLabel(selectedGroupType)} {selectedGroupName}
              </div>
            ) : null}
          </div>
          <div id="condominium-units-header-buttons" className="flex flex-col gap-2 sm:flex-row">
            <Button id="condominium-units-groups-button" asChild variant="outline">
              <Link to={`/condominiums/${code}/unit-groups`}>Cadastro de grupos</Link>
            </Button>
            <Button id="condominium-units-back-button" asChild variant="outline">
              <Link to={`/condominiums/${code}`}>Voltar ao condominio</Link>
            </Button>
          </div>
        </div>
      </div>

      <div id="condominium-units-board" className="overflow-hidden rounded-2xl border border-border bg-background text-foreground shadow-sm">
        <div id="condominium-units-board-header" className="space-y-6 px-5 py-5 md:px-6">
          <div id="condominium-units-list-summary" className="text-sm text-muted-foreground">
            Total de unidades: <span className="font-semibold text-foreground">{units.length}</span>
            {selectedGroup ? (
              <>
                {'  '}
                Grupo selecionado: <span className="font-semibold text-foreground">{getUnitGroupTypeLabel(selectedGroup.group_type)} {selectedGroup.name}</span>
              </>
            ) : null}
          </div>

          <div id="condominium-units-list-toolbar" className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div id="condominium-units-search-wrapper" className="relative min-w-0 lg:min-w-72">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="condominium-units-search-input"
                type="text"
                placeholder="Buscar unidades..."
                className="h-10 border-border bg-background ps-9 text-foreground placeholder:text-muted-foreground"
                data-kt-datatable-search="#condominium-units-kt-datatable"
              />
            </div>

            <div id="condominium-units-toolbar-actions" className="flex flex-col gap-2 sm:flex-row">
              {selectedGroupType && selectedGroupName ? (
                <Button
                  id="condominium-units-clear-filter-button"
                  variant="outline"
                  onClick={() => setSearchParams({})}
                >
                  Limpar filtro
                </Button>
              ) : null}
              <Button id="condominium-units-create-button" asChild variant="outline">
                <Link to={`/condominiums/${code}/units/create`}>
                  <Plus className="size-4" />
                  Cadastrar unidade
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div id="condominium-units-loading" className="space-y-3 px-5 pb-5 md:px-6">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        ) : filteredUnits.length === 0 ? (
          <div id="condominium-units-empty" className="border-t border-border px-5 py-6 text-sm text-muted-foreground md:px-6">
            {selectedGroupType && selectedGroupName
              ? 'Nenhuma unidade encontrada para este grupo.'
              : 'Nenhuma unidade cadastrada ainda.'}
          </div>
        ) : (
          <div
            id="condominium-units-kt-datatable"
            className="kt-card-table border-t border-border"
            data-kt-datatable="true"
            data-kt-datatable-page-size="10"
            data-kt-datatable-state-save="true"
          >
            <div className="kt-table-wrapper kt-scrollable">
              <table id="condominium-units-table" className="kt-table min-w-full" data-kt-datatable-table="true">
                <thead className="bg-muted/40">
                  <tr>
                    <th scope="col" className="min-w-72 border-border text-muted-foreground" data-kt-datatable-column="label">
                      <span className="kt-table-col">
                        <span className="kt-table-col-label">Unidade</span>
                        <span className="kt-table-col-sort"></span>
                      </span>
                    </th>
                    <th scope="col" className="w-40 border-border text-muted-foreground" data-kt-datatable-column="group">
                      <span className="kt-table-col">
                        <span className="kt-table-col-label">Grupo</span>
                        <span className="kt-table-col-sort"></span>
                      </span>
                    </th>
                    <th scope="col" className="w-28 border-border text-muted-foreground" data-kt-datatable-column="floor">
                      <span className="kt-table-col">
                        <span className="kt-table-col-label">Andar</span>
                        <span className="kt-table-col-sort"></span>
                      </span>
                    </th>
                    <th scope="col" className="w-40 border-border text-muted-foreground" data-kt-datatable-column="area">
                      <span className="kt-table-col">
                        <span className="kt-table-col-label">Area privativa</span>
                        <span className="kt-table-col-sort"></span>
                      </span>
                    </th>
                    <th scope="col" className="w-40 border-border text-muted-foreground" data-kt-datatable-column="fraction">
                      <span className="kt-table-col">
                        <span className="kt-table-col-label">Fracao ideal</span>
                        <span className="kt-table-col-sort"></span>
                      </span>
                    </th>
                    <th scope="col" className="w-32 border-border text-muted-foreground" data-kt-datatable-column="status">
                      <span className="kt-table-col">
                        <span className="kt-table-col-label">Status</span>
                        <span className="kt-table-col-sort"></span>
                      </span>
                    </th>
                    <th scope="col" className="w-48 border-border text-muted-foreground" data-kt-datatable-column="actions">
                      <span className="kt-table-col">
                        <span className="kt-table-col-label">Acoes</span>
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUnits.map((unit) => (
                    <tr key={unit.id} id={`condominium-unit-row-${unit.id}`}>
                      <td className="border-border bg-background">
                        <div id={`condominium-unit-label-${unit.id}`} className="space-y-1">
                          <div className="font-medium text-foreground">{unit.identifier}</div>
                          <div className="font-mono text-xs text-muted-foreground">{unit.code}</div>
                          {unit.description ? (
                            <div className="text-sm text-muted-foreground">{unit.description}</div>
                          ) : null}
                        </div>
                      </td>
                      <td className="border-border bg-background">
                        <div id={`condominium-unit-group-${unit.id}`} className="text-sm text-foreground">
                          {unit.group_name ? `${getUnitGroupTypeLabel(unit.group_type)} - ${unit.group_name}` : 'Nao informado'}
                        </div>
                      </td>
                      <td className="border-border bg-background">
                        <div id={`condominium-unit-floor-${unit.id}`} className="text-sm text-foreground">
                          {unit.floor || 'Nao informado'}
                        </div>
                      </td>
                      <td className="border-border bg-background">
                        {editingUnitId === unit.id ? (
                          <div id={`condominium-unit-private-area-editor-${unit.id}`} className="space-y-2">
                            <Input
                              id={`condominium-unit-private-area-input-${unit.id}`}
                              value={editingArea}
                              onChange={(event) => setEditingArea(event.target.value)}
                              placeholder="Ex: 72,40"
                              className="h-9"
                            />
                            <div id={`condominium-unit-private-area-actions-${unit.id}`} className="flex gap-2">
                              <Button
                                id={`condominium-unit-private-area-save-${unit.id}`}
                                size="sm"
                                variant="primary"
                                onClick={() => void savePrivateArea(unit.id)}
                                disabled={savingAreaId === unit.id}
                              >
                                {savingAreaId === unit.id ? 'Salvando...' : 'Salvar'}
                              </Button>
                              <Button
                                id={`condominium-unit-private-area-cancel-${unit.id}`}
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingUnitId(null);
                                  setEditingArea('');
                                }}
                                disabled={savingAreaId === unit.id}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div id={`condominium-unit-private-area-display-${unit.id}`} className="text-sm font-medium text-foreground">
                            {formatArea(unit.private_area)}
                          </div>
                        )}
                      </td>
                      <td className="border-border bg-background">
                        <div id={`condominium-unit-fraction-${unit.id}`} className="text-sm font-medium text-foreground">
                          {formatFraction(unit.ideal_fraction)}
                        </div>
                      </td>
                      <td className="border-border bg-background">
                        <span
                          id={`condominium-unit-status-${unit.id}`}
                          className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-400"
                        >
                          Ativa
                        </span>
                      </td>
                      <td className="border-border bg-background text-end">
                        <div id={`condominium-unit-actions-${unit.id}`} className="inline-flex gap-2.5">
                          <button
                            id={`condominium-unit-private-area-edit-${unit.id}`}
                            type="button"
                            className="kt-btn kt-btn-sm kt-btn-icon kt-btn-outline"
                            onClick={() => {
                              setEditingUnitId(unit.id);
                              setEditingArea(unit.private_area == null ? '' : String(unit.private_area).replace('.', ','));
                            }}
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            id={`condominium-unit-delete-${unit.id}`}
                            type="button"
                            className="kt-btn kt-btn-sm kt-btn-icon kt-btn-outline"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              setUnitPendingDelete(unit);
                            }}
                            disabled={deletingUnitId === unit.id}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div id="condominium-units-kt-datatable-footer" className="kt-datatable-toolbar border-t border-border bg-background">
              <div id="condominium-units-kt-datatable-length" className="kt-datatable-length">
                Mostrar
                <select
                  id="condominium-units-kt-datatable-size"
                  className="kt-select kt-select-sm w-16"
                  name="perpage"
                  data-kt-datatable-size="true"
                />
                por pagina
              </div>
              <div id="condominium-units-kt-datatable-info-wrapper" className="kt-datatable-info">
                <span
                  id="condominium-units-kt-datatable-info"
                  data-kt-datatable-info="true"
                />
                <div
                  id="condominium-units-kt-datatable-pagination"
                  className="kt-datatable-pagination"
                  data-kt-datatable-pagination="true"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {error ? (
        <div id="condominium-units-error" className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <AlertDialog
        open={unitPendingDelete != null}
        onOpenChange={(open) => {
          if (!open && deletingUnitId == null) {
            setUnitPendingDelete(null);
          }
        }}
      >
        <AlertDialogContent id="condominium-units-delete-dialog-content">
          <AlertDialogHeader id="condominium-units-delete-dialog-header">
            <AlertDialogTitle id="condominium-units-delete-dialog-title">
              Excluir unidade
            </AlertDialogTitle>
            <AlertDialogDescription id="condominium-units-delete-dialog-description">
              {unitPendingDelete
                ? `Deseja realmente excluir a unidade ${unitPendingDelete.identifier}? Esta ação não pode ser desfeita.`
                : 'Deseja realmente excluir esta unidade?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter id="condominium-units-delete-dialog-footer">
            <AlertDialogCancel
              id="condominium-units-delete-dialog-cancel"
              disabled={deletingUnitId != null}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              id="condominium-units-delete-dialog-confirm"
              variant="destructive"
              disabled={unitPendingDelete == null || deletingUnitId != null}
              onClick={(event) => {
                event.preventDefault();
                if (unitPendingDelete) {
                  void onDeleteUnit(unitPendingDelete.id);
                }
              }}
            >
              {deletingUnitId != null ? 'Excluindo...' : 'Excluir unidade'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
