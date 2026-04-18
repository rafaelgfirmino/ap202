<script lang="ts">
	import SearchIcon from '@lucide/svelte/icons/search';
	import PencilLineIcon from '@lucide/svelte/icons/pencil-line';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import LockIcon from '@lucide/svelte/icons/lock';
	import { onMount } from 'svelte';
	import CardEmpty from '$lib/components/app/card-empty/index.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { cn } from '$lib/utils.js';
	import {
		createUnitGroup,
		deleteUnitGroup,
		listUnitGroups,
		updateUnitGroup,
		type UnitGroup
	} from '$lib/services/unit-groups.js';
	import { listUnits, type Unit } from '$lib/services/units.js';

	interface Props {
		params: {
			code: string;
		};
	}

	interface GroupTypeOption {
		label: string;
		value: string;
		description: string;
	}

	interface GroupCardViewModel {
		id: number;
		name: string;
		groupType: string;
		floors: number;
		active: boolean;
		unitCount: number;
		structureInsight: string;
		canManage: boolean;
	}

	const groupTypeOptions: GroupTypeOption[] = [
		{ value: 'block', label: 'Bloco', description: 'Ideal para torres ou blocos residenciais.' },
		{ value: 'tower', label: 'Torre', description: 'Agrupa unidades por torres independentes.' },
		{ value: 'sector', label: 'Setor', description: 'Organiza conjuntos por setores internos.' },
		{ value: 'court', label: 'Quadra', description: 'Agrupa casas ou lotes por quadras.' }
	];

	let { params }: Props = $props();

	let groups = $state<UnitGroup[]>([]);
	let units = $state<Unit[]>([]);
	let selectedGroupId = $state<number | null>(null);
	let searchTerm = $state('');
	let isLoading = $state(true);
	let isSubmitting = $state(false);
	let isDeleting = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');
	let formMode = $state<'create' | 'edit'>('create');
	let selectedGroupType = $state<GroupTypeOption['value']>('block');
	let groupName = $state('');
	let floorsValue = $state('');

	const totalGroups = $derived(groups.length);
	const hasGroups = $derived(totalGroups > 0);
	const isBlockType = $derived(selectedGroupType === 'block');
	const nameFieldLabel = $derived(isBlockType ? 'Código do bloco' : 'Nome do grupo');
	const nameFieldPlaceholder = $derived(isBlockType ? 'Ex.: A' : 'Ex.: Torre Norte');
	const nameFieldDescription = $derived(
		isBlockType
			? 'O código do bloco deve ter 1 letra de A a Z.'
			: 'Informe um nome curto e claro para o grupo.'
	);
	const formTitle = $derived(formMode === 'edit' ? 'Editar grupo' : 'Novo grupo');
	const formDescription = $derived(
		formMode === 'edit'
			? 'Ajuste os dados do grupo selecionado quando ele estiver liberado para manutenção.'
			: 'Preencha os dados abaixo para cadastrar um novo grupo sem alterar a API do backend.'
	);
	const feedbackMessage = $derived(errorMessage || successMessage);
	const feedbackTone = $derived(errorMessage ? 'error' : successMessage ? 'success' : 'idle');

	function normalizeGroupName(value: string, groupType: GroupTypeOption['value']): string {
		const trimmedValue = value.trim();

		if (groupType === 'block') {
			return trimmedValue.toUpperCase().replaceAll(/[^A-Z]/g, '').slice(0, 1);
		}

		return trimmedValue;
	}

	function validateGroupName(groupType: GroupTypeOption['value'], value: string): string | null {
		if (groupType === 'block' && !/^[A-Z]$/.test(value)) {
			return 'O código do bloco deve ter exatamente 1 letra entre A e Z.';
		}

		if (value.length === 0) {
			return 'Informe o nome do grupo.';
		}

		return null;
	}

	function getGroupTypeLabel(groupType: string): string {
		return groupTypeOptions.find((option) => option.value === groupType)?.label ?? groupType;
	}

	function getUnitsByGroup(group: UnitGroup): Unit[] {
		return units.filter(
			(unit) => unit.group_type === group.group_type && unit.group_name === group.name
		);
	}

	function canManageGroup(group: UnitGroup): boolean {
		return getUnitsByGroup(group).length === 0;
	}

	function getNextBlockName(): string {
		const usedBlockNames = new Set(
			groups
				.filter((group) => group.group_type === 'block')
				.map((group) => normalizeGroupName(group.name, 'block'))
				.filter((name) => name.length === 1)
		);

		for (let code = 65; code <= 90; code += 1) {
			const blockName = String.fromCharCode(code);

			if (!usedBlockNames.has(blockName)) {
				return blockName;
			}
		}

		return '';
	}

	function getManagementTooltip(linkedUnitCount: number): string {
		if (linkedUnitCount === 0) {
			return 'Clique para editar este grupo.';
		}

		return `${linkedUnitCount} unidade${linkedUnitCount === 1 ? '' : 's'} vinculada${linkedUnitCount === 1 ? '' : 's'}. Edição e exclusão indisponíveis.`;
	}

	const selectedGroup = $derived(
		groups.find((group) => group.id === selectedGroupId) ?? null
	);

	const selectedGroupCanManage = $derived(selectedGroup ? canManageGroup(selectedGroup) : false);

	const groupCards = $derived(
		groups.map((group) => {
			const floors = group.floors ?? 0;
			const unitCount = getUnitsByGroup(group).length;

			return {
				id: group.id,
				name: group.name,
				groupType: group.group_type,
				floors,
				active: group.active,
				unitCount,
				structureInsight:
					floors > 0
						? `${floors} andar${floors === 1 ? '' : 'es'} configurado${floors === 1 ? '' : 's'}`
						: 'Sem andares informados',
				canManage: canManageGroup(group)
			} satisfies GroupCardViewModel;
		})
	);

	const filteredGroupCards = $derived(
		groupCards.filter((group) => {
			const normalizedSearch = searchTerm.trim().toLowerCase();

			if (normalizedSearch.length === 0) {
				return true;
			}

			return (
				group.name.toLowerCase().includes(normalizedSearch) ||
				getGroupTypeLabel(group.groupType).toLowerCase().includes(normalizedSearch)
			);
		})
	);

	function applyCreateFormDefaults(groupType: GroupTypeOption['value'] = 'block'): void {
		formMode = 'create';
		selectedGroupId = null;
		selectedGroupType = groupType;
		groupName = groupType === 'block' ? getNextBlockName() : '';
		floorsValue = '';
	}

	function resetForm(): void {
		applyCreateFormDefaults();
	}

	function fillFormFromGroup(group: UnitGroup): void {
		formMode = 'edit';
		selectedGroupId = group.id;
		selectedGroupType = group.group_type as GroupTypeOption['value'];
		groupName = group.name;
		floorsValue = group.floors != null ? String(group.floors) : '';
	}

	function focusForm(): void {
		if (typeof document === 'undefined') {
			return;
		}

		const input = document.getElementById('group-registration-name-input');
		input?.scrollIntoView({ behavior: 'smooth', block: 'center' });
		input?.focus();
	}

	function handleSelectGroup(group: UnitGroup): void {
		errorMessage = '';
		successMessage = '';

		if (canManageGroup(group)) {
			fillFormFromGroup(group);
			focusForm();
			return;
		}

		applyCreateFormDefaults();
		focusForm();
	}

	async function loadPageData(): Promise<void> {
		isLoading = true;
		errorMessage = '';

		try {
			const [groupsResponse, unitsResponse] = await Promise.all([
				listUnitGroups(params.code),
				listUnits(params.code)
			]);

			groups = groupsResponse.data;
			units = unitsResponse.data;

			if (selectedGroupId != null && !groups.some((group) => group.id === selectedGroupId)) {
				resetForm();
			} else if (formMode === 'create') {
				groupName = selectedGroupType === 'block' ? getNextBlockName() : '';
			}
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Não foi possível carregar os grupos.';
		} finally {
			isLoading = false;
		}
	}

	async function handleSubmit(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		errorMessage = '';
		successMessage = '';
		isSubmitting = true;

		const floors = floorsValue.trim() === '' ? null : Number(floorsValue);
		const normalizedGroupName = normalizeGroupName(groupName, selectedGroupType);
		const nameError = validateGroupName(selectedGroupType, normalizedGroupName);

		if (nameError) {
			errorMessage = nameError;
			isSubmitting = false;
			return;
		}

		if (formMode === 'edit' && (!selectedGroup || !selectedGroupCanManage)) {
			errorMessage = 'Selecione um grupo liberado para manutenção antes de editar.';
			isSubmitting = false;
			return;
		}

		try {
			if (formMode === 'edit' && selectedGroup) {
				await updateUnitGroup(params.code, selectedGroup.id, {
					group_type: selectedGroupType,
					name: normalizedGroupName,
					floors
				});
				successMessage = 'Grupo atualizado com sucesso.';
			} else {
				await createUnitGroup(params.code, {
					group_type: selectedGroupType,
					name: normalizedGroupName,
					floors
				});
				successMessage = 'Grupo cadastrado com sucesso.';
			}

			resetForm();
			await loadPageData();
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Não foi possível salvar o grupo.';
		} finally {
			isSubmitting = false;
		}
	}

	async function handleDeleteSelectedGroup(): Promise<void> {
		if (!selectedGroup || !selectedGroupCanManage) {
			errorMessage = 'Selecione um grupo liberado para exclusão.';
			return;
		}

		isDeleting = true;
		errorMessage = '';
		successMessage = '';

		try {
			await deleteUnitGroup(params.code, selectedGroup.id);
				successMessage = 'Grupo excluído com sucesso.';
			resetForm();
			await loadPageData();
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Não foi possível excluir o grupo.';
		} finally {
			isDeleting = false;
		}
	}

	onMount(async () => {
		await loadPageData();
	});
</script>

<svelte:head>
	<title>Cadastro de grupos</title>
</svelte:head>

<Tooltip.Provider>
	<main
		id="group-registration-page-root"
		data-test="group-registration-page-root"
		class="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6"
	>
	<section
		id="group-registration-page-header"
		data-test="group-registration-page-header"
		class="flex flex-col gap-2"
	>
		<div
			id="group-registration-page-title-group"
			data-test="group-registration-page-title-group"
			class="flex flex-col gap-1"
		>
			<h1
				id="group-registration-page-title"
				data-test="group-registration-page-title"
				class="text-2xl font-semibold tracking-tight text-foreground"
			>
				Cadastro de grupos
			</h1>
			<p
				id="group-registration-page-description"
				data-test="group-registration-page-description"
				class="text-sm text-muted-foreground"
			>
				Selecione um grupo para revisar seus dados e mantenha a estrutura organizada mesmo quando houver muitos blocos.
			</p>
		</div>
	</section>

	<section
		id="group-registration-page-content"
		data-test="group-registration-page-content"
		class="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]"
	>
		<Card.Root id="group-registration-list-card" data-test="group-registration-list-card">
			<Card.Header id="group-registration-list-header" data-test="group-registration-list-header">
				<Card.Title id="group-registration-list-title" data-test="group-registration-list-title">
					Grupos cadastrados
				</Card.Title>
				<Card.Description
					id="group-registration-list-description"
					data-test="group-registration-list-description"
				>
					Selecione um grupo para editar quando ele estiver livre de unidades vinculadas.
				</Card.Description>
			</Card.Header>
			<Card.Content
				id="group-registration-list-content"
				data-test="group-registration-list-content"
				class="flex flex-col gap-4"
			>
				<div
					id="group-registration-list-toolbar"
					data-test="group-registration-list-toolbar"
					class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
				>
					<div
						id="group-registration-list-summary"
						data-test="group-registration-list-summary"
						class="text-sm text-muted-foreground"
					>
						{totalGroups} grupos cadastrados para o condomínio {params.code}.
					</div>
					<div
						id="group-registration-search-wrapper"
						data-test="group-registration-search-wrapper"
						class="relative w-full lg:max-w-xs"
					>
						<SearchIcon
							id="group-registration-search-icon"
							data-test="group-registration-search-icon"
							class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
						/>
						<Input
							id="group-registration-search-input"
							data-test="group-registration-search-input"
							value={searchTerm}
							placeholder="Buscar bloco, torre ou setor"
							class="pl-9"
							oninput={(event) => {
								const target = event.currentTarget as HTMLInputElement;
								searchTerm = target.value;
							}}
						/>
					</div>
				</div>

				{#if isLoading}
					<div
						id="group-registration-loading"
						data-test="group-registration-loading"
						class="text-muted-foreground text-sm"
					>
						Carregando grupos...
					</div>
				{:else if !hasGroups}
					<CardEmpty onAction={focusForm} />
				{:else if filteredGroupCards.length === 0}
					<div
						id="group-registration-empty-search"
						data-test="group-registration-empty-search"
						class="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground"
					>
						Nenhum grupo encontrado para o filtro informado.
					</div>
				{:else}
					<div
						id="group-registration-list-grid"
						data-test="group-registration-list-grid"
						class="grid max-h-[760px] grid-cols-1 gap-3 overflow-y-auto pr-1 md:grid-cols-2"
					>
						{#each filteredGroupCards as group}
							<button
								id={`group-registration-item-${group.id}`}
								data-test={`group-registration-item-${group.id}`}
								type="button"
								class={cn(
									'flex flex-col gap-4 rounded-xl border p-4 text-left transition-colors',
									selectedGroupId === group.id
										? 'border-primary bg-primary/5'
										: 'bg-card hover:border-primary/40',
									!group.canManage && 'border-dashed'
								)}
								onclick={() => {
									const sourceGroup = groups.find((item) => item.id === group.id);

									if (sourceGroup) {
										handleSelectGroup(sourceGroup);
									}
								}}
							>
								<div
									id={`group-registration-item-header-${group.id}`}
									data-test={`group-registration-item-header-${group.id}`}
									class="flex items-start justify-between gap-3"
								>
									<div
										id={`group-registration-item-title-group-${group.id}`}
										data-test={`group-registration-item-title-group-${group.id}`}
										class="flex min-w-0 flex-col gap-1"
									>
										<div
											id={`group-registration-item-title-row-${group.id}`}
											data-test={`group-registration-item-title-row-${group.id}`}
											class="flex items-center gap-2"
										>
											<h2
												id={`group-registration-item-title-${group.id}`}
												data-test={`group-registration-item-title-${group.id}`}
												class="truncate text-base font-semibold text-foreground"
											>
												{group.name}
											</h2>
											<Tooltip.Root>
												<Tooltip.Trigger>
													<span class="inline-flex" tabindex="-1">
														{#if group.canManage}
															<PencilLineIcon
																id={`group-registration-item-edit-icon-${group.id}`}
																data-test={`group-registration-item-edit-icon-${group.id}`}
																class="size-4 text-muted-foreground"
															/>
														{:else}
															<LockIcon
																id={`group-registration-item-lock-icon-${group.id}`}
																data-test={`group-registration-item-lock-icon-${group.id}`}
																class="size-4 text-muted-foreground"
															/>
														{/if}
													</span>
												</Tooltip.Trigger>
												<Tooltip.Content side="top" align="start">
													{getManagementTooltip(group.unitCount)}
												</Tooltip.Content>
											</Tooltip.Root>
										</div>
										<span
											id={`group-registration-item-type-${group.id}`}
											data-test={`group-registration-item-type-${group.id}`}
											class="text-xs uppercase tracking-[0.08em] text-muted-foreground"
										>
											{getGroupTypeLabel(group.groupType)}
										</span>
									</div>
									<span
										id={`group-registration-item-status-${group.id}`}
										data-test={`group-registration-item-status-${group.id}`}
										class={group.active
											? 'rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700'
											: 'rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground'}
									>
										{group.active ? 'Ativo' : 'Inativo'}
									</span>
								</div>
								<div
									id={`group-registration-item-metadata-${group.id}`}
									data-test={`group-registration-item-metadata-${group.id}`}
									class="grid grid-cols-3 gap-3 text-sm"
								>
									<div
										id={`group-registration-item-floors-wrapper-${group.id}`}
										data-test={`group-registration-item-floors-wrapper-${group.id}`}
										class="flex flex-col gap-1"
									>
										<span
											id={`group-registration-item-floors-label-${group.id}`}
											data-test={`group-registration-item-floors-label-${group.id}`}
											class="text-xs uppercase tracking-[0.08em] text-muted-foreground"
										>
											Andares
										</span>
										<strong
											id={`group-registration-item-floors-value-${group.id}`}
											data-test={`group-registration-item-floors-value-${group.id}`}
											class="text-sm text-foreground"
										>
											{group.floors}
										</strong>
									</div>
									<div
										id={`group-registration-item-units-wrapper-${group.id}`}
										data-test={`group-registration-item-units-wrapper-${group.id}`}
										class="flex flex-col gap-1"
									>
										<span
											id={`group-registration-item-units-label-${group.id}`}
											data-test={`group-registration-item-units-label-${group.id}`}
											class="text-xs uppercase tracking-[0.08em] text-muted-foreground"
										>
											Unidades
										</span>
										<strong
											id={`group-registration-item-units-value-${group.id}`}
											data-test={`group-registration-item-units-value-${group.id}`}
											class="text-sm text-foreground"
										>
											{group.unitCount}
										</strong>
									</div>
									<div
										id={`group-registration-item-id-wrapper-${group.id}`}
										data-test={`group-registration-item-id-wrapper-${group.id}`}
										class="flex flex-col gap-1"
									>
										<span
											id={`group-registration-item-id-label-${group.id}`}
											data-test={`group-registration-item-id-label-${group.id}`}
											class="text-xs uppercase tracking-[0.08em] text-muted-foreground"
										>
											Identificador
										</span>
										<strong
											id={`group-registration-item-id-value-${group.id}`}
											data-test={`group-registration-item-id-value-${group.id}`}
											class="text-sm text-foreground"
										>
											#{group.id}
										</strong>
									</div>
								</div>
								<div
									id={`group-registration-item-footer-${group.id}`}
									data-test={`group-registration-item-footer-${group.id}`}
									class="flex flex-col gap-3 border-t pt-3"
								>
									<div
										id={`group-registration-item-insights-${group.id}`}
										data-test={`group-registration-item-insights-${group.id}`}
										class="grid grid-cols-1 gap-2"
									>
										<div
											id={`group-registration-item-insight-structure-${group.id}`}
											data-test={`group-registration-item-insight-structure-${group.id}`}
											class="rounded-lg bg-muted/50 px-3 py-2"
										>
											<div
												id={`group-registration-item-insight-structure-label-${group.id}`}
												data-test={`group-registration-item-insight-structure-label-${group.id}`}
												class="text-[11px] uppercase tracking-[0.08em] text-muted-foreground"
											>
												Estrutura
											</div>
											<div
												id={`group-registration-item-insight-structure-value-${group.id}`}
												data-test={`group-registration-item-insight-structure-value-${group.id}`}
												class="text-sm font-medium text-foreground"
											>
												{group.structureInsight}
											</div>
										</div>
									</div>
									<div
										id={`group-registration-item-management-row-${group.id}`}
										data-test={`group-registration-item-management-row-${group.id}`}
										class="flex items-center justify-end gap-3"
									>
										<span
											id={`group-registration-item-action-label-${group.id}`}
											data-test={`group-registration-item-action-label-${group.id}`}
											class={cn(
												'text-xs font-medium',
												group.canManage ? 'text-foreground' : 'text-muted-foreground'
											)}
										>
											{group.canManage ? 'Selecionar para editar' : 'Protegido'}
										</span>
									</div>
								</div>
							</button>
						{/each}
					</div>
				{/if}
			</Card.Content>
		</Card.Root>

		<Card.Root
			id="group-registration-form-card"
			data-test="group-registration-form-card"
			class="flex min-h-[42rem] flex-col"
		>
			<Card.Header id="group-registration-form-header" data-test="group-registration-form-header">
				<Card.Title id="group-registration-form-title" data-test="group-registration-form-title">
					{formTitle}
				</Card.Title>
				<Card.Description
					id="group-registration-form-description"
					data-test="group-registration-form-description"
				>
					{formDescription}
				</Card.Description>
			</Card.Header>
			<Card.Content
				id="group-registration-form-content"
				data-test="group-registration-form-content"
				class="flex flex-1 flex-col"
			>
				<form
					id="group-registration-form"
					data-test="group-registration-form"
					class="flex flex-1 flex-col gap-5"
					onsubmit={handleSubmit}
				>
					<div
						id="group-registration-type-section"
						data-test="group-registration-type-section"
						class="flex flex-col gap-3"
					>
						<Label
							id="group-registration-type-label"
							data-test="group-registration-type-label"
							for="group-registration-type-options"
						>
							Tipo do grupo
						</Label>
						<div
							id="group-registration-type-options"
							data-test="group-registration-type-options"
							class="grid grid-cols-1 gap-2 sm:grid-cols-2"
						>
							{#each groupTypeOptions as option}
								<button
									id={`group-registration-type-option-${option.value}`}
									data-test={`group-registration-type-option-${option.value}`}
									type="button"
									class={cn(
										'flex flex-col items-start gap-1 rounded-lg border px-3 py-3 text-left',
										selectedGroupType === option.value && 'border-primary bg-primary/5'
									)}
									disabled={formMode === 'edit' && !selectedGroupCanManage}
									onclick={() => {
										selectedGroupType = option.value;

										if (formMode === 'create') {
											groupName = option.value === 'block' ? getNextBlockName() : '';
											floorsValue = '';
											return;
										}

										groupName = normalizeGroupName(groupName, option.value);
									}}
								>
									<span
										id={`group-registration-type-option-title-${option.value}`}
										data-test={`group-registration-type-option-title-${option.value}`}
										class="text-sm font-medium text-foreground"
									>
										{option.label}
									</span>
									<span
										id={`group-registration-type-option-description-${option.value}`}
										data-test={`group-registration-type-option-description-${option.value}`}
										class="text-xs text-muted-foreground"
									>
										{option.description}
									</span>
								</button>
							{/each}
						</div>
					</div>

					<div
						id="group-registration-name-section"
						data-test="group-registration-name-section"
						class="flex flex-col gap-2"
					>
						<Label
							id="group-registration-name-label"
							data-test="group-registration-name-label"
							for="group-registration-name-input"
						>
							{nameFieldLabel}
						</Label>
						<Input
							id="group-registration-name-input"
							data-test="group-registration-name-input"
							name="name"
							maxlength={isBlockType ? 1 : 20}
							placeholder={nameFieldPlaceholder}
							value={groupName}
							disabled={formMode === 'edit' && !selectedGroupCanManage}
							oninput={(event) => {
								const target = event.currentTarget as HTMLInputElement;
								groupName = normalizeGroupName(target.value, selectedGroupType);
							}}
						/>
						<span
							id="group-registration-name-helper"
							data-test="group-registration-name-helper"
							class="text-xs text-muted-foreground"
						>
							{nameFieldDescription}
						</span>
					</div>

					<div
						id="group-registration-floors-section"
						data-test="group-registration-floors-section"
						class="flex flex-col gap-2"
					>
						<Label
							id="group-registration-floors-label"
							data-test="group-registration-floors-label"
							for="group-registration-floors-input"
						>
							Quantidade de andares
						</Label>
						<Input
							id="group-registration-floors-input"
							data-test="group-registration-floors-input"
							name="floors"
							type="number"
							min="0"
							inputmode="numeric"
							placeholder="0"
							value={floorsValue}
							disabled={formMode === 'edit' && !selectedGroupCanManage}
							oninput={(event) => {
								const target = event.currentTarget as HTMLInputElement;
								floorsValue = target.value;
							}}
						/>
					</div>

					<div
						id="group-registration-feedback"
						data-test="group-registration-feedback"
						aria-live="polite"
						class={cn(
							'min-h-[3.75rem] rounded-lg border px-3 py-2 text-sm',
							feedbackTone === 'error' && 'border-destructive/30 bg-destructive/5 text-destructive',
							feedbackTone === 'success' && 'border-emerald-300 bg-emerald-50 text-emerald-700',
							feedbackTone === 'idle' && 'invisible border-transparent'
						)}
					>
						{feedbackMessage || 'Mensagem de status'}
					</div>

					<div
						id="group-registration-form-actions"
						data-test="group-registration-form-actions"
						class="mt-auto flex min-h-[8.5rem] flex-col gap-2 sm:min-h-[2.5rem] sm:flex-row sm:flex-wrap sm:items-start"
					>
						<Button
							id="group-registration-submit-button"
							data-test="group-registration-submit-button"
							type="submit"
							disabled={isSubmitting || (formMode === 'edit' && !selectedGroupCanManage)}
						>
							{isSubmitting
								? 'Salvando...'
								: formMode === 'edit'
									? 'Salvar alterações'
									: 'Cadastrar grupo'}
						</Button>
						<Button
							id="group-registration-reset-button"
							data-test="group-registration-reset-button"
							type="button"
							variant="outline"
							disabled={isSubmitting || isDeleting}
							onclick={resetForm}
						>
							{formMode === 'edit' ? 'Cancelar edição' : 'Limpar formulário'}
						</Button>
						<Button
							id="group-registration-delete-button"
							data-test="group-registration-delete-button"
							type="button"
							variant="outline"
							class={cn(formMode === 'edit' ? '' : 'invisible')}
							disabled={formMode !== 'edit' || isDeleting || isSubmitting || !selectedGroupCanManage}
							aria-hidden={formMode !== 'edit'}
							onclick={handleDeleteSelectedGroup}
						>
							<Trash2Icon
								id="group-registration-delete-icon"
								data-test="group-registration-delete-icon"
							/>
							{isDeleting ? 'Excluindo...' : 'Excluir grupo'}
						</Button>
					</div>
				</form>
			</Card.Content>
		</Card.Root>
	</section>
	</main>
</Tooltip.Provider>
