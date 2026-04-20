<script lang="ts">
	type SummaryCard = {
		id: string;
		label: string;
		value: string;
		description: string;
		accentClass: string;
	};

	type MonthlyOverdue = {
		month: string;
		value: number;
	};

	type ExpectedVsReceived = {
		label: string;
		expected: number;
		received: number;
	};

	const currencyFormatter = new Intl.NumberFormat('pt-BR', {
		style: 'currency',
		currency: 'BRL',
		maximumFractionDigits: 0
	});

	const summaryCards: SummaryCard[] = [
		{
			id: 'current-balance',
			label: 'Saldo atual',
			value: 'R$ 184.300',
			description: 'Caixa consolidado das contas do condominio',
			accentClass: 'bg-slate-900/80'
		},
		{
			id: 'received-month',
			label: 'Recebido no mes',
			value: 'R$ 52.880',
			description: '78% da receita prevista para abril',
			accentClass: 'bg-emerald-600/85'
		},
		{
			id: 'paid-month',
			label: 'Pago no mes',
			value: 'R$ 31.420',
			description: 'Despesas operacionais e contratos recorrentes',
			accentClass: 'bg-sky-600/85'
		},
		{
			id: 'total-overdue',
			label: 'Inadimplencia total',
			value: 'R$ 18.640',
			description: '10 unidades em atraso em 2 blocos',
			accentClass: 'bg-rose-600/85'
		}
	];

	const monthlyOverdueData: MonthlyOverdue[] = [
		{ month: 'Nov', value: 8200 },
		{ month: 'Dez', value: 9100 },
		{ month: 'Jan', value: 9800 },
		{ month: 'Fev', value: 11200 },
		{ month: 'Mar', value: 16600 },
		{ month: 'Abr', value: 18640 }
	];

	const expectedVsReceivedData: ExpectedVsReceived[] = [
		{ label: 'Bloco A', expected: 18000, received: 16100 },
		{ label: 'Bloco B', expected: 14200, received: 9800 },
		{ label: 'Bloco C', expected: 15600, received: 14980 }
	];

	const insights = [
		{
			id: 'insight-overdue-growth',
			title: 'Inadimplencia em alta',
			description: 'A inadimplencia subiu 12% em relacao ao mes passado.',
			toneClass: 'border-rose-200 bg-rose-50/60 text-rose-700'
		},
		{
			id: 'insight-block-risk',
			title: 'Bloco critico',
			description: 'Bloco B concentra a maior divida do condominio.',
			toneClass: 'border-border bg-card text-foreground'
		},
		{
			id: 'insight-concentration',
			title: 'Acao imediata',
			description: '3 unidades representam 40% do total em atraso.',
			toneClass: 'border-amber-200 bg-amber-50/60 text-amber-800'
		}
	];

	const maxOverdueValue = Math.max(...monthlyOverdueData.map((item) => item.value));
</script>

<svelte:head>
	<title>Dashboard do Condominio</title>
</svelte:head>

<main id="dashboard-page-root" class="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6">
	<section id="dashboard-hero" class="flex flex-col gap-2">
		<div id="dashboard-title-group" class="flex flex-col gap-1">
			<h1 id="dashboard-title" class="text-2xl font-semibold tracking-tight text-foreground">
				Dashboard do condominio
			</h1>
			<p id="dashboard-subtitle" class="max-w-3xl text-sm text-muted-foreground">
				Acompanhe caixa, inadimplencia e os principais pontos de atencao do condominio em uma
				visao unica.
			</p>
		</div>
	</section>

	<section id="dashboard-summary" class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
		{#each summaryCards as summary}
			<article
				id={`dashboard-summary-card-${summary.id}`}
				class="flex min-h-[132px] flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-sm"
			>
				<div id={`dashboard-summary-card-header-${summary.id}`} class="flex flex-col gap-3">
					<span
						id={`dashboard-summary-card-label-${summary.id}`}
						class="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground"
					>
						<span class={`h-2 w-2 rounded-full ${summary.accentClass}`}></span>
						{summary.label}
					</span>
					<strong
						id={`dashboard-summary-card-value-${summary.id}`}
						class="text-2xl font-semibold leading-none text-foreground"
					>
						{summary.value}
					</strong>
				</div>
				<p
					id={`dashboard-summary-card-description-${summary.id}`}
					class="mt-3 text-sm leading-snug text-muted-foreground"
				>
					{summary.description}
				</p>
			</article>
		{/each}
	</section>

	<section id="dashboard-charts" class="grid grid-cols-1 gap-4 xl:grid-cols-2">
		<section id="dashboard-overdue-chart-card" class="rounded-xl border bg-card">
			<div id="dashboard-overdue-chart-header" class="space-y-1 border-b px-6 py-5">
				<h2 id="dashboard-overdue-chart-title" class="text-base font-semibold text-foreground">Inadimplencia por mes</h2>
				<p id="dashboard-overdue-chart-description" class="text-sm text-muted-foreground">
					Evolucao do valor em atraso nos ultimos 6 meses
				</p>
			</div>
			<div id="dashboard-overdue-chart-content" class="px-6 py-5">
				<div
					id="dashboard-overdue-chart-bars"
					class="flex h-[260px] items-end justify-between gap-3 rounded-lg border border-border bg-muted/25 p-4"
				>
					{#each monthlyOverdueData as item}
						<div
							id={`dashboard-overdue-chart-column-${item.month}`}
							class="flex h-full flex-1 flex-col items-center justify-end gap-3"
						>
							<div
								id={`dashboard-overdue-chart-bar-wrapper-${item.month}`}
								class="flex h-full w-full items-end justify-center"
							>
								<div
									id={`dashboard-overdue-chart-bar-${item.month}`}
									class="w-full max-w-12 rounded-t-md bg-rose-400/85"
									style={`height: ${(item.value / maxOverdueValue) * 100}%; min-height: 18px;`}
								></div>
							</div>
							<div
								id={`dashboard-overdue-chart-footer-${item.month}`}
								class="flex flex-col items-center gap-1"
							>
								<span
									id={`dashboard-overdue-chart-value-${item.month}`}
									class="text-center text-[11px] font-medium text-muted-foreground"
								>
									{currencyFormatter.format(item.value)}
								</span>
								<span
									id={`dashboard-overdue-chart-label-${item.month}`}
									class="text-xs text-muted-foreground"
								>
									{item.month}
								</span>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</section>

		<section id="dashboard-expected-chart-card" class="rounded-xl border bg-card">
			<div id="dashboard-expected-chart-header" class="space-y-1 border-b px-6 py-5">
				<h2 id="dashboard-expected-chart-title" class="text-base font-semibold text-foreground">Recebido x previsto no mes</h2>
				<p id="dashboard-expected-chart-description" class="text-sm text-muted-foreground">
					Comparativo entre arrecadacao prevista e recebida por bloco
				</p>
			</div>
			<div id="dashboard-expected-chart-content" class="space-y-4 px-6 py-5">
				{#each expectedVsReceivedData as item}
					<div id={`dashboard-expected-chart-row-${item.label}`} class="flex flex-col gap-2">
						<div
							id={`dashboard-expected-chart-row-header-${item.label}`}
							class="flex items-center justify-between gap-2"
						>
							<span
								id={`dashboard-expected-chart-row-label-${item.label}`}
								class="text-sm font-medium text-foreground"
							>
								{item.label}
							</span>
							<span
								id={`dashboard-expected-chart-row-values-${item.label}`}
								class="text-xs text-muted-foreground"
							>
								{currencyFormatter.format(item.received)} de {currencyFormatter.format(item.expected)}
							</span>
						</div>
						<div
							id={`dashboard-expected-chart-track-${item.label}`}
							class="h-3 w-full overflow-hidden rounded-full bg-muted"
						>
							<div
								id={`dashboard-expected-chart-progress-${item.label}`}
								class="h-full rounded-full bg-slate-700"
								style={`width: ${(item.received / item.expected) * 100}%;`}
							></div>
						</div>
					</div>
				{/each}
			</div>
		</section>
	</section>

	<section id="dashboard-insights" class="flex flex-col gap-3">
		<div id="dashboard-insights-header" class="flex flex-col gap-1">
			<h2 id="dashboard-insights-title" class="text-lg font-semibold text-foreground">
				Indicadores inteligentes
			</h2>
			<p id="dashboard-insights-subtitle" class="text-sm text-muted-foreground">
				Leituras automaticas para destacar onde esta o problema e o que precisa de acao agora.
			</p>
		</div>

		<div id="dashboard-insights-grid" class="grid grid-cols-1 gap-2 lg:grid-cols-3">
			{#each insights as insight}
				<article
					id={`dashboard-insight-card-${insight.id}`}
					class={`flex min-h-[88px] flex-col justify-center rounded-md border px-4 py-3 ${insight.toneClass}`}
				>
					<h3
						id={`dashboard-insight-title-${insight.id}`}
						class="text-sm font-semibold leading-none"
					>
						{insight.title}
					</h3>
					<p
						id={`dashboard-insight-description-${insight.id}`}
						class="mt-2 text-sm leading-snug opacity-85"
					>
						{insight.description}
					</p>
				</article>
			{/each}
		</div>
	</section>
</main>
