<script lang="ts">
	import EyeIcon from '@lucide/svelte/icons/eye';
	import PencilLineIcon from '@lucide/svelte/icons/pencil-line';
	import ChevronsLeftIcon from '@lucide/svelte/icons/chevrons-left';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import ChevronsRightIcon from '@lucide/svelte/icons/chevrons-right';
	import UserIcon from '@lucide/svelte/icons/user';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { cn } from '$lib/utils.js';

	export interface ResidentListRow {
		id: number;
		name: string;
		cpf: string;
		phone: string;
		email: string;
		unitCode: string;
		typeLabel: string;
		type: 'owner' | 'tenant';
	}

	interface Props {
		rows: ResidentListRow[];
		onRowSelect?: (row: ResidentListRow) => void;
		onView?: (row: ResidentListRow) => void;
		onEdit?: (row: ResidentListRow) => void;
	}

	let { rows, onRowSelect, onView, onEdit }: Props = $props();

	let pageSize = $state(10);
	let currentPage = $state(1);

	const totalPages = $derived(Math.max(1, Math.ceil(rows.length / pageSize)));
	const pagedRows = $derived(rows.slice((currentPage - 1) * pageSize, currentPage * pageSize));

	$effect(() => {
		rows;
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
	<div class="overflow-hidden rounded-lg border">
		<Tooltip.Provider>
			<Table.Root class="text-sm">
				<Table.Header class="bg-muted/35">
					<Table.Row class="hover:bg-transparent">
						<Table.Head class="w-[200px] pl-4">Nome</Table.Head>
						<Table.Head class="w-[160px]">CPF</Table.Head>
						<Table.Head class="w-[160px]">Telefone</Table.Head>
						<Table.Head class="w-[200px]">E-mail</Table.Head>
						<Table.Head class="w-[140px]">Unidade</Table.Head>
						<Table.Head class="w-[130px]">Tipo</Table.Head>
						<Table.Head class="w-[120px] pr-4 text-right">Ações</Table.Head>
					</Table.Row>
				</Table.Header>

				<Table.Body>
					{#each pagedRows as row (row.id)}
						<Table.Row
							class={cn(onRowSelect ? 'cursor-pointer' : undefined)}
							onclick={() => onRowSelect?.(row)}
						>
							<Table.Cell class="pl-4">
								<div class="flex min-w-0 items-center gap-2">
									<UserIcon class="size-4 shrink-0 text-muted-foreground" />
									<div class="min-w-0">
										<div class="truncate font-medium text-foreground">{row.name}</div>
									</div>
								</div>
							</Table.Cell>

							<Table.Cell class="font-mono text-muted-foreground">{row.cpf}</Table.Cell>

							<Table.Cell class="text-muted-foreground">
								{row.phone || '—'}
							</Table.Cell>

							<Table.Cell class="text-muted-foreground">
								<div class="truncate">{row.email || '—'}</div>
							</Table.Cell>

							<Table.Cell>
								{#if row.unitCode}
									<span
										class="rounded-full border border-border/70 px-2 py-1 text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase"
									>
										{row.unitCode}
									</span>
								{:else}
									<span class="text-muted-foreground">—</span>
								{/if}
							</Table.Cell>

							<Table.Cell>
								<span
									class={cn(
										'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
										row.type === 'owner'
											? 'bg-sky-100 text-sky-700'
											: 'bg-amber-100 text-amber-700'
									)}
								>
									{row.typeLabel}
								</span>
							</Table.Cell>

							<Table.Cell class="pr-4 text-right">
								<div class="flex items-center justify-end gap-2">
									{#if onView}
										<Tooltip.Root>
											<Tooltip.Trigger>
												<Button
													type="button"
													variant="outline"
													size="icon"
													class="size-8"
													aria-label="Ver morador"
													onclick={(event) => {
														event.stopPropagation();
														onView(row);
													}}
												>
													<EyeIcon class="size-4" />
												</Button>
											</Tooltip.Trigger>
											<Tooltip.Content side="top">Ver morador</Tooltip.Content>
										</Tooltip.Root>
									{/if}

									{#if onEdit}
										<Tooltip.Root>
											<Tooltip.Trigger>
												<Button
													type="button"
													variant="outline"
													size="icon"
													class="size-8"
													aria-label="Editar morador"
													onclick={(event) => {
														event.stopPropagation();
														onEdit(row);
													}}
												>
													<PencilLineIcon class="size-4" />
												</Button>
											</Tooltip.Trigger>
											<Tooltip.Content side="top">Editar morador</Tooltip.Content>
										</Tooltip.Root>
									{/if}
								</div>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</Tooltip.Provider>
	</div>

	<div class="flex flex-col gap-3 px-1 lg:flex-row lg:items-center lg:justify-between">
		<div class="text-sm text-muted-foreground">
			Mostrando {pagedRows.length} de {rows.length} moradores encontrados.
		</div>

		<div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
			<div class="flex items-center gap-2 sm:shrink-0">
				<Label class="text-sm font-medium whitespace-nowrap">Linhas por página</Label>
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
