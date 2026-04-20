<script lang="ts">
	import { goto } from '$app/navigation';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import SearchIcon from '@lucide/svelte/icons/search';
	import { onMount } from 'svelte';
	import CardEmpty from '$lib/components/app/card-empty/index.svelte';
	import UnitsDataTable, {
		type UnitListRow,
		type UnitOverdueHistoryPoint
	} from '$lib/components/app/units-data-table.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { listUnitGroups, type UnitGroup } from '$lib/services/unit-groups.js';
	import { listUnits, type Unit } from '$lib/services/units.js';

	interface Props {
		params: {
			code: string;
		};
	}

	let { params }: Props = $props();

	let groups = $state<UnitGroup[]>([]);
	let units = $state<Unit[]>([]);
	let searchTerm = $state('');
	let isLoading = $state(true);
	let errorMessage = $state('');

	const hasGroups = $derived(groups.length > 0);
	const hasUnits = $derived(units.length > 0);

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

	function getUnitGroupLabel(unit: Pick<Unit, 'group_type' | 'group_name'>): string {
		if (!unit.group_type || !unit.group_name) {
			return 'Sem grupo';
		}

		return `${getGroupTypeLabel(unit.group_type)} ${unit.group_name}`;
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

	function formatCurrency(value: number): string {
		return value.toLocaleString('pt-BR', {
			style: 'currency',
			currency: 'BRL',
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		});
	}

	function formatFloorLabel(value: string | null | undefined): string {
		const normalizedValue = value?.trim();

		if (!normalizedValue) {
			return 'Sem andar';
		}

		return `${normalizedValue}º andar`;
	}

	function getReferenceDate(monthOffset: number): string {
		const referenceDate = new Date();
		referenceDate.setDate(1);
		referenceDate.setMonth(referenceDate.getMonth() + monthOffset);

		return referenceDate.toISOString();
	}

	function getMockFinancialState(unit: Unit) {
		// Mock explícito até a API financeira por unidade existir.
		const seed = unit.id;
		const isOverdue = seed % 3 === 0 || seed % 5 === 0;

		if (!isOverdue) {
			const paidHistory = [-3, -2, -1, 0].map((monthOffset, index) => ({
				referenceDate: getReferenceDate(monthOffset),
				amount: 420 + ((seed + index) % 6) * 37
			})) satisfies UnitOverdueHistoryPoint[];

			return {
				financialStatusLabel: 'Adimplente',
				financialStatusTone: 'positive' as const,
				totalOverdueLabel: '-',
				overdueHistory: paidHistory
			};
		}

		const base = 180 + (seed % 7) * 95;
		const history = [base * 0.35, base * 0.55, base * 0.8, base * 1.1].map((value) =>
			Math.round(value)
		);
		const overdueHistory = [-3, -2, -1, 0].map((monthOffset, index) => ({
			referenceDate: getReferenceDate(monthOffset),
			amount: history[index] ?? 0
		})) satisfies UnitOverdueHistoryPoint[];

		return {
			financialStatusLabel: 'Inadimplente',
			financialStatusTone: 'negative' as const,
			totalOverdueLabel: formatCurrency(history[3]),
			overdueHistory
		};
	}

	const unitRows = $derived(
		units
			.map((unit) => {
				const financial = getMockFinancialState(unit);

				return {
					id: unit.id,
					code: unit.code,
					groupLabel: getUnitGroupLabel(unit),
					identifierLabel: unit.identifier,
					floorLabel: formatFloorLabel(unit.floor),
					privateAreaLabel: formatArea(unit.private_area),
					...financial
				} satisfies UnitListRow;
			})
			.filter((unit) => {
				const normalizedSearch = searchTerm.trim().toLowerCase();

				if (normalizedSearch.length === 0) {
					return true;
				}

				return [
					unit.code,
					unit.groupLabel,
					unit.identifierLabel,
					unit.floorLabel,
					unit.privateAreaLabel,
					unit.financialStatusLabel,
					unit.totalOverdueLabel
				]
					.join(' ')
					.toLowerCase()
					.includes(normalizedSearch);
			})
	);

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
		} catch (error) {
			errorMessage =
				error instanceof Error ? error.message : 'Não foi possível carregar as unidades.';
		} finally {
			isLoading = false;
		}
	}

	onMount(async () => {
		await loadPageData();
	});
</script>

<svelte:head>
	<title>Unidades</title>
</svelte:head>

<main class="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6">
	<section class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
		<div class="flex flex-col gap-1">
			<h1 class="text-2xl font-semibold tracking-tight text-foreground">Unidades</h1>
		</div>

		<Button
			type="button"
			onclick={() => {
				void goto(`/g/${params.code}/unidades/nova`);
			}}
		>
			<PlusIcon class="mr-2 size-4" />
			Adicionar unidade
		</Button>
	</section>

	<Card.Root>
		<Card.Header>
			<Card.Title>Listagem de unidades</Card.Title>
		</Card.Header>
		<Card.Content class="flex flex-col gap-4">
			<div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
				<div class="text-sm text-muted-foreground">
					{units.length} unidades cadastradas em {groups.length} grupos ativos.
				</div>

				<div class="relative w-full lg:max-w-xs">
					<SearchIcon
						class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
					/>
					<Input
						value={searchTerm}
						placeholder="Buscar por código, grupo, andar ou status"
						class="pl-9"
						oninput={(event) => {
							const target = event.currentTarget as HTMLInputElement;
							searchTerm = target.value;
						}}
					/>
				</div>
			</div>

			{#if isLoading}
				<div class="text-sm text-muted-foreground">Carregando unidades...</div>
			{:else if errorMessage}
				<div
					class="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
				>
					{errorMessage}
				</div>
			{:else if !hasGroups}
				<CardEmpty
					title="Cadastre grupos antes das unidades"
					description="As unidades dependem de um grupo registrado. Crie pelo menos um bloco, torre, setor, quadra ou fase para liberar o cadastro."
					actionLabel="Ir para grupos"
					onAction={() => {
						void goto(`/g/${params.code}/grupos`);
					}}
				/>
			{:else if !hasUnits}
				<CardEmpty
					title="Nenhuma unidade cadastrada"
					description="Tudo pronto para começar. Clique em adicionar unidade para abrir a tela de cadastro."
					actionLabel="Adicionar unidade"
					onAction={() => {
						void goto(`/g/${params.code}/unidades/nova`);
					}}
				/>
			{:else if unitRows.length === 0}
				<div
					class="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground"
				>
					Nenhuma unidade encontrada para o filtro informado.
				</div>
			{:else}
				<UnitsDataTable
					rows={unitRows}
					onView={(row) => {
						void goto(`/g/${params.code}/unidades/${row.id}`);
					}}
					onEdit={(row) => {
						void goto(`/g/${params.code}/unidades/${row.id}/editar`);
					}}
				/>
			{/if}
		</Card.Content>
	</Card.Root>
</main>
