<script lang="ts">
	import { goto } from '$app/navigation';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import BadgeCheckIcon from '@lucide/svelte/icons/badge-check';
	import FileDownIcon from '@lucide/svelte/icons/file-down';
	import LockIcon from '@lucide/svelte/icons/lock';
	import LockOpenIcon from '@lucide/svelte/icons/lock-open';
	import PaperclipIcon from '@lucide/svelte/icons/paperclip';
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
	import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
	import TrendingDownIcon from '@lucide/svelte/icons/trending-down';
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
	import WalletIcon from '@lucide/svelte/icons/wallet';
	import { onMount } from 'svelte';
	import Logo from '$lib/components/app/logo/index.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import {
		buildBalanceReport,
		closeBalancete,
		reopenBalancete,
		type BalanceReportItem,
		type BalanceReportPreview
	} from '$lib/services/balancete.js';
	import { cn } from '$lib/utils.js';
	import posthog from 'posthog-js';

	interface Props {
		params: { code: string; balanceteId: string };
	}

	let { params }: Props = $props();

	const balanceteId = $derived(
		Number.isFinite(Number(params.balanceteId)) ? Number(params.balanceteId) : null
	);

	let report = $state<BalanceReportPreview | null>(null);
	let isLoading = $state(true);
	let isActing = $state(false);
	let errorMessage = $state('');
	let showCloseDialog = $state(false);
	let closeDueDate = $state('');

	const isClosed = $derived(report?.status === 'closed');
	const statusLabel = $derived(
		report?.status === 'closed'
			? 'Fechado'
			: report?.status === 'reopened'
				? 'Reaberto'
				: 'Rascunho'
	);
	const statusTone = $derived(
		report?.status === 'closed'
			? 'bg-muted text-muted-foreground'
			: report?.status === 'reopened'
				? 'bg-amber-100 text-amber-700'
				: 'bg-emerald-100 text-emerald-700'
	);
	const summaryCards = $derived.by(() => {
		if (!report) return [];

		return [
			{
				label: 'Saldo anterior',
				value: formatCurrency(report.previous_balance_cents),
				icon: WalletIcon,
				tone: 'bg-sky-100 text-sky-700'
			},
			{
				label: 'Receitas realizadas',
				value: formatCurrency(report.total_income_cents),
				icon: TrendingUpIcon,
				tone: 'bg-emerald-100 text-emerald-700'
			},
			{
				label: 'Despesas realizadas',
				value: formatCurrency(report.total_expense_cents),
				icon: TrendingDownIcon,
				tone: 'bg-rose-100 text-rose-700'
			},
			{
				label: 'Resultado do período',
				value: formatCurrency(report.period_result_cents),
				icon: BadgeCheckIcon,
				tone:
					report.period_result_cents >= 0
						? 'bg-emerald-100 text-emerald-700'
						: 'bg-amber-100 text-amber-700'
			},
			{
				label: 'Saldo final',
				value: formatCurrency(report.final_balance_cents),
				icon: WalletIcon,
				tone:
					report.final_balance_cents >= 0
						? 'bg-primary/10 text-primary'
						: 'bg-rose-100 text-rose-700'
			},
			{
				label: 'Inadimplência vencida',
				value: formatCurrency(report.delinquency.overdue_amount_cents),
				icon: ShieldCheckIcon,
				tone: 'bg-amber-100 text-amber-700'
			}
		];
	});

	function formatMonth(month: string): string {
		const [year, monthNumber] = month.split('-');
		const months = [
			'Janeiro',
			'Fevereiro',
			'Março',
			'Abril',
			'Maio',
			'Junho',
			'Julho',
			'Agosto',
			'Setembro',
			'Outubro',
			'Novembro',
			'Dezembro'
		];
		return `${months[Number(monthNumber) - 1] ?? monthNumber} / ${year}`;
	}

	function formatCurrency(amountCents: number): string {
		return (amountCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
	}

	function formatDate(date: string | null): string {
		if (!date) return 'Não informado';
		return new Date(date.includes('T') ? date : `${date}T00:00:00`).toLocaleDateString('pt-BR');
	}

	function formatPercent(value: number): string {
		return value.toLocaleString('pt-BR', { style: 'percent', maximumFractionDigits: 1 });
	}

	function getSourceLabel(source: string): string {
		return (
			(
				{
					manual: 'Manual',
					charge: 'Cobrança',
					payment: 'Pagamento',
					settlement: 'Baixa',
					reversal: 'Estorno',
					agreement: 'Acordo',
					fine: 'Multa',
					interest: 'Juros',
					expense: 'Despesa',
					transfer: 'Transferência'
				} as Record<string, string>
			)[source] ?? source
		);
	}

	async function loadReport(): Promise<void> {
		if (!balanceteId) {
			errorMessage = 'Balancete inválido.';
			isLoading = false;
			return;
		}

		isLoading = true;
		errorMessage = '';
		try {
			report = await buildBalanceReport(params.code, balanceteId);
		} catch (error) {
			errorMessage =
				error instanceof Error ? error.message : 'Não foi possível carregar o balancete.';
		} finally {
			isLoading = false;
		}
	}

	async function handleClose(): Promise<void> {
		if (!balanceteId || !closeDueDate) return;
		isActing = true;
		showCloseDialog = false;
		try {
			await closeBalancete(params.code, balanceteId, closeDueDate);
			posthog.capture('balancete_closed', {
				condominium_code: params.code,
				balancete_id: balanceteId,
				month: report?.month
			});
			await loadReport();
		} catch (error) {
			posthog.captureException(error);
			errorMessage =
				error instanceof Error ? error.message : 'Não foi possível fechar a competência.';
		} finally {
			isActing = false;
		}
	}

	async function handleReopen(): Promise<void> {
		if (!balanceteId) return;
		isActing = true;
		try {
			await reopenBalancete(params.code, balanceteId);
			posthog.capture('balancete_reopened', {
				condominium_code: params.code,
				balancete_id: balanceteId,
				month: report?.month
			});
			await loadReport();
		} catch (error) {
			posthog.captureException(error);
			errorMessage =
				error instanceof Error ? error.message : 'Não foi possível reabrir a competência.';
		} finally {
			isActing = false;
		}
	}

	onMount(async () => {
		await loadReport();
	});
</script>

<svelte:head>
	<title>{report ? `Balancete ${formatMonth(report.month)}` : 'Balancete'} | AP202</title>
</svelte:head>

<main
	id="balance-report-page"
	data-test="balance-report-page"
	class="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6"
>
	{#if isLoading}
		<Card.Root>
			<Card.Content class="py-10">
				<div
					id="balance-report-loading"
					data-test="balance-report-loading"
					class="flex flex-col items-center justify-center gap-4 text-center"
				>
					<div
						id="balance-report-loading-logo"
						data-test="balance-report-loading-logo"
						class="rounded-2xl border border-border/70 bg-background p-4 shadow-sm"
					>
						<Logo class="h-10" />
					</div>
					<p
						id="balance-report-loading-text"
						data-test="balance-report-loading-text"
						class="text-sm text-muted-foreground"
					>
						Montando prestação de contas...
					</p>
				</div>
			</Card.Content>
		</Card.Root>
	{:else if errorMessage && !report}
		<div
			id="balance-report-error"
			data-test="balance-report-error"
			class="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
		>
			{errorMessage}
		</div>
	{:else if report}
		<section
			id="balance-report-header"
			data-test="balance-report-header"
			class="flex flex-col gap-4 rounded-3xl border bg-gradient-to-br from-background via-muted/30 to-background p-5 shadow-sm md:flex-row md:items-end md:justify-between"
		>
			<div
				id="balance-report-title-group"
				data-test="balance-report-title-group"
				class="flex flex-col gap-3"
			>
				<Button
					id="balance-report-back-button"
					data-test="balance-report-back-button"
					type="button"
					variant="ghost"
					class="w-fit px-0"
					onclick={() => void goto(`/g/${params.code}/balancete`)}
				>
					<ArrowLeftIcon class="mr-2 size-4" />
					Todos os balancetes
				</Button>
				<div
					id="balance-report-heading-row"
					data-test="balance-report-heading-row"
					class="flex flex-wrap items-center gap-3"
				>
					<h1
						id="balance-report-title"
						data-test="balance-report-title"
						class="text-2xl font-semibold tracking-tight text-foreground"
					>
						Balancete de {formatMonth(report.month)}
					</h1>
					<span
						id="balance-report-status"
						data-test="balance-report-status"
						class={cn(
							'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
							statusTone
						)}
					>
						{#if isClosed}<LockIcon class="size-3" />{:else}<LockOpenIcon class="size-3" />{/if}
						{statusLabel}
					</span>
				</div>
				<p
					id="balance-report-condominium"
					data-test="balance-report-condominium"
					class="max-w-3xl text-sm text-muted-foreground"
				>
					{report.condominium_name} · {report.condominium_document} · {report.condominium_address}
				</p>
				<p
					id="balance-report-generation"
					data-test="balance-report-generation"
					class="text-xs text-muted-foreground"
				>
					Gerado em {formatDate(report.generated_at)} por {report.responsible_name}
					{#if report.closed_at}
						· Fechado em {formatDate(report.closed_at)}{/if}
				</p>
			</div>

			<div
				id="balance-report-actions"
				data-test="balance-report-actions"
				class="flex flex-wrap gap-2"
			>
				<Button
					id="balance-report-preview-button"
					data-test="balance-report-preview-button"
					type="button"
					variant="outline"
					disabled={isActing}
					onclick={loadReport}
				>
					<RefreshCwIcon class="mr-2 size-4" />
					Gerar prévia
				</Button>
				<Button
					id="balance-report-pdf-button"
					data-test="balance-report-pdf-button"
					type="button"
					variant="outline"
				>
					<FileDownIcon class="mr-2 size-4" />
					Exportar PDF
				</Button>
				<Button
					id="balance-report-csv-button"
					data-test="balance-report-csv-button"
					type="button"
					variant="outline"
				>
					<FileDownIcon class="mr-2 size-4" />
					Exportar CSV
				</Button>
				{#if isClosed}
					<Button
						id="balance-report-reopen-button"
						data-test="balance-report-reopen-button"
						type="button"
						disabled={isActing}
						onclick={handleReopen}
					>
						<LockOpenIcon class="mr-2 size-4" />
						Reabrir competência
					</Button>
				{:else}
					<Button
						id="balance-report-close-button"
						data-test="balance-report-close-button"
						type="button"
						disabled={isActing}
						onclick={() => {
							closeDueDate = '';
							showCloseDialog = true;
						}}
					>
						<LockIcon class="mr-2 size-4" />
						Fechar competência
					</Button>
				{/if}
			</div>
		</section>

		<Dialog.Root bind:open={showCloseDialog}>
			<Dialog.Content class="max-w-md">
				<Dialog.Header>
					<Dialog.Title>Fechar competência</Dialog.Title>
					<Dialog.Description>
						O fechamento salva um snapshot do balancete. Depois disso, correções devem virar ajustes
						ou exigir reabertura com permissão.
					</Dialog.Description>
				</Dialog.Header>
				<div
					id="balance-report-close-dialog-body"
					data-test="balance-report-close-dialog-body"
					class="space-y-2 py-2"
				>
					<Label for="balance-report-close-due-date">Vencimento das cobranças geradas</Label>
					<Input
						id="balance-report-close-due-date"
						data-test="balance-report-close-due-date"
						type="date"
						value={closeDueDate}
						oninput={(event) => {
							closeDueDate = event.currentTarget.value;
						}}
					/>
				</div>
				<Dialog.Footer>
					<Button
						id="balance-report-close-cancel"
						data-test="balance-report-close-cancel"
						type="button"
						variant="outline"
						disabled={isActing}
						onclick={() => {
							showCloseDialog = false;
						}}>Cancelar</Button
					>
					<Button
						id="balance-report-close-confirm"
						data-test="balance-report-close-confirm"
						type="button"
						disabled={isActing || !closeDueDate}
						onclick={handleClose}>Fechar competência</Button
					>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Root>

		{#if errorMessage}
			<div
				id="balance-report-inline-error"
				data-test="balance-report-inline-error"
				class="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
			>
				{errorMessage}
			</div>
		{/if}

		<section
			id="balance-report-summary"
			data-test="balance-report-summary"
			class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
		>
			{#each summaryCards as card, index (card.label)}
				{@const Icon = card.icon}
				<Card.Root>
					<Card.Content class="flex items-center gap-4 py-4">
						<div
							id={`balance-report-summary-icon-${index}`}
							data-test="balance-report-summary-icon"
							class={cn('flex size-11 shrink-0 items-center justify-center rounded-2xl', card.tone)}
						>
							<Icon class="size-5" />
						</div>
						<div
							id={`balance-report-summary-copy-${index}`}
							data-test="balance-report-summary-copy"
						>
							<p
								id={`balance-report-summary-label-${index}`}
								data-test="balance-report-summary-label"
								class="text-xs text-muted-foreground"
							>
								{card.label}
							</p>
							<p
								id={`balance-report-summary-value-${index}`}
								data-test="balance-report-summary-value"
								class="text-xl font-bold text-foreground"
							>
								{card.value}
							</p>
						</div>
					</Card.Content>
				</Card.Root>
			{/each}
		</section>

		<Tabs.Root value="prestacao">
			<Tabs.List class="grid h-auto w-full grid-cols-2 md:grid-cols-5">
				<Tabs.Trigger value="prestacao">Prestação</Tabs.Trigger>
				<Tabs.Trigger value="pendencias">Pendências</Tabs.Trigger>
				<Tabs.Trigger value="contas">Contas</Tabs.Trigger>
				<Tabs.Trigger value="rastreio">Rastreio</Tabs.Trigger>
				<Tabs.Trigger value="regras">Regras</Tabs.Trigger>
			</Tabs.List>

			<Tabs.Content value="prestacao" class="mt-4">
				<section
					id="balance-report-realized-section"
					data-test="balance-report-realized-section"
					class="grid grid-cols-1 gap-4 lg:grid-cols-2"
				>
					{@render reportItemsCard(
						'Receitas realizadas',
						'Entradas confirmadas ou conciliadas no livro-caixa.',
						report.income_items,
						'income'
					)}
					{@render reportItemsCard(
						'Despesas realizadas',
						'Saídas confirmadas ou conciliadas no livro-caixa.',
						report.expense_items,
						'expense'
					)}
				</section>

				<Card.Root class="mt-4">
					<Card.Header>
						<Card.Title>Movimentações realizadas do período</Card.Title>
						<Card.Description
							>Pendentes, canceladas e estornadas ficam fora do saldo realizado.</Card.Description
						>
					</Card.Header>
					<Card.Content class="p-0">
						<Table.Root>
							<Table.Header>
								<Table.Row>
									<Table.Head class="pl-6">Data</Table.Head>
									<Table.Head>Descrição</Table.Head>
									<Table.Head>Categoria</Table.Head>
									<Table.Head>Conta</Table.Head>
									<Table.Head>Status</Table.Head>
									<Table.Head>Origem</Table.Head>
									<Table.Head class="pr-6 text-right">Valor</Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each report.realized_entries as entry (entry.id)}
									<Table.Row>
										<Table.Cell class="pl-6 text-muted-foreground"
											>{formatDate(
												entry.paid_at ?? entry.occurred_at ?? entry.due_date
											)}</Table.Cell
										>
										<Table.Cell class="font-medium">{entry.description}</Table.Cell>
										<Table.Cell>{entry.category}</Table.Cell>
										<Table.Cell>{entry.financial_account_name}</Table.Cell>
										<Table.Cell>
											<span
												class={cn(
													'rounded-full px-2 py-0.5 text-xs font-medium',
													entry.status === 'reconciled'
														? 'bg-emerald-100 text-emerald-700'
														: 'bg-amber-100 text-amber-700'
												)}
											>
												{entry.status === 'reconciled' ? 'Conciliado' : 'Confirmado'}
											</span>
										</Table.Cell>
										<Table.Cell>{getSourceLabel(entry.source_type)}</Table.Cell>
										<Table.Cell
											class={cn(
												'pr-6 text-right font-bold',
												entry.type === 'credit' ? 'text-emerald-700' : 'text-rose-700'
											)}
										>
											{entry.type === 'credit' ? '+' : '-'}{formatCurrency(entry.amount_cents)}
										</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</Card.Content>
				</Card.Root>
			</Tabs.Content>

			<Tabs.Content value="pendencias" class="mt-4">
				<section
					id="balance-report-pending-grid"
					data-test="balance-report-pending-grid"
					class="grid grid-cols-1 gap-4 xl:grid-cols-3"
				>
					<Card.Root class="xl:col-span-2">
						<Card.Header>
							<Card.Title>Contas a pagar em aberto</Card.Title>
							<Card.Description>Não reduzem o saldo realizado até serem pagas.</Card.Description>
						</Card.Header>
						<Card.Content class="p-0">
							<Table.Root>
								<Table.Header>
									<Table.Row>
										<Table.Head class="pl-6">Descrição</Table.Head>
										<Table.Head>Categoria</Table.Head>
										<Table.Head>Vencimento</Table.Head>
										<Table.Head>Status</Table.Head>
										<Table.Head class="pr-6 text-right">Valor</Table.Head>
									</Table.Row>
								</Table.Header>
								<Table.Body>
									{#each report.open_payables as item (item.id)}
										<Table.Row>
											<Table.Cell class="pl-6 font-medium">{item.description}</Table.Cell>
											<Table.Cell>{item.category_name}</Table.Cell>
											<Table.Cell
												>{formatDate(item.due_date)}{#if item.days_overdue > 0}
													· {item.days_overdue} dias{/if}</Table.Cell
											>
											<Table.Cell>{item.status === 'overdue' ? 'Vencida' : 'Em aberto'}</Table.Cell>
											<Table.Cell class="pr-6 text-right font-bold text-rose-700"
												>{formatCurrency(item.amount_cents)}</Table.Cell
											>
										</Table.Row>
									{/each}
								</Table.Body>
							</Table.Root>
						</Card.Content>
					</Card.Root>

					<Card.Root>
						<Card.Header>
							<Card.Title>Inadimplência</Card.Title>
							<Card.Description>Cobranças vencidas e não pagas.</Card.Description>
						</Card.Header>
						<Card.Content class="space-y-4">
							<div
								id="balance-report-delinquency-total"
								data-test="balance-report-delinquency-total"
								class="rounded-2xl border bg-amber-50 p-4 text-amber-900"
							>
								<p
									id="balance-report-delinquency-label"
									data-test="balance-report-delinquency-label"
									class="text-xs font-medium"
								>
									Valor vencido
								</p>
								<p
									id="balance-report-delinquency-value"
									data-test="balance-report-delinquency-value"
									class="text-2xl font-bold"
								>
									{formatCurrency(report.delinquency.overdue_amount_cents)}
								</p>
								<p
									id="balance-report-delinquency-rate"
									data-test="balance-report-delinquency-rate"
									class="text-xs"
								>
									{formatPercent(report.delinquency.delinquency_rate)} das cobranças em aberto
								</p>
							</div>
							<div
								id="balance-report-delinquency-facts"
								data-test="balance-report-delinquency-facts"
								class="grid grid-cols-2 gap-3 text-sm"
							>
								<div
									id="balance-report-delinquency-units"
									data-test="balance-report-delinquency-units"
									class="rounded-lg border p-3"
								>
									<p class="text-muted-foreground">Unidades</p>
									<p class="font-bold">{report.delinquency.delinquent_units_count}</p>
								</div>
								<div
									id="balance-report-delinquency-charges"
									data-test="balance-report-delinquency-charges"
									class="rounded-lg border p-3"
								>
									<p class="text-muted-foreground">Cobranças</p>
									<p class="font-bold">{report.delinquency.overdue_charges_count}</p>
								</div>
							</div>
							{#each report.delinquency.main_pending_items as item (item.id)}
								<div
									id={`balance-report-delinquency-item-${item.id}`}
									data-test="balance-report-delinquency-item"
									class="rounded-lg border p-3 text-sm"
								>
									<p class="font-medium">{item.unit_label} · {item.resident_name}</p>
									<p class="text-muted-foreground">
										{formatCurrency(item.amount_cents)} vencido em {formatDate(item.due_date)}
									</p>
								</div>
							{/each}
						</Card.Content>
					</Card.Root>

					<Card.Root class="xl:col-span-3">
						<Card.Header>
							<Card.Title>Contas a receber em aberto</Card.Title>
							<Card.Description
								>Não aumentam o saldo realizado até o pagamento cair no livro-caixa.</Card.Description
							>
						</Card.Header>
						<Card.Content class="p-0">
							<Table.Root>
								<Table.Header>
									<Table.Row>
										<Table.Head class="pl-6">Unidade</Table.Head>
										<Table.Head>Condômino</Table.Head>
										<Table.Head>Competência</Table.Head>
										<Table.Head>Vencimento</Table.Head>
										<Table.Head>Status</Table.Head>
										<Table.Head class="pr-6 text-right">Valor</Table.Head>
									</Table.Row>
								</Table.Header>
								<Table.Body>
									{#each report.open_receivables as item (item.id)}
										<Table.Row>
											<Table.Cell class="pl-6 font-medium">{item.unit_label}</Table.Cell>
											<Table.Cell>{item.resident_name}</Table.Cell>
											<Table.Cell>{formatMonth(item.competence_month)}</Table.Cell>
											<Table.Cell
												>{formatDate(item.due_date)}{#if item.days_overdue > 0}
													· {item.days_overdue} dias{/if}</Table.Cell
											>
											<Table.Cell>{item.status === 'overdue' ? 'Vencida' : 'Em aberto'}</Table.Cell>
											<Table.Cell class="pr-6 text-right font-bold text-amber-700"
												>{formatCurrency(item.amount_cents)}</Table.Cell
											>
										</Table.Row>
									{/each}
								</Table.Body>
							</Table.Root>
						</Card.Content>
					</Card.Root>
				</section>
			</Tabs.Content>

			<Tabs.Content value="contas" class="mt-4">
				<Card.Root>
					<Card.Header>
						<Card.Title>Saldos por conta financeira</Card.Title>
						<Card.Description
							>Transferências aparecem aqui, mas não inflam receitas e despesas do consolidado.</Card.Description
						>
					</Card.Header>
					<Card.Content class="p-0">
						<Table.Root>
							<Table.Header>
								<Table.Row>
									<Table.Head class="pl-6">Conta</Table.Head>
									<Table.Head>Saldo anterior</Table.Head>
									<Table.Head>Entradas</Table.Head>
									<Table.Head>Saídas</Table.Head>
									<Table.Head>Transferências</Table.Head>
									<Table.Head class="pr-6 text-right">Saldo final</Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each report.account_balances as account (account.id)}
									<Table.Row>
										<Table.Cell class="pl-6 font-medium">{account.account_name}</Table.Cell>
										<Table.Cell>{formatCurrency(account.previous_balance_cents)}</Table.Cell>
										<Table.Cell class="text-emerald-700"
											>{formatCurrency(account.income_cents)}</Table.Cell
										>
										<Table.Cell class="text-rose-700"
											>{formatCurrency(account.expense_cents)}</Table.Cell
										>
										<Table.Cell
											>{formatCurrency(
												account.transfer_in_cents - account.transfer_out_cents
											)}</Table.Cell
										>
										<Table.Cell class="pr-6 text-right font-bold"
											>{formatCurrency(account.final_balance_cents)}</Table.Cell
										>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</Card.Content>
				</Card.Root>

				<Card.Root class="mt-4">
					<Card.Header>
						<Card.Title>Transferências entre contas</Card.Title>
						<Card.Description
							>Movimentam conta de origem e destino, com resultado líquido zero no condomínio.</Card.Description
						>
					</Card.Header>
					<Card.Content class="grid grid-cols-1 gap-3 md:grid-cols-2">
						{#each report.transfers as transfer (transfer.source_id)}
							<div
								id={`balance-report-transfer-${transfer.source_id}`}
								data-test="balance-report-transfer"
								class="rounded-xl border p-4"
							>
								<p class="text-sm font-medium">{transfer.description}</p>
								<p class="mt-1 text-xs text-muted-foreground">
									{transfer.from_account_name} → {transfer.to_account_name}
								</p>
								<p class="mt-3 text-lg font-bold">{formatCurrency(transfer.amount_cents)}</p>
							</div>
						{:else}
							<p
								id="balance-report-no-transfers"
								data-test="balance-report-no-transfers"
								class="text-sm text-muted-foreground"
							>
								Nenhuma transferência nesta competência.
							</p>
						{/each}
					</Card.Content>
				</Card.Root>
			</Tabs.Content>

			<Tabs.Content value="rastreio" class="mt-4">
				<section
					id="balance-report-traceability"
					data-test="balance-report-traceability"
					class="grid grid-cols-1 gap-4 lg:grid-cols-2"
				>
					<Card.Root>
						<Card.Header>
							<Card.Title>Conciliação do período</Card.Title>
							<Card.Description
								>Mostra quanto já foi conferido com extrato bancário.</Card.Description
							>
						</Card.Header>
						<Card.Content class="space-y-4">
							<div
								id="balance-report-reconciliation-bar"
								data-test="balance-report-reconciliation-bar"
								class="h-3 overflow-hidden rounded-full bg-muted"
							>
								<div
									id="balance-report-reconciliation-fill"
									data-test="balance-report-reconciliation-fill"
									class={cn(
										'h-full rounded-full',
										report.reconciliation.reconciliation_rate >= 0.7
											? 'bg-emerald-500'
											: 'bg-amber-500',
										report.reconciliation.reconciliation_rate >= 0.7 ? 'w-3/4' : 'w-1/3'
									)}
								></div>
							</div>
							<p
								id="balance-report-reconciliation-rate"
								data-test="balance-report-reconciliation-rate"
								class="text-sm text-muted-foreground"
							>
								{formatPercent(report.reconciliation.reconciliation_rate)} do valor realizado está conciliado.
							</p>
							<div
								id="balance-report-reconciliation-values"
								data-test="balance-report-reconciliation-values"
								class="grid grid-cols-2 gap-3"
							>
								<div class="rounded-lg border p-3">
									<p class="text-xs text-muted-foreground">Conciliado</p>
									<p class="font-bold">
										{formatCurrency(report.reconciliation.reconciled_amount_cents)}
									</p>
								</div>
								<div class="rounded-lg border p-3">
									<p class="text-xs text-muted-foreground">Confirmado</p>
									<p class="font-bold">
										{formatCurrency(report.reconciliation.confirmed_amount_cents)}
									</p>
								</div>
							</div>
						</Card.Content>
					</Card.Root>

					<Card.Root>
						<Card.Header>
							<Card.Title>Anexos e comprovantes</Card.Title>
							<Card.Description
								>Recibos, notas fiscais, comprovantes e conciliações ligados ao caixa.</Card.Description
							>
						</Card.Header>
						<Card.Content class="space-y-3">
							{#each report.attachments as attachment (attachment.id)}
								<div
									id={`balance-report-attachment-${attachment.id}`}
									data-test="balance-report-attachment"
									class="flex items-center gap-3 rounded-lg border p-3"
								>
									<PaperclipIcon class="size-4 text-muted-foreground" />
									<div>
										<p class="text-sm font-medium">{attachment.file_name}</p>
										<p class="text-xs text-muted-foreground">{attachment.file_type}</p>
									</div>
								</div>
							{:else}
								<p
									id="balance-report-no-attachments"
									data-test="balance-report-no-attachments"
									class="text-sm text-muted-foreground"
								>
									Nenhum anexo vinculado a lançamentos realizados.
								</p>
							{/each}
						</Card.Content>
					</Card.Root>
				</section>
			</Tabs.Content>

			<Tabs.Content value="regras" class="mt-4">
				<section
					id="balance-report-rules"
					data-test="balance-report-rules"
					class="grid grid-cols-1 gap-4 lg:grid-cols-2"
				>
					{@render infoListCard('Modelagem recomendada', report.modeling_notes)}
					{@render infoListCard('Regras de negócio', report.business_rules)}
					{@render infoListCard('Regras de cálculo', report.calculation_rules)}
					{@render infoListCard('Fechamento da competência', report.closing_flow)}
					{@render infoListCard('Alterações após fechamento', report.after_closing_rules)}
					{@render infoListCard('Como evitar inconsistências', report.consistency_guards)}
					<Card.Root class="lg:col-span-2">
						<Card.Header>
							<Card.Title>Eventos de domínio principais</Card.Title>
							<Card.Description
								>Eventos que deixam o balancete rastreável e auditável.</Card.Description
							>
						</Card.Header>
						<Card.Content class="grid grid-cols-1 gap-3 md:grid-cols-2">
							{#each report.domain_events as event (event.id)}
								<div
									id={`balance-report-event-${event.id}`}
									data-test="balance-report-event"
									class="rounded-xl border p-4"
								>
									<p class="text-sm font-semibold">{event.name}</p>
									<p class="mt-1 text-sm text-muted-foreground">{event.description}</p>
									<p class="mt-2 text-xs font-medium text-primary">{event.impact}</p>
								</div>
							{/each}
						</Card.Content>
					</Card.Root>
					{@render infoListCard('Exemplos práticos', report.examples, true)}
				</section>
			</Tabs.Content>
		</Tabs.Root>
	{/if}
</main>

{#snippet reportItemsCard(
	title: string,
	description: string,
	items: BalanceReportItem[],
	tone: 'income' | 'expense'
)}
	<Card.Root>
		<Card.Header>
			<Card.Title>{title}</Card.Title>
			<Card.Description>{description}</Card.Description>
		</Card.Header>
		<Card.Content class="p-0">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head class="pl-6">Categoria</Table.Head>
						<Table.Head>Lançamentos</Table.Head>
						<Table.Head>Conciliado</Table.Head>
						<Table.Head class="pr-6 text-right">Total</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each items as item (item.id)}
						<Table.Row>
							<Table.Cell class="pl-6">
								<p class="font-medium">{item.category_name}</p>
								<p class="max-w-80 truncate text-xs text-muted-foreground">{item.description}</p>
							</Table.Cell>
							<Table.Cell>{item.entries_count}</Table.Cell>
							<Table.Cell>{formatCurrency(item.reconciled_cents)}</Table.Cell>
							<Table.Cell
								class={cn(
									'pr-6 text-right font-bold',
									tone === 'income' ? 'text-emerald-700' : 'text-rose-700'
								)}
							>
								{formatCurrency(item.total_cents)}
							</Table.Cell>
						</Table.Row>
					{:else}
						<Table.Row>
							<Table.Cell colspan={4} class="px-6 py-8 text-center text-sm text-muted-foreground"
								>Nenhum lançamento realizado nesta competência.</Table.Cell
							>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</Card.Content>
	</Card.Root>
{/snippet}

{#snippet infoListCard(title: string, items: string[], wide = false)}
	<Card.Root class={wide ? 'lg:col-span-2' : ''}>
		<Card.Header>
			<Card.Title>{title}</Card.Title>
		</Card.Header>
		<Card.Content>
			<ul class="space-y-2">
				{#each items as item, index}
					<li
						id={`balance-report-info-${index}`}
						data-test="balance-report-info-item"
						class="flex gap-2 text-sm text-muted-foreground"
					>
						<span class="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary"></span>
						<span>{item}</span>
					</li>
				{/each}
			</ul>
		</Card.Content>
	</Card.Root>
{/snippet}
