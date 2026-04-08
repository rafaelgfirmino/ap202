import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/react-router';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type UnitGroupType = 'block' | 'tower' | 'sector' | 'court' | 'phase';

const unitGroupTypeOptions: Array<{ value: UnitGroupType; label: string }> = [
  { value: 'block', label: 'Bloco' },
  { value: 'tower', label: 'Torre' },
  { value: 'sector', label: 'Setor' },
  { value: 'court', label: 'Quadra' },
  { value: 'phase', label: 'Fase' },
];

export function CondominiumUnitGroupsCreatePage() {
  const { code = '', id } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(isEditMode);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groupForm, setGroupForm] = useState({
    group_type: 'block' as UnitGroupType,
    name: '',
    floors: '',
  });

  useEffect(() => {
    async function loadGroup() {
      if (!isEditMode || !id) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const token = await getToken();
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/condominiums/${code}/unit-groups`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.message || 'Falha ao carregar grupo.');
        }

        const json = (await response.json()) as { data: Array<{ id: number; group_type: UnitGroupType; name: string; floors?: number | null }> | null };
        const found = (json.data ?? []).find((item) => String(item.id) === id);
        if (!found) {
          throw new Error('Grupo nao encontrado.');
        }

        setGroupForm({
          group_type: found.group_type,
          name: found.name,
          floors: found.floors == null ? '' : String(found.floors),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar grupo.');
      } finally {
        setLoading(false);
      }
    }

    void loadGroup();
  }, [code, getToken, id, isEditMode]);

  async function onCreateGroup(event: FormEvent) {
    event.preventDefault();
    setCreatingGroup(true);
    setError(null);

    try {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/condominiums/${code}/unit-groups${isEditMode ? `/${id}` : ''}`, {
        method: isEditMode ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          group_type: groupForm.group_type,
          name: groupForm.name,
          floors: groupForm.floors.trim() === '' ? null : Number(groupForm.floors),
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || `Falha ao ${isEditMode ? 'atualizar' : 'criar'} grupo de unidades.`);
      }

      navigate(`/condominiums/${code}/unit-groups`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : `Erro ao ${isEditMode ? 'atualizar' : 'criar'} grupo de unidades.`);
    } finally {
      setCreatingGroup(false);
    }
  }

  return (
    <div id="condominium-unit-groups-create-page" className="space-y-5">
      <div id="condominium-unit-groups-create-header" className="space-y-3">
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
                <Link to={`/condominiums/${code}/unit-groups`}>Cadastro de grupos</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
            <BreadcrumbPage>{isEditMode ? 'Editar grupo' : 'Novo grupo'}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

        <div id="condominium-unit-groups-create-header-actions" className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <h1 id="condominium-unit-groups-create-title" className="text-2xl font-semibold tracking-tight">
              {isEditMode ? 'Editar grupo' : 'Cadastrar grupo'}
            </h1>
            <p id="condominium-unit-groups-create-description" className="text-sm text-muted-foreground">
              {isEditMode ? 'Atualize os dados do agrupamento e volte para a listagem.' : 'Cadastre um novo agrupamento e depois volte para a listagem.'}
            </p>
          </div>
          <Button id="condominium-unit-groups-create-back-button" asChild variant="outline">
            <Link to={`/condominiums/${code}/unit-groups`}>Voltar para listagem</Link>
          </Button>
        </div>
      </div>

      <Card id="condominium-unit-groups-create-card">
        <CardHeader>
          <CardTitle>{isEditMode ? 'Editar grupo' : 'Novo grupo'}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div id="condominium-unit-groups-create-loading" className="space-y-3">
              <div className="h-10 rounded-md bg-muted" />
              <div className="h-10 rounded-md bg-muted" />
              <div className="h-10 rounded-md bg-muted" />
            </div>
          ) : (
          <form id="condominium-unit-groups-create-form" className="space-y-4" onSubmit={onCreateGroup}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="unit-groups-create-type-select">Tipo de grupo</Label>
                <Select
                  value={groupForm.group_type}
                  onValueChange={(value) => setGroupForm((current) => ({ ...current, group_type: value as UnitGroupType }))}
                >
                  <SelectTrigger id="unit-groups-create-type-select">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {unitGroupTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit-groups-create-name-input">Nome do grupo</Label>
                <Input
                  id="unit-groups-create-name-input"
                  value={groupForm.name}
                  onChange={(event) => setGroupForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Ex: A"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit-groups-create-floors-input">Andares</Label>
                <Input
                  id="unit-groups-create-floors-input"
                  type="number"
                  min="0"
                  step="1"
                  value={groupForm.floors}
                  onChange={(event) => setGroupForm((current) => ({ ...current, floors: event.target.value }))}
                  placeholder="Ex: 12"
                />
              </div>
            </div>

            <Button id="unit-groups-create-submit-button" type="submit" variant="primary" disabled={creatingGroup}>
              {creatingGroup ? `${isEditMode ? 'Salvando' : 'Cadastrando'} grupo...` : `${isEditMode ? 'Salvar alteracoes' : 'Cadastrar grupo'}`}
            </Button>
          </form>
          )}
        </CardContent>
      </Card>

      {error ? (
        <div id="condominium-unit-groups-create-error" className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}
    </div>
  );
}
