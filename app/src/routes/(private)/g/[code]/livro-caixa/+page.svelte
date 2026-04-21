<script lang="ts">
	import MinusIcon from '@lucide/svelte/icons/minus';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import TrendingDownIcon from '@lucide/svelte/icons/trending-down';
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
	import CardEmpty from '$lib/components/app/card-empty/index.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { listLivroCaixaEntries, type LivroCaixaEntry } from '$lib/services/livro-caixa.js';
	import { cn } from '$lib/utils.js';

	interface Props {
		params: { code: string };
	}

	let { params }: Props = $props();

	type TypeFilter = 'all' | 'entrada' | 'saida';

	let entries = $state<LivroCaixaEntry[]>([]);
	let isLoading = $state(true);
	let errorMessage = $state('');
	let monthFilter = $state(new Date().toISOString().slice(0, 7));
	let typeFilter = $state<TypeFilter>('all');

	const filteredEntries = $derived.by(() => {
		if (typeFilter === 'all') return entries;
		return entries.filter((e) => e.type === typeFilter);
	});

	const totalEntradas = $derived(
		filteredEntries.filter((e) => e.type === 'entrada').reduce((s, e) => s + e.value, 0)
	);

	const totalSaidas = $derived(
		filteredEntries.filter((e) => e.type === 'saida').reduce((s, e) => s + e.value, 0)
	);

	const saldo = $derived(totalEntradas - totalSaidas);

	function formatCurrency(v: number): string {
		return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
	}

	function formatDate(date: string): string {
		const [year, month, day] = date.split('-');
		return `${day}/${month}/${year}`;
	}

	function originLabel(origin: LivroCaixaEntry['origin']): string {
		if (origin === 'conta_a_pagar') return 'Conta a pagar';
		if (origin === 'pagamento_condomino') return 'Condômino';
		return 'Manual';
	}

	function originClasses(origin: LivroCaixaEntry['origin']): string {
		if (origin === 'conta_a_pagar') return 'bg-gray-100 text-gray-700';
		if (origin === 'pagamento_condomino') return 'bg-sky-100 text-sky-700';
		return 'bg-amber-100 text-amber-700';
	}

	async function loadData(): Promise<void> {
		isLoading = true;
		errorMessage = '';
		try {
			entries = await listLivroCaixaEntries(params.code, monthFilter || undefined);
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'Não foi possível carregar o livro caixa.';
		} finally {
			isLoading = false;
		}
	}

	$effect(() => {
		// Runs on mount and whenever monthFilter changes.
		// typeFilter is client-side derived — no re-fetch needed for it.
		void monthFilter;
		void loadData();
	});
</script>

<svelte:head>
	<title>Livro Caixa</title>
</svelte:head>

<main class="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6">
	<!-- HEADER -->
	<section class="flex flex-col gap-2">
		<h1 class="text-2xl font-semibold tracking-tight text-foreground">Livro Caixa</h1>
		<p class="text-sm text-muted-foreground">
			Movimentações financeiras reais do condomínio. Alimentado automaticamente ao confirmar
			pagamentos.
		</p>
	</section>

	<!-- FILTER BAR -->
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<!-- Type filter tabs -->
		<div class="flex items-center gap-1 rounded-lg border bg-muted/30 p-1">
			{#each ([['all', 'Todas'], ['entrada', 'Entradas'], ['saida', 'Saídas']] as [TypeFilter, string][]) as [value, label]}
				<button
					type="button"
					class={cn(
						'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
						typeFilter === value
							? 'bg-background text-foreground shadow-sm'
							: 'text-muted-foreground hover:text-foreground'
					)}
					onclick={() => { typeFilter = value; }}
				>
					{label}
				</button>
			{/each}
		</div>

		<!-- Month filter -->
		<div class="flex items-center gap-2">
			<Label for="lc-month-filter" class="shrink-0 text-sm text-muted-foreground">Período</Label>
			<Input
				id="lc-month-filter"
				type="month"
				value={monthFilter}
				class="w-40"
				oninput={(e) => {
					monthFilter = (e.currentTarget as HTMLInputElement).value;
				}}
			/>
		</div>
	</div>

	<!-- SUMMARY CARDS -->
	<section class="grid grid-cols-1 gap-3 sm:grid-cols-3">
		<!-- Total entradas -->
		<div class="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm">
			<div class="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
				<TrendingUpIcon class="size-5" />
			</div>
			<div class="min-w-0">
				<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
					Total de entradas
				</p>
				<p class="mt-0.5 text-xl font-bold text-emerald-600">{formatCurrency(totalEntradas)}</p>
			</div>
		</div>

		<!-- Total saídas -->
		<div class="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm">
			<div class="flex size-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
				<TrendingDownIcon class="size-5" />
			</div>
			<div class="min-w-0">
				<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
					Total de saídas
				</p>
				<p class="mt-0.5 text-xl font-bold text-rose-600">{formatCurrency(totalSaidas)}</p>
			</div>
		</div>

		<!-- Saldo -->
		<div class="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm">
			<div
				class={cn(
					'flex size-10 shrink-0 items-center justify-center rounded-full',
					saldo >= 0 ? 'bg-blue-100 text-blue-600' : 'bg-rose-100 text-rose-600'
				)}
			>
				{#if saldo >= 0}
					<PlusIcon class="size-5" />
				{:else}
					<MinusIcon class="size-5" />
				{/if}
			</div>
			<div class="min-w-0">
				<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
					Saldo do período
				</p>
				<p
					class={cn(
						'mt-0.5 text-xl font-bold',
						saldo >= 0 ? 'text-blue-600' : 'text-rose-600'
					)}
				>
					{formatCurrency(saldo)}
				</p>
			</div>
		</div>
	</section>

	<!-- TABLE CARD -->
	<Card.Root>
		<Card.Header>
			<Card.Title>Movimentações</Card.Title>
		</Card.Header>
		<Card.Content class="p-0">
			{#if isLoading}
				<div class="px-6 py-8 text-sm text-muted-foreground">Carregando movimentações…</div>
			{:else if errorMessage}
				<div class="mx-6 mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
					{errorMessage}
				</div>
			{:else if filteredEntries.length === 0}
				<div class="p-4">
					<CardEmpty
						title="Nenhuma movimentação encontrada"
						description="Não há movimentações financeiras para o período e filtro selecionados. O livro caixa é alimentado automaticamente ao confirmar pagamentos de contas a pagar e ao registrar recebimentos de condôminos."
						actionLabel="Ver contas a pagar"
						onAction={() => { window.location.href = `/g/${params.code}/contas-a-pagar`; }}
					/>
				</div>
			{:else}
				<Table.Root class="text-sm">
					<Table.Header class="bg-muted/35">
						<Table.Row class="hover:bg-transparent">
							<Table.Head class="w-32 pl-6">Data</Table.Head>
							<Table.Head>Descrição</Table.Head>
							<Table.Head class="w-32">Categoria</Table.Head>
							<Table.Head class="w-24">Tipo</Table.Head>
							<Table.Head class="w-44">Conta Bancária</Table.Head>
							<Table.Head class="w-32">Origem</Table.Head>
							<Table.Head class="w-36 pr-6 text-right">Valor</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each filteredEntries as entry (entry.id)}
							<Table.Row>
								<!-- Data -->
								<Table.Cell class="pl-6 text-muted-foreground">
									{formatDate(entry.date)}
								</Table.Cell>

								<!-- Descrição -->
								<Table.Cell class="font-medium text-foreground">
									{entry.description}
								</Table.Cell>

								<!-- Categoria -->
								<Table.Cell class="text-muted-foreground">
									{entry.category}
								</Table.Cell>

								<!-- Tipo badge -->
								<Table.Cell>
									<span
										class={cn(
											'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
											entry.type === 'entrada'
												? 'bg-emerald-100 text-emerald-700'
												: 'bg-rose-100 text-rose-700'
										)}
									>
										{entry.type === 'entrada' ? 'Entrada' : 'Saída'}
									</span>
								</Table.Cell>

								<!-- Conta Bancária -->
								<Table.Cell class="text-muted-foreground">
									{entry.bank_account_name}
								</Table.Cell>

								<!-- Origem badge -->
								<Table.Cell>
									<span
										class={cn(
											'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
											originClasses(entry.origin)
										)}
									>
										{originLabel(entry.origin)}
									</span>
								</Table.Cell>

								<!-- Valor -->
								<Table.Cell class="pr-6 text-right">
									<span
										class={cn(
											'font-semibold',
											entry.type === 'entrada' ? 'text-emerald-600' : 'text-rose-600'
										)}
									>
										{entry.type === 'entrada' ? '+' : '−'}{formatCurrency(entry.value)}
									</span>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			{/if}
		</Card.Content>
	</Card.Root>
</main>
