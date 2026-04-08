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

function formatGroupLabel(group?: UnitGroup) {
  if (!group) {
    return '';
  }

  const suffix = group.floors != null ? ` • ${group.floors} ${group.floors === 1 ? 'andar' : 'andares'}` : '';
  return `${getUnitGroupTypeLabel(group.group_type)} - ${group.name}${suffix}`;
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

function normalizeNumericIdentifier(value: string) {
  return value.replace(/\D/g, '');
}

export function CondominiumUnitsCreatePage() {
  const { code = '' } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<UnitGroup[]>([]);
  const [form, setForm] = useState({
    identifier: '',
    group_id: '',
    floor: '',
    description: '',
    private_area: '',
  });

  useEffect(() => {
    async function loadGroups() {
      try {
        setLoading(true);
        setError(null);

        const token = await getToken();
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/condominiums/${code}/unit-groups`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (response.status === 404) {
          navigate('/condominiums', { replace: true });
          return;
        }

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.message || 'Falha ao carregar grupos de unidades.');
        }

        const json = (await response.json()) as UnitGroupListResponse;
        setGroups(Array.isArray(json.data) ? json.data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar grupos de unidades.');
      } finally {
        setLoading(false);
      }
    }

    void loadGroups();
  }, [code, getToken, navigate]);

  const selectedGroup = groups.find((item) => String(item.id) === form.group_id);
  const selectedGroupFloorOptions = useMemo(() => {
    if (!selectedGroup?.floors || selectedGroup.floors < 1) {
      return [];
    }

    return Array.from({ length: selectedGroup.floors }, (_, index) => String(index + 1));
  }, [selectedGroup]);

  async function onCreateUnit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (!form.group_id) {
        throw new Error('Selecione um grupo antes de cadastrar a unidade.');
      }
      const selectedItem = groups.find((item) => String(item.id) === form.group_id);
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/condominiums/${code}/units`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          identifier: form.identifier,
          group_type: selectedItem?.group_type || '',
          group_name: selectedItem?.name || '',
          floor: form.floor,
          description: form.description,
          private_area: parseOptionalArea(form.private_area),
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || 'Falha ao criar unidade.');
      }

      navigate(`/condominiums/${code}/units`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar unidade.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div id="condominium-units-create-page" className="space-y-5">
      <div id="condominium-units-create-header" className="space-y-3">
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
              <BreadcrumbLink asChild>
                <Link to={`/condominiums/${code}/units`}>Unidades</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Nova unidade</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div id="condominium-units-create-header-actions" className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <h1 id="condominium-units-create-title" className="text-2xl font-semibold tracking-tight">Cadastrar unidade</h1>
            <p id="condominium-units-create-description" className="text-sm text-muted-foreground">
              Cadastre uma nova unidade e depois volte para a listagem.
            </p>
          </div>
          <div id="condominium-units-create-header-buttons" className="flex flex-col gap-2 sm:flex-row">
            <Button id="condominium-units-create-groups-button" asChild variant="outline">
              <Link to={`/condominiums/${code}/unit-groups`}>Cadastro de grupos</Link>
            </Button>
            <Button id="condominium-units-create-back-button" asChild variant="outline">
              <Link to={`/condominiums/${code}/units`}>Voltar para listagem</Link>
            </Button>
          </div>
        </div>
      </div>

      <Card id="condominium-units-create-card">
        <CardHeader>
          <CardTitle>Nova unidade</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div id="condominium-units-create-loading" className="space-y-3">
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          ) : (
            <form id="condominium-units-create-form" className="space-y-4" onSubmit={onCreateUnit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="unit-create-identifier">Identificador</Label>
                  <Input
                    id="unit-create-identifier"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={form.identifier}
                    onChange={(event) => setForm((current) => ({ ...current, identifier: normalizeNumericIdentifier(event.target.value) }))}
                    placeholder="Ex: 101"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit-create-private-area">Area privativa</Label>
                  <Input
                    id="unit-create-private-area"
                    value={form.private_area}
                    onChange={(event) => setForm((current) => ({ ...current, private_area: event.target.value }))}
                    placeholder="Ex: 68,5"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit-create-group-select">Grupo previamente cadastrado</Label>
                  <Select
                    value={form.group_id}
                    onValueChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        group_id: value,
                        floor: '',
                      }))
                    }
                  >
                    <SelectTrigger id="unit-create-group-select">
                      <SelectValue placeholder="Selecione um grupo" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={String(group.id)}>
                          {formatGroupLabel(group)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedGroup ? (
                    <div id="unit-create-group-selected-summary" className="text-xs text-muted-foreground">
                      {selectedGroup.floors != null
                        ? formatGroupLabel(selectedGroup)
                        : `${getUnitGroupTypeLabel(selectedGroup.group_type)} - ${selectedGroup.name} sem andares informados`}
                    </div>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit-create-floor">{selectedGroup?.floors ? 'Andar do grupo' : 'Andar'}</Label>
                  {selectedGroupFloorOptions.length ? (
                    <Select value={form.floor} onValueChange={(value) => setForm((current) => ({ ...current, floor: value }))}>
                      <SelectTrigger id="unit-create-floor-select">
                        <SelectValue placeholder="Selecione o andar" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedGroupFloorOptions.map((floor) => (
                          <SelectItem key={floor} value={floor}>
                            {floor}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="unit-create-floor"
                      value={form.floor}
                      onChange={(event) => setForm((current) => ({ ...current, floor: event.target.value }))}
                      placeholder="Ex: 10"
                    />
                  )}
                  {selectedGroup?.floors ? (
                    <div id="unit-create-floor-help" className="text-xs text-muted-foreground">
                      Escolha um andar entre 1 e {selectedGroup.floors}.
                    </div>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit-create-description">Descricao</Label>
                  <Input
                    id="unit-create-description"
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    placeholder="Ex: Cobertura"
                  />
                </div>
              </div>

              <Button id="condominium-units-create-submit" type="submit" variant="primary" disabled={submitting || !form.group_id}>
                {submitting ? 'Cadastrando unidade...' : 'Cadastrar unidade'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {error ? (
        <div id="condominium-units-create-error" className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}
    </div>
  );
}
