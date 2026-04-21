<script lang="ts">
	import { goto } from '$app/navigation';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import ChevronsLeftIcon from '@lucide/svelte/icons/chevrons-left';
	import ChevronsRightIcon from '@lucide/svelte/icons/chevrons-right';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import LockIcon from '@lucide/svelte/icons/lock';
	import LockOpenIcon from '@lucide/svelte/icons/lock-open';
	import SearchIcon from '@lucide/svelte/icons/search';
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
		getBalancete,
		reopenBalancete,
		type Balancete
	} from '$lib/services/balancete.js';
	import { listLivroCaixaEntries, type LivroCaixaEntry } from '$lib/services/livro-caixa.js';
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
	let entries = $state<LivroCaixaEntry[]>([]);
	let units = $state<Unit[]>([]);
	let isLoading = $state(true);
	let isActing = $state(false);
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

	function getOriginLabel(origin: string): string {
		return ({ conta_a_pagar: 'Conta a pagar', pagamento_condomino: 'Condômino', manual: 'Manual' } as Record<string, string>)[origin] ?? origin;
	}

	// --- rateio calculation ---

	function getEntryScopeUnits(entry: LivroCaixaEntry): Unit[] {
		if (entry.scope === 'geral') return units;
		if (entry.scope === 'bloco') return units.filter((u) => u.group_name === entry.scope_value);
		return units.filter((u) => String(u.id) === entry.scope_value);
	}

	function calcUnitEntryValue(unit: Unit, entry: LivroCaixaEntry, scopeUnits: Unit[]): number {
		if (entry.scope === 'unidade') return entry.value;
		const method = entry.rateio_method;
		if (!method || method === 'igual') return entry.value / (scopeUnits.length || 1);
		if (method === 'area') {
			const totalArea = scopeUnits.reduce((s, u) => s + (u.private_area ?? 0), 0);
			if (totalArea === 0) return entry.value / (scopeUnits.length || 1);
			return entry.value * ((unit.private_area ?? 0) / totalArea);
		}
		const totalFrac = scopeUnits.reduce((s, u) => s + (u.ideal_fraction ?? 0), 0);
		if (totalFrac === 0) return entry.value / (scopeUnits.length || 1);
		return entry.value * ((unit.ideal_fraction ?? 0) / totalFrac);
	}

	// --- derived state ---

	const isOpen = $derived(balancete?.status === 'open');

	const expenseEntries = $derived(entries.filter((e) => e.type === 'saida'));
	const revenueEntries = $derived(entries.filter((e) => e.type === 'entrada'));
	const totalExpenses = $derived(expenseEntries.reduce((s, e) => s + e.value, 0));
	const totalRevenues = $derived(revenueEntries.reduce((s, e) => s + e.value, 0));

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

	const rateioMax = $derived(rateioRows.length ? Math.max(...rateioRows.map((r) => r.total)) : 0);

	const rateioBlockOptions = $derived.by(() => {
		const blocks = Array.from(new Set(rateioRows.map((r) => r.unit.group_name ?? 'Sem grupo'))).sort();
		return ['all', ...blocks];
	});

	const filteredRateioRows = $derived(
		rateioRows.filter((row) => {
			const blockName = row.unit.group_name ?? 'Sem grupo';
			if (rateioBlockFilter !== 'all' && blockName !== rateioBlockFilter) return false;
			const q = rateioUnitFilter.trim().toLowerCase();
			if (!q) return true;
			return [row.unit.code, row.unit.identifier, row.unit.group_name ?? '', row.unit.floor ?? '']
				.join(' ').toLowerCase().includes(q);
		})
	);

	const rateioTotalPages = $derived(Math.max(1, Math.ceil(filteredRateioRows.length / rateioPageSize)));
	const pagedRateioRows = $derived(
		filteredRateioRows.slice((rateioCurrentPage - 1) * rateioPageSize, rateioCurrentPage * rateioPageSize)
	);
	const filteredRateioGroupCount = $derived.by(() => {
		return new Set(filteredRateioRows.map((r) => r.unit.group_name ?? 'Sem grupo')).size;
	});
	const rateioGroups = $derived.by(() => {
		const map = new Map<string, typeof rateioRows>();
		for (const row of pagedRateioRows) {
			const key = row.unit.group_name ?? 'Sem grupo';
			if (!map.has(key)) map.set(key, []);
			map.get(key)!.push(row);
		}
		return Array.from(map.entries()).map(([name, rows], i) => ({
			name, rows, colorIndex: i, subtotal: rows.reduce((s, r) => s + r.total, 0)
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
				listLivroCaixaEntries(params.code),
				listUnits(params.code)
			]);
			balancete = b;
			entries = e.filter((entry) => entry.date.startsWith(b.month));
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

	$effect(() => { rateioPageSize; rateioCurrentPage = 1; });
	$effect(() => { rateioRows; rateioCurrentPage = 1; });
	$effect(() => { rateioBlockFilter; rateioCurrentPage = 1; });
	$effect(() => { rateioUnitFilter; rateioCurrentPage = 1; });
	$effect(() => { if (rateioCurrentPage > rateioTotalPages) rateioCurrentPage = rateioTotalPages; });

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
					</p>
				{/if}
			</div>

			<div class="flex flex-wrap items-center gap-2">
				{#if isOpen}
					<Button type="button" variant="outline" disabled={isActing} onclick={() => { closeDueDate = ''; showCloseDialog = true; }}>
						<LockIcon class="mr-2 size-4" />
						{isActing ? 'Fechando…' : 'Fechar balancete'}
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
						Defina o vencimento dos boletos. Após fechar, o balancete não poderá receber novas movimentações.
					</Dialog.Description>
				</Dialog.Header>
				<div class="space-y-2 py-2">
					<Label for="close-due-date">Vencimento dos boletos</Label>
					<Input id="close-due-date" type="date" value={closeDueDate}
						oninput={(e) => { closeDueDate = (e.currentTarget as HTMLInputElement).value; }}
					/>
				</div>
				<Dialog.Footer>
					<Button variant="outline" onclick={() => { showCloseDialog = false; }} disabled={isActing}>Cancelar</Button>
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
						<div class="text-xs text-muted-foreground">Total de saídas</div>
						<div class="text-xl font-bold text-foreground">{formatCurrency(totalExpenses)}</div>
						<div class="text-xs text-muted-foreground">{expenseEntries.length} movimentações</div>
					</div>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Content class="flex items-center gap-4 py-4">
					<div class="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
						<TrendingUpIcon class="size-5" />
					</div>
					<div>
						<div class="text-xs text-muted-foreground">Total de entradas</div>
						<div class="text-xl font-bold text-foreground">{formatCurrency(totalRevenues)}</div>
						<div class="text-xs text-muted-foreground">{revenueEntries.length} movimentações</div>
					</div>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Content class="flex items-center gap-4 py-4">
					<div class={cn('flex size-10 shrink-0 items-center justify-center rounded-full', totalExpenses > 0 ? 'bg-muted text-muted-foreground' : 'bg-emerald-100 text-emerald-600')}>
						<TrendingDownIcon class="size-5" />
					</div>
					<div>
						<div class="text-xs text-muted-foreground">A ratear pelas unidades</div>
						<div class="text-xl font-bold text-foreground">{formatCurrency(totalExpenses)}</div>
						<div class="text-xs text-muted-foreground">Entradas não abaterão cobranças</div>
					</div>
				</Card.Content>
			</Card.Root>
		</div>

		<!-- TABS: MOVIMENTAÇÕES | RATEIO -->
		<Card.Root class="overflow-hidden">
			<Tabs.Root value="movimentacoes">
				<Card.Header class="border-b pb-0">
					<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<Card.Title>Detalhamento</Card.Title>
						<Tabs.List>
							<Tabs.Trigger value="movimentacoes">Movimentações</Tabs.Trigger>
							<Tabs.Trigger value="rateio">Rateio por unidade</Tabs.Trigger>
						</Tabs.List>
					</div>
				</Card.Header>

				<!-- TAB: MOVIMENTAÇÕES -->
				<Tabs.Content value="movimentacoes" class="mt-0">
					{#if entries.length === 0}
						<div class="p-4">
							<CardEmpty
								title="Nenhuma movimentação neste mês"
								description="As movimentações aparecem aqui conforme contas são pagas e pagamentos de condôminos são registrados."
							/>
						</div>
					{:else}
						<Tooltip.Provider>
							<Table.Root class="text-sm">
								<Table.Header class="bg-muted/35">
									<Table.Row class="hover:bg-transparent">
										<Table.Head class="w-28 pl-6">Data</Table.Head>
										<Table.Head>Descrição</Table.Head>
										<Table.Head class="w-32">Categoria</Table.Head>
										<Table.Head class="w-24">Tipo</Table.Head>
										<Table.Head class="w-32">Conta</Table.Head>
										<Table.Head class="w-28">Origem</Table.Head>
										<Table.Head class="w-32 pr-6 text-right">Valor</Table.Head>
									</Table.Row>
								</Table.Header>
								<Table.Body>
									{#each entries as entry (entry.id)}
										<Table.Row>
											<Table.Cell class="pl-6 text-muted-foreground">
												{new Date(entry.date + 'T00:00:00').toLocaleDateString('pt-BR')}
											</Table.Cell>
											<Table.Cell class="max-w-xs">
												<div class="truncate font-medium">{entry.description}</div>
											</Table.Cell>
											<Table.Cell class="text-muted-foreground">{entry.category}</Table.Cell>
											<Table.Cell>
												<span class={cn(
													'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
													entry.type === 'saida' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
												)}>
													{entry.type === 'saida' ? 'Saída' : 'Entrada'}
												</span>
											</Table.Cell>
											<Table.Cell class="text-xs text-muted-foreground">{entry.bank_account_name}</Table.Cell>
											<Table.Cell>
												<span class={cn(
													'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
													entry.origin === 'conta_a_pagar' ? 'bg-muted text-muted-foreground' :
													entry.origin === 'pagamento_condomino' ? 'bg-sky-100 text-sky-700' :
													'bg-amber-100 text-amber-700'
												)}>
													{getOriginLabel(entry.origin)}
												</span>
											</Table.Cell>
											<Table.Cell class="pr-6 text-right font-bold">
												<span class={entry.type === 'saida' ? 'text-rose-700' : 'text-emerald-700'}>
													{entry.type === 'saida' ? '−' : '+'}{formatCurrency(entry.value)}
												</span>
											</Table.Cell>
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
							<p class="text-sm font-medium text-foreground">Nenhuma saída registrada</p>
							<p class="mt-1 text-xs text-muted-foreground">Registre pagamentos de contas para visualizar o rateio por unidade.</p>
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
								<div class="mt-0.5 text-[10px] text-muted-foreground">{expenseEntries.length} {expenseEntries.length === 1 ? 'saída' : 'saídas'}</div>
							</div>
							<div class="rounded-lg border bg-background p-3">
								<div class="text-xs text-muted-foreground">Unidades afetadas</div>
								<div class="mt-1 text-base font-bold text-foreground">{filteredRateioRows.length}</div>
								<div class="mt-0.5 text-[10px] text-muted-foreground">{filteredRateioGroupCount} {filteredRateioGroupCount === 1 ? 'grupo' : 'grupos'}</div>
							</div>
							<div class="rounded-lg border bg-background p-3">
								<div class="text-xs text-muted-foreground">Média por unidade</div>
								<div class="mt-1 text-base font-bold text-foreground">
									{formatCurrency(rateioRows.length ? totalExpenses / rateioRows.length : 0)}
								</div>
								<div class="mt-0.5 text-[10px] text-muted-foreground">
									{formatCurrency(rateioRows.length ? Math.min(...rateioRows.map(r => r.total)) : 0)} — {formatCurrency(rateioMax)}
								</div>
							</div>
						</div>

						<!-- FILTROS DO RATEIO -->
						<div class="flex flex-wrap items-center gap-2 border-b px-4 py-3">
							<select
								class="h-8 rounded-md border border-input bg-input/20 px-2 text-xs outline-none focus-visible:border-ring"
								value={rateioBlockFilter}
								onchange={(e) => { rateioBlockFilter = (e.currentTarget as HTMLSelectElement).value; }}
							>
								{#each rateioBlockOptions as opt}
									<option value={opt}>{opt === 'all' ? 'Todos os blocos' : opt}</option>
								{/each}
							</select>
							<div class="relative flex-1 sm:max-w-60">
								<SearchIcon class="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
								<Input
									placeholder="Buscar unidade…"
									class="h-8 pl-7 text-xs"
									value={rateioUnitFilter}
									oninput={(e) => { rateioUnitFilter = (e.currentTarget as HTMLInputElement).value; }}
								/>
							</div>
							<select
								class="h-8 rounded-md border border-input bg-input/20 px-2 text-xs outline-none focus-visible:border-ring"
								value={String(rateioPageSize)}
								onchange={(e) => { rateioPageSize = Number((e.currentTarget as HTMLSelectElement).value); }}
							>
								{#each [10, 20, 50] as size}<option value={String(size)}>{size} por página</option>{/each}
							</select>
						</div>

						<!-- RATEIO GROUPS -->
						<div>
							{#each rateioGroups as group, gi}
								<div class="border-b last:border-b-0">
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

									{#each group.rows as row, idx}
										{@const pct = rateioMax > 0 ? Math.round((row.total / rateioMax) * 100) : 0}
										{@const colorClass = ROW_COLORS[(gi * 8 + idx) % ROW_COLORS.length]!}
										<div class="flex items-center gap-4 px-6 py-3 transition-colors hover:bg-muted/10">
											<div class={cn('flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold', colorClass)}>
												{row.unit.identifier.slice(0, 3)}
											</div>
											<div class="min-w-0 flex-1">
												<div class="flex items-center gap-2">
													<span class="text-sm font-medium text-foreground">{row.unit.code}</span>
													{#if row.unit.floor}
														<span class="text-xs text-muted-foreground">{row.unit.floor}º andar</span>
													{/if}
												</div>
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
								<span class="text-sm font-bold text-rose-700">{formatCurrency(totalExpenses)}</span>
							</div>

							<!-- PAGINATION -->
							{#if rateioTotalPages > 1}
								<div class="flex items-center justify-between border-t px-6 py-3">
									<span class="text-xs text-muted-foreground">
										{filteredRateioRows.length} unidades · página {rateioCurrentPage} de {rateioTotalPages}
									</span>
									<div class="flex items-center gap-1">
										<Button variant="outline" size="icon" class="size-7" disabled={rateioCurrentPage === 1}
											onclick={() => { rateioCurrentPage = 1; }}>
											<ChevronsLeftIcon class="size-3.5" />
										</Button>
										<Button variant="outline" size="icon" class="size-7" disabled={rateioCurrentPage === 1}
											onclick={() => { rateioCurrentPage -= 1; }}>
											<ChevronLeftIcon class="size-3.5" />
										</Button>
										<Button variant="outline" size="icon" class="size-7" disabled={rateioCurrentPage === rateioTotalPages}
											onclick={() => { rateioCurrentPage += 1; }}>
											<ChevronRightIcon class="size-3.5" />
										</Button>
										<Button variant="outline" size="icon" class="size-7" disabled={rateioCurrentPage === rateioTotalPages}
											onclick={() => { rateioCurrentPage = rateioTotalPages; }}>
											<ChevronsRightIcon class="size-3.5" />
										</Button>
									</div>
								</div>
							{/if}
						</div>
					{/if}
				</Tabs.Content>
			</Tabs.Root>
		</Card.Root>
	{/if}
</main>
