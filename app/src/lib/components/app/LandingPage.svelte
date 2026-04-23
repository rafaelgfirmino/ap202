<script lang="ts">
	import BadgeCheckIcon from '@lucide/svelte/icons/badge-check';
	import BarChart3Icon from '@lucide/svelte/icons/bar-chart-3';
	import BellRingIcon from '@lucide/svelte/icons/bell-ring';
	import Building2Icon from '@lucide/svelte/icons/building-2';
	import CheckCircle2Icon from '@lucide/svelte/icons/check-circle-2';
	import CircleDollarSignIcon from '@lucide/svelte/icons/circle-dollar-sign';
	import FileSpreadsheetIcon from '@lucide/svelte/icons/file-spreadsheet';
	import HandCoinsIcon from '@lucide/svelte/icons/hand-coins';
	import LandmarkIcon from '@lucide/svelte/icons/landmark';
	import MessageCircleMoreIcon from '@lucide/svelte/icons/message-circle-more';
	import ReceiptTextIcon from '@lucide/svelte/icons/receipt-text';
	import ScaleIcon from '@lucide/svelte/icons/scale';
	import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
	import UsersIcon from '@lucide/svelte/icons/users';
	import WalletCardsIcon from '@lucide/svelte/icons/wallet-cards';
	import Logo from '$lib/components/app/logo/index.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';

	interface ProblemItem {
		title: string;
		description: string;
		icon: typeof FileSpreadsheetIcon;
	}

	interface SolutionStep {
		title: string;
		description: string;
	}

	interface BenefitItem {
		title: string;
		description: string;
		icon: typeof ShieldCheckIcon;
	}

	interface FeatureItem {
		title: string;
		description: string;
		icon: typeof Building2Icon;
	}

	interface PricingTier {
		label: string;
		price: string;
		description: string;
		highlight?: boolean;
	}

	interface FaqItem {
		question: string;
		answer: string;
	}

	const whatsappContactHref =
		'https://wa.me/5531996767346?text=Ol%C3%A1%21%20Quero%20conhecer%20o%20AP202%20para%20meu%20condom%C3%ADnio.';
	const entryHref = '/entrar';

	const heroMetrics: Array<{ label: string; value: string }> = [
		{ label: 'Condomínios ideais', value: 'Até 30 unidades' },
		{ label: 'Cobrança incluída', value: '1 boleto compensado' },
		{ label: 'Lembrete mensal', value: '1 WhatsApp por unidade' }
	];

	const problems: ProblemItem[] = [
		{
			title: 'Cobrança feita no braço',
			description: 'Mensagens manuais, boletos soltos e muito retrabalho todo mês.',
			icon: HandCoinsIcon
		},
		{
			title: 'Inadimplência difícil de acompanhar',
			description: 'Sem uma visão clara, o síndico perde tempo tentando descobrir quem pagou.',
			icon: BarChart3Icon
		},
		{
			title: 'Financeiro espalhado em planilhas',
			description: 'Entradas, saídas e comprovantes ficam desorganizados e difíceis de conferir.',
			icon: FileSpreadsheetIcon
		},
		{
			title: 'Comunicação confusa com moradores',
			description: 'Avisos e cobranças se misturam, gerando ruído e atrasos desnecessários.',
			icon: MessageCircleMoreIcon
		}
	];

	const solutionSteps: SolutionStep[] = [
		{
			title: 'Emita cobranças sem burocracia',
			description: 'Organize a cobrança por unidade com um processo simples e recorrente.'
		},
		{
			title: 'Acompanhe a inadimplência em segundos',
			description: 'Veja rapidamente o que está em aberto, o que venceu e o que já foi pago.'
		},
		{
			title: 'Envie lembretes por WhatsApp',
			description: 'Reforce a cobrança com comunicação mais direta, clara e conveniente.'
		},
		{
			title: 'Centralize a gestão financeira',
			description: 'Tenha pagamentos, indicadores e histórico do condomínio em um só lugar.'
		}
	];

	const benefits: BenefitItem[] = [
		{
			title: 'Mais controle financeiro',
			description:
				'O síndico visualiza a situação do condomínio sem depender de planilhas paralelas.',
			icon: WalletCardsIcon
		},
		{
			title: 'Menos inadimplência',
			description: 'Cobranças organizadas e lembretes claros ajudam a reduzir atrasos recorrentes.',
			icon: BellRingIcon
		},
		{
			title: 'Menos trabalho manual',
			description: 'O AP202 reduz tarefas repetitivas para sobrar tempo para a gestão do prédio.',
			icon: ReceiptTextIcon
		},
		{
			title: 'Mais transparência',
			description:
				'Tudo fica mais fácil de acompanhar, do status das cobranças ao preço do sistema.',
			icon: ScaleIcon
		},
		{
			title: 'Cobrança organizada',
			description: 'Cada unidade tem acompanhamento simples, com histórico e visão objetiva.',
			icon: CircleDollarSignIcon
		},
		{
			title: 'Feito para condomínio pequeno',
			description: 'A experiência é leve, direta e pensada para autogestão sem complicação.',
			icon: Building2Icon
		}
	];

	const features: FeatureItem[] = [
		{
			title: 'Gestão de unidades',
			description: 'Cadastre unidades e acompanhe cada uma com mais contexto.',
			icon: Building2Icon
		},
		{
			title: 'Boletos',
			description: 'Emita cobranças com mais padronização e previsibilidade.',
			icon: LandmarkIcon
		},
		{
			title: 'Cobrança via WhatsApp',
			description: 'Envie lembretes mensais por unidade sem depender de processos improvisados.',
			icon: MessageCircleMoreIcon
		},
		{
			title: 'Acompanhamento da inadimplência',
			description: 'Entenda rapidamente quem está em dia e quem precisa de atenção.',
			icon: BarChart3Icon
		},
		{
			title: 'Visão de pagamentos',
			description: 'Monitore recebimentos e status de cobrança em uma visualização central.',
			icon: CheckCircle2Icon
		},
		{
			title: 'Relatórios financeiros',
			description: 'Tenha uma leitura prática do financeiro do condomínio.',
			icon: WalletCardsIcon
		},
		{
			title: 'Rateio por unidade',
			description: 'Visualize quanto cabe a cada unidade com clareza e organização.',
			icon: ScaleIcon
		},
		{
			title: 'Cadastro de moradores',
			description: 'Mantenha a base organizada para facilitar comunicação e gestão.',
			icon: UsersIcon
		},
		{
			title: 'Organização do condomínio',
			description: 'Centralize rotinas administrativas em uma ferramenta mais simples de operar.',
			icon: ShieldCheckIcon
		}
	];

	const pricingTiers: PricingTier[] = [
		{
			label: 'Até 5 unidades',
			price: 'R$ 39,90/mês',
			description: 'Entrada simples para condomínios bem enxutos.'
		},
		{
			label: 'De 6 a 30 unidades',
			price: 'R$ 5,99 por unidade/mês',
			description: 'Faixa principal para condomínios com autogestão.',
			highlight: true
		},
		{
			label: 'De 31 a 50 unidades',
			price: 'R$ 5,79 por unidade/mês',
			description: 'Mais escala mantendo clareza no custo.'
		},
		{
			label: 'De 51 a 100 unidades',
			price: 'R$ 5,49 por unidade/mês',
			description: 'Preço por unidade menor conforme o condomínio cresce.'
		},
		{
			label: 'Acima de 100 unidades',
			price: 'R$ 4,99 por unidade/mês',
			description: 'Faixa para operações maiores com previsibilidade.'
		}
	];

	const faqs: FaqItem[] = [
		{
			question: 'Como funciona a cobrança por unidade?',
			answer:
				'O valor acompanha a faixa de unidades do condomínio. Em cada unidade por mês, o plano inclui 1 boleto compensado e 1 cobrança via WhatsApp.'
		},
		{
			question: 'O que significa boleto compensado?',
			answer:
				'É o boleto que foi pago e teve a compensação registrada, ajudando o síndico a acompanhar o recebimento com mais segurança.'
		},
		{
			question: 'Posso usar em condomínio pequeno?',
			answer:
				'Sim. O AP202 foi pensado justamente para condomínios pequenos, com foco inicial em prédios e conjuntos de até 30 unidades.'
		},
		{
			question: 'O sistema envia cobrança por WhatsApp?',
			answer:
				'Sim. Cada unidade conta com 1 cobrança via WhatsApp por mês incluída na composição do preço informado.'
		},
		{
			question: 'Preciso pedir orçamento?',
			answer:
				'Não. A proposta é ter preço público e transparente para você entender o custo antes mesmo de falar com alguém.'
		},
		{
			question: 'Existe taxa de implantação?',
			answer:
				'Esta página apresenta a mensalidade de forma clara. Se houver cobrança excedente por volume adicional, isso aparece de forma separada.'
		},
		{
			question: 'Como funciona se eu tiver mais unidades?',
			answer:
				'O preço por unidade muda conforme a faixa do condomínio, mantendo a contratação previsível e sem tabela escondida.'
		}
	];
</script>

<svelte:head>
	<title>AP202 | Gestão condominial simples e cobrança organizada</title>
	<meta
		name="description"
		content="Gestão condominial simples, cobrança organizada e preço transparente para condomínios pequenos."
	/>
</svelte:head>

<main
	id="landing-page"
	data-test="landing-page"
	class="min-h-screen overflow-x-hidden bg-background text-foreground"
>
	<div id="landing-page-shell" data-test="landing-page-shell" class="relative isolate">
		<a
			id="landing-floating-whatsapp-button"
			data-test="landing-floating-whatsapp-button"
			class="fixed right-4 bottom-4 z-50 inline-flex items-center gap-3 rounded-full bg-emerald-600 px-3 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all hover:bg-emerald-500 sm:right-6 sm:bottom-6"
			href={whatsappContactHref}
			target="_blank"
			rel="noreferrer"
		>
			<span
				id="landing-floating-whatsapp-icon-wrap"
				data-test="landing-floating-whatsapp-icon-wrap"
				class="flex h-10 w-10 items-center justify-center rounded-full bg-white/18"
			>
				<MessageCircleMoreIcon
					id="landing-floating-whatsapp-icon"
					data-test="landing-floating-whatsapp-icon"
					class="h-5 w-5"
					aria-hidden="true"
				/>
			</span>
			<span
				id="landing-floating-whatsapp-text"
				data-test="landing-floating-whatsapp-text"
				class="pr-2"
			>
				Fale conosco
			</span>
		</a>

		<div
			id="landing-page-background-orb-left"
			data-test="landing-page-background-orb-left"
			class="absolute top-[-8rem] left-[-12rem] h-80 w-80 rounded-full bg-primary/12 blur-3xl"
		></div>
		<div
			id="landing-page-background-orb-right"
			data-test="landing-page-background-orb-right"
			class="absolute top-56 right-[-10rem] h-72 w-72 rounded-full bg-emerald-200/35 blur-3xl"
		></div>

		<section
			id="landing-hero-section"
			data-test="landing-hero-section"
			class="relative border-b border-slate-200/80"
		>
			<div
				id="landing-hero-container"
				data-test="landing-hero-container"
				class="flex w-full flex-col px-5 py-6 sm:px-8 lg:px-10 2xl:px-16"
			>
				<header
					id="landing-header"
					data-test="landing-header"
					class="mb-12 flex flex-col gap-4 border-b border-slate-200/70 pb-6 lg:flex-row lg:items-center lg:justify-between"
				>
					<div
						id="landing-brand-wrap"
						data-test="landing-brand-wrap"
						class="flex items-center gap-4"
					>
						<div
							id="landing-brand-mark"
							data-test="landing-brand-mark"
							class="flex h-14 items-center"
						>
							<Logo class="h-10" />
						</div>
						<div id="landing-brand-text-wrap" data-test="landing-brand-text-wrap" class="space-y-1">
							<p
								id="landing-brand-tagline"
								data-test="landing-brand-tagline"
								class="text-sm text-muted-foreground"
							>
								Gestão condominial leve, clara e confiável.
							</p>
						</div>
					</div>

					<nav
						id="landing-header-nav"
						data-test="landing-header-nav"
						class="flex flex-wrap items-center gap-3 text-sm font-medium"
					>
						<a
							id="landing-header-link-benefits"
							data-test="landing-header-link-benefits"
							class="text-muted-foreground transition-colors hover:text-foreground"
							href="#landing-benefits-section"
						>
							Benefícios
						</a>
						<a
							id="landing-header-link-pricing"
							data-test="landing-header-link-pricing"
							class="text-muted-foreground transition-colors hover:text-foreground"
							href="#landing-pricing-section"
						>
							Preços
						</a>
						<a
							id="landing-header-link-faq"
							data-test="landing-header-link-faq"
							class="text-muted-foreground transition-colors hover:text-foreground"
							href="#landing-faq-section"
						>
							FAQ
						</a>
						<Button
							id="landing-header-button-login"
							class="h-11 rounded-full px-6 text-sm font-semibold shadow-md shadow-primary/20 ring-1 ring-primary/20"
							href={entryHref}
						>
							Entrar
						</Button>
					</nav>
				</header>

				<div
					id="landing-hero-grid"
					data-test="landing-hero-grid"
					class="grid items-center gap-10 xl:grid-cols-[1.04fr_0.96fr]"
				>
					<div id="landing-hero-content" data-test="landing-hero-content" class="space-y-8">
						<div id="landing-hero-copy" data-test="landing-hero-copy" class="space-y-5">
							<div
								id="landing-hero-badge"
								data-test="landing-hero-badge"
								class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-background/90 px-4 py-2 text-sm font-medium text-primary shadow-sm"
							>
								<BadgeCheckIcon class="h-4 w-4" aria-hidden="true" />
								<span id="landing-hero-badge-text" data-test="landing-hero-badge-text">
									Feito de síndico para síndico
								</span>
							</div>

							<h1
								id="landing-hero-title"
								data-test="landing-hero-title"
								class="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl"
							>
								Gestão condominial simples, cobrança organizada e menos dor de cabeça para o
								síndico.
							</h1>

							<p
								id="landing-hero-description"
								data-test="landing-hero-description"
								class="max-w-2xl text-lg leading-8 text-muted-foreground"
							>
								O AP202 nasceu da rotina real de quem administra condomínio. Ele ajuda
								condomínios com autogestão a cobrar melhor, acompanhar a inadimplência e
								organizar o financeiro sem burocracia e sem preço escondido.
							</p>

							<div
								id="landing-hero-highlight"
								data-test="landing-hero-highlight"
								class="inline-flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-secondary/70 px-4 py-3 text-sm font-medium"
							>
								<CheckCircle2Icon class="h-4 w-4 text-primary" aria-hidden="true" />
								<span id="landing-hero-highlight-text" data-test="landing-hero-highlight-text">
									1 boleto compensado + 1 cobrança via WhatsApp por unidade/mês
								</span>
							</div>
						</div>

						<div
							id="landing-hero-actions"
							data-test="landing-hero-actions"
							class="flex flex-col gap-3 sm:flex-row"
						>
							<Button
								id="landing-hero-primary-cta"
								class="h-12 rounded-full px-7 text-base"
								href={entryHref}
							>
								Começar com preço claro
							</Button>
							<Button
								id="landing-hero-whatsapp-cta"
								class="h-12 rounded-full px-7 text-base"
								href={whatsappContactHref}
								target="_blank"
								rel="noreferrer"
								variant="outline"
							>
								Entrar em contato
							</Button>
							<Button
								id="landing-hero-secondary-cta"
								class="h-12 rounded-full px-7 text-base"
								href="#landing-pricing-section"
								variant="outline"
							>
								Ver tabela de preços
							</Button>
						</div>

						<div
							id="landing-hero-metrics"
							data-test="landing-hero-metrics"
							class="grid gap-3 sm:grid-cols-3"
						>
							{#each heroMetrics as metric, index}
								<div
									id={`landing-hero-metric-${index + 1}`}
									data-test={`landing-hero-metric-${index + 1}`}
									class="rounded-3xl border border-slate-200 bg-background/90 p-4 shadow-sm"
								>
									<p
										id={`landing-hero-metric-label-${index + 1}`}
										data-test={`landing-hero-metric-label-${index + 1}`}
										class="text-sm text-muted-foreground"
									>
										{metric.label}
									</p>
									<p
										id={`landing-hero-metric-value-${index + 1}`}
										data-test={`landing-hero-metric-value-${index + 1}`}
										class="mt-2 text-lg font-semibold"
									>
										{metric.value}
									</p>
								</div>
							{/each}
						</div>
					</div>

					<div
						id="landing-hero-visual-column"
						data-test="landing-hero-visual-column"
						class="relative"
					>
						<div
							id="landing-hero-visual-frame"
							data-test="landing-hero-visual-frame"
							class="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-background via-background to-primary/10 p-3 shadow-[0_24px_80px_-36px_rgba(15,23,42,0.45)]"
						>
							<div
								id="landing-hero-visual-card"
								data-test="landing-hero-visual-card"
								class="rounded-[1.5rem] border border-slate-200 bg-background p-4 sm:p-5"
							>
								<div
									id="landing-dashboard-header"
									data-test="landing-dashboard-header"
									class="mb-4 flex flex-col gap-4 border-b border-slate-200 pb-4 md:flex-row md:items-start md:justify-between"
								>
									<div
										id="landing-dashboard-header-copy"
										data-test="landing-dashboard-header-copy"
										class="space-y-2"
									>
										<p
											id="landing-dashboard-overline"
											data-test="landing-dashboard-overline"
											class="text-xs font-semibold tracking-[0.22em] text-primary uppercase"
										>
											Painel AP202
										</p>
										<h2
											id="landing-dashboard-title"
											data-test="landing-dashboard-title"
											class="text-xl font-semibold"
										>
											Cobrança e gestão em uma visão clara
										</h2>
									</div>
									<div
										id="landing-dashboard-pill"
										data-test="landing-dashboard-pill"
										class="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
									>
										Condomínio em dia
									</div>
								</div>

								<div
									id="landing-dashboard-grid"
									data-test="landing-dashboard-grid"
									class="grid gap-4"
								>
									<div
										id="landing-dashboard-top-cards"
										data-test="landing-dashboard-top-cards"
										class="grid gap-4 md:grid-cols-2 2xl:grid-cols-3"
									>
										<div
											id="landing-dashboard-card-revenue"
											data-test="landing-dashboard-card-revenue"
											class="rounded-3xl border border-slate-200 bg-gradient-to-br from-primary/10 to-primary/5 p-4"
										>
											<p
												id="landing-dashboard-card-revenue-label"
												data-test="landing-dashboard-card-revenue-label"
												class="text-xs tracking-[0.22em] text-muted-foreground uppercase"
											>
												Recebimentos
											</p>
											<p
												id="landing-dashboard-card-revenue-value"
												data-test="landing-dashboard-card-revenue-value"
												class="mt-3 text-2xl font-semibold"
											>
												R$ 12.480
											</p>
											<p
												id="landing-dashboard-card-revenue-note"
												data-test="landing-dashboard-card-revenue-note"
												class="mt-2 text-sm text-muted-foreground"
											>
												92% das unidades pagaram no prazo.
											</p>
										</div>

										<div
											id="landing-dashboard-card-overdue"
											data-test="landing-dashboard-card-overdue"
											class="rounded-3xl border border-slate-200 p-4"
										>
											<p
												id="landing-dashboard-card-overdue-label"
												data-test="landing-dashboard-card-overdue-label"
												class="text-xs tracking-[0.22em] text-muted-foreground uppercase"
											>
												Inadimplência
											</p>
											<p
												id="landing-dashboard-card-overdue-value"
												data-test="landing-dashboard-card-overdue-value"
												class="mt-3 text-2xl font-semibold"
											>
												3 unidades
											</p>
											<p
												id="landing-dashboard-card-overdue-note"
												data-test="landing-dashboard-card-overdue-note"
												class="mt-2 text-sm text-muted-foreground"
											>
												Lembretes enviados com acompanhamento por unidade.
											</p>
										</div>

										<div
											id="landing-dashboard-card-whatsapp"
											data-test="landing-dashboard-card-whatsapp"
											class="rounded-3xl border border-slate-200 p-4"
										>
											<p
												id="landing-dashboard-card-whatsapp-label"
												data-test="landing-dashboard-card-whatsapp-label"
												class="text-xs tracking-[0.22em] text-muted-foreground uppercase"
											>
												Cobranças do mês
											</p>
											<p
												id="landing-dashboard-card-whatsapp-value"
												data-test="landing-dashboard-card-whatsapp-value"
												class="mt-3 text-2xl font-semibold"
											>
												24 boletos
											</p>
											<p
												id="landing-dashboard-card-whatsapp-note"
												data-test="landing-dashboard-card-whatsapp-note"
												class="mt-2 text-sm text-muted-foreground"
											>
												24 mensagens por WhatsApp programadas.
											</p>
										</div>
									</div>

									<div
										id="landing-dashboard-bottom-grid"
										data-test="landing-dashboard-bottom-grid"
										class="grid gap-4 xl:grid-cols-2 2xl:grid-cols-[1.05fr_0.9fr_0.85fr]"
									>
										<div
											id="landing-dashboard-list-card"
											data-test="landing-dashboard-list-card"
											class="rounded-[1.75rem] border border-slate-200 p-4"
										>
											<div
												id="landing-dashboard-list-header"
												data-test="landing-dashboard-list-header"
												class="mb-4 flex items-center justify-between"
											>
												<h3
													id="landing-dashboard-list-title"
													data-test="landing-dashboard-list-title"
													class="text-base font-semibold"
												>
													Unidades com atenção
												</h3>
												<p
													id="landing-dashboard-list-subtitle"
													data-test="landing-dashboard-list-subtitle"
													class="text-sm text-muted-foreground"
												>
													Visão rápida do mês
												</p>
											</div>

											<div
												id="landing-dashboard-list"
												data-test="landing-dashboard-list"
												class="space-y-3"
											>
												{#each [{ unit: 'Apto 101', status: 'Pago', tone: 'emerald' }, { unit: 'Apto 202', status: 'Vence hoje', tone: 'amber' }, { unit: 'Apto 303', status: 'Em aberto', tone: 'rose' }] as item, index}
													<div
														id={`landing-dashboard-list-item-${index + 1}`}
														data-test={`landing-dashboard-list-item-${index + 1}`}
														class="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3"
													>
														<div
															id={`landing-dashboard-list-item-copy-${index + 1}`}
															data-test={`landing-dashboard-list-item-copy-${index + 1}`}
															class="space-y-1"
														>
															<p
																id={`landing-dashboard-list-item-unit-${index + 1}`}
																data-test={`landing-dashboard-list-item-unit-${index + 1}`}
																class="font-medium"
															>
																{item.unit}
															</p>
															<p
																id={`landing-dashboard-list-item-note-${index + 1}`}
																data-test={`landing-dashboard-list-item-note-${index + 1}`}
																class="text-sm text-muted-foreground"
															>
																Cobrança acompanhada em um só lugar.
															</p>
														</div>
														<div
															id={`landing-dashboard-list-item-status-${index + 1}`}
															data-test={`landing-dashboard-list-item-status-${index + 1}`}
															class={[
																'rounded-full px-3 py-1 text-xs font-semibold',
																item.tone === 'emerald' &&
																	'border border-emerald-200 bg-emerald-50 text-emerald-700',
																item.tone === 'amber' &&
																	'border border-amber-200 bg-amber-50 text-amber-700',
																item.tone === 'rose' &&
																	'border border-rose-200 bg-rose-50 text-rose-700'
															]}
														>
															{item.status}
														</div>
													</div>
												{/each}
											</div>
										</div>

										<div
											id="landing-dashboard-allocation-card"
											data-test="landing-dashboard-allocation-card"
											class="rounded-[1.75rem] border border-slate-200 p-4"
										>
											<div
												id="landing-dashboard-allocation-header"
												data-test="landing-dashboard-allocation-header"
												class="mb-4 flex items-center justify-between"
											>
												<div
													id="landing-dashboard-allocation-copy"
													data-test="landing-dashboard-allocation-copy"
													class="space-y-1"
												>
													<h3
														id="landing-dashboard-allocation-title"
														data-test="landing-dashboard-allocation-title"
														class="text-base font-semibold"
													>
														Rateio por unidade
													</h3>
													<p
														id="landing-dashboard-allocation-subtitle"
														data-test="landing-dashboard-allocation-subtitle"
														class="text-sm text-muted-foreground"
													>
														Despesas distribuídas com visão objetiva
													</p>
												</div>
												<div
													id="landing-dashboard-allocation-badge"
													data-test="landing-dashboard-allocation-badge"
													class="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700"
												>
													Abril
												</div>
											</div>

											<div
												id="landing-dashboard-allocation-list"
												data-test="landing-dashboard-allocation-list"
												class="space-y-3"
											>
												{#each [
													{ label: 'Água', value: 'R$ 68,40' },
													{ label: 'Luz comum', value: 'R$ 44,10' },
													{ label: 'Limpeza', value: 'R$ 37,50' },
													{ label: 'Reserva', value: 'R$ 25,00' }
												] as item, index}
													<div
														id={`landing-dashboard-allocation-item-${index + 1}`}
														data-test={`landing-dashboard-allocation-item-${index + 1}`}
														class="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
													>
														<p
															id={`landing-dashboard-allocation-item-label-${index + 1}`}
															data-test={`landing-dashboard-allocation-item-label-${index + 1}`}
															class="text-sm font-medium"
														>
															{item.label}
														</p>
														<p
															id={`landing-dashboard-allocation-item-value-${index + 1}`}
															data-test={`landing-dashboard-allocation-item-value-${index + 1}`}
															class="text-sm font-semibold"
														>
															{item.value}
														</p>
													</div>
												{/each}
											</div>

											<div
												id="landing-dashboard-allocation-total"
												data-test="landing-dashboard-allocation-total"
												class="mt-4 rounded-2xl border border-slate-200 bg-primary/5 px-4 py-3"
											>
												<p
													id="landing-dashboard-allocation-total-label"
													data-test="landing-dashboard-allocation-total-label"
													class="text-sm text-muted-foreground"
												>
													Total do rateio da unidade 202
												</p>
												<p
													id="landing-dashboard-allocation-total-value"
													data-test="landing-dashboard-allocation-total-value"
													class="mt-1 text-2xl font-semibold"
												>
													R$ 175,00
												</p>
											</div>
										</div>

										<div
											id="landing-dashboard-summary-card"
											data-test="landing-dashboard-summary-card"
											class="rounded-[1.75rem] bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-slate-50 xl:col-span-2 2xl:col-span-1"
										>
											<p
												id="landing-dashboard-summary-overline"
												data-test="landing-dashboard-summary-overline"
												class="text-xs font-semibold tracking-[0.22em] text-slate-300 uppercase"
											>
												Resumo financeiro
											</p>
											<h3
												id="landing-dashboard-summary-title"
												data-test="landing-dashboard-summary-title"
												class="mt-3 text-xl leading-tight font-semibold sm:text-2xl"
											>
												Organização para cobrar melhor sem virar um ERP complicado.
											</h3>
											<div
												id="landing-dashboard-summary-points"
												data-test="landing-dashboard-summary-points"
												class="mt-6 space-y-3"
											>
												<div
													id="landing-dashboard-summary-point-1"
													data-test="landing-dashboard-summary-point-1"
													class="flex items-center gap-3"
												>
													<div
														id="landing-dashboard-summary-point-icon-1"
														data-test="landing-dashboard-summary-point-icon-1"
														class="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10"
													>
														<LandmarkIcon class="h-4 w-4" aria-hidden="true" />
													</div>
													<p
														id="landing-dashboard-summary-point-text-1"
														data-test="landing-dashboard-summary-point-text-1"
														class="text-sm leading-6 text-slate-200"
													>
														Boletos e pagamentos com leitura objetiva.
													</p>
												</div>
												<div
													id="landing-dashboard-summary-point-2"
													data-test="landing-dashboard-summary-point-2"
													class="flex items-center gap-3"
												>
													<div
														id="landing-dashboard-summary-point-icon-2"
														data-test="landing-dashboard-summary-point-icon-2"
														class="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10"
													>
														<MessageCircleMoreIcon class="h-4 w-4" aria-hidden="true" />
													</div>
													<p
														id="landing-dashboard-summary-point-text-2"
														data-test="landing-dashboard-summary-point-text-2"
														class="text-sm leading-6 text-slate-200"
													>
														Cobranças por WhatsApp para reforçar a comunicação.
													</p>
												</div>
												<div
													id="landing-dashboard-summary-point-3"
													data-test="landing-dashboard-summary-point-3"
													class="flex items-center gap-3"
												>
													<div
														id="landing-dashboard-summary-point-icon-3"
														data-test="landing-dashboard-summary-point-icon-3"
														class="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10"
													>
														<ShieldCheckIcon class="h-4 w-4" aria-hidden="true" />
													</div>
													<p
														id="landing-dashboard-summary-point-text-3"
														data-test="landing-dashboard-summary-point-text-3"
														class="text-sm leading-6 text-slate-200"
													>
														Rateio e cobrança com leitura clara para o síndico.
													</p>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>

		<section
			id="landing-problems-section"
			data-test="landing-problems-section"
			class="w-full px-5 py-20 sm:px-8 lg:px-10 2xl:px-16"
		>
			<div
				id="landing-problems-header"
				data-test="landing-problems-header"
				class="max-w-3xl space-y-4"
			>
				<p
					id="landing-problems-overline"
					data-test="landing-problems-overline"
					class="text-sm font-semibold tracking-[0.22em] text-primary uppercase"
				>
					O problema
				</p>
				<h2
					id="landing-problems-title"
					data-test="landing-problems-title"
					class="text-3xl font-semibold tracking-tight sm:text-4xl"
				>
					Quando a gestão depende de planilha, a cobrança vira desgaste.
				</h2>
				<p
					id="landing-problems-description"
					data-test="landing-problems-description"
					class="text-lg leading-8 text-muted-foreground"
				>
					Em muitos condomínios pequenos, o síndico precisa cobrar, conferir pagamentos, organizar o
					financeiro e ainda responder moradores sem uma ferramenta realmente feita para isso.
				</p>
			</div>

			<div
				id="landing-problems-grid"
				data-test="landing-problems-grid"
				class="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4"
			>
				{#each problems as problem, index}
					<Card.Root
						id={`landing-problem-card-${index + 1}`}
						class="rounded-[1.75rem] border-slate-200 shadow-none"
					>
						<Card.Content id={`landing-problem-card-content-${index + 1}`} class="space-y-5 p-6">
							<div
								id={`landing-problem-icon-wrap-${index + 1}`}
								data-test={`landing-problem-icon-wrap-${index + 1}`}
								class="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary"
							>
								<problem.icon class="h-5 w-5 text-primary" aria-hidden="true" />
							</div>
							<h3
								id={`landing-problem-title-${index + 1}`}
								data-test={`landing-problem-title-${index + 1}`}
								class="text-xl font-semibold"
							>
								{problem.title}
							</h3>
							<p
								id={`landing-problem-description-${index + 1}`}
								data-test={`landing-problem-description-${index + 1}`}
								class="leading-7 text-muted-foreground"
							>
								{problem.description}
							</p>
						</Card.Content>
					</Card.Root>
				{/each}
			</div>
		</section>

		<section
			id="landing-solution-section"
			data-test="landing-solution-section"
			class="border-y border-slate-200/70 bg-secondary/55"
		>
			<div
				id="landing-solution-container"
				data-test="landing-solution-container"
				class="grid w-full gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-10 2xl:px-16"
			>
				<div id="landing-solution-copy" data-test="landing-solution-copy" class="space-y-5">
					<p
						id="landing-solution-overline"
						data-test="landing-solution-overline"
						class="text-sm font-semibold tracking-[0.22em] text-primary uppercase"
					>
						A solução
					</p>
					<h2
						id="landing-solution-title"
						data-test="landing-solution-title"
						class="text-3xl font-semibold tracking-tight sm:text-4xl"
					>
						O AP202 organiza a rotina do condomínio para cobrar melhor e trabalhar com mais clareza.
					</h2>
					<p
						id="landing-solution-description"
						data-test="landing-solution-description"
						class="text-lg leading-8 text-muted-foreground"
					>
						Em vez de espalhar informação em vários lugares, você acompanha cobrança, inadimplência,
						pagamentos e comunicação com moradores em uma operação mais simples.
					</p>
				</div>

				<div id="landing-solution-steps" data-test="landing-solution-steps" class="grid gap-4">
					{#each solutionSteps as step, index}
						<div
							id={`landing-solution-step-${index + 1}`}
							data-test={`landing-solution-step-${index + 1}`}
							class="flex gap-4 rounded-[1.5rem] border border-slate-200 bg-background p-5 shadow-sm"
						>
							<div
								id={`landing-solution-step-number-${index + 1}`}
								data-test={`landing-solution-step-number-${index + 1}`}
								class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground"
							>
								{index + 1}
							</div>
							<div
								id={`landing-solution-step-copy-${index + 1}`}
								data-test={`landing-solution-step-copy-${index + 1}`}
								class="space-y-2"
							>
								<h3
									id={`landing-solution-step-title-${index + 1}`}
									data-test={`landing-solution-step-title-${index + 1}`}
									class="text-lg font-semibold"
								>
									{step.title}
								</h3>
								<p
									id={`landing-solution-step-description-${index + 1}`}
									data-test={`landing-solution-step-description-${index + 1}`}
									class="leading-7 text-muted-foreground"
								>
									{step.description}
								</p>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</section>

		<section
			id="landing-benefits-section"
			data-test="landing-benefits-section"
			class="w-full px-5 py-20 sm:px-8 lg:px-10 2xl:px-16"
		>
			<div
				id="landing-benefits-header"
				data-test="landing-benefits-header"
				class="max-w-3xl space-y-4"
			>
				<p
					id="landing-benefits-overline"
					data-test="landing-benefits-overline"
					class="text-sm font-semibold tracking-[0.22em] text-primary uppercase"
				>
					Benefícios
				</p>
				<h2
					id="landing-benefits-title"
					data-test="landing-benefits-title"
					class="text-3xl font-semibold tracking-tight sm:text-4xl"
				>
					Um sistema pensado por quem conhece a rotina do síndico e quer uma gestão mais
					organizada sem complicação.
				</h2>
			</div>

			<div
				id="landing-benefits-grid"
				data-test="landing-benefits-grid"
				class="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3"
			>
				{#each benefits as benefit, index}
					<div
						id={`landing-benefit-card-${index + 1}`}
						data-test={`landing-benefit-card-${index + 1}`}
						class="rounded-[1.75rem] border border-slate-200 p-6"
					>
						<div
							id={`landing-benefit-icon-wrap-${index + 1}`}
							data-test={`landing-benefit-icon-wrap-${index + 1}`}
							class="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary"
						>
							<benefit.icon class="h-5 w-5 text-primary" aria-hidden="true" />
						</div>
						<h3
							id={`landing-benefit-title-${index + 1}`}
							data-test={`landing-benefit-title-${index + 1}`}
							class="mt-5 text-xl font-semibold"
						>
							{benefit.title}
						</h3>
						<p
							id={`landing-benefit-description-${index + 1}`}
							data-test={`landing-benefit-description-${index + 1}`}
							class="mt-3 leading-7 text-muted-foreground"
						>
							{benefit.description}
						</p>
					</div>
				{/each}
			</div>
		</section>

		<section
			id="landing-features-section"
			data-test="landing-features-section"
			class="bg-slate-950 text-slate-50"
		>
			<div
				id="landing-features-container"
				data-test="landing-features-container"
				class="w-full px-5 py-20 sm:px-8 lg:px-10 2xl:px-16"
			>
				<div
					id="landing-features-header"
					data-test="landing-features-header"
					class="max-w-3xl space-y-4"
				>
					<p
						id="landing-features-overline"
						data-test="landing-features-overline"
						class="text-sm font-semibold tracking-[0.22em] text-emerald-300 uppercase"
					>
						Funcionalidades
					</p>
					<h2
						id="landing-features-title"
						data-test="landing-features-title"
						class="text-3xl font-semibold tracking-tight sm:text-4xl"
					>
						Tudo o que o síndico precisa para cobrar e organizar o condomínio com mais segurança.
					</h2>
					<p
						id="landing-features-description"
						data-test="landing-features-description"
						class="text-lg leading-8 text-slate-300"
					>
						A proposta não é adicionar complexidade. É centralizar o essencial para a gestão
						funcionar melhor.
					</p>
				</div>

				<div
					id="landing-features-grid"
					data-test="landing-features-grid"
					class="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4"
				>
					{#each features as feature, index}
						<div
							id={`landing-feature-card-${index + 1}`}
							data-test={`landing-feature-card-${index + 1}`}
							class="rounded-[1.75rem] border border-white/10 bg-white/5 p-6"
						>
							<div
								id={`landing-feature-icon-wrap-${index + 1}`}
								data-test={`landing-feature-icon-wrap-${index + 1}`}
								class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10"
							>
								<feature.icon class="h-5 w-5 text-emerald-300" aria-hidden="true" />
							</div>
							<h3
								id={`landing-feature-title-${index + 1}`}
								data-test={`landing-feature-title-${index + 1}`}
								class="mt-5 text-xl font-semibold"
							>
								{feature.title}
							</h3>
							<p
								id={`landing-feature-description-${index + 1}`}
								data-test={`landing-feature-description-${index + 1}`}
								class="mt-3 leading-7 text-slate-300"
							>
								{feature.description}
							</p>
						</div>
					{/each}
				</div>
			</div>
		</section>

		<section
			id="landing-balancete-preview-section"
			data-test="landing-balancete-preview-section"
			class="w-full border-y border-slate-200/70 bg-secondary/45 px-5 py-20 sm:px-8 lg:px-10 2xl:px-16"
		>
			<div
				id="landing-balancete-preview-layout"
				data-test="landing-balancete-preview-layout"
				class="grid gap-8 lg:grid-cols-[0.42fr_0.58fr]"
			>
				<div
					id="landing-balancete-preview-copy"
					data-test="landing-balancete-preview-copy"
					class="space-y-5"
				>
					<p
						id="landing-balancete-preview-overline"
						data-test="landing-balancete-preview-overline"
						class="text-sm font-semibold tracking-[0.22em] text-primary uppercase"
					>
						Tela de rateio
					</p>
					<h2
						id="landing-balancete-preview-title"
						data-test="landing-balancete-preview-title"
						class="text-3xl font-semibold tracking-tight sm:text-4xl"
					>
						Mostre com clareza como o balancete foi rateado por unidade.
					</h2>
					<p
						id="landing-balancete-preview-description"
						data-test="landing-balancete-preview-description"
						class="text-lg leading-8 text-muted-foreground"
					>
						O síndico consegue visualizar o total a ratear, filtrar unidades e enxergar quanto
						cada apartamento recebeu de despesa no balancete, sem depender de planilhas.
					</p>

					<div
						id="landing-balancete-preview-points"
						data-test="landing-balancete-preview-points"
						class="space-y-3"
					>
						<div
							id="landing-balancete-preview-point-1"
							data-test="landing-balancete-preview-point-1"
							class="flex items-start gap-3 rounded-2xl border border-slate-200 bg-background px-4 py-3"
						>
							<CheckCircle2Icon
								id="landing-balancete-preview-point-icon-1"
								data-test="landing-balancete-preview-point-icon-1"
								class="mt-0.5 h-5 w-5 shrink-0 text-primary"
								aria-hidden="true"
							/>
							<p
								id="landing-balancete-preview-point-text-1"
								data-test="landing-balancete-preview-point-text-1"
								class="leading-7 text-muted-foreground"
							>
								Resumo com total do balancete, unidades afetadas e média por unidade.
							</p>
						</div>
						<div
							id="landing-balancete-preview-point-2"
							data-test="landing-balancete-preview-point-2"
							class="flex items-start gap-3 rounded-2xl border border-slate-200 bg-background px-4 py-3"
						>
							<CheckCircle2Icon
								id="landing-balancete-preview-point-icon-2"
								data-test="landing-balancete-preview-point-icon-2"
								class="mt-0.5 h-5 w-5 shrink-0 text-primary"
								aria-hidden="true"
							/>
							<p
								id="landing-balancete-preview-point-text-2"
								data-test="landing-balancete-preview-point-text-2"
								class="leading-7 text-muted-foreground"
							>
								Filtros por bloco e unidade para localizar rapidamente o que precisa ser conferido.
							</p>
						</div>
						<div
							id="landing-balancete-preview-point-3"
							data-test="landing-balancete-preview-point-3"
							class="flex items-start gap-3 rounded-2xl border border-slate-200 bg-background px-4 py-3"
						>
							<CheckCircle2Icon
								id="landing-balancete-preview-point-icon-3"
								data-test="landing-balancete-preview-point-icon-3"
								class="mt-0.5 h-5 w-5 shrink-0 text-primary"
								aria-hidden="true"
							/>
							<p
								id="landing-balancete-preview-point-text-3"
								data-test="landing-balancete-preview-point-text-3"
								class="leading-7 text-muted-foreground"
							>
								Leitura por unidade com valor final e participação relativa no rateio.
							</p>
						</div>
					</div>
				</div>

				<div
					id="landing-balancete-preview-frame"
					data-test="landing-balancete-preview-frame"
					class="overflow-hidden rounded-[2rem] border border-slate-200 bg-background shadow-[0_24px_80px_-36px_rgba(15,23,42,0.35)]"
				>
					<div
						id="landing-balancete-preview-header"
						data-test="landing-balancete-preview-header"
						class="flex flex-col gap-4 border-b border-slate-200 px-5 py-5"
					>
						<div
							id="landing-balancete-preview-header-top"
							data-test="landing-balancete-preview-header-top"
							class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
						>
							<a
								id="landing-balancete-preview-header-copy"
								data-test="landing-balancete-preview-header-copy"
								class="group space-y-1"
								href={entryHref}
							>
								<p
									id="landing-balancete-preview-header-overline"
									data-test="landing-balancete-preview-header-overline"
									class="text-xs font-semibold tracking-[0.22em] text-primary uppercase"
								>
									Balancete de abril
								</p>
								<h3
									id="landing-balancete-preview-header-title"
									data-test="landing-balancete-preview-header-title"
									class="text-xl font-semibold transition-colors group-hover:text-primary"
								>
									Rateio por unidade
								</h3>
								<p
									id="landing-balancete-preview-header-link-note"
									data-test="landing-balancete-preview-header-link-note"
									class="text-xs text-muted-foreground transition-colors group-hover:text-primary"
								>
									Clique para ver o balancete completo
								</p>
							</a>
							<div
								id="landing-balancete-preview-header-badge"
								data-test="landing-balancete-preview-header-badge"
								class="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
							>
								Balancete fechado
							</div>
						</div>

						<div
							id="landing-balancete-preview-summary"
							data-test="landing-balancete-preview-summary"
							class="grid gap-3 sm:grid-cols-3"
						>
							<div
								id="landing-balancete-preview-summary-card-1"
								data-test="landing-balancete-preview-summary-card-1"
								class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
							>
								<p
									id="landing-balancete-preview-summary-label-1"
									data-test="landing-balancete-preview-summary-label-1"
									class="text-xs text-muted-foreground"
								>
									Total a ratear
								</p>
								<p
									id="landing-balancete-preview-summary-value-1"
									data-test="landing-balancete-preview-summary-value-1"
									class="mt-2 text-lg font-semibold"
								>
									R$ 4.200,00
								</p>
								<p
									id="landing-balancete-preview-summary-note-1"
									data-test="landing-balancete-preview-summary-note-1"
									class="mt-1 text-[11px] text-muted-foreground"
								>
									6 saídas no mês
								</p>
							</div>
							<div
								id="landing-balancete-preview-summary-card-2"
								data-test="landing-balancete-preview-summary-card-2"
								class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
							>
								<p
									id="landing-balancete-preview-summary-label-2"
									data-test="landing-balancete-preview-summary-label-2"
									class="text-xs text-muted-foreground"
								>
									Unidades afetadas
								</p>
								<p
									id="landing-balancete-preview-summary-value-2"
									data-test="landing-balancete-preview-summary-value-2"
									class="mt-2 text-lg font-semibold"
								>
									24 unidades
								</p>
								<p
									id="landing-balancete-preview-summary-note-2"
									data-test="landing-balancete-preview-summary-note-2"
									class="mt-1 text-[11px] text-muted-foreground"
								>
									2 blocos no filtro
								</p>
							</div>
							<div
								id="landing-balancete-preview-summary-card-3"
								data-test="landing-balancete-preview-summary-card-3"
								class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
							>
								<p
									id="landing-balancete-preview-summary-label-3"
									data-test="landing-balancete-preview-summary-label-3"
									class="text-xs text-muted-foreground"
								>
									Média por unidade
								</p>
								<p
									id="landing-balancete-preview-summary-value-3"
									data-test="landing-balancete-preview-summary-value-3"
									class="mt-2 text-lg font-semibold"
								>
									R$ 175,00
								</p>
								<p
									id="landing-balancete-preview-summary-note-3"
									data-test="landing-balancete-preview-summary-note-3"
									class="mt-1 text-[11px] text-muted-foreground"
								>
									R$ 148,00 a R$ 238,00
								</p>
							</div>
						</div>

						<div
							id="landing-balancete-preview-filters"
							data-test="landing-balancete-preview-filters"
							class="flex flex-wrap items-center gap-2"
						>
							<div
								id="landing-balancete-preview-filter-block"
								data-test="landing-balancete-preview-filter-block"
								class="rounded-full border border-slate-200 px-3 py-2 text-xs text-muted-foreground"
							>
								Todos os blocos
							</div>
							<div
								id="landing-balancete-preview-filter-unit"
								data-test="landing-balancete-preview-filter-unit"
								class="rounded-full border border-slate-200 px-3 py-2 text-xs text-muted-foreground"
							>
								Buscar unidade
							</div>
						</div>
					</div>

					<div
						id="landing-balancete-preview-list"
						data-test="landing-balancete-preview-list"
						class="divide-y divide-slate-200"
					>
						<div
							id="landing-balancete-preview-group-a"
							data-test="landing-balancete-preview-group-a"
							class="bg-muted/20 px-5 py-3"
						>
							<div
								id="landing-balancete-preview-group-a-header"
								data-test="landing-balancete-preview-group-a-header"
								class="flex items-center justify-between"
							>
								<p
									id="landing-balancete-preview-group-a-title"
									data-test="landing-balancete-preview-group-a-title"
									class="text-sm font-semibold"
								>
									Bloco A
								</p>
								<p
									id="landing-balancete-preview-group-a-total"
									data-test="landing-balancete-preview-group-a-total"
									class="text-sm font-semibold"
								>
									R$ 2.050,00
								</p>
							</div>
						</div>

						{#each [
							{ code: 'Apto 101', details: 'Fração ideal 1,45% · 1º andar', amount: 'R$ 148,20', percent: '62%' },
							{ code: 'Apto 202', details: 'Fração ideal 1,72% · 2º andar', amount: 'R$ 175,00', percent: '74%' },
							{ code: 'Cobertura A', details: 'Fração ideal 2,34% · cobertura', amount: 'R$ 238,10', percent: '100%' }
						] as row, index}
							<div
								id={`landing-balancete-preview-row-${index + 1}`}
								data-test={`landing-balancete-preview-row-${index + 1}`}
								class="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center"
							>
								<div
									id={`landing-balancete-preview-row-avatar-${index + 1}`}
									data-test={`landing-balancete-preview-row-avatar-${index + 1}`}
									class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
								>
									{row.code.slice(0, 3)}
								</div>
								<div
									id={`landing-balancete-preview-row-copy-${index + 1}`}
									data-test={`landing-balancete-preview-row-copy-${index + 1}`}
									class="min-w-0 flex-1"
								>
									<p
										id={`landing-balancete-preview-row-title-${index + 1}`}
										data-test={`landing-balancete-preview-row-title-${index + 1}`}
										class="text-sm font-semibold"
									>
										{row.code}
									</p>
									<p
										id={`landing-balancete-preview-row-details-${index + 1}`}
										data-test={`landing-balancete-preview-row-details-${index + 1}`}
										class="mt-1 text-xs text-muted-foreground"
									>
										{row.details}
									</p>
									<div
										id={`landing-balancete-preview-row-tags-${index + 1}`}
										data-test={`landing-balancete-preview-row-tags-${index + 1}`}
										class="mt-2 flex flex-wrap gap-2"
									>
										<span
											id={`landing-balancete-preview-row-tag-water-${index + 1}`}
											data-test={`landing-balancete-preview-row-tag-water-${index + 1}`}
											class="rounded-full bg-slate-100 px-2 py-1 text-[10px] text-muted-foreground"
										>
											Água
										</span>
										<span
											id={`landing-balancete-preview-row-tag-clean-${index + 1}`}
											data-test={`landing-balancete-preview-row-tag-clean-${index + 1}`}
											class="rounded-full bg-slate-100 px-2 py-1 text-[10px] text-muted-foreground"
										>
											Limpeza
										</span>
										<span
											id={`landing-balancete-preview-row-tag-energy-${index + 1}`}
											data-test={`landing-balancete-preview-row-tag-energy-${index + 1}`}
											class="rounded-full bg-slate-100 px-2 py-1 text-[10px] text-muted-foreground"
										>
											Luz comum
										</span>
									</div>
								</div>
								<div
									id={`landing-balancete-preview-row-bar-wrap-${index + 1}`}
									data-test={`landing-balancete-preview-row-bar-wrap-${index + 1}`}
									class="w-full sm:w-28"
								>
									<div
										id={`landing-balancete-preview-row-bar-base-${index + 1}`}
										data-test={`landing-balancete-preview-row-bar-base-${index + 1}`}
										class="h-2 overflow-hidden rounded-full bg-slate-100"
									>
										<div
											id={`landing-balancete-preview-row-bar-fill-${index + 1}`}
											data-test={`landing-balancete-preview-row-bar-fill-${index + 1}`}
											class={[
												'h-full rounded-full bg-primary',
												index === 0 && 'w-[62%]',
												index === 1 && 'w-[74%]',
												index === 2 && 'w-full'
											]}
										></div>
									</div>
									<p
										id={`landing-balancete-preview-row-bar-text-${index + 1}`}
										data-test={`landing-balancete-preview-row-bar-text-${index + 1}`}
										class="mt-1 text-right text-[10px] text-muted-foreground"
									>
										{row.percent} do maior rateio
									</p>
								</div>
								<div
									id={`landing-balancete-preview-row-amount-${index + 1}`}
									data-test={`landing-balancete-preview-row-amount-${index + 1}`}
									class="w-full text-left text-sm font-semibold sm:w-24 sm:text-right"
								>
									{row.amount}
								</div>
							</div>
						{/each}

						<div
							id="landing-balancete-preview-footer"
							data-test="landing-balancete-preview-footer"
							class="flex items-center justify-between bg-muted/20 px-5 py-4"
						>
							<p
								id="landing-balancete-preview-footer-label"
								data-test="landing-balancete-preview-footer-label"
								class="text-sm font-semibold"
							>
								Total geral do rateio
							</p>
							<p
								id="landing-balancete-preview-footer-value"
								data-test="landing-balancete-preview-footer-value"
								class="text-sm font-semibold text-rose-700"
							>
								R$ 4.200,00
							</p>
						</div>
					</div>
				</div>
			</div>
		</section>

		<section
			id="landing-launch-modes-section"
			data-test="landing-launch-modes-section"
			class="w-full px-5 py-20 sm:px-8 lg:px-10 2xl:px-16"
		>
			<div
				id="landing-launch-modes-header"
				data-test="landing-launch-modes-header"
				class="max-w-3xl space-y-4"
			>
				<p
					id="landing-launch-modes-overline"
					data-test="landing-launch-modes-overline"
					class="text-sm font-semibold tracking-[0.22em] text-primary uppercase"
				>
					Lançamento de despesas
				</p>
				<h2
					id="landing-launch-modes-title"
					data-test="landing-launch-modes-title"
					class="text-3xl font-semibold tracking-tight sm:text-4xl"
				>
					O lançamento pode ser feito do jeito que a rotina do condomínio pede.
				</h2>
				<p
					id="landing-launch-modes-description"
					data-test="landing-launch-modes-description"
					class="text-lg leading-8 text-muted-foreground"
				>
					Nem toda despesa é igual. Por isso, o AP202 permite lançar valores no condomínio
					inteiro, em um bloco específico ou direto para uma unidade.
				</p>
			</div>

			<div
				id="landing-launch-modes-grid"
				data-test="landing-launch-modes-grid"
				class="mt-10 grid gap-5 lg:grid-cols-3"
			>
				<div
					id="landing-launch-mode-card-general"
					data-test="landing-launch-mode-card-general"
					class="rounded-[1.75rem] border border-slate-200 p-6"
				>
					<div
						id="landing-launch-mode-icon-general"
						data-test="landing-launch-mode-icon-general"
						class="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary"
					>
						<Building2Icon class="h-5 w-5 text-primary" aria-hidden="true" />
					</div>
					<h3
						id="landing-launch-mode-title-general"
						data-test="landing-launch-mode-title-general"
						class="mt-5 text-xl font-semibold"
					>
						Lançamento geral
					</h3>
					<p
						id="landing-launch-mode-description-general"
						data-test="landing-launch-mode-description-general"
						class="mt-3 leading-7 text-muted-foreground"
					>
						Ideal para despesas que precisam ser distribuídas entre todas as unidades do
						condomínio.
					</p>
				</div>

				<div
					id="landing-launch-mode-card-block"
					data-test="landing-launch-mode-card-block"
					class="rounded-[1.75rem] border border-slate-200 p-6"
				>
					<div
						id="landing-launch-mode-icon-block"
						data-test="landing-launch-mode-icon-block"
						class="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary"
					>
						<UsersIcon class="h-5 w-5 text-primary" aria-hidden="true" />
					</div>
					<h3
						id="landing-launch-mode-title-block"
						data-test="landing-launch-mode-title-block"
						class="mt-5 text-xl font-semibold"
					>
						Lançamento por bloco
					</h3>
					<p
						id="landing-launch-mode-description-block"
						data-test="landing-launch-mode-description-block"
						class="mt-3 leading-7 text-muted-foreground"
					>
						Útil quando a despesa pertence só a um bloco ou grupo específico de unidades.
					</p>
				</div>

				<div
					id="landing-launch-mode-card-unit"
					data-test="landing-launch-mode-card-unit"
					class="rounded-[1.75rem] border border-slate-200 p-6"
				>
					<div
						id="landing-launch-mode-icon-unit"
						data-test="landing-launch-mode-icon-unit"
						class="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary"
					>
						<ReceiptTextIcon class="h-5 w-5 text-primary" aria-hidden="true" />
					</div>
					<h3
						id="landing-launch-mode-title-unit"
						data-test="landing-launch-mode-title-unit"
						class="mt-5 text-xl font-semibold"
					>
						Lançamento por unidade
					</h3>
					<p
						id="landing-launch-mode-description-unit"
						data-test="landing-launch-mode-description-unit"
						class="mt-3 leading-7 text-muted-foreground"
					>
						Perfeito para cobranças direcionadas, sem rateio, direto para a unidade certa.
					</p>
				</div>
			</div>
		</section>

		<section
			id="landing-pricing-section"
			data-test="landing-pricing-section"
			class="w-full px-5 py-20 sm:px-8 lg:px-10 2xl:px-16"
		>
			<div
				id="landing-pricing-header"
				data-test="landing-pricing-header"
				class="max-w-3xl space-y-4"
			>
				<p
					id="landing-pricing-overline"
					data-test="landing-pricing-overline"
					class="text-sm font-semibold tracking-[0.22em] text-primary uppercase"
				>
					Preços transparentes
				</p>
				<h2
					id="landing-pricing-title"
					data-test="landing-pricing-title"
					class="text-3xl font-semibold tracking-tight sm:text-4xl"
				>
					Preço público, contratação simples e custo previsível para o condomínio.
				</h2>
				<p
					id="landing-pricing-description"
					data-test="landing-pricing-description"
					class="text-lg leading-8 text-muted-foreground"
				>
					Você entende quanto vai pagar antes de começar. Sem “sob consulta” e sem precisar pedir
					orçamento para descobrir o básico.
				</p>
			</div>

			<div
				id="landing-pricing-layout"
				data-test="landing-pricing-layout"
				class="mt-10 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]"
			>
				<div
					id="landing-pricing-table"
					data-test="landing-pricing-table"
					class="rounded-[2rem] border border-slate-200"
				>
					{#each pricingTiers as tier, index}
						<div
							id={`landing-pricing-row-${index + 1}`}
							data-test={`landing-pricing-row-${index + 1}`}
							class={[
								'grid gap-3 border-b border-slate-200 px-5 py-5 sm:grid-cols-[1fr_auto] sm:items-center sm:px-7',
								index === pricingTiers.length - 1 && 'border-b-0',
								tier.highlight && 'bg-primary/5'
							]}
						>
							<div
								id={`landing-pricing-row-copy-${index + 1}`}
								data-test={`landing-pricing-row-copy-${index + 1}`}
								class="space-y-1"
							>
								<h3
									id={`landing-pricing-row-label-${index + 1}`}
									data-test={`landing-pricing-row-label-${index + 1}`}
									class="text-lg font-semibold"
								>
									{tier.label}
								</h3>
								<p
									id={`landing-pricing-row-description-${index + 1}`}
									data-test={`landing-pricing-row-description-${index + 1}`}
									class="leading-7 text-muted-foreground"
								>
									{tier.description}
								</p>
							</div>
							<div
								id={`landing-pricing-row-price-wrap-${index + 1}`}
								data-test={`landing-pricing-row-price-wrap-${index + 1}`}
								class="text-left sm:text-right"
							>
								<p
									id={`landing-pricing-row-price-${index + 1}`}
									data-test={`landing-pricing-row-price-${index + 1}`}
									class="text-2xl font-semibold tracking-tight"
								>
									{tier.price}
								</p>
							</div>
						</div>
					{/each}
				</div>

				<div
					id="landing-pricing-side-card"
					data-test="landing-pricing-side-card"
					class="rounded-[2rem] bg-gradient-to-br from-slate-900 to-slate-800 p-7 text-slate-50"
				>
					<p
						id="landing-pricing-side-overline"
						data-test="landing-pricing-side-overline"
						class="text-sm font-semibold tracking-[0.22em] text-slate-300 uppercase"
					>
						Por unidade/mês
					</p>
					<h3
						id="landing-pricing-side-title"
						data-test="landing-pricing-side-title"
						class="mt-3 text-3xl font-semibold tracking-tight"
					>
						Inclui cobrança essencial para a rotina do condomínio.
					</h3>
					<div
						id="landing-pricing-side-items"
						data-test="landing-pricing-side-items"
						class="mt-8 space-y-4"
					>
						<div
							id="landing-pricing-side-item-1"
							data-test="landing-pricing-side-item-1"
							class="flex items-start gap-3 rounded-2xl bg-white/5 p-4"
						>
							<div
								id="landing-pricing-side-item-icon-1"
								data-test="landing-pricing-side-item-icon-1"
								class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10"
							>
								<LandmarkIcon class="h-4 w-4" aria-hidden="true" />
							</div>
							<div
								id="landing-pricing-side-item-copy-1"
								data-test="landing-pricing-side-item-copy-1"
								class="space-y-1"
							>
								<p
									id="landing-pricing-side-item-title-1"
									data-test="landing-pricing-side-item-title-1"
									class="font-semibold"
								>
									1 boleto compensado
								</p>
								<p
									id="landing-pricing-side-item-description-1"
									data-test="landing-pricing-side-item-description-1"
									class="text-sm leading-6 text-slate-300"
								>
									Registro claro do recebimento por unidade.
								</p>
							</div>
						</div>
						<div
							id="landing-pricing-side-item-2"
							data-test="landing-pricing-side-item-2"
							class="flex items-start gap-3 rounded-2xl bg-white/5 p-4"
						>
							<div
								id="landing-pricing-side-item-icon-2"
								data-test="landing-pricing-side-item-icon-2"
								class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10"
							>
								<MessageCircleMoreIcon class="h-4 w-4" aria-hidden="true" />
							</div>
							<div
								id="landing-pricing-side-item-copy-2"
								data-test="landing-pricing-side-item-copy-2"
								class="space-y-1"
							>
								<p
									id="landing-pricing-side-item-title-2"
									data-test="landing-pricing-side-item-title-2"
									class="font-semibold"
								>
									1 cobrança via WhatsApp
								</p>
								<p
									id="landing-pricing-side-item-description-2"
									data-test="landing-pricing-side-item-description-2"
									class="text-sm leading-6 text-slate-300"
								>
									Reforço mensal para deixar a cobrança mais organizada.
								</p>
							</div>
						</div>
					</div>
					<p
						id="landing-pricing-side-note"
						data-test="landing-pricing-side-note"
						class="mt-6 text-sm leading-6 text-slate-300"
					>
						*** Cobranças excedentes podem ser tarifadas à parte.
					</p>
				</div>
			</div>
		</section>

		<section
			id="landing-transparency-section"
			data-test="landing-transparency-section"
			class="border-y border-slate-200/70 bg-secondary/55"
		>
			<div
				id="landing-transparency-container"
				data-test="landing-transparency-container"
				class="grid w-full gap-6 px-5 py-20 sm:px-8 lg:grid-cols-4 lg:px-10 2xl:px-16"
			>
				<div
					id="landing-transparency-copy"
					data-test="landing-transparency-copy"
					class="space-y-4 lg:col-span-2"
				>
					<p
						id="landing-transparency-overline"
						data-test="landing-transparency-overline"
						class="text-sm font-semibold tracking-[0.22em] text-primary uppercase"
					>
						Transparência
					</p>
					<h2
						id="landing-transparency-title"
						data-test="landing-transparency-title"
						class="text-3xl font-semibold tracking-tight sm:text-4xl"
					>
						O AP202 foi feito de síndico para síndico para deixar a cobrança mais previsível,
						inclusive no preço.
					</h2>
					<p
						id="landing-transparency-description"
						data-test="landing-transparency-description"
						class="text-lg leading-8 text-muted-foreground"
					>
						Preço público, contratação simples e foco no que realmente importa para quem precisa
						organizar a gestão do condomínio sem perder tempo com negociação opaca.
					</p>
				</div>

				<div
					id="landing-transparency-point-1"
					data-test="landing-transparency-point-1"
					class="rounded-[1.75rem] border border-slate-200 bg-background p-6"
				>
					<p
						id="landing-transparency-point-title-1"
						data-test="landing-transparency-point-title-1"
						class="text-lg font-semibold"
					>
						Sem preço escondido
					</p>
					<p
						id="landing-transparency-point-description-1"
						data-test="landing-transparency-point-description-1"
						class="mt-3 leading-7 text-muted-foreground"
					>
						Você vê a tabela e entende o custo antes de qualquer contato comercial.
					</p>
				</div>

				<div
					id="landing-transparency-point-2"
					data-test="landing-transparency-point-2"
					class="rounded-[1.75rem] border border-slate-200 bg-background p-6"
				>
					<p
						id="landing-transparency-point-title-2"
						data-test="landing-transparency-point-title-2"
						class="text-lg font-semibold"
					>
						Clareza e previsibilidade
					</p>
					<p
						id="landing-transparency-point-description-2"
						data-test="landing-transparency-point-description-2"
						class="mt-3 leading-7 text-muted-foreground"
					>
						A gestão fica mais organizada e o custo do sistema também.
					</p>
				</div>
			</div>
		</section>

		<section
			id="landing-credibility-section"
			data-test="landing-credibility-section"
			class="w-full px-5 py-20 sm:px-8 lg:px-10 2xl:px-16"
		>
			<div
				id="landing-credibility-layout"
				data-test="landing-credibility-layout"
				class="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]"
			>
				<div id="landing-credibility-copy" data-test="landing-credibility-copy" class="space-y-4">
					<p
						id="landing-credibility-overline"
						data-test="landing-credibility-overline"
						class="text-sm font-semibold tracking-[0.22em] text-primary uppercase"
					>
						Confiança visual
					</p>
					<h2
						id="landing-credibility-title"
						data-test="landing-credibility-title"
						class="text-3xl font-semibold tracking-tight sm:text-4xl"
					>
						Visual profissional para transmitir organização, controle e confiança.
					</h2>
					<p
						id="landing-credibility-description"
						data-test="landing-credibility-description"
						class="text-lg leading-8 text-muted-foreground"
					>
						Sem promessas exageradas e sem depoimentos inventados. A credibilidade vem de uma
						experiência clara, números fáceis de ler e uma proposta objetiva para o síndico.
					</p>
				</div>

				<div
					id="landing-credibility-grid"
					data-test="landing-credibility-grid"
					class="grid gap-4 sm:grid-cols-3"
				>
					<div
						id="landing-credibility-stat-1"
						data-test="landing-credibility-stat-1"
						class="rounded-[1.75rem] border border-slate-200 p-6"
					>
						<p
							id="landing-credibility-stat-value-1"
							data-test="landing-credibility-stat-value-1"
							class="text-4xl font-semibold tracking-tight"
						>
							24
						</p>
						<p
							id="landing-credibility-stat-label-1"
							data-test="landing-credibility-stat-label-1"
							class="mt-3 leading-7 text-muted-foreground"
						>
							unidades acompanhadas em uma visão centralizada.
						</p>
					</div>
					<div
						id="landing-credibility-stat-2"
						data-test="landing-credibility-stat-2"
						class="rounded-[1.75rem] border border-slate-200 p-6"
					>
						<p
							id="landing-credibility-stat-value-2"
							data-test="landing-credibility-stat-value-2"
							class="text-4xl font-semibold tracking-tight"
						>
							3
						</p>
						<p
							id="landing-credibility-stat-label-2"
							data-test="landing-credibility-stat-label-2"
							class="mt-3 leading-7 text-muted-foreground"
						>
							status de cobrança para enxergar rapidamente o que exige ação.
						</p>
					</div>
					<div
						id="landing-credibility-stat-3"
						data-test="landing-credibility-stat-3"
						class="rounded-[1.75rem] border border-slate-200 p-6"
					>
						<p
							id="landing-credibility-stat-value-3"
							data-test="landing-credibility-stat-value-3"
							class="text-4xl font-semibold tracking-tight"
						>
							100%
						</p>
						<p
							id="landing-credibility-stat-label-3"
							data-test="landing-credibility-stat-label-3"
							class="mt-3 leading-7 text-muted-foreground"
						>
							preço público para contratar com mais previsibilidade.
						</p>
					</div>
				</div>
			</div>
		</section>

		<section
			id="landing-faq-section"
			data-test="landing-faq-section"
			class="border-y border-slate-200/70 bg-secondary/55"
		>
			<div
				id="landing-faq-container"
				data-test="landing-faq-container"
				class="w-full px-5 py-20 sm:px-8 lg:px-10 2xl:px-16"
			>
				<div id="landing-faq-header" data-test="landing-faq-header" class="max-w-3xl space-y-4">
					<p
						id="landing-faq-overline"
						data-test="landing-faq-overline"
						class="text-sm font-semibold tracking-[0.22em] text-primary uppercase"
					>
						Perguntas frequentes
					</p>
					<h2
						id="landing-faq-title"
						data-test="landing-faq-title"
						class="text-3xl font-semibold tracking-tight sm:text-4xl"
					>
						O que síndicos e responsáveis costumam querer entender antes de começar.
					</h2>
				</div>

				<div id="landing-faq-list" data-test="landing-faq-list" class="mt-10 space-y-4">
					{#each faqs as faq, index}
						<details
							id={`landing-faq-item-${index + 1}`}
							data-test={`landing-faq-item-${index + 1}`}
							class="rounded-[1.5rem] border border-slate-200 bg-background px-5 py-4"
						>
							<summary
								id={`landing-faq-question-${index + 1}`}
								data-test={`landing-faq-question-${index + 1}`}
								class="cursor-pointer list-none pr-8 text-lg font-semibold"
							>
								{faq.question}
							</summary>
							<p
								id={`landing-faq-answer-${index + 1}`}
								data-test={`landing-faq-answer-${index + 1}`}
								class="mt-4 leading-7 text-muted-foreground"
							>
								{faq.answer}
							</p>
						</details>
					{/each}
				</div>
			</div>
		</section>

		<section
			id="landing-final-cta-section"
			data-test="landing-final-cta-section"
			class="w-full px-5 py-20 sm:px-8 lg:px-10 2xl:px-16"
		>
			<div
				id="landing-final-cta-card"
				data-test="landing-final-cta-card"
				class="rounded-[2.5rem] bg-gradient-to-r from-primary to-emerald-600 px-6 py-10 text-primary-foreground sm:px-10 sm:py-12"
			>
				<div
					id="landing-final-cta-content"
					data-test="landing-final-cta-content"
					class="mx-auto max-w-4xl text-center"
				>
					<p
						id="landing-final-cta-overline"
						data-test="landing-final-cta-overline"
						class="text-sm font-semibold tracking-[0.22em] text-white/80 uppercase"
					>
						Comece com simplicidade
					</p>
					<h2
						id="landing-final-cta-title"
						data-test="landing-final-cta-title"
						class="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-5xl"
					>
						Comece a organizar a cobrança e a gestão do seu condomínio com mais simplicidade.
					</h2>
					<p
						id="landing-final-cta-description"
						data-test="landing-final-cta-description"
						class="mx-auto mt-4 max-w-2xl text-lg leading-8 text-white/85"
					>
						Use um sistema feito para a rotina real do síndico: cobre melhor, acompanhe a
						inadimplência com clareza e tenha um preço fácil de entender desde o primeiro acesso.
					</p>
					<div
						id="landing-final-cta-actions"
						data-test="landing-final-cta-actions"
						class="mt-8 flex flex-col justify-center gap-3 sm:flex-row"
					>
						<Button
							id="landing-final-cta-whatsapp"
							class="h-12 rounded-full border-white/40 bg-transparent px-7 text-base text-white hover:bg-white/10"
							href={whatsappContactHref}
							target="_blank"
							rel="noreferrer"
							variant="outline"
						>
							Falar no WhatsApp
						</Button>
						<Button
							id="landing-final-cta-secondary"
							class="h-12 rounded-full border-white/40 bg-transparent px-7 text-base text-white hover:bg-white/10"
							href="#landing-pricing-section"
							variant="outline"
						>
							Rever preços
						</Button>
					</div>
				</div>
			</div>
		</section>
	</div>
</main>
