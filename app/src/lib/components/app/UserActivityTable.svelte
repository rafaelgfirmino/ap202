<script lang="ts">
	import SearchIcon from '@lucide/svelte/icons/search';
	import ChevronsLeftIcon from '@lucide/svelte/icons/chevrons-left';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import ChevronsRightIcon from '@lucide/svelte/icons/chevrons-right';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import type { UserAuditEntry } from '$lib/services/users.js';
	import { cn } from '$lib/utils.js';

	interface Props {
		rows: UserAuditEntry[];
	}

	type ActivityFilter =
		| 'all'
		| 'invite_sent'
		| 'invite_accepted'
		| 'role_updated'
		| 'user_unlinked'
		| 'transfer_requested'
		| 'transfer_accepted'
		| 'actor_changed';

	let { rows }: Props = $props();

	let searchTerm = $state('');
	let actionFilter = $state<ActivityFilter>('all');
	let pageSize = $state(10);
	let currentPage = $state(1);

	const actionLabels: Record<ActivityFilter, string> = {
		all: 'Todas as ações',
		invite_sent: 'Convites enviados',
		invite_accepted: 'Convites aceitos',
		role_updated: 'Roles alteradas',
		user_unlinked: 'Desvinculações',
		transfer_requested: 'Transferências iniciadas',
		transfer_accepted: 'Transferências aceitas',
		actor_changed: 'Sessão alterada'
	};

	function formatDate(value: string): string {
		return new Intl.DateTimeFormat('pt-BR', {
			dateStyle: 'short'
		}).format(new Date(value));
	}

	function formatDateTime(value: string): string {
		return new Intl.DateTimeFormat('pt-BR', {
			dateStyle: 'short',
			timeStyle: 'short'
		}).format(new Date(value));
	}

	const filteredRows = $derived(
		rows.filter((row) => {
			const normalizedSearch = searchTerm.trim().toLowerCase();
			const matchesAction = actionFilter === 'all' || row.action === actionFilter;
			const matchesSearch =
				normalizedSearch.length === 0 ||
				[row.description, row.actorName, formatDate(row.createdAt), formatDateTime(row.createdAt)]
					.join(' ')
					.toLowerCase()
					.includes(normalizedSearch);

			return matchesAction && matchesSearch;
		})
	);

	const totalPages = $derived(Math.max(1, Math.ceil(filteredRows.length / pageSize)));
	const pagedRows = $derived(
		filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize)
	);

	$effect(() => {
		rows;
		searchTerm;
		actionFilter;
		currentPage = 1;
	});

	$effect(() => {
		pageSize;
		currentPage = 1;
	});

	$effect(() => {
		if (currentPage > totalPages) {
			currentPage = totalPages;
		}
	});
</script>

<div class="flex flex-col gap-4">
	<div class="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
		<div class="text-sm text-muted-foreground">
			{rows.length} ações registradas nesta linha do tempo.
		</div>

		<div class="grid grid-cols-1 gap-3 xl:grid-cols-[280px_220px]">
			<div class="relative w-full">
				<SearchIcon
					class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
				/>
				<Input
					value={searchTerm}
					placeholder="Buscar por data, ator ou ação"
					class="pl-9"
					oninput={(event) => {
						searchTerm = (event.currentTarget as HTMLInputElement).value;
					}}
				/>
			</div>

			<select
				id="user-activity-filter"
				data-test="user-activity-filter"
				class="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
				value={actionFilter}
				onchange={(event) => {
					actionFilter = (event.currentTarget as HTMLSelectElement).value as ActivityFilter;
				}}
			>
				{#each Object.entries(actionLabels) as [value, label] (value)}
					<option {value}>{label}</option>
				{/each}
			</select>
		</div>
	</div>

	<div class="overflow-hidden rounded-lg border">
		<Table.Root class="text-sm">
			<Table.Header class="bg-muted/35">
				<Table.Row class="hover:bg-transparent">
					<Table.Head class="w-[160px] pl-4">Data</Table.Head>
					<Table.Head>Ação</Table.Head>
				</Table.Row>
			</Table.Header>

			<Table.Body>
				{#if pagedRows.length === 0}
					<Table.Row class="hover:bg-transparent">
						<Table.Cell class="px-4 py-8 text-center text-muted-foreground" colspan={2}>
							Nenhuma ação encontrada para os filtros informados.
						</Table.Cell>
					</Table.Row>
				{:else}
					{#each pagedRows as row (row.id)}
						<Table.Row>
							<Table.Cell class="pl-4 align-top text-muted-foreground">
								{formatDate(row.createdAt)}
							</Table.Cell>
							<Table.Cell class="align-top">
								<div class="flex flex-col gap-1">
									<p class="text-sm text-foreground">{row.description}</p>
									<p class="text-xs text-muted-foreground">
										Registrado por {row.actorName} em {formatDateTime(row.createdAt)}
									</p>
								</div>
							</Table.Cell>
						</Table.Row>
					{/each}
				{/if}
			</Table.Body>
		</Table.Root>
	</div>

	<div class="flex flex-col gap-3 px-1 lg:flex-row lg:items-center lg:justify-between">
		<div class="text-sm text-muted-foreground">
			Mostrando {pagedRows.length} de {filteredRows.length} ações encontradas.
		</div>

		<div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
			<div class="flex items-center gap-2 sm:shrink-0">
				<Label class="text-sm font-medium whitespace-nowrap">Itens por página</Label>
				<div class="flex items-center overflow-hidden rounded-md border border-input">
					{#each [5, 10, 20, 30] as size}
						<button
							type="button"
							class={cn(
								'h-9 min-w-10 border-r px-3 text-sm font-medium transition-colors last:border-r-0',
								pageSize === size
									? 'bg-primary text-primary-foreground'
									: 'bg-background text-foreground hover:bg-muted'
							)}
							onclick={() => {
								pageSize = size;
							}}
						>
							{size}
						</button>
					{/each}
				</div>
			</div>

			<div class="flex flex-wrap items-center gap-2 sm:justify-end">
				<div class="text-sm font-medium whitespace-nowrap text-foreground">
					Página {currentPage} de {totalPages}
				</div>
				<div class="flex items-center gap-2">
					<Button
						variant="outline"
						size="icon"
						class="hidden sm:flex"
						disabled={currentPage <= 1}
						onclick={() => {
							currentPage = 1;
						}}
					>
						<ChevronsLeftIcon class="size-4" />
					</Button>
					<Button
						variant="outline"
						size="icon"
						disabled={currentPage <= 1}
						onclick={() => {
							currentPage -= 1;
						}}
					>
						<ChevronLeftIcon class="size-4" />
					</Button>
					<Button
						variant="outline"
						size="icon"
						disabled={currentPage >= totalPages}
						onclick={() => {
							currentPage += 1;
						}}
					>
						<ChevronRightIcon class="size-4" />
					</Button>
					<Button
						variant="outline"
						size="icon"
						class="hidden sm:flex"
						disabled={currentPage >= totalPages}
						onclick={() => {
							currentPage = totalPages;
						}}
					>
						<ChevronsRightIcon class="size-4" />
					</Button>
				</div>
			</div>
		</div>
	</div>
</div>
