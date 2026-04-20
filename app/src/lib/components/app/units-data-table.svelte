<script lang="ts">
	import EyeIcon from '@lucide/svelte/icons/eye';
	import PencilLineIcon from '@lucide/svelte/icons/pencil-line';
	import ChevronsLeftIcon from '@lucide/svelte/icons/chevrons-left';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import ChevronsRightIcon from '@lucide/svelte/icons/chevrons-right';
	import DoorOpenIcon from '@lucide/svelte/icons/door-open';
	import FinancialStatusBadge from '$lib/components/app/FinancialStatusBadge.svelte';
	import UnitOverdueMiniChart from '$lib/components/app/unit-overdue-mini-chart.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { cn } from '$lib/utils.js';

	export interface UnitOverdueHistoryPoint {
		referenceDate: string;
		amount: number;
	}

	export interface UnitListRow {
		id: number;
		code: string;
		groupLabel: string;
		identifierLabel: string;
		floorLabel: string;
		privateAreaLabel: string;
		financialStatusLabel: string;
		financialStatusTone: 'positive' | 'negative';
		totalOverdueLabel: string;
		overdueHistory: UnitOverdueHistoryPoint[];
	}

	interface Props {
		rows: UnitListRow[];
		onRowSelect?: (row: UnitListRow) => void;
		onView?: (row: UnitListRow) => void;
		onEdit?: (row: UnitListRow) => void;
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
						<Table.Head class="w-55 pl-4">Unidade</Table.Head>
						<Table.Head class="w-[170px]">Grupo</Table.Head>
						<Table.Head class="w-[120px]">Área privativa</Table.Head>
						<Table.Head class="w-[140px]">Status</Table.Head>
						<Table.Head class="w-[180px]">Em aberto</Table.Head>
						<Table.Head class="w-[220px]">Últimos 4 meses</Table.Head>
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
									<DoorOpenIcon class="size-4 shrink-0 text-muted-foreground" />
									<div class="min-w-0">
										<div class="font-medium text-foreground">
											{row.floorLabel} · {row.identifierLabel}
										</div>
										<div class="truncate text-xs text-muted-foreground">{row.code}</div>
									</div>
								</div>
							</Table.Cell>

							<Table.Cell class="text-muted-foreground">{row.groupLabel}</Table.Cell>

							<Table.Cell class="text-muted-foreground">{row.privateAreaLabel}</Table.Cell>

							<Table.Cell>
								<FinancialStatusBadge
									status={row.financialStatusTone === 'positive' ? 'adimplente' : 'inadimplente'}
								/>
							</Table.Cell>

							<Table.Cell
								class={cn(
									'font-medium',
									row.financialStatusTone === 'positive' ? 'text-muted-foreground' : 'text-rose-700'
								)}
							>
								{row.totalOverdueLabel}
							</Table.Cell>

							<Table.Cell>
								<UnitOverdueMiniChart values={row.overdueHistory} tone={row.financialStatusTone} />
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
													aria-label="Ver histórico financeiro da unidade"
													onclick={(event) => {
														event.stopPropagation();
														onView(row);
													}}
												>
													<EyeIcon class="size-4" />
												</Button>
											</Tooltip.Trigger>
											<Tooltip.Content side="top">Ver histórico financeiro</Tooltip.Content>
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
													aria-label="Editar unidade"
													onclick={(event) => {
														event.stopPropagation();
														onEdit(row);
													}}
												>
													<PencilLineIcon class="size-4" />
												</Button>
											</Tooltip.Trigger>
											<Tooltip.Content side="top">Editar unidade</Tooltip.Content>
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
			Mostrando {pagedRows.length} de {rows.length} unidades encontradas.
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
