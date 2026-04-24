<script lang="ts">
	import { goto } from '$app/navigation';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import PencilLineIcon from '@lucide/svelte/icons/pencil-line';
	import RefreshCcwIcon from '@lucide/svelte/icons/refresh-ccw';
	import RulerIcon from '@lucide/svelte/icons/ruler';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import { onMount } from 'svelte';
	import Logo from '$lib/components/app/logo/index.svelte';
	import UnitFinancialReport from '$lib/components/app/UnitFinancialReport.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { listUnitGroups, type UnitGroup } from '$lib/services/unit-groups.js';
	import {
		createUnit,
		deleteUnit,
		getUnit,
		updateUnitPrivateArea,
		type Unit
	} from '$lib/services/units.js';
	import posthog from 'posthog-js';

	interface Props {
		mode: 'create' | 'edit' | 'view';
		condominiumCode: string;
		unitId?: number | null;
	}

	let { mode, condominiumCode, unitId = null }: Props = $props();

	let groups = $state<UnitGroup[]>([]);
	let unit = $state<Unit | null>(null);
	let isLoading = $state(true);
	let isSubmitting = $state(false);
	let isDeleting = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');

	let createIdentifier = $state('');
	let selectedGroupKey = $state('');
	let createFloor = $state('');
	let createDescription = $state('');
	let createPrivateArea = $state('');
	let updatePrivateAreaValue = $state('');

	const isEditMode = $derived(mode === 'edit');
	const isViewMode = $derived(mode === 'view');
	const isCreateMode = $derived(mode === 'create');
	const selectedGroup = $derived(
		groups.find((group) => `${group.group_type}::${group.name}` === selectedGroupKey) ?? null
	);

	function getGroupTypeLabel(groupType: string): string {
		const labels: Record<string, string> = {
			block: 'Bloco',
			tower: 'Torre',
			sector: 'Setor',
			court: 'Quadra',
			phase: 'Fase'
		};

		return labels[groupType] ?? groupType;
	}

	function getUnitGroupLabel(value: Pick<Unit, 'group_type' | 'group_name'> | null): string {
		if (!value?.group_type || !value.group_name) {
			return 'Sem grupo';
		}

		return `${getGroupTypeLabel(value.group_type)} ${value.group_name}`;
	}

	function getViewTitle(unitValue: Unit | null): string {
		if (!unitValue) {
			return 'Ver unidade';
		}

		return `${unitValue.code} • ${getUnitGroupLabel(unitValue)} • ${formatFloorLabel(unitValue.floor)} andar • ${unitValue.identifier}`;
	}

	function normalizeIdentifier(value: string): string {
		return value.replaceAll(/\D/g, '').slice(0, 20);
	}

	function normalizePrivateAreaInput(value: string): string {
		return value.replaceAll(',', '.').replaceAll(/[^0-9.]/g, '');
	}

	function parsePrivateArea(value: string): number | null {
		const normalized = normalizePrivateAreaInput(value).trim();

		if (normalized === '') {
			return null;
		}

		const parsed = Number(normalized);
		return Number.isFinite(parsed) ? parsed : Number.NaN;
	}

	function formatArea(value: number | null | undefined): string {
		if (value == null) {
			return 'Área não informada';
		}

		return `${value.toLocaleString('pt-BR', {
			minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
			maximumFractionDigits: 2
		})} m²`;
	}

	function formatFloorLabel(value: string | null | undefined): string {
		const normalizedValue = value?.trim();

		if (!normalizedValue) {
			return 'Não informado';
		}

		return `${normalizedValue}º andar`;
	}

	function getFloorHint(group: UnitGroup | null): string {
		if (!group || group.floors == null || group.floors <= 0) {
			return 'Opcional. Use o formato que fizer sentido para a estrutura do condomínio.';
		}

		return `Opcional. Para este grupo, o backend valida andares de 1 a ${group.floors}.`;
	}

	const availableFloors = $derived.by(() => {
		if (!selectedGroup?.floors || selectedGroup.floors <= 0) {
			return [];
		}

		return Array.from({ length: selectedGroup.floors }, (_, index) => String(index + 1));
	});

	function getGroupOptionLabel(group: UnitGroup): string {
		const floorsLabel =
			group.floors != null && group.floors > 0
				? `${group.floors} andar${group.floors === 1 ? '' : 'es'}`
				: 'sem andares';

		return `${getGroupTypeLabel(group.group_type)} ${group.name} • ${floorsLabel}`;
	}

	function hydrateFormFromUnit(source: Unit): void {
		unit = source;
		createIdentifier = source.identifier;
		selectedGroupKey =
			source.group_type && source.group_name ? `${source.group_type}::${source.group_name}` : '';
		createFloor = source.floor ?? '';
		createDescription = source.description ?? '';
		createPrivateArea = source.private_area != null ? String(source.private_area) : '';
		updatePrivateAreaValue = source.private_area != null ? String(source.private_area) : '';
	}

	function resetCreateForm(): void {
		createIdentifier = '';
		selectedGroupKey = groups.length > 0 ? `${groups[0].group_type}::${groups[0].name}` : '';
		createFloor = '';
		createDescription = '';
		createPrivateArea = '';
	}

	async function loadPageData(): Promise<void> {
		isLoading = true;
		errorMessage = '';

		try {
			groups = (await listUnitGroups(condominiumCode)).data;

			if (isEditMode || isViewMode) {
				if (!unitId || unitId <= 0) {
					throw new Error('Unidade inválida.');
				}

				const loadedUnit = await getUnit(condominiumCode, unitId);
				hydrateFormFromUnit(loadedUnit);
			} else {
				resetCreateForm();
			}
		} catch (error) {
			errorMessage =
				error instanceof Error
					? error.message
					: 'Não foi possível carregar o formulário da unidade.';
		} finally {
			isLoading = false;
		}
	}

	async function handleCreate(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		errorMessage = '';
		successMessage = '';

		if (!selectedGroup) {
			errorMessage = 'Cadastre ou selecione um grupo antes de criar unidades.';
			return;
		}

		if (createIdentifier.trim().length === 0) {
			errorMessage = 'Informe o identificador numérico da unidade.';
			return;
		}

		const privateArea = parsePrivateArea(createPrivateArea);
		if (Number.isNaN(privateArea)) {
			errorMessage = 'Informe uma área privativa válida.';
			return;
		}

		isSubmitting = true;

		try {
			await createUnit(condominiumCode, {
				identifier: createIdentifier.trim(),
				group_type: selectedGroup.group_type,
				group_name: selectedGroup.name,
				floor: createFloor.trim(),
				description: createDescription.trim(),
				private_area: privateArea
			});

			posthog.capture('unit_created', {
				condominium_code: condominiumCode,
				group_type: selectedGroup.group_type,
				has_private_area: privateArea !== null
			});
			await goto(`/g/${condominiumCode}/unidades`);
		} catch (error) {
			posthog.captureException(error);
			errorMessage =
				error instanceof Error ? error.message : 'Não foi possível cadastrar a unidade.';
		} finally {
			isSubmitting = false;
		}
	}

	async function handleUpdatePrivateArea(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		errorMessage = '';
		successMessage = '';

		if (!unit) {
			errorMessage = 'Selecione uma unidade válida para edição.';
			return;
		}

		const privateArea = parsePrivateArea(updatePrivateAreaValue);
		if (Number.isNaN(privateArea)) {
			errorMessage = 'Informe uma área privativa válida.';
			return;
		}

		isSubmitting = true;

		try {
			await updateUnitPrivateArea(condominiumCode, unit.id, {
				private_area: privateArea
			});

			posthog.capture('unit_private_area_updated', {
				condominium_code: condominiumCode,
				unit_id: unit.id
			});
			await goto(`/g/${condominiumCode}/unidades`);
		} catch (error) {
			posthog.captureException(error);
			errorMessage =
				error instanceof Error ? error.message : 'Não foi possível atualizar a área privativa.';
		} finally {
			isSubmitting = false;
		}
	}

	async function handleDelete(): Promise<void> {
		if (!unit) {
			errorMessage = 'Selecione uma unidade válida para exclusão.';
			return;
		}

		errorMessage = '';
		successMessage = '';
		isDeleting = true;

		try {
			await deleteUnit(condominiumCode, unit.id);
			posthog.capture('unit_deleted', {
				condominium_code: condominiumCode,
				unit_id: unit.id
			});
			await goto(`/g/${condominiumCode}/unidades`);
		} catch (error) {
			posthog.captureException(error);
			errorMessage = error instanceof Error ? error.message : 'Não foi possível excluir a unidade.';
		} finally {
			isDeleting = false;
		}
	}

	onMount(async () => {
		await loadPageData();
	});
</script>

<main class="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-5 sm:px-6">
	<section class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
		<div class="flex flex-col gap-1">
			<h1 class="text-2xl font-semibold tracking-tight text-foreground">
				{isEditMode ? 'Editar unidade' : isViewMode ? getViewTitle(unit) : 'Nova unidade'}
			</h1>
		</div>

		<div class="flex flex-wrap items-center justify-end gap-2">
			{#if isViewMode && unitId}
				<Button
					type="button"
					onclick={() => {
						void goto(`/g/${condominiumCode}/unidades/${unitId}/editar`);
					}}
				>
					<PencilLineIcon class="mr-2 size-4" />
					Editar unidade
				</Button>
			{/if}

			<Button
				type="button"
				variant="outline"
				onclick={() => {
					void goto(`/g/${condominiumCode}/unidades`);
				}}
			>
				<ArrowLeftIcon class="mr-2 size-4" />
				Voltar para listagem
			</Button>
		</div>
	</section>

	{#if isLoading}
		<Card.Root>
			<Card.Content class="py-10">
				<div
					id="unit-loading-state"
					data-test="unit-loading-state"
					class="flex flex-col items-center justify-center gap-4 text-center"
				>
					<div
						id="unit-loading-logo-wrapper"
						data-test="unit-loading-logo-wrapper"
						class="rounded-2xl border border-border/70 bg-background p-4 shadow-sm"
					>
						<Logo class="h-10" />
					</div>
					<p
						id="unit-loading-message"
						data-test="unit-loading-message"
						class="text-sm text-muted-foreground"
					>
						Carregando...
					</p>
				</div>
			</Card.Content>
		</Card.Root>
	{:else}
		<div class="flex flex-col gap-4">
			{#if errorMessage}
				<div
					class="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
				>
					{errorMessage}
				</div>
			{/if}

			{#if successMessage}
				<div
					class="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
				>
					{successMessage}
				</div>
			{/if}

			{#if isCreateMode}
				<Card.Root>
					<Card.Header>
						<Card.Title>Cadastro da unidade</Card.Title>
						<Card.Description>
							O identificador compõe o código final da unidade junto com o grupo selecionado.
						</Card.Description>
					</Card.Header>
					<Card.Content>
						<form class="flex flex-col gap-4" onsubmit={handleCreate}>
							<div class="space-y-2">
								<Label for="unit-registration-create-group">Grupo</Label>
								<select
									id="unit-registration-create-group"
									class="flex h-9 w-full rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50"
									value={selectedGroupKey}
									disabled={isSubmitting}
									onchange={(event) => {
										const target = event.currentTarget as HTMLSelectElement;
										selectedGroupKey = target.value;
									}}
								>
									{#each groups as group}
										<option value={`${group.group_type}::${group.name}`}
											>{getGroupOptionLabel(group)}</option
										>
									{/each}
								</select>
							</div>

							<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div class="space-y-2">
									<Label for="unit-registration-create-identifier">Identificador</Label>
									<Input
										id="unit-registration-create-identifier"
										value={createIdentifier}
										placeholder="Ex.: 101"
										inputmode="numeric"
										maxlength={20}
										disabled={isSubmitting}
										oninput={(event) => {
											const target = event.currentTarget as HTMLInputElement;
											createIdentifier = normalizeIdentifier(target.value);
										}}
									/>
								</div>

								<div class="space-y-2">
									<Label for="unit-registration-create-floor">Andar</Label>
									{#if availableFloors.length > 0}
										<select
											id="unit-registration-create-floor"
											class="flex h-9 w-full rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50"
											value={createFloor}
											disabled={isSubmitting}
											onchange={(event) => {
												const target = event.currentTarget as HTMLSelectElement;
												createFloor = target.value;
											}}
										>
											<option value="">Selecione um andar</option>
											{#each availableFloors as floor}
												<option value={floor}>{floor}</option>
											{/each}
										</select>
									{:else}
										<Input
											id="unit-registration-create-floor"
											value={createFloor}
											placeholder="Ex.: 1"
											disabled={isSubmitting}
											oninput={(event) => {
												const target = event.currentTarget as HTMLInputElement;
												createFloor = target.value;
											}}
										/>
									{/if}
									<p class="text-xs text-muted-foreground">{getFloorHint(selectedGroup)}</p>
								</div>
							</div>

							<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div class="space-y-2">
									<Label for="unit-registration-create-private-area">Área privativa</Label>
									<Input
										id="unit-registration-create-private-area"
										value={createPrivateArea}
										placeholder="Ex.: 68,5"
										inputmode="decimal"
										disabled={isSubmitting}
										oninput={(event) => {
											const target = event.currentTarget as HTMLInputElement;
											createPrivateArea = normalizePrivateAreaInput(target.value);
										}}
									/>
									<p class="text-xs text-muted-foreground">
										O sistema recalcula a fração ideal quando esta área muda.
									</p>
								</div>

								<div class="space-y-2">
									<Label for="unit-registration-code-preview">Código previsto</Label>
									<Input
										id="unit-registration-code-preview"
										value={selectedGroup
											? `${condominiumCode}-${selectedGroup.name}-${createIdentifier || '...'}`
											: ''}
										readonly
										disabled
									/>
								</div>
							</div>

							<div class="space-y-2">
								<Label for="unit-registration-create-description">Descrição</Label>
								<Textarea
									id="unit-registration-create-description"
									value={createDescription}
									placeholder="Ex.: Apartamento de fundos, cobertura, loja térrea..."
									disabled={isSubmitting}
									oninput={(event) => {
										const target = event.currentTarget as HTMLTextAreaElement;
										createDescription = target.value;
									}}
								/>
							</div>

							<div class="flex items-center justify-between gap-3">
								<Button
									type="button"
									variant="ghost"
									onclick={resetCreateForm}
									disabled={isSubmitting}
								>
									Limpar
								</Button>
								<Button type="submit" disabled={isSubmitting}>
									{isSubmitting ? 'Salvando...' : 'Cadastrar unidade'}
								</Button>
							</div>
						</form>
					</Card.Content>
				</Card.Root>
			{:else if unit}
				{#if isViewMode}
					<UnitFinancialReport {unit} />
				{:else}
					<Card.Root>
						<Card.Header>
							<Card.Title>Editar área privativa</Card.Title>
						</Card.Header>
						<Card.Content>
							<form class="flex flex-col gap-4" onsubmit={handleUpdatePrivateArea}>
								<div class="flex items-start gap-3">
									<div class="rounded-full bg-primary/10 p-2 text-primary">
										<RulerIcon class="size-4" />
									</div>
									<div class="space-y-1">
										<h2 class="font-semibold text-foreground">Atualizar área privativa</h2>
										<p class="text-sm text-muted-foreground">
											Use este ajuste para refletir a metragem correta e manter os cálculos de
											fração ideal consistentes.
										</p>
									</div>
								</div>

								<div class="space-y-2">
									<Label for="unit-registration-update-private-area">Área privativa</Label>
									<Input
										id="unit-registration-update-private-area"
										value={updatePrivateAreaValue}
										placeholder="Ex.: 68,5"
										inputmode="decimal"
										disabled={isSubmitting}
										oninput={(event) => {
											const target = event.currentTarget as HTMLInputElement;
											updatePrivateAreaValue = normalizePrivateAreaInput(target.value);
										}}
									/>
									<p class="text-xs text-muted-foreground">
										Valor atual: {formatArea(unit.private_area)}. Deixe em branco para remover a
										metragem cadastrada.
									</p>
								</div>

								<div class="flex flex-wrap items-center justify-between gap-3">
									<Button
										type="button"
										variant="outline"
										onclick={() => {
											updatePrivateAreaValue =
												unit?.private_area != null ? String(unit.private_area) : '';
										}}
									>
										<RefreshCcwIcon class="mr-2 size-4" />
										Restaurar valor
									</Button>
									<Button type="submit" disabled={isSubmitting}>
										<PencilLineIcon class="mr-2 size-4" />
										{isSubmitting ? 'Atualizando...' : 'Salvar área privativa'}
									</Button>
								</div>
							</form>
						</Card.Content>
					</Card.Root>

					<Card.Root>
						<Card.Header>
							<Card.Title>Excluir unidade</Card.Title>
							<Card.Description>
								A exclusão depende das validações de negócio do backend.
							</Card.Description>
						</Card.Header>
						<Card.Content>
							<div class="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
								<div class="flex items-start justify-between gap-3">
									<div class="space-y-1">
										<h2 class="font-semibold text-foreground">Remover unidade</h2>
										<p class="text-sm text-muted-foreground">
											Unidades com cobranças ou moradores ativos podem ser bloqueadas pelo backend.
										</p>
									</div>
									<Button
										type="button"
										variant="destructive"
										disabled={isDeleting}
										onclick={handleDelete}
									>
										<Trash2Icon class="mr-2 size-4" />
										{isDeleting ? 'Excluindo...' : 'Excluir'}
									</Button>
								</div>
							</div>
						</Card.Content>
					</Card.Root>
				{/if}
			{/if}
		</div>
	{/if}
</main>
