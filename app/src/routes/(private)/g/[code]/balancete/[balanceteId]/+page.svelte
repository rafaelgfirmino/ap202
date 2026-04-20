<script lang="ts">
	import { goto } from '$app/navigation';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import ChevronsLeftIcon from '@lucide/svelte/icons/chevrons-left';
	import ChevronsRightIcon from '@lucide/svelte/icons/chevrons-right';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import LockIcon from '@lucide/svelte/icons/lock';
	import LockOpenIcon from '@lucide/svelte/icons/lock-open';
	import Pencil2Icon from '@lucide/svelte/icons/pencil';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import SearchIcon from '@lucide/svelte/icons/search';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import TrendingDownIcon from '@lucide/svelte/icons/trending-down';
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
	import { onMount } from 'svelte';
	import Logo from '$lib/components/app/logo/index.svelte';
	import CardEmpty from '$lib/components/app/card-empty/index.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import {
		closeBalancete,
		deleteEntry,
		getBalancete,
		listEntries,
		reopenBalancete,
		type Balancete,
		type BalanceteEntry
	} from '$lib/services/balancete.js';
	import { listUnits, type Unit } from '$lib/services/units.js';
	import { cn } from '$lib/utils.js';

	interface Props {
		params: { code: string; balanceteId: string };
	}

	let { params }: Props = $props();

	const balanceteId = $derived(
		Number.isFinite(Number(params.balanceteId)) ? Number(params.balanceteId) : null
	);

	let balancete = $state<Balancete | null>(null);
	let entries = $state<BalanceteEntry[]>([]);
	let units = $state<Unit[]>([]);
	let isLoading = $state(true);
	let isActing = $state(false);
	let deletingId = $state<number | null>(null);
	let errorMessage = $state('');
	let rateioBlockFilter = $state('all');
	let rateioUnitFilter = $state('');
	let rateioPageSize = $state(20);
	let rateioCurrentPage = $state(1);

	let showCloseDialog = $state(false);
	let closeDueDate = $state('');

	const ROW_COLORS = [
		'bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700',
		'bg-purple-100 text-purple-700', 'bg-amber-100 text-amber-700',
		'bg-rose-100 text-rose-700', 'bg-sky-100 text-sky-700',
		'bg-indigo-100 text-indigo-700', 'bg-teal-100 text-teal-700'
	];

	function formatMonth(month: string): string {
		const [year, m] = month.split('-');
		const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
		return `${months[Number(m) - 1] ?? m} / ${year}`;
	}

	function formatCurrency(v: number): string {
		return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
	}

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('pt-BR');
	}

	function getScopeLabel(entry: BalanceteEntry): string {
		if (entry.scope === 'geral') return 'Geral';
		if (entry.scope === 'bloco') return `Bloco ${entry.scope_value ?? ''}`;
		return entry.scope_value ?? 'Unidade';
	}

	function getRateioLabel(method: string | null): string {
		if (!method) return '—';
		return ({ fracao: 'Fração ideal', igual: 'Partes iguais', area: 'Por m²' } as Record<string, string>)[method] ?? method;
	}

	// --- rateio calculation ---

	function getEntryScopeUnits(entry: BalanceteEntry): Unit[] {
		if (entry.scope === 'geral') return units;
		if (entry.scope === 'bloco') return units.filter((u) => u.group_name === entry.scope_value);
		return units.filter((u) => String(u.id) === entry.scope_value);
	}

	function calcUnitEntryValue(unit: Unit, entry: BalanceteEntry, scopeUnits: Unit[]): number {
		if (entry.scope === 'unidade') return entry.total_value;
		const method = entry.rateio_method;
		if (!method || method === 'igual') return entry.total_value / (scopeUnits.length || 1);
		if (method === 'area') {
			const totalArea = scopeUnits.reduce((s, u) => s + (u.private_area ?? 0), 0);
			if (totalArea === 0) return entry.total_value / (scopeUnits.length || 1);
			return entry.total_value * ((unit.private_area ?? 0) / totalArea);
		}
		// fracao
		const totalFrac = scopeUnits.reduce((s, u) => s + (u.ideal_fraction ?? 0), 0);
		if (totalFrac === 0) return entry.total_value / (scopeUnits.length || 1);
		return entry.total_value * ((unit.ideal_fraction ?? 0) / totalFrac);
	}

	// --- derived state ---

	const isOpen = $derived(balancete?.status === 'open');

	const expenseEntries = $derived(entries.filter((e) => e.kind === 'expense'));
	const revenueEntries = $derived(entries.filter((e) => e.kind === 'revenue'));
	const totalExpenses = $derived(expenseEntries.reduce((s, e) => s + e.total_value, 0));
	const totalRevenues = $derived(revenueEntries.reduce((s, e) => s + e.total_value, 0));

	// Per-unit aggregate from all expense entries
	const rateioRows = $derived.by(() => {
		if (expenseEntries.length === 0 || units.length === 0) return [];

		const totals = new Map<number, number>();
		for (const entry of expenseEntries) {
			const scopeUnits = getEntryScopeUnits(entry);
			for (const unit of scopeUnits) {
				const v = calcUnitEntryValue(unit, entry, scopeUnits);
				totals.set(unit.id, (totals.get(unit.id) ?? 0) + v);
			}
		}

		return units
			.filter((u) => totals.has(u.id))
			.map((u) => ({ unit: u, total: totals.get(u.id)! }))
			.sort((a, b) => {
				const g = (a.unit.group_name ?? '').localeCompare(b.unit.group_name ?? '');
				return g !== 0 ? g : a.unit.identifier.localeCompare(b.unit.identifier);
			});
	});

	const rateioMax = $derived(
		rateioRows.length ? Math.max(...rateioRows.map((r) => r.total)) : 0
	);

	const rateioBlockOptions = $derived.by(() => {
		const blocks = Array.from(
			new Set(rateioRows.map((row) => row.unit.group_name ?? 'Sem grupo'))
		).sort((a, b) => a.localeCompare(b));

		return ['all', ...blocks];
	});

	const filteredRateioRows = $derived(
		rateioRows.filter((row) => {
			const blockName = row.unit.group_name ?? 'Sem grupo';
			if (rateioBlockFilter !== 'all' && blockName !== rateioBlockFilter) {
				return false;
			}

			const normalizedFilter = rateioUnitFilter.trim().toLowerCase();

			if (normalizedFilter.length === 0) {
				return true;
			}

			return [
				row.unit.code,
				row.unit.identifier,
				row.unit.group_name ?? '',
				row.unit.floor ?? ''
			]
				.join(' ')
				.toLowerCase()
				.includes(normalizedFilter);
		})
	);

	const rateioTotalPages = $derived(
		Math.max(1, Math.ceil(filteredRateioRows.length / rateioPageSize))
	);

	const pagedRateioRows = $derived(
		filteredRateioRows.slice(
			(rateioCurrentPage - 1) * rateioPageSize,
			rateioCurrentPage * rateioPageSize
		)
	);

	const filteredRateioGroupCount = $derived.by(() => {
		const groupNames = new Set(filteredRateioRows.map((row) => row.unit.group_name ?? 'Sem grupo'));
		return groupNames.size;
	});

	// Grouped by block for the rateio tab
	const rateioGroups = $derived.by(() => {
		const map = new Map<string, typeof rateioRows>();
		for (const row of pagedRateioRows) {
			const key = row.unit.group_name ?? 'Sem grupo';
			if (!map.has(key)) map.set(key, []);
			map.get(key)!.push(row);
		}
		return Array.from(map.entries()).map(([name, rows], i) => ({
			name,
			rows,
			colorIndex: i,
			subtotal: rows.reduce((s, r) => s + r.total, 0)
		}));
	});

	// --- actions ---

	async function loadData(): Promise<void> {
		if (!balanceteId) { errorMessage = 'Balancete inválido.'; isLoading = false; return; }
		isLoading = true;
		errorMessage = '';
		try {
			const [b, e, u] = await Promise.all([
				getBalancete(params.code, balanceteId),
				listEntries(params.code, balanceteId),
				listUnits(params.code)
			]);
			balancete = b;
			entries = e;
			units = u.data;
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Não foi possível carregar o balancete.';
		} finally {
			isLoading = false;
		}
	}

	async function handleClose(): Promise<void> {
		if (!balanceteId || !closeDueDate) return;
		isActing = true;
		showCloseDialog = false;
		try { balancete = await closeBalancete(params.code, balanceteId, closeDueDate); }
		catch (error) { errorMessage = error instanceof Error ? error.message : 'Não foi possível fechar o balancete.'; }
		finally { isActing = false; }
	}

	async function handleReopen(): Promise<void> {
		if (!balanceteId) return;
		isActing = true;
		try { balancete = await reopenBalancete(params.code, balanceteId); }
		catch (error) { errorMessage = error instanceof Error ? error.message : 'Não foi possível reabrir o balancete.'; }
		finally { isActing = false; }
	}

	async function handleDelete(entryId: number): Promise<void> {
		if (!balanceteId) return;
		deletingId = entryId;
		try {
			await deleteEntry(params.code, balanceteId, entryId);
			entries = entries.filter((e) => e.id !== entryId);
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Não foi possível excluir o lançamento.';
		} finally { deletingId = null; }
	}

	$effect(() => {
		rateioPageSize;
		rateioCurrentPage = 1;
	});

	$effect(() => {
		rateioRows;
		rateioCurrentPage = 1;
	});

	$effect(() => {
		rateioBlockFilter;
		rateioCurrentPage = 1;
	});

	$effect(() => {
		rateioUnitFilter;
		rateioCurrentPage = 1;
	});

	$effect(() => {
		if (rateioCurrentPage > rateioTotalPages) {
			rateioCurrentPage = rateioTotalPages;
		}
	});

	onMount(async () => { await loadData(); });
</script>

<svelte:head>
	<title>{balancete ? `Balancete ${formatMonth(balancete.month)}` : 'Balancete'}</title>
</svelte:head>

<main class="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6">
	{#if isLoading}
		<Card.Root>
			<Card.Content class="py-10">
				<div class="flex flex-col items-center justify-center gap-4 text-center">
					<div class="rounded-2xl border border-border/70 bg-background p-4 shadow-sm"><Logo class="h-10" /></div>
					<p class="text-sm text-muted-foreground">Carregando balancete…</p>
				</div>
			</Card.Content>
		</Card.Root>
	{:else if errorMessage && !balancete}
		<div class="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{errorMessage}</div>
	{:else if balancete}

		<!-- HEADER -->
		<section class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
			<div class="flex flex-col gap-2">
				<div class="flex items-center gap-3">
					<h1 class="text-2xl font-semibold tracking-tight text-foreground">
						Balancete de {formatMonth(balancete.month)}
					</h1>
					<span class={cn(
						'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
						isOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'
					)}>
						{#if isOpen}<LockOpenIcon class="size-3" /> Aberto
						{:else}<LockIcon class="size-3" /> Fechado{/if}
					</span>
				</div>
				{#if !isOpen && balancete.closed_at}
					<p class="text-sm text-muted-foreground">
						Fechado em {formatDate(balancete.closed_at)}
						{#if balancete.due_date} · Vencimento {new Date(balancete.due_date + 'T00:00:00').toLocaleDateString('pt-BR')}{/if}
						· Nenhum novo lançamento pode ser adicionado.
					</p>
				{/if}
			</div>

			<div class="flex flex-wrap items-center gap-2">
				{#if isOpen}
					<Button type="button" variant="outline" disabled={isActing} onclick={() => { closeDueDate = ''; showCloseDialog = true; }}>
						<LockIcon class="mr-2 size-4" />
						{isActing ? 'Fechando…' : 'Fechar balancete'}
					</Button>
					<Button type="button" onclick={() => void goto(`/g/${params.code}/balancete/${balanceteId}/lancar`)}>
						<PlusIcon class="mr-2 size-4" />
						Novo lançamento
					</Button>
				{:else}
					<Button type="button" variant="outline" disabled={isActing} onclick={handleReopen}>
						<LockOpenIcon class="mr-2 size-4" />
						{isActing ? 'Reabrindo…' : 'Reabrir balancete'}
					</Button>
				{/if}
				<Button type="button" variant="ghost" onclick={() => void goto(`/g/${params.code}/balancete`)}>
					<ArrowLeftIcon class="mr-2 size-4" />
					Todos os balancetes
				</Button>
			</div>
		</section>

		<!-- DIALOG: fechar balancete -->
		<Dialog.Root bind:open={showCloseDialog}>
			<Dialog.Content class="max-w-sm">
				<Dialog.Header>
					<Dialog.Title>Fechar balancete</Dialog.Title>
					<Dialog.Description>
						Defina o vencimento dos boletos. Após fechar, nenhum novo lançamento poderá ser adicionado.
					</Dialog.Description>
				</Dialog.Header>
				<div class="space-y-2 py-2">
					<Label for="close-due-date">Vencimento dos boletos</Label>
					<Input id="close-due-date" type="date" value={closeDueDate}
						oninput={(e) => { closeDueDate = (e.currentTarget as HTMLInputElement).value; }}
					/>
				</div>
				<Dialog.Footer>
					<Button variant="outline" onclick={() => { showCloseDialog = false; }} disabled={isActing}>
						Cancelar
					</Button>
					<Button onclick={handleClose} disabled={isActing || !closeDueDate}>
						{isActing ? 'Fechando…' : 'Fechar balancete'}
					</Button>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Root>

		{#if errorMessage}
			<div class="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{errorMessage}</div>
		{/if}

		<!-- SUMMARY CARDS -->
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
			<Card.Root>
				<Card.Content class="flex items-center gap-4 py-4">
					<div class="flex size-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
						<TrendingDownIcon class="size-5" />
					</div>
					<div>
						<div class="text-xs text-muted-foreground">Total de despesas</div>
						<div class="text-xl font-bold text-foreground">{formatCurrency(totalExpenses)}</div>
						<div class="text-xs text-muted-foreground">{expenseEntries.length} lançamentos</div>
					</div>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Content class="flex items-center gap-4 py-4">
					<div class="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
						<TrendingUpIcon class="size-5" />
					</div>
					<div>
						<div class="text-xs text-muted-foreground">Receitas (informacional)</div>
						<div class="text-xl font-bold text-foreground">{formatCurrency(totalRevenues)}</div>
						<div class="text-xs text-muted-foreground">{revenueEntries.length} lançamentos</div>
					</div>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Content class="flex items-center gap-4 py-4">
					<div class="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
						<TrendingDownIcon class="size-5" />
					</div>
					<div>
						<div class="text-xs text-muted-foreground">A ratear pelas unidades</div>
						<div class="text-xl font-bold text-foreground">{formatCurrency(totalExpenses)}</div>
						<div class="text-xs text-muted-foreground">Receitas não abaterão cobranças</div>
					</div>
				</Card.Content>
			</Card.Root>
		</div>

		<!-- TABS: LANÇAMENTOS | RATEIO -->
		<Card.Root class="overflow-hidden">
			<Tabs.Root value="lancamentos">
				<Card.Header class="border-b pb-0">
					<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<Card.Title>Detalhamento</Card.Title>
						<Tabs.List>
							<Tabs.Trigger value="lancamentos">Lançamentos</Tabs.Trigger>
							<Tabs.Trigger value="rateio">Rateio por unidade</Tabs.Trigger>
						</Tabs.List>
					</div>
				</Card.Header>

				<!-- TAB: LANÇAMENTOS -->
				<Tabs.Content value="lancamentos" class="mt-0">
					{#if entries.length === 0}
						<div class="p-4">
							<CardEmpty
								title="Nenhum lançamento ainda"
								description={isOpen ? 'Este balancete está aberto. Adicione despesas e receitas do mês.' : 'Este balancete foi fechado sem lançamentos.'}
								actionLabel={isOpen ? 'Adicionar lançamento' : ''}
								onAction={isOpen ? () => void goto(`/g/${params.code}/balancete/${balanceteId}/lancar`) : undefined}
							/>
						</div>
					{:else}
						<Tooltip.Provider>
							<Table.Root class="text-sm">
								<Table.Header class="bg-muted/35">
									<Table.Row class="hover:bg-transparent">
										<Table.Head class="w-24 pl-6">Tipo</Table.Head>
										<Table.Head class="w-36">Categoria</Table.Head>
										<Table.Head class="w-32">Escopo</Table.Head>
										<Table.Head class="w-32">Rateio</Table.Head>
										<Table.Head>Descrição</Table.Head>
										<Table.Head class="w-28">Vencimento</Table.Head>
										<Table.Head class="w-32 text-right">Valor</Table.Head>
										{#if isOpen}<Table.Head class="w-24 pr-6 text-right">Ações</Table.Head>{/if}
									</Table.Row>
								</Table.Header>
								<Table.Body>
									{#each entries as entry (entry.id)}
										<Table.Row>
											<Table.Cell class="pl-6">
												<Tooltip.Root>
													<Tooltip.Trigger>
														<span class={cn(
															'inline-flex cursor-default items-center rounded-full px-2 py-0.5 text-xs font-medium',
															entry.kind === 'expense' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
														)}>
															{entry.kind === 'expense' ? 'Despesa' : 'Receita'}
														</span>
													</Tooltip.Trigger>
													{#if entry.description}
														<Tooltip.Content side="right" class="max-w-64">{entry.description}</Tooltip.Content>
													{/if}
												</Tooltip.Root>
											</Table.Cell>
											<Table.Cell class="font-medium">{entry.category}</Table.Cell>
											<Table.Cell class="text-muted-foreground">{getScopeLabel(entry)}</Table.Cell>
											<Table.Cell class="text-muted-foreground">
												{entry.kind === 'revenue' ? '—' : getRateioLabel(entry.rateio_method)}
											</Table.Cell>
											<Table.Cell class="max-w-xs text-muted-foreground">
												<div class="truncate">{entry.description || '—'}</div>
											</Table.Cell>
											<Table.Cell class="text-muted-foreground">
												{entry.due_date ? new Date(entry.due_date + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
											</Table.Cell>
											<Table.Cell class="text-right font-bold">
												<span class={entry.kind === 'expense' ? 'text-rose-700' : 'text-emerald-700'}>
													{entry.kind === 'expense' ? '−' : '+'}{formatCurrency(entry.total_value)}
												</span>
											</Table.Cell>
											{#if isOpen}
												<Table.Cell class="pr-6 text-right">
													<div class="flex items-center justify-end gap-1">
														<Tooltip.Root>
															<Tooltip.Trigger>
																<Button type="button" variant="outline" size="icon" class="size-8"
																	onclick={() => void goto(`/g/${params.code}/balancete/${balanceteId}/lancar/${entry.id}`)}
																>
																	<Pencil2Icon class="size-4" />
																</Button>
															</Tooltip.Trigger>
															<Tooltip.Content side="top">Editar lançamento</Tooltip.Content>
														</Tooltip.Root>
														<Tooltip.Root>
															<Tooltip.Trigger>
																<Button type="button" variant="outline" size="icon" class="size-8"
																	disabled={deletingId === entry.id}
																	onclick={() => void handleDelete(entry.id)}
																>
																	<Trash2Icon class="size-4" />
																</Button>
															</Tooltip.Trigger>
															<Tooltip.Content side="top">Excluir lançamento</Tooltip.Content>
														</Tooltip.Root>
													</div>
												</Table.Cell>
											{/if}
										</Table.Row>
									{/each}
								</Table.Body>
							</Table.Root>
						</Tooltip.Provider>
					{/if}
				</Tabs.Content>

				<!-- TAB: RATEIO POR UNIDADE -->
				<Tabs.Content value="rateio" class="mt-0">
					{#if expenseEntries.length === 0}
						<div class="px-6 py-10 text-center">
							<p class="text-sm font-medium text-foreground">Nenhuma despesa lançada</p>
							<p class="mt-1 text-xs text-muted-foreground">
								Adicione despesas ao balancete para visualizar o rateio consolidado por unidade.
							</p>
						</div>
					{:else if units.length === 0}
						<div class="px-6 py-10 text-center">
							<p class="text-sm text-muted-foreground">Nenhuma unidade cadastrada para calcular o rateio.</p>
						</div>
					{:else}
						<!-- RATEIO SUMMARY -->
						<div class="grid grid-cols-3 gap-3 border-b p-4">
							<div class="rounded-lg border bg-background p-3">
								<div class="text-xs text-muted-foreground">Total a ratear</div>
								<div class="mt-1 text-base font-bold text-foreground">{formatCurrency(totalExpenses)}</div>
								<div class="mt-0.5 text-[10px] text-muted-foreground">{expenseEntries.length} {expenseEntries.length === 1 ? 'despesa' : 'despesas'}</div>
							</div>
							<div class="rounded-lg border bg-background p-3">
								<div class="text-xs text-muted-foreground">Unidades afetadas</div>
								<div class="mt-1 text-base font-bold text-foreground">{filteredRateioRows.length}</div>
								<div class="mt-0.5 text-[10px] text-muted-foreground">{filteredRateioGroupCount} {filteredRateioGroupCount === 1 ? 'grupo' : 'grupos'}</div>
							</div>
							<div class="rounded-lg border bg-background p-3">
								<div class="text-xs text-muted-foreground">Média por unidade</div>
								<div class="mt-1 text-base font-bold text-foreground">
									{formatCurrency(filteredRateioRows.length ? filteredRateioRows.reduce((sum, row) => sum + row.total, 0) / filteredRateioRows.length : 0)}
								</div>
								<div class="mt-0.5 text-[10px] text-muted-foreground">
									{formatCurrency(filteredRateioRows.length ? Math.min(...filteredRateioRows.map(r => r.total)) : 0)} — {formatCurrency(filteredRateioRows.length ? Math.max(...filteredRateioRows.map(r => r.total)) : 0)}
								</div>
							</div>
						</div>

						<!-- RATEIO GROUPS -->
						<div class="flex flex-col">
							<div class="border-b px-4 py-3">
								<div class="flex flex-col gap-3 lg:flex-row lg:items-center">
									<div
										id="balancete-rateio-block-filter-wrapper"
										data-test="balancete-rateio-block-filter-wrapper"
										class="w-full lg:w-56"
									>
										<select
											id="balancete-rateio-block-filter-select"
											data-test="balancete-rateio-block-filter-select"
											class="flex h-9 w-full rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
											value={rateioBlockFilter}
											onchange={(event) => {
												const target = event.currentTarget as HTMLSelectElement;
												rateioBlockFilter = target.value;
											}}
										>
											<option value="all">Todos os blocos</option>
											{#each rateioBlockOptions.filter((option) => option !== 'all') as option}
												<option value={option}>{option}</option>
											{/each}
										</select>
									</div>

									<div
										id="balancete-rateio-unit-filter-wrapper"
										data-test="balancete-rateio-unit-filter-wrapper"
										class="relative w-full lg:w-72"
									>
										<SearchIcon class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
										<Input
											id="balancete-rateio-unit-filter-input"
											data-test="balancete-rateio-unit-filter-input"
											value={rateioUnitFilter}
											placeholder="Filtrar por unidade"
											class="pl-9"
											oninput={(event) => {
												const target = event.currentTarget as HTMLInputElement;
												rateioUnitFilter = target.value;
											}}
										/>
									</div>
								</div>
							</div>

							<div class="max-h-[42rem] overflow-y-auto">
							{#if rateioGroups.length === 0}
								<div
									id="balancete-rateio-unit-filter-empty"
									data-test="balancete-rateio-unit-filter-empty"
									class="px-6 py-10 text-center"
								>
									<p class="text-sm font-medium text-foreground">Nenhuma unidade encontrada</p>
									<p class="mt-1 text-xs text-muted-foreground">
										Ajuste o filtro para visualizar outras unidades no rateio.
									</p>
								</div>
							{:else}
							{#each rateioGroups as group, gi}
								<div class="border-b last:border-b-0">
									<!-- GROUP HEADER -->
									<div class="flex items-center justify-between bg-muted/30 px-6 py-2.5">
										<div class="flex items-center gap-2">
											<div class={cn('flex size-5 items-center justify-center rounded text-[9px] font-bold', ROW_COLORS[gi % ROW_COLORS.length])}>
												{group.name.slice(0, 1)}
											</div>
											<span class="text-xs font-semibold text-foreground">{group.name}</span>
											<span class="text-xs text-muted-foreground">· {group.rows.length} {group.rows.length === 1 ? 'unidade' : 'unidades'}</span>
										</div>
										<span class="text-xs font-bold text-foreground">{formatCurrency(group.subtotal)}</span>
									</div>

									<!-- UNIT ROWS -->
									{#each group.rows as row, idx}
										{@const pct = rateioMax > 0 ? Math.round((row.total / rateioMax) * 100) : 0}
										{@const colorClass = ROW_COLORS[(gi * 8 + idx) % ROW_COLORS.length]!}
										<div class="flex items-center gap-4 px-6 py-3 transition-colors hover:bg-muted/10">
											<!-- avatar -->
											<div class={cn('flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold', colorClass)}>
												{row.unit.identifier.slice(0, 3)}
											</div>

											<!-- info -->
											<div class="min-w-0 flex-1">
												<div class="flex items-center gap-2">
													<span class="text-sm font-medium text-foreground">{row.unit.code}</span>
													{#if row.unit.floor}
														<span class="text-xs text-muted-foreground">{row.unit.floor}º andar</span>
													{/if}
												</div>
												<!-- entry breakdown pills -->
												<div class="mt-1 flex flex-wrap gap-1">
													{#each expenseEntries as entry}
														{@const scopeUnits = getEntryScopeUnits(entry)}
														{@const inScope = scopeUnits.some(u => u.id === row.unit.id)}
														{#if inScope}
															{@const v = calcUnitEntryValue(row.unit, entry, scopeUnits)}
															<Tooltip.Root>
																<Tooltip.Trigger>
																	<span class="inline-flex cursor-default items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
																		{entry.category}: {formatCurrency(v)}
																	</span>
																</Tooltip.Trigger>
																{#if entry.description}
																	<Tooltip.Content side="top" class="max-w-64">{entry.description}</Tooltip.Content>
																{/if}
															</Tooltip.Root>
														{/if}
													{/each}
												</div>
											</div>

											<!-- bar + value -->
											<div class="flex shrink-0 items-center gap-3">
												<div class="hidden w-24 sm:block">
													<div class="mb-1 h-1.5 overflow-hidden rounded-full bg-muted">
														<div class="h-full rounded-full bg-rose-400 transition-all" style="width:{pct}%"></div>
													</div>
													<div class="text-right text-[10px] text-muted-foreground">{pct}% do maior</div>
												</div>
												<div class="w-24 text-right text-sm font-bold text-foreground">
													{formatCurrency(row.total)}
												</div>
											</div>
										</div>
									{/each}
								</div>
							{/each}

							<!-- GRAND TOTAL -->
							<div class="flex items-center justify-between border-t bg-muted/20 px-6 py-3">
								<span class="text-sm font-semibold text-foreground">Total geral</span>
								<span class="text-sm font-bold text-rose-700">{formatCurrency(filteredRateioRows.reduce((sum, row) => sum + row.total, 0))}</span>
							</div>
							{/if}
							</div>

							<div class="flex flex-col gap-3 border-t px-4 py-3">
								<div class="text-sm text-muted-foreground">
									Mostrando {pagedRateioRows.length} de {filteredRateioRows.length} unidades no rateio.
								</div>
								<div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
									<div class="flex items-center gap-2 sm:shrink-0">
										<Label class="text-sm font-medium whitespace-nowrap">Linhas por página</Label>
										<div class="flex items-center overflow-hidden rounded-md border border-input">
											{#each [20, 50, 100] as size}
												<button
													type="button"
													class={cn(
														'h-9 min-w-10 border-r px-3 text-sm font-medium transition-colors last:border-r-0',
														rateioPageSize === size
															? 'bg-primary text-primary-foreground'
															: 'bg-background text-foreground hover:bg-muted'
													)}
													onclick={() => {
														rateioPageSize = size;
													}}
												>
													{size}
												</button>
											{/each}
										</div>
									</div>

									<div class="flex flex-wrap items-center gap-2 sm:justify-end">
										<div class="text-sm font-medium whitespace-nowrap text-foreground">
									Página {rateioCurrentPage} de {rateioTotalPages}
										</div>
										<div class="flex items-center gap-2">
											<Button
												variant="outline"
												size="icon"
												class="hidden sm:flex"
												disabled={rateioCurrentPage <= 1}
												onclick={() => {
													rateioCurrentPage = 1;
												}}
											>
												<ChevronsLeftIcon class="size-4" />
											</Button>
											<Button
												variant="outline"
												size="icon"
												disabled={rateioCurrentPage <= 1}
												onclick={() => {
													rateioCurrentPage -= 1;
												}}
											>
												<ChevronLeftIcon class="size-4" />
											</Button>
											<Button
												variant="outline"
												size="icon"
												disabled={rateioCurrentPage >= rateioTotalPages}
												onclick={() => {
													rateioCurrentPage += 1;
												}}
											>
												<ChevronRightIcon class="size-4" />
											</Button>
											<Button
												variant="outline"
												size="icon"
												class="hidden sm:flex"
												disabled={rateioCurrentPage >= rateioTotalPages}
												onclick={() => {
													rateioCurrentPage = rateioTotalPages;
												}}
											>
												<ChevronsRightIcon class="size-4" />
											</Button>
										</div>
									</div>
								</div>
							</div>
						</div>
					{/if}
				</Tabs.Content>
			</Tabs.Root>
		</Card.Root>
	{/if}
</main>
