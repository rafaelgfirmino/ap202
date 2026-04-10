<script lang="ts">
	const pains = [
		{
			title: "Contas que ninguém entende",
			description:
				"Quando o balancete vem confuso, o síndico perde tempo explicando e os moradores continuam desconfiados.",
		},
		{
			title: "Sistema caro para pouca necessidade",
			description:
				"Condomínios pequenos acabam pagando por um software cheio de funções que nunca vão usar.",
		},
		{
			title: "Planilhas viram retrabalho",
			description:
				"Atualizar cobrança, despesa e prestação de contas em planilha gera erro, atraso e informação desencontrada.",
		},
		{
			title: "Falta de clareza gera conflito",
			description:
				"Quando ninguém vê o mesmo número, qualquer despesa vira discussão no grupo do condomínio.",
		},
	];

	const solutions = [
		"Balancete claro, com entradas, saídas e saldo sem esconder número.",
		"Controle financeiro simples para lançar despesas e acompanhar o caixa do mês.",
		"Inadimplência visível por unidade, com acompanhamento direto e organizado.",
		"Comunicados e informações em um só lugar, sem depender de planilhas e mensagens soltas.",
	];

	const productViews = [
		{
			eyebrow: "Balancete",
			title: "Números fáceis de conferir",
			description:
				"Moradores entendem o que entrou, o que saiu e qual é o saldo atual sem pedir uma segunda explicação.",
			rows: [
				["Recebimentos do mês", "R$ 8.460,00"],
				["Despesas pagas", "R$ 5.720,35"],
				["Fundo de reserva", "R$ 1.140,00"],
				["Saldo atual", "R$ 6.984,21"],
			],
		},
		{
			eyebrow: "Despesas",
			title: "Tudo lançado com contexto",
			description:
				"Cada gasto aparece com categoria, data e valor para facilitar conferência e prestação de contas.",
			rows: [
				["Limpeza semanal", "R$ 480,00"],
				["Energia área comum", "R$ 362,14"],
				["Manutenção do portão", "R$ 690,00"],
				["Água", "R$ 1.248,70"],
			],
		},
		{
			eyebrow: "Inadimplência",
			title: "Cobrança sem bagunça",
			description:
				"O síndico vê rapidamente quem está em atraso, há quantos dias e qual impacto isso tem no caixa.",
			rows: [
				["Apto 101", "12 dias"],
				["Apto 202", "28 dias"],
				["Apto 301", "43 dias"],
				["Total em aberto", "R$ 1.940,00"],
			],
		},
	];

	const differentiators = [
		{
			title: "Transparência total",
			description: "As informações podem ser visualizadas com clareza por quem precisa acompanhar o condomínio.",
		},
		{
			title: "Feito para 6 a 30 unidades",
			description: "O produto atende a rotina real de condomínios pequenos, sem módulos desnecessários.",
		},
		{
			title: "Sem curva de aprendizado longa",
			description: "Quem nunca usou um sistema de gestão consegue operar o básico em poucos minutos.",
		},
		{
			title: "Menos atrito no dia a dia",
			description: "Quando a informação está clara, sobra menos espaço para dúvida, cobrança e conflito.",
		},
	];

	const principles = [
		{
			title: "Número aberto, sem maquiagem",
			description: "O objetivo do Ap202 é deixar o financeiro legível, não esconder informação atrás de tela complicada.",
		},
		{
			title: "Produto enxuto de verdade",
			description: "Cada parte da experiência existe para resolver rotina de condomínio, não para inflar a percepção de valor.",
		},
		{
			title: "Preço claro desde o começo",
			description: "O condomínio entende quanto vai pagar, por que está pagando e o que está incluído.",
		},
	];

	const trustItems = [
		"Dados protegidos e acesso organizado por perfil.",
		"Histórico auditável para acompanhar alterações e lançamentos.",
		"Informações sempre disponíveis para consulta quando necessário.",
	];
</script>

<svelte:head>
	<title>Ap202 | Gestão simples para condomínios pequenos</title>
	<meta
		name="description"
		content="Gestão de condomínios pequenos com balancete claro, controle financeiro simples e preço justo. Sem taxas escondidas e sem complicação."
	/>
</svelte:head>

<div
	id="landing-page"
	class="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe_0%,rgba(219,234,254,0.45)_18%,transparent_42%),linear-gradient(180deg,#f8fbff_0%,#f3f7fb_36%,#ffffff_100%)] text-[#0f172a]"
>
	<header
		id="landing-header"
		class="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-6 lg:px-8"
	>
		<div id="landing-brand" class="flex items-center gap-3">
			<div
				id="landing-brand-mark"
				class="flex h-[124px] w-[164px] items-center justify-center overflow-hidden rounded-[22px] border border-white/10 bg-black shadow-[0_10px_24px_rgba(15,23,42,0.18)]"
			>
				<img
					id="landing-brand-mark-image"
					src="/media/app/logo.png"
					alt="Ap202"
					class="h-auto w-[150px] object-contain"
				/>
			</div>
			<div id="landing-brand-text" class="space-y-0.5">
				<div id="landing-brand-tagline" class="text-sm text-[#64748b]">
					Gestão clara para condomínios
				</div>
			</div>
		</div>

		<nav id="landing-header-actions" class="flex items-center gap-3">
			<a
				id="landing-header-login-button"
				href="/login"
				class="hidden rounded-full border border-[#d7dfeb] bg-white/80 px-4 py-2 text-sm font-medium text-[#0f172a] shadow-[0_1px_0_rgba(255,255,255,0.7)] sm:inline-flex"
			>
				Entrar
			</a>
			<a
				id="landing-header-cta-button"
				href="/login"
				class="inline-flex rounded-full bg-[#0f172a] px-4 py-2 text-sm font-medium text-white shadow-[0_14px_34px_rgba(15,23,42,0.16)]"
			>
				Criar meu condomínio
			</a>
		</nav>
	</header>

	<main id="landing-main">
		<section
			id="landing-hero"
			class="mx-auto grid w-full max-w-7xl gap-10 px-5 pb-16 pt-8 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:px-8 lg:pb-24 lg:pt-12"
		>
			<div id="landing-hero-copy" class="max-w-2xl">
				<div
					id="landing-hero-kicker"
					class="inline-flex rounded-full border border-[#dbe7f5] bg-white/80 px-3 py-1 text-sm font-medium text-[#2563eb]"
				>
					Sem planilha. Sem taxa escondida. Sem complicação.
				</div>
				<h1
					id="landing-hero-title"
					class="mt-6 max-w-3xl text-5xl font-semibold tracking-[-0.08em] text-[#0f172a] sm:text-6xl lg:text-7xl"
				>
					Seu condomínio sem dor de cabeça.
				</h1>
				<p
					id="landing-hero-description"
					class="mt-6 max-w-2xl text-lg leading-8 text-[#475569] sm:text-xl"
				>
					Gestão simples, transparente e feita para condomínios pequenos. O Ap202 deixa o balancete claro, organiza as despesas e reduz atrito entre síndico e moradores.
				</p>
				<div id="landing-hero-actions" class="mt-8 flex flex-col gap-3 sm:flex-row">
					<a
						id="landing-hero-primary-cta"
						href="/login"
						class="inline-flex items-center justify-center rounded-full bg-[#0f172a] px-6 py-3 text-sm font-medium text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]"
					>
						Começar agora
					</a>
					<a
						id="landing-hero-secondary-cta"
						href="/sidebar-16"
						class="inline-flex items-center justify-center rounded-full border border-[#d7dfeb] bg-white/90 px-6 py-3 text-sm font-medium text-[#0f172a]"
					>
						Ver demonstração
					</a>
				</div>
				<div
					id="landing-hero-proof-strip"
					class="mt-10 grid gap-3 text-sm text-[#475569] sm:grid-cols-3"
				>
					<div id="landing-hero-proof-1" class="rounded-2xl border border-[#e5edf6] bg-white/75 px-4 py-3">
						<div id="landing-hero-proof-1-value" class="text-lg font-semibold text-[#0f172a]">
							Estrutura escalável
						</div>
						<div id="landing-hero-proof-1-label">para condomínios de qualquer porte</div>
					</div>
					<div id="landing-hero-proof-2" class="rounded-2xl border border-[#e5edf6] bg-white/75 px-4 py-3">
						<div id="landing-hero-proof-2-value" class="text-lg font-semibold text-[#0f172a]">
							Números visíveis
						</div>
						<div id="landing-hero-proof-2-label">para síndico e moradores</div>
					</div>
					<div id="landing-hero-proof-3" class="rounded-2xl border border-[#e5edf6] bg-white/75 px-4 py-3">
						<div id="landing-hero-proof-3-value" class="text-lg font-semibold text-[#0f172a]">
							Preço justo
						</div>
						<div id="landing-hero-proof-3-label">sem contrato longo</div>
					</div>
				</div>
			</div>

			<div
				id="landing-hero-visual"
				class="relative overflow-hidden rounded-[32px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.95)_0%,rgba(248,250,252,0.98)_100%)] p-4 shadow-[0_30px_90px_rgba(15,23,42,0.14)] sm:p-5"
			>
				<div
					id="landing-hero-visual-blur"
					class="absolute inset-x-8 top-0 h-32 rounded-full bg-[#bfdbfe]/50 blur-3xl"
				></div>
				<div
					id="landing-hero-dashboard"
					class="relative rounded-[28px] border border-[#e2e8f0] bg-[#f8fafc] p-4 sm:p-5"
				>
					<div id="landing-hero-dashboard-top" class="mb-5 flex items-center justify-between">
						<div id="landing-hero-dashboard-brand" class="space-y-1">
							<div id="landing-hero-dashboard-label" class="text-xs font-medium uppercase tracking-[0.18em] text-[#64748b]">
								Ap202
							</div>
							<div id="landing-hero-dashboard-title" class="text-base font-semibold text-[#0f172a]">
								Balancete de abril
							</div>
						</div>
						<div
							id="landing-hero-dashboard-badge"
							class="rounded-full bg-[#dcfce7] px-3 py-1 text-xs font-medium text-[#166534]"
						>
							Fechado e disponível
						</div>
					</div>

					<div id="landing-hero-dashboard-grid" class="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
						<div id="landing-hero-dashboard-balance-card" class="rounded-[24px] bg-[#0f172a] p-5 text-white">
							<div id="landing-hero-dashboard-balance-label" class="text-sm text-white/70">
								Saldo atual em caixa
							</div>
							<div
								id="landing-hero-dashboard-balance-value"
								class="mt-3 text-3xl font-semibold tracking-[-0.05em]"
							>
								R$ 6.984,21
							</div>
							<div
								id="landing-hero-dashboard-balance-meta"
								class="mt-6 grid gap-3 text-sm text-white/80 sm:grid-cols-2"
							>
								<div id="landing-hero-dashboard-balance-entry" class="rounded-2xl bg-white/8 px-3 py-3">
									<div id="landing-hero-dashboard-balance-entry-label">Recebido no mês</div>
									<div id="landing-hero-dashboard-balance-entry-value" class="mt-1 font-medium text-white">
										R$ 8.460,00
									</div>
								</div>
								<div id="landing-hero-dashboard-balance-exit" class="rounded-2xl bg-white/8 px-3 py-3">
									<div id="landing-hero-dashboard-balance-exit-label">Despesas pagas</div>
									<div id="landing-hero-dashboard-balance-exit-value" class="mt-1 font-medium text-white">
										R$ 5.720,35
									</div>
								</div>
							</div>
						</div>

						<div id="landing-hero-dashboard-side" class="space-y-4">
							<div
								id="landing-hero-dashboard-default-card"
								class="rounded-[24px] border border-[#e2e8f0] bg-white p-5"
							>
								<div id="landing-hero-dashboard-default-label" class="text-sm text-[#64748b]">
									Inadimplência
								</div>
								<div
									id="landing-hero-dashboard-default-value"
									class="mt-2 text-3xl font-semibold tracking-[-0.05em] text-[#0f172a]"
								>
									2 unidades
								</div>
								<div id="landing-hero-dashboard-default-help" class="mt-2 text-sm text-[#475569]">
									R$ 1.940,00 em aberto com visão por apartamento.
								</div>
							</div>

							<div
								id="landing-hero-dashboard-list-card"
								class="rounded-[24px] border border-[#e2e8f0] bg-white p-5"
							>
								<div id="landing-hero-dashboard-list-title" class="text-sm font-medium text-[#0f172a]">
									Ultimas despesas lançadas
								</div>
								<div id="landing-hero-dashboard-list" class="mt-4 space-y-3 text-sm text-[#475569]">
									<div id="landing-hero-dashboard-list-item-1" class="flex items-center justify-between">
										<span id="landing-hero-dashboard-list-item-1-label">Água</span>
										<span id="landing-hero-dashboard-list-item-1-value" class="font-medium text-[#0f172a]">
											R$ 1.248,70
										</span>
									</div>
									<div id="landing-hero-dashboard-list-item-2" class="flex items-center justify-between">
										<span id="landing-hero-dashboard-list-item-2-label">Portão</span>
										<span id="landing-hero-dashboard-list-item-2-value" class="font-medium text-[#0f172a]">
											R$ 690,00
										</span>
									</div>
									<div id="landing-hero-dashboard-list-item-3" class="flex items-center justify-between">
										<span id="landing-hero-dashboard-list-item-3-label">Limpeza</span>
										<span id="landing-hero-dashboard-list-item-3-value" class="font-medium text-[#0f172a]">
											R$ 480,00
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>

		<section
			id="landing-problem"
			class="mx-auto w-full max-w-7xl px-5 py-14 sm:px-6 lg:px-8 lg:py-20"
		>
			<div id="landing-problem-header" class="max-w-2xl">
				<div id="landing-problem-kicker" class="text-sm font-medium uppercase tracking-[0.18em] text-[#2563eb]">
					O problema
				</div>
				<h2
					id="landing-problem-title"
					class="mt-4 text-3xl font-semibold tracking-[-0.06em] text-[#0f172a] sm:text-4xl"
				>
					O condomínio pequeno sofre quando a gestão parece maior do que precisa ser.
				</h2>
				<p id="landing-problem-description" class="mt-4 text-lg leading-8 text-[#475569]">
					O que deveria ser simples vira ruído quando as informações ficam espalhadas, caras e difíceis de entender.
				</p>
			</div>

			<div id="landing-problem-grid" class="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				{#each pains as pain, index}
					<article
						id={`landing-problem-card-${index + 1}`}
						class="rounded-[28px] border border-[#e2e8f0] bg-white/85 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.04)]"
					>
						<div
							id={`landing-problem-card-number-${index + 1}`}
							class="inline-flex rounded-full bg-[#eef4ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#2563eb]"
						>
							0{index + 1}
						</div>
						<h3
							id={`landing-problem-card-title-${index + 1}`}
							class="mt-5 text-xl font-semibold tracking-[-0.04em] text-[#0f172a]"
						>
							{pain.title}
						</h3>
						<p
							id={`landing-problem-card-description-${index + 1}`}
							class="mt-3 text-base leading-7 text-[#475569]"
						>
							{pain.description}
						</p>
					</article>
				{/each}
			</div>
		</section>

		<section
			id="landing-solution"
			class="mx-auto w-full max-w-7xl px-5 py-14 sm:px-6 lg:px-8 lg:py-20"
		>
			<div
				id="landing-solution-shell"
				class="grid gap-8 rounded-[36px] border border-[#dfe7f1] bg-[#0f172a] px-6 py-8 text-white sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:px-10 lg:py-10"
			>
				<div id="landing-solution-copy" class="max-w-xl">
					<div id="landing-solution-kicker" class="text-sm font-medium uppercase tracking-[0.18em] text-[#93c5fd]">
						A solução
					</div>
					<h2
						id="landing-solution-title"
						class="mt-4 text-3xl font-semibold tracking-[-0.06em] sm:text-4xl"
					>
						O Ap202 organiza a gestão sem virar mais um problema para resolver.
					</h2>
					<p id="landing-solution-description" class="mt-5 text-lg leading-8 text-white/72">
						Ele foi pensado para a rotina real do condomínio pequeno: caixa, despesas, inadimplência e comunicação em uma experiência clara, leve e direta.
					</p>
				</div>

				<div id="landing-solution-list" class="grid gap-3 sm:grid-cols-2">
					{#each solutions as item, index}
						<div
							id={`landing-solution-item-${index + 1}`}
							class="rounded-[24px] border border-white/10 bg-white/6 p-5 text-sm leading-7 text-white/80"
						>
							<div
								id={`landing-solution-item-badge-${index + 1}`}
								class="mb-4 inline-flex size-8 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white"
							>
								0{index + 1}
							</div>
							<div id={`landing-solution-item-text-${index + 1}`}>{item}</div>
						</div>
					{/each}
				</div>
			</div>
		</section>

		<section
			id="landing-demo"
			class="mx-auto w-full max-w-7xl px-5 py-14 sm:px-6 lg:px-8 lg:py-20"
		>
			<div id="landing-demo-header" class="max-w-2xl">
				<div id="landing-demo-kicker" class="text-sm font-medium uppercase tracking-[0.18em] text-[#2563eb]">
					Demonstração do produto
				</div>
				<h2
					id="landing-demo-title"
					class="mt-4 text-3xl font-semibold tracking-[-0.06em] text-[#0f172a] sm:text-4xl"
				>
					Telas que priorizam leitura, não complexidade.
				</h2>
				<p id="landing-demo-description" class="mt-4 text-lg leading-8 text-[#475569]">
					Quem abre o sistema encontra o que precisa rápido. Sem menus confusos, sem relatório escondido e sem depender de treinamento longo.
				</p>
			</div>

			<div id="landing-demo-grid" class="mt-10 grid gap-5 xl:grid-cols-3">
				{#each productViews as view, index}
					<article
						id={`landing-demo-card-${index + 1}`}
						class="overflow-hidden rounded-[30px] border border-[#e2e8f0] bg-white shadow-[0_18px_44px_rgba(15,23,42,0.06)]"
					>
						<div
							id={`landing-demo-card-top-${index + 1}`}
							class="border-b border-[#eef2f7] bg-[linear-gradient(180deg,#f8fbff_0%,#f4f7fb_100%)] px-6 py-5"
						>
							<div
								id={`landing-demo-card-eyebrow-${index + 1}`}
								class="text-xs font-semibold uppercase tracking-[0.18em] text-[#2563eb]"
							>
								{view.eyebrow}
							</div>
							<h3
								id={`landing-demo-card-title-${index + 1}`}
								class="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[#0f172a]"
							>
								{view.title}
							</h3>
							<p
								id={`landing-demo-card-description-${index + 1}`}
								class="mt-3 text-base leading-7 text-[#475569]"
							>
								{view.description}
							</p>
						</div>

						<div id={`landing-demo-card-body-${index + 1}`} class="p-6">
							<div
								id={`landing-demo-card-window-${index + 1}`}
								class="rounded-[24px] border border-[#e2e8f0] bg-[#fbfdff] p-4"
							>
								<div
									id={`landing-demo-card-window-header-${index + 1}`}
									class="mb-4 flex items-center justify-between"
								>
									<div
										id={`landing-demo-card-window-title-${index + 1}`}
										class="text-sm font-medium text-[#0f172a]"
									>
										{view.eyebrow} do mês
									</div>
									<div
										id={`landing-demo-card-window-badge-${index + 1}`}
										class="rounded-full bg-[#eef4ff] px-2.5 py-1 text-xs font-medium text-[#2563eb]"
									>
										Abril
									</div>
								</div>
								<div
									id={`landing-demo-card-window-list-${index + 1}`}
									class="space-y-3 text-sm text-[#475569]"
								>
									{#each view.rows as row, rowIndex}
										<div
											id={`landing-demo-card-window-row-${index + 1}-${rowIndex + 1}`}
											class="flex items-center justify-between rounded-2xl border border-[#eef2f7] bg-white px-4 py-3"
										>
											<span id={`landing-demo-card-window-row-label-${index + 1}-${rowIndex + 1}`}>
												{row[0]}
											</span>
											<span
												id={`landing-demo-card-window-row-value-${index + 1}-${rowIndex + 1}`}
												class="font-semibold text-[#0f172a]"
											>
												{row[1]}
											</span>
										</div>
									{/each}
								</div>
							</div>
						</div>
					</article>
				{/each}
			</div>
		</section>

		<section
			id="landing-differentials"
			class="mx-auto w-full max-w-7xl px-5 py-14 sm:px-6 lg:px-8 lg:py-20"
		>
			<div class="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
				<div id="landing-differentials-copy" class="max-w-xl">
					<div id="landing-differentials-kicker" class="text-sm font-medium uppercase tracking-[0.18em] text-[#2563eb]">
						Diferenciais
					</div>
					<h2
						id="landing-differentials-title"
						class="mt-4 text-3xl font-semibold tracking-[-0.06em] text-[#0f172a] sm:text-4xl"
					>
						Menos excesso. Mais clareza no que realmente importa.
					</h2>
					<p id="landing-differentials-description" class="mt-4 text-lg leading-8 text-[#475569]">
						O Ap202 não tenta parecer um ERP. Ele resolve a rotina de um condomínio pequeno com uma estrutura enxuta, transparente e fácil de usar.
					</p>
				</div>

				<div id="landing-differentials-grid" class="grid gap-4 sm:grid-cols-2">
					{#each differentiators as item, index}
						<article
							id={`landing-differentials-card-${index + 1}`}
							class="rounded-[28px] border border-[#e2e8f0] bg-white p-6"
						>
							<h3
								id={`landing-differentials-card-title-${index + 1}`}
								class="text-xl font-semibold tracking-[-0.04em] text-[#0f172a]"
							>
								{item.title}
							</h3>
							<p
								id={`landing-differentials-card-description-${index + 1}`}
								class="mt-3 text-base leading-7 text-[#475569]"
							>
								{item.description}
							</p>
						</article>
					{/each}
				</div>
			</div>
		</section>

		<section
			id="landing-pricing"
			class="mx-auto w-full max-w-7xl px-5 py-14 sm:px-6 lg:px-8 lg:py-20"
		>
			<div
				id="landing-pricing-shell"
				class="grid gap-8 rounded-[36px] border border-[#dfe7f1] bg-white px-6 py-8 shadow-[0_20px_50px_rgba(15,23,42,0.06)] lg:grid-cols-[0.85fr_1.15fr] lg:px-10 lg:py-10"
			>
				<div id="landing-pricing-copy" class="max-w-xl">
					<div id="landing-pricing-kicker" class="text-sm font-medium uppercase tracking-[0.18em] text-[#2563eb]">
						Preços
					</div>
					<h2
						id="landing-pricing-title"
						class="mt-4 text-3xl font-semibold tracking-[-0.06em] text-[#0f172a] sm:text-4xl"
					>
						Preço simples para um problema simples.
					</h2>
					<p id="landing-pricing-description" class="mt-4 text-lg leading-8 text-[#475569]">
						Você paga um valor acessível e previsível para organizar a gestão. Sem taxa escondida, sem implantação longa e sem contrato que prende o condomínio.
					</p>
				</div>

				<div
					id="landing-pricing-card"
					class="rounded-[32px] border border-[#dbe6f3] bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] p-6"
				>
					<div id="landing-pricing-card-plan" class="text-sm font-medium uppercase tracking-[0.18em] text-[#2563eb]">
						Plano único
					</div>
					<div id="landing-pricing-card-price-row" class="mt-4 flex items-end gap-3">
						<div
							id="landing-pricing-card-price"
							class="text-5xl font-semibold tracking-[-0.07em] text-[#0f172a]"
						>
							R$ 4,90
						</div>
						<div id="landing-pricing-card-price-detail" class="pb-2 text-base text-[#64748b]">
							por unidade / mês
						</div>
					</div>
					<div id="landing-pricing-card-note" class="mt-3 text-sm text-[#475569]">
						Exemplo: um condomínio com 12 unidades paga R$ 58,80 por mês.
					</div>
					<div id="landing-pricing-card-list" class="mt-6 space-y-3 text-sm text-[#334155]">
						<div id="landing-pricing-card-item-1" class="rounded-2xl border border-[#e7eef7] bg-white px-4 py-3">
							Sem taxa escondida
						</div>
						<div id="landing-pricing-card-item-2" class="rounded-2xl border border-[#e7eef7] bg-white px-4 py-3">
							Assina e sai quando quiser
						</div>
						<div id="landing-pricing-card-item-3" class="rounded-2xl border border-[#e7eef7] bg-white px-4 py-3">
							Sem surpresa no fechamento
						</div>
					</div>
					<a
						id="landing-pricing-card-cta"
						href="/login"
						class="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[#0f172a] px-6 py-3 text-sm font-medium text-white"
					>
						Criar meu condomínio grátis
					</a>
				</div>
			</div>
		</section>

		<section
			id="landing-principles"
			class="mx-auto w-full max-w-7xl px-5 py-14 sm:px-6 lg:px-8 lg:py-20"
		>
			<div id="landing-principles-header" class="max-w-2xl">
				<div id="landing-principles-kicker" class="text-sm font-medium uppercase tracking-[0.18em] text-[#2563eb]">
					Nosso compromisso
				</div>
				<h2
					id="landing-principles-title"
					class="mt-4 text-3xl font-semibold tracking-[-0.06em] text-[#0f172a] sm:text-4xl"
				>
					Confiança se constrói com clareza, não com promessa vazia.
				</h2>
				<p id="landing-principles-description" class="mt-4 text-lg leading-8 text-[#475569]">
					Enquanto o Ap202 cresce, o compromisso é manter o produto simples, transparente e honesto sobre o que entrega.
				</p>
			</div>

			<div id="landing-principles-grid" class="mt-10 grid gap-4 lg:grid-cols-3">
				{#each principles as principle, index}
					<article
						id={`landing-principles-card-${index + 1}`}
						class="rounded-[30px] border border-[#e2e8f0] bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.04)]"
					>
						<h3
							id={`landing-principles-card-title-${index + 1}`}
							class="text-xl font-semibold tracking-[-0.04em] text-[#0f172a]"
						>
							{principle.title}
						</h3>
						<p
							id={`landing-principles-card-description-${index + 1}`}
							class="mt-4 text-base leading-7 text-[#475569]"
						>
							{principle.description}
						</p>
					</article>
				{/each}
			</div>
		</section>

		<section
			id="landing-trust"
			class="mx-auto w-full max-w-7xl px-5 py-14 sm:px-6 lg:px-8 lg:py-20"
		>
			<div class="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
				<div id="landing-trust-copy" class="max-w-xl">
					<div id="landing-trust-kicker" class="text-sm font-medium uppercase tracking-[0.18em] text-[#2563eb]">
						Segurança e confiança
					</div>
					<h2
						id="landing-trust-title"
						class="mt-4 text-3xl font-semibold tracking-[-0.06em] text-[#0f172a] sm:text-4xl"
					>
						Confiança não vem só da interface. Vem da consistência dos dados.
					</h2>
					<p id="landing-trust-description" class="mt-4 text-lg leading-8 text-[#475569]">
						As informações precisam estar protegidas, organizadas e acessíveis quando o condomínio precisa prestar contas.
					</p>
				</div>

				<div id="landing-trust-list" class="grid gap-4">
					{#each trustItems as item, index}
						<div
							id={`landing-trust-item-${index + 1}`}
							class="rounded-[28px] border border-[#e2e8f0] bg-white px-6 py-5 text-base leading-7 text-[#334155]"
						>
							{item}
						</div>
					{/each}
				</div>
			</div>
		</section>

		<section
			id="landing-final-cta"
			class="mx-auto w-full max-w-7xl px-5 pb-20 pt-8 sm:px-6 lg:px-8 lg:pb-28"
		>
			<div
				id="landing-final-cta-shell"
				class="overflow-hidden rounded-[40px] bg-[linear-gradient(135deg,#0f172a_0%,#172554_100%)] px-6 py-10 text-white shadow-[0_28px_70px_rgba(15,23,42,0.18)] sm:px-8 lg:px-12 lg:py-12"
			>
				<div class="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
					<div id="landing-final-cta-copy" class="max-w-2xl">
						<div
							id="landing-final-cta-kicker"
							class="text-sm font-medium uppercase tracking-[0.18em] text-[#93c5fd]"
						>
							Pronto para começar
						</div>
						<h2
							id="landing-final-cta-title"
							class="mt-4 text-3xl font-semibold tracking-[-0.06em] sm:text-4xl"
						>
							Tranquilidade para o síndico. Clareza para os moradores.
						</h2>
						<p id="landing-final-cta-description" class="mt-4 text-lg leading-8 text-white/78">
							Crie seu condomínio em poucos minutos e troque planilhas, dúvidas e conflitos por uma gestão simples, clara e justa.
						</p>
					</div>

					<div id="landing-final-cta-actions" class="flex flex-col gap-3 sm:flex-row lg:flex-col">
						<a
							id="landing-final-cta-primary"
							href="/login"
							class="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-medium text-[#0f172a]"
						>
							Criar meu condomínio grátis
						</a>
						<a
							id="landing-final-cta-secondary"
							href="/sidebar-16"
							class="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/8 px-6 py-3 text-sm font-medium text-white"
						>
							Começar em poucos minutos
						</a>
					</div>
				</div>
			</div>
		</section>
	</main>
</div>
