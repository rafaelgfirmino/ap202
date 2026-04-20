<script lang="ts">
	import { goto } from '$app/navigation';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import SearchIcon from '@lucide/svelte/icons/search';
	import { onMount } from 'svelte';
	import CardEmpty from '$lib/components/app/card-empty/index.svelte';
	import ResidentsDataTable, {
		type ResidentListRow
	} from '$lib/components/app/residents-data-table.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { listResidents, type Resident } from '$lib/services/residents.js';

	interface Props {
		params: {
			code: string;
		};
	}

	let { params }: Props = $props();

	let residents = $state<Resident[]>([]);
	let searchTerm = $state('');
	let isLoading = $state(true);
	let errorMessage = $state('');

	const hasResidents = $derived(residents.length > 0);

	function getTypeLabel(type: 'owner' | 'tenant'): string {
		return type === 'owner' ? 'Proprietário' : 'Inquilino';
	}

	const residentRows = $derived(
		residents
			.map((r) => ({
				id: r.id,
				name: r.name,
				cpf: r.cpf,
				phone: r.phone,
				email: r.email,
				unitCode: r.unit_code ?? '',
				typeLabel: getTypeLabel(r.type),
				type: r.type
			}) satisfies ResidentListRow)
			.filter((r) => {
				const normalizedSearch = searchTerm.trim().toLowerCase();

				if (normalizedSearch.length === 0) {
					return true;
				}

				return [r.name, r.cpf, r.phone, r.email, r.unitCode, r.typeLabel]
					.join(' ')
					.toLowerCase()
					.includes(normalizedSearch);
			})
	);

	async function loadPageData(): Promise<void> {
		isLoading = true;
		errorMessage = '';

		try {
			const response = await listResidents(params.code);
			residents = response.data;
		} catch (error) {
			errorMessage =
				error instanceof Error ? error.message : 'Não foi possível carregar os moradores.';
		} finally {
			isLoading = false;
		}
	}

	onMount(async () => {
		await loadPageData();
	});
</script>

<svelte:head>
	<title>Moradores</title>
</svelte:head>

<main class="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6">
	<section class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
		<div class="flex flex-col gap-1">
			<h1 class="text-2xl font-semibold tracking-tight text-foreground">Moradores</h1>
		</div>

		<Button
			type="button"
			onclick={() => {
				void goto(`/g/${params.code}/moradores/novo`);
			}}
		>
			<PlusIcon class="mr-2 size-4" />
			Adicionar morador
		</Button>
	</section>

	<Card.Root>
		<Card.Header>
			<Card.Title>Listagem de moradores</Card.Title>
		</Card.Header>
		<Card.Content class="flex flex-col gap-4">
			<div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
				<div class="text-sm text-muted-foreground">
					{residents.length} moradores cadastrados.
				</div>

				<div class="relative w-full lg:max-w-xs">
					<SearchIcon
						class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
					/>
					<Input
						value={searchTerm}
						placeholder="Buscar por nome, CPF, unidade ou tipo"
						class="pl-9"
						oninput={(event) => {
							const target = event.currentTarget as HTMLInputElement;
							searchTerm = target.value;
						}}
					/>
				</div>
			</div>

			{#if isLoading}
				<div class="text-sm text-muted-foreground">Carregando moradores...</div>
			{:else if errorMessage}
				<div
					class="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
				>
					{errorMessage}
				</div>
			{:else if !hasResidents}
				<CardEmpty
					title="Nenhum morador cadastrado"
					description="Tudo pronto para começar. Clique em adicionar morador para abrir a tela de cadastro."
					actionLabel="Adicionar morador"
					onAction={() => {
						void goto(`/g/${params.code}/moradores/novo`);
					}}
				/>
			{:else if residentRows.length === 0}
				<div
					class="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground"
				>
					Nenhum morador encontrado para o filtro informado.
				</div>
			{:else}
				<ResidentsDataTable
					rows={residentRows}
					onView={(row) => {
						void goto(`/g/${params.code}/moradores/${row.id}`);
					}}
					onEdit={(row) => {
						void goto(`/g/${params.code}/moradores/${row.id}/editar`);
					}}
				/>
			{/if}
		</Card.Content>
	</Card.Root>
</main>
