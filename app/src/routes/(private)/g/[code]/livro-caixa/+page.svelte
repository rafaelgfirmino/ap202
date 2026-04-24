<script lang="ts">
	import ArrowDownLeftIcon from '@lucide/svelte/icons/arrow-down-left';
	import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
	import BanknoteIcon from '@lucide/svelte/icons/banknote';
	import CalendarCheckIcon from '@lucide/svelte/icons/calendar-check';
	import CircleDollarSignIcon from '@lucide/svelte/icons/circle-dollar-sign';
	import DownloadIcon from '@lucide/svelte/icons/download';
	import FileCheckIcon from '@lucide/svelte/icons/file-check';
	import PaperclipIcon from '@lucide/svelte/icons/paperclip';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import RefreshCcwIcon from '@lucide/svelte/icons/refresh-ccw';
	import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
	import ShuffleIcon from '@lucide/svelte/icons/shuffle';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import UploadIcon from '@lucide/svelte/icons/upload';
	import CardEmpty from '$lib/components/app/card-empty/index.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import {
		createBankAccount,
		listBankAccounts,
		type BankAccount,
		type CreateBankAccountInput
	} from '$lib/services/bank-accounts.js';
	import {
		calculateCashFlowSummary,
		listFinancialCategories,
		listLivroCaixaEntries,
		type CashFlowEntryType,
		type CashFlowSourceType,
		type CashFlowStatus,
		type FinancialCategory,
		type LivroCaixaEntry
	} from '$lib/services/livro-caixa.js';
	import { cn } from '$lib/utils.js';

	interface Props {
		params: { code: string };
	}

	interface SummaryCard {
		id: string;
		label: string;
		value: string;
		description: string;
		tone: 'neutral' | 'positive' | 'negative' | 'warning';
		icon: typeof CircleDollarSignIcon;
	}

	interface OfxImport {
		id: number;
		file_name: string;
		account_name: string;
		imported_at: string;
		status: 'ready' | 'processed';
	}

	let { params }: Props = $props();

	let entries = $state<LivroCaixaEntry[]>([]);
	let accounts = $state<BankAccount[]>([]);
	let categories = $state<FinancialCategory[]>([]);
	let isLoading = $state(true);
	let errorMessage = $state('');
	let selectedAccountId = $state('all');
	let monthFilter = $state(new Date().toISOString().slice(0, 7));
	let typeFilter = $state<'all' | CashFlowEntryType>('all');
	let statusFilter = $state<'all' | CashFlowStatus>('all');
	let categoryFilter = $state('all');
	let sourceFilter = $state<'all' | CashFlowSourceType>('all');
	let showAccountDialog = $state(false);
	let showOfxDialog = $state(false);
	let accountDialogError = $state('');
	let ofxDialogError = $state('');
	let isSavingAccount = $state(false);
	let ofxImports = $state<OfxImport[]>([]);
	let accountName = $state('');
	let accountType = $state<BankAccount['type']>('checking');
	let accountBankName = $state('');
	let accountAgency = $state('');
	let accountNumber = $state('');
	let accountPixKey = $state('');
	let accountGatewayId = $state('');
	let accountInitialBalance = $state('');
	let ofxAccountId = $state('');
	let ofxFileName = $state('');

	const activeAccountIds = $derived(
		selectedAccountId === 'all' ? accounts.map((account) => account.id) : [Number(selectedAccountId)]
	);
	const scopedEntries = $derived(
		entries.filter((entry) => activeAccountIds.includes(entry.financial_account_id))
	);
	const filteredEntries = $derived.by(() =>
		scopedEntries.filter((entry) => {
			if (typeFilter !== 'all' && entry.type !== typeFilter) return false;
			if (statusFilter !== 'all' && entry.status !== statusFilter) return false;
			if (categoryFilter !== 'all' && String(entry.category_id) !== categoryFilter) return false;
			if (sourceFilter !== 'all' && entry.source_type !== sourceFilter) return false;
			return true;
		})
	);
	const realizedEntries = $derived(
		scopedEntries.filter((entry) => entry.status === 'confirmed' || entry.status === 'reconciled')
	);
	const pendingEntries = $derived(scopedEntries.filter((entry) => entry.status === 'pending'));
	const periodIncomeCents = $derived(
		realizedEntries
			.filter((entry) => entry.type === 'credit')
			.reduce((sum, entry) => sum + entry.amount_cents, 0)
	);
	const periodExpenseCents = $derived(
		realizedEntries
			.filter((entry) => entry.type === 'debit')
			.reduce((sum, entry) => sum + entry.amount_cents, 0)
	);
	const initialBalanceCents = $derived(
		accounts
			.filter((account) => activeAccountIds.includes(account.id))
			.reduce((sum, account) => sum + account.initial_balance_cents, 0)
	);
	const currentBalanceCents = $derived(
		initialBalanceCents +
			realizedEntries.reduce(
				(sum, entry) => sum + (entry.type === 'credit' ? entry.amount_cents : -entry.amount_cents),
				0
			)
	);
	const projectedBalanceCents = $derived(
		currentBalanceCents +
			pendingEntries.reduce(
				(sum, entry) => sum + (entry.type === 'credit' ? entry.amount_cents : -entry.amount_cents),
				0
			)
	);
	const overdueCents = $derived(
		pendingEntries
			.filter((entry) => entry.type === 'credit' && entry.due_date < new Date().toISOString().slice(0, 10))
			.reduce((sum, entry) => sum + entry.amount_cents, 0)
	);
	const accountSummaries = $derived(
		accounts.map((account) => {
			const accountEntries = entries.filter((entry) => entry.financial_account_id === account.id);
			const realized = accountEntries.filter((entry) =>
				entry.status === 'confirmed' || entry.status === 'reconciled'
			);
			const balance =
				account.initial_balance_cents +
				realized.reduce(
					(sum, entry) => sum + (entry.type === 'credit' ? entry.amount_cents : -entry.amount_cents),
					0
				);

			return {
				...account,
				balance_cents: balance,
				pending_count: accountEntries.filter((entry) => entry.status === 'pending').length
			};
		})
	);
	const summaryCards = $derived<SummaryCard[]>([
		{
			id: 'current-balance',
			label: 'Saldo atual',
			value: formatCurrencyFromCents(currentBalanceCents),
			description: 'Confirmado e conciliado, somando o saldo inicial.',
			tone: currentBalanceCents >= 0 ? 'positive' : 'negative',
			icon: CircleDollarSignIcon
		},
		{
			id: 'projected-balance',
			label: 'Saldo previsto',
			value: formatCurrencyFromCents(projectedBalanceCents),
			description: 'Inclui entradas e saídas ainda pendentes.',
			tone: projectedBalanceCents >= currentBalanceCents ? 'neutral' : 'warning',
			icon: CalendarCheckIcon
		},
		{
			id: 'period-income',
			label: 'Entradas do período',
			value: formatCurrencyFromCents(periodIncomeCents),
			description: 'Recebimentos confirmados ou conciliados.',
			tone: 'positive',
			icon: ArrowDownLeftIcon
		},
		{
			id: 'period-expense',
			label: 'Saídas do período',
			value: formatCurrencyFromCents(periodExpenseCents),
			description: 'Pagamentos confirmados ou conciliados.',
			tone: 'negative',
			icon: ArrowUpRightIcon
		},
		{
			id: 'overdue',
			label: 'Inadimplência relacionada',
			value: formatCurrencyFromCents(overdueCents),
			description: 'Cobranças pendentes vencidas no fluxo.',
			tone: overdueCents > 0 ? 'warning' : 'neutral',
			icon: TriangleAlertIcon
		}
	]);

	function formatCurrencyFromCents(amountCents: number): string {
		return (amountCents / 100).toLocaleString('pt-BR', {
			style: 'currency',
			currency: 'BRL',
			minimumFractionDigits: 2
		});
	}

	function formatDate(date: string | null): string {
		if (!date) return '-';
		return new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR');
	}

	function getTypeLabel(type: CashFlowEntryType): string {
		return type === 'credit' ? 'Entrada' : 'Saída';
	}

	function getStatusLabel(status: CashFlowStatus): string {
		return ({
			pending: 'Pendente',
			confirmed: 'Confirmado',
			reconciled: 'Conciliado',
			canceled: 'Cancelado',
			reversed: 'Estornado'
		} satisfies Record<CashFlowStatus, string>)[status];
	}

	function getSourceLabel(source: CashFlowSourceType): string {
		return ({
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
		} satisfies Record<CashFlowSourceType, string>)[source];
	}

	function getStatusClasses(status: CashFlowStatus): string {
		return (
			{
				pending: 'bg-amber-100 text-amber-700',
				confirmed: 'bg-sky-100 text-sky-700',
				reconciled: 'bg-emerald-100 text-emerald-700',
				canceled: 'bg-muted text-muted-foreground',
				reversed: 'bg-rose-100 text-rose-700'
			} satisfies Record<CashFlowStatus, string>
		)[status];
	}

	function getSummaryToneClasses(tone: SummaryCard['tone']): string {
		return (
			{
				neutral: 'bg-blue-100 text-blue-700',
				positive: 'bg-emerald-100 text-emerald-700',
				negative: 'bg-rose-100 text-rose-700',
				warning: 'bg-amber-100 text-amber-700'
			} satisfies Record<SummaryCard['tone'], string>
		)[tone];
	}

	function isOverdue(entry: LivroCaixaEntry): boolean {
		return entry.status === 'pending' && entry.due_date < new Date().toISOString().slice(0, 10);
	}

	function parseCurrencyToCents(value: string): number {
		const normalizedValue = value.trim().replaceAll('.', '').replace(',', '.');
		const parsedValue = Number.parseFloat(normalizedValue);

		return Number.isNaN(parsedValue) ? 0 : Math.round(parsedValue * 100);
	}

	function resetAccountForm(): void {
		accountName = '';
		accountType = 'checking';
		accountBankName = '';
		accountAgency = '';
		accountNumber = '';
		accountPixKey = '';
		accountGatewayId = '';
		accountInitialBalance = '';
		accountDialogError = '';
	}

	function openAccountDialog(): void {
		resetAccountForm();
		showAccountDialog = true;
	}

	function openOfxDialog(): void {
		ofxDialogError = '';
		ofxAccountId = selectedAccountId !== 'all' ? selectedAccountId : accounts[0] ? String(accounts[0].id) : '';
		ofxFileName = '';
		showOfxDialog = true;
	}

	async function handleCreateAccount(): Promise<void> {
		accountDialogError = '';

		if (!accountName.trim()) {
			accountDialogError = 'Informe o nome da conta financeira.';
			return;
		}

		isSavingAccount = true;

		const input: CreateBankAccountInput = {
			name: accountName.trim(),
			type: accountType,
			bank_name: accountBankName.trim(),
			agency: accountAgency.trim(),
			account_number: accountNumber.trim(),
			pix_key: accountPixKey.trim(),
			gateway_account_id: accountGatewayId.trim() || null,
			initial_balance_cents: parseCurrencyToCents(accountInitialBalance)
		};

		try {
			const account = await createBankAccount(params.code, input);
			accounts = [...accounts, account];
			selectedAccountId = String(account.id);
			showAccountDialog = false;
			resetAccountForm();
		} catch (error) {
			accountDialogError =
				error instanceof Error ? error.message : 'Não foi possível criar a conta financeira.';
		} finally {
			isSavingAccount = false;
		}
	}

	function handleOfxFileChange(event: Event): void {
		const file = (event.currentTarget as HTMLInputElement).files?.[0];

		ofxFileName = file?.name ?? '';
	}

	function handleImportOfx(): void {
		ofxDialogError = '';

		if (!ofxAccountId) {
			ofxDialogError = 'Selecione a conta financeira do extrato.';
			return;
		}

		if (!ofxFileName.toLowerCase().endsWith('.ofx')) {
			ofxDialogError = 'Selecione um arquivo OFX válido.';
			return;
		}

		const account = accounts.find((item) => item.id === Number(ofxAccountId));

		ofxImports = [
			{
				id: Date.now(),
				file_name: ofxFileName,
				account_name: account?.name ?? 'Conta financeira',
				imported_at: new Date().toISOString(),
				status: 'ready'
			},
			...ofxImports
		];
		showOfxDialog = false;
	}

	async function loadData(): Promise<void> {
		isLoading = true;
		errorMessage = '';

		try {
			const [entriesResponse, accountsResponse, categoriesResponse] = await Promise.all([
				listLivroCaixaEntries(params.code, monthFilter || undefined),
				listBankAccounts(params.code),
				listFinancialCategories(params.code),
				calculateCashFlowSummary(params.code, selectedAccountId === 'all' ? 'all' : Number(selectedAccountId), monthFilter)
			]);
			entries = entriesResponse;
			accounts = accountsResponse;
			categories = categoriesResponse;
			if (!ofxAccountId && accountsResponse.length > 0) {
				ofxAccountId = String(accountsResponse[0]!.id);
			}
		} catch (error) {
			errorMessage =
				error instanceof Error ? error.message : 'Não foi possível carregar o fluxo de caixa.';
		} finally {
			isLoading = false;
		}
	}

	$effect(() => {
		monthFilter;
		void loadData();
	});
</script>

<svelte:head>
	<title>Fluxo de Caixa</title>
</svelte:head>

<main id="cash-flow-page" data-test="cash-flow-page" class="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6">
	<section id="cash-flow-header" data-test="cash-flow-header" class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
		<div id="cash-flow-title-group" data-test="cash-flow-title-group" class="space-y-1">
			<h1 id="cash-flow-title" data-test="cash-flow-title" class="text-2xl font-semibold tracking-tight text-foreground">
				Fluxo de Caixa
			</h1>
			<p id="cash-flow-subtitle" data-test="cash-flow-subtitle" class="max-w-3xl text-sm text-muted-foreground">
				Acompanhe entradas, saídas, contas financeiras e conciliação do condomínio.
			</p>
		</div>

		<div id="cash-flow-actions" data-test="cash-flow-actions" class="flex flex-wrap gap-2">
			<Button id="cash-flow-new-entry" data-test="cash-flow-new-entry" type="button">
				<PlusIcon class="mr-2 size-4" />
				Novo lançamento
			</Button>
			<Button id="cash-flow-new-account" data-test="cash-flow-new-account" type="button" variant="outline" onclick={openAccountDialog}>
				<BanknoteIcon class="mr-2 size-4" />
				Nova conta financeira
			</Button>
			<Button id="cash-flow-import-ofx" data-test="cash-flow-import-ofx" type="button" variant="outline" onclick={openOfxDialog}>
				<UploadIcon class="mr-2 size-4" />
				Importar OFX
			</Button>
			<Button id="cash-flow-transfer" data-test="cash-flow-transfer" type="button" variant="outline">
				<ShuffleIcon class="mr-2 size-4" />
				Transferir
			</Button>
			<Button id="cash-flow-export-csv" data-test="cash-flow-export-csv" type="button" variant="outline">
				<DownloadIcon class="mr-2 size-4" />
				CSV
			</Button>
			<Button id="cash-flow-export-pdf" data-test="cash-flow-export-pdf" type="button" variant="outline">
				<DownloadIcon class="mr-2 size-4" />
				PDF
			</Button>
		</div>
	</section>

	<Dialog.Root bind:open={showAccountDialog}>
		<Dialog.Content class="max-h-[90vh] w-[calc(100vw-2rem)] max-w-none overflow-y-auto sm:max-w-[920px]">
			<Dialog.Header>
				<Dialog.Title>Nova conta financeira</Dialog.Title>
				<Dialog.Description>
					Cadastre contas como conta principal, fundo de reserva, obras, aplicação ou gateway.
				</Dialog.Description>
			</Dialog.Header>

			<div id="cash-flow-account-dialog-form" data-test="cash-flow-account-dialog-form" class="grid gap-4 py-2 md:grid-cols-2">
				{#if accountDialogError}
					<div id="cash-flow-account-dialog-error" data-test="cash-flow-account-dialog-error" class="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive md:col-span-2">
						{accountDialogError}
					</div>
				{/if}

				<div id="cash-flow-account-name-field" data-test="cash-flow-account-name-field" class="space-y-2 md:col-span-2">
					<Label for="cash-flow-account-name-input">Nome da conta</Label>
					<Input id="cash-flow-account-name-input" data-test="cash-flow-account-name-input" value={accountName} placeholder="Ex.: Fundo de reserva" disabled={isSavingAccount} oninput={(event) => { accountName = (event.currentTarget as HTMLInputElement).value; }} />
				</div>

				<div id="cash-flow-account-type-field" data-test="cash-flow-account-type-field" class="space-y-2">
					<Label for="cash-flow-account-type-select">Tipo</Label>
					<select id="cash-flow-account-type-select" data-test="cash-flow-account-type-select" class="flex h-9 w-full rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30" value={accountType} disabled={isSavingAccount} onchange={(event) => { accountType = (event.currentTarget as HTMLSelectElement).value as BankAccount['type']; }}>
						<option value="checking">Conta corrente</option>
						<option value="savings">Poupança</option>
						<option value="reserve">Fundo de reserva</option>
						<option value="investment">Aplicação</option>
						<option value="gateway">Subconta do gateway</option>
						<option value="cash">Caixa físico</option>
					</select>
				</div>

				<div id="cash-flow-account-bank-field" data-test="cash-flow-account-bank-field" class="space-y-2">
					<Label for="cash-flow-account-bank-input">Banco</Label>
					<Input id="cash-flow-account-bank-input" data-test="cash-flow-account-bank-input" value={accountBankName} placeholder="Ex.: Banco do Brasil" disabled={isSavingAccount} oninput={(event) => { accountBankName = (event.currentTarget as HTMLInputElement).value; }} />
				</div>

				<div id="cash-flow-account-agency-field" data-test="cash-flow-account-agency-field" class="space-y-2">
					<Label for="cash-flow-account-agency-input">Agência</Label>
					<Input id="cash-flow-account-agency-input" data-test="cash-flow-account-agency-input" value={accountAgency} placeholder="0000" disabled={isSavingAccount} oninput={(event) => { accountAgency = (event.currentTarget as HTMLInputElement).value; }} />
				</div>

				<div id="cash-flow-account-number-field" data-test="cash-flow-account-number-field" class="space-y-2">
					<Label for="cash-flow-account-number-input">Número da conta</Label>
					<Input id="cash-flow-account-number-input" data-test="cash-flow-account-number-input" value={accountNumber} placeholder="00000-0" disabled={isSavingAccount} oninput={(event) => { accountNumber = (event.currentTarget as HTMLInputElement).value; }} />
				</div>

				<div id="cash-flow-account-pix-field" data-test="cash-flow-account-pix-field" class="space-y-2">
					<Label for="cash-flow-account-pix-input">Chave Pix</Label>
					<Input id="cash-flow-account-pix-input" data-test="cash-flow-account-pix-input" value={accountPixKey} placeholder="financeiro@condominio.com.br" disabled={isSavingAccount} oninput={(event) => { accountPixKey = (event.currentTarget as HTMLInputElement).value; }} />
				</div>

				<div id="cash-flow-account-gateway-field" data-test="cash-flow-account-gateway-field" class="space-y-2">
					<Label for="cash-flow-account-gateway-input">ID do gateway</Label>
					<Input id="cash-flow-account-gateway-input" data-test="cash-flow-account-gateway-input" value={accountGatewayId} placeholder="Opcional" disabled={isSavingAccount} oninput={(event) => { accountGatewayId = (event.currentTarget as HTMLInputElement).value; }} />
				</div>

				<div id="cash-flow-account-initial-balance-field" data-test="cash-flow-account-initial-balance-field" class="space-y-2 md:col-span-2">
					<Label for="cash-flow-account-initial-balance-input">Saldo inicial</Label>
					<Input id="cash-flow-account-initial-balance-input" data-test="cash-flow-account-initial-balance-input" value={accountInitialBalance} placeholder="0,00" inputmode="decimal" disabled={isSavingAccount} oninput={(event) => { accountInitialBalance = (event.currentTarget as HTMLInputElement).value; }} />
				</div>
			</div>

			<Dialog.Footer>
				<Button type="button" variant="outline" disabled={isSavingAccount} onclick={() => { showAccountDialog = false; }}>
					Cancelar
				</Button>
				<Button type="button" disabled={isSavingAccount} onclick={handleCreateAccount}>
					{isSavingAccount ? 'Salvando...' : 'Criar conta'}
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>

	<Dialog.Root bind:open={showOfxDialog}>
		<Dialog.Content class="max-w-lg">
			<Dialog.Header>
				<Dialog.Title>Importar extrato OFX</Dialog.Title>
				<Dialog.Description>
					Selecione a conta financeira e envie o arquivo OFX para preparar a conciliação.
				</Dialog.Description>
			</Dialog.Header>

			<div id="cash-flow-ofx-dialog-form" data-test="cash-flow-ofx-dialog-form" class="grid gap-4 py-2">
				{#if ofxDialogError}
					<div id="cash-flow-ofx-dialog-error" data-test="cash-flow-ofx-dialog-error" class="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
						{ofxDialogError}
					</div>
				{/if}

				<div id="cash-flow-ofx-account-field" data-test="cash-flow-ofx-account-field" class="space-y-2">
					<Label for="cash-flow-ofx-account-select">Conta financeira</Label>
					<select id="cash-flow-ofx-account-select" data-test="cash-flow-ofx-account-select" class="flex h-9 w-full rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30" value={ofxAccountId} onchange={(event) => { ofxAccountId = (event.currentTarget as HTMLSelectElement).value; }}>
						<option value="">Selecione a conta</option>
						{#each accounts as account (account.id)}
							<option value={String(account.id)}>{account.name}</option>
						{/each}
					</select>
				</div>

				<div id="cash-flow-ofx-file-field" data-test="cash-flow-ofx-file-field" class="space-y-2">
					<Label for="cash-flow-ofx-file-input">Arquivo OFX</Label>
					<Input id="cash-flow-ofx-file-input" data-test="cash-flow-ofx-file-input" type="file" accept=".ofx,application/x-ofx" onchange={handleOfxFileChange} />
					<p id="cash-flow-ofx-file-help" data-test="cash-flow-ofx-file-help" class="text-xs text-muted-foreground">
						O arquivo fica em memória nesta versão frontend e aparece como importação pronta para conciliação.
					</p>
				</div>
			</div>

			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={() => { showOfxDialog = false; }}>
					Cancelar
				</Button>
				<Button type="button" onclick={handleImportOfx}>
					Importar OFX
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>

	<section id="cash-flow-summary-grid" data-test="cash-flow-summary-grid" class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
		{#each summaryCards as card (card.id)}
			{@const Icon = card.icon}
			<Card.Root>
				<Card.Content class="flex items-start gap-3 p-4">
					<div class={cn('flex size-10 shrink-0 items-center justify-center rounded-full', getSummaryToneClasses(card.tone))}>
						<Icon class="size-5" />
					</div>
					<div id={`cash-flow-summary-${card.id}`} data-test="cash-flow-summary-card" class="min-w-0">
						<p class="text-xs font-medium uppercase text-muted-foreground">{card.label}</p>
						<p class="mt-1 text-xl font-bold text-foreground">{card.value}</p>
						<p class="mt-1 text-xs text-muted-foreground">{card.description}</p>
					</div>
				</Card.Content>
			</Card.Root>
		{/each}
	</section>

	<section id="cash-flow-account-view" data-test="cash-flow-account-view" class="grid gap-3 lg:grid-cols-4">
		{#each accountSummaries as account (account.id)}
			<button
				id={`cash-flow-account-${account.id}`}
				data-test="cash-flow-account-card"
				type="button"
				class={cn(
					'rounded-lg border bg-card p-4 text-left shadow-sm transition-colors hover:bg-muted/40',
					selectedAccountId === String(account.id) && 'border-primary bg-primary/5'
				)}
				onclick={() => {
					selectedAccountId = String(account.id);
				}}
			>
				<div class="flex items-center justify-between gap-3">
					<div class="min-w-0">
						<p class="truncate text-sm font-semibold text-foreground">{account.name}</p>
						<p class="truncate text-xs text-muted-foreground">{account.bank_name}</p>
					</div>
					<BanknoteIcon class="size-4 text-muted-foreground" />
				</div>
				<p class="mt-3 text-lg font-bold text-foreground">{formatCurrencyFromCents(account.balance_cents)}</p>
				<p class="mt-1 text-xs text-muted-foreground">
					{account.pending_count} pendências · saldo inicial {formatCurrencyFromCents(account.initial_balance_cents)}
				</p>
			</button>
		{/each}
	</section>

	{#if ofxImports.length > 0}
		<section id="cash-flow-ofx-imports" data-test="cash-flow-ofx-imports" class="rounded-lg border bg-card p-4">
			<div id="cash-flow-ofx-imports-header" data-test="cash-flow-ofx-imports-header" class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
				<div id="cash-flow-ofx-imports-title-group" data-test="cash-flow-ofx-imports-title-group">
					<h2 id="cash-flow-ofx-imports-title" data-test="cash-flow-ofx-imports-title" class="text-sm font-semibold text-foreground">
						Extratos OFX importados
					</h2>
					<p id="cash-flow-ofx-imports-description" data-test="cash-flow-ofx-imports-description" class="text-xs text-muted-foreground">
						Arquivos prontos para conferência e conciliação manual.
					</p>
				</div>
				<Button id="cash-flow-ofx-import-more" data-test="cash-flow-ofx-import-more" type="button" variant="outline" size="sm" onclick={openOfxDialog}>
					<UploadIcon class="mr-2 size-4" />
					Importar outro
				</Button>
			</div>

			<div id="cash-flow-ofx-import-list" data-test="cash-flow-ofx-import-list" class="mt-3 grid gap-2 md:grid-cols-2">
				{#each ofxImports as importRecord (importRecord.id)}
					<div id={`cash-flow-ofx-import-${importRecord.id}`} data-test="cash-flow-ofx-import-item" class="rounded-md border border-dashed px-3 py-2">
						<div class="flex items-center justify-between gap-3">
							<div class="min-w-0">
								<p class="truncate text-sm font-medium text-foreground">{importRecord.file_name}</p>
								<p class="text-xs text-muted-foreground">
									{importRecord.account_name} · {new Date(importRecord.imported_at).toLocaleString('pt-BR')}
								</p>
							</div>
							<span class="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
								Pronto
							</span>
						</div>
					</div>
				{/each}
			</div>
		</section>
	{/if}

	<Card.Root>
		<Card.Header>
			<Card.Title>Filtros</Card.Title>
		</Card.Header>
		<Card.Content class="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
			<div id="cash-flow-condominium-filter" data-test="cash-flow-condominium-filter" class="space-y-2">
				<Label for="cash-flow-condominium">Condomínio</Label>
				<Input id="cash-flow-condominium" data-test="cash-flow-condominium" value={params.code} disabled />
			</div>
			<div id="cash-flow-account-filter" data-test="cash-flow-account-filter" class="space-y-2">
				<Label for="cash-flow-account">Conta financeira</Label>
				<select id="cash-flow-account" data-test="cash-flow-account" class="flex h-9 w-full rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30" value={selectedAccountId} onchange={(event) => { selectedAccountId = (event.currentTarget as HTMLSelectElement).value; }}>
					<option value="all">Consolidado</option>
					{#each accounts as account (account.id)}
						<option value={String(account.id)}>{account.name}</option>
					{/each}
				</select>
			</div>
			<div id="cash-flow-period-filter" data-test="cash-flow-period-filter" class="space-y-2">
				<Label for="cash-flow-period">Período</Label>
				<Input id="cash-flow-period" data-test="cash-flow-period" type="month" value={monthFilter} oninput={(event) => { monthFilter = (event.currentTarget as HTMLInputElement).value; }} />
			</div>
			<div id="cash-flow-type-filter" data-test="cash-flow-type-filter" class="space-y-2">
				<Label for="cash-flow-type">Tipo</Label>
				<select id="cash-flow-type" data-test="cash-flow-type" class="flex h-9 w-full rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30" value={typeFilter} onchange={(event) => { typeFilter = (event.currentTarget as HTMLSelectElement).value as 'all' | CashFlowEntryType; }}>
					<option value="all">Todos</option>
					<option value="credit">Entradas</option>
					<option value="debit">Saídas</option>
				</select>
			</div>
			<div id="cash-flow-status-filter" data-test="cash-flow-status-filter" class="space-y-2">
				<Label for="cash-flow-status">Status</Label>
				<select id="cash-flow-status" data-test="cash-flow-status" class="flex h-9 w-full rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30" value={statusFilter} onchange={(event) => { statusFilter = (event.currentTarget as HTMLSelectElement).value as 'all' | CashFlowStatus; }}>
					<option value="all">Todos</option>
					<option value="pending">Pendente</option>
					<option value="confirmed">Confirmado</option>
					<option value="reconciled">Conciliado</option>
					<option value="canceled">Cancelado</option>
					<option value="reversed">Estornado</option>
				</select>
			</div>
			<div id="cash-flow-category-filter" data-test="cash-flow-category-filter" class="space-y-2">
				<Label for="cash-flow-category">Categoria</Label>
				<select id="cash-flow-category" data-test="cash-flow-category" class="flex h-9 w-full rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30" value={categoryFilter} onchange={(event) => { categoryFilter = (event.currentTarget as HTMLSelectElement).value; }}>
					<option value="all">Todas</option>
					{#each categories as category (category.id)}
						<option value={String(category.id)}>{category.name}</option>
					{/each}
				</select>
			</div>
			<div id="cash-flow-source-filter" data-test="cash-flow-source-filter" class="space-y-2 xl:col-span-2">
				<Label for="cash-flow-source">Origem</Label>
				<select id="cash-flow-source" data-test="cash-flow-source" class="flex h-9 w-full rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30" value={sourceFilter} onchange={(event) => { sourceFilter = (event.currentTarget as HTMLSelectElement).value as 'all' | CashFlowSourceType; }}>
					<option value="all">Todas</option>
					<option value="manual">Manual</option>
					<option value="charge">Cobrança</option>
					<option value="payment">Pagamento</option>
					<option value="settlement">Baixa</option>
					<option value="expense">Despesa</option>
					<option value="agreement">Acordo</option>
					<option value="fine">Multa</option>
					<option value="interest">Juros</option>
					<option value="reversal">Estorno</option>
					<option value="transfer">Transferência</option>
				</select>
			</div>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title>Lançamentos</Card.Title>
		</Card.Header>
		<Card.Content class="p-0">
			{#if isLoading}
				<div id="cash-flow-loading" data-test="cash-flow-loading" class="px-6 py-8 text-sm text-muted-foreground">Carregando fluxo de caixa...</div>
			{:else if errorMessage}
				<div id="cash-flow-error" data-test="cash-flow-error" class="mx-6 mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{errorMessage}</div>
			{:else if filteredEntries.length === 0}
				<div class="p-4">
					<CardEmpty
						title="Nenhum lançamento encontrado"
						description="Ajuste os filtros ou cadastre um lançamento para acompanhar o fluxo de caixa."
						actionLabel="Novo lançamento"
					/>
				</div>
			{:else}
				<Tooltip.Provider>
					<Table.Root class="text-sm">
						<Table.Header class="bg-muted/35">
							<Table.Row class="hover:bg-transparent">
								<Table.Head class="w-28 pl-6">Data</Table.Head>
								<Table.Head>Descrição</Table.Head>
								<Table.Head class="w-36">Categoria</Table.Head>
								<Table.Head class="w-40">Conta</Table.Head>
								<Table.Head class="w-24">Tipo</Table.Head>
								<Table.Head class="w-32 text-right">Valor</Table.Head>
								<Table.Head class="w-28">Status</Table.Head>
								<Table.Head class="w-32">Origem</Table.Head>
								<Table.Head class="w-36 pr-6 text-right">Ações</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each filteredEntries as entry (entry.id)}
								<Table.Row class={cn(isOverdue(entry) && 'bg-amber-50/60')}>
									<Table.Cell class="pl-6 text-muted-foreground">{formatDate(entry.paid_at ?? entry.occurred_at ?? entry.due_date)}</Table.Cell>
									<Table.Cell>
										<div class="font-medium text-foreground">{entry.description}</div>
										<div class="text-xs text-muted-foreground">Competência {formatDate(entry.competence_date)}</div>
									</Table.Cell>
									<Table.Cell class="text-muted-foreground">{entry.category}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{entry.financial_account_name}</Table.Cell>
									<Table.Cell>
										<span class={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', entry.type === 'credit' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700')}>{getTypeLabel(entry.type)}</span>
									</Table.Cell>
									<Table.Cell class="text-right font-semibold">
										<span class={entry.type === 'credit' ? 'text-emerald-700' : 'text-rose-700'}>{entry.type === 'credit' ? '+' : '-'}{formatCurrencyFromCents(entry.amount_cents)}</span>
									</Table.Cell>
									<Table.Cell>
										<span class={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', getStatusClasses(entry.status))}>{getStatusLabel(entry.status)}</span>
									</Table.Cell>
									<Table.Cell>
										<span class="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{getSourceLabel(entry.source_type)}</span>
									</Table.Cell>
									<Table.Cell class="pr-6 text-right">
										<div class="flex items-center justify-end gap-1">
											{#if entry.status === 'pending'}
												<Tooltip.Root>
													<Tooltip.Trigger>
														<Button type="button" variant="outline" size="icon" class="size-8" aria-label="Confirmar pagamento"><FileCheckIcon class="size-4" /></Button>
													</Tooltip.Trigger>
													<Tooltip.Content>Confirmar pagamento</Tooltip.Content>
												</Tooltip.Root>
											{/if}
											<Tooltip.Root>
												<Tooltip.Trigger>
													<Button type="button" variant="outline" size="icon" class="size-8" aria-label="Anexar comprovante"><PaperclipIcon class="size-4" /></Button>
												</Tooltip.Trigger>
												<Tooltip.Content>Anexar comprovante</Tooltip.Content>
											</Tooltip.Root>
											<Tooltip.Root>
												<Tooltip.Trigger>
													<Button type="button" variant="outline" size="icon" class="size-8" disabled={entry.status === 'reconciled'} aria-label="Conciliar lançamento"><ShieldCheckIcon class="size-4" /></Button>
												</Tooltip.Trigger>
												<Tooltip.Content>Conciliar</Tooltip.Content>
											</Tooltip.Root>
											<Tooltip.Root>
												<Tooltip.Trigger>
													<Button type="button" variant="outline" size="icon" class="size-8" disabled={entry.status === 'reconciled'} aria-label="Estornar lançamento"><RefreshCcwIcon class="size-4" /></Button>
												</Tooltip.Trigger>
												<Tooltip.Content>Estornar ou cancelar</Tooltip.Content>
											</Tooltip.Root>
										</div>
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Tooltip.Provider>
			{/if}
		</Card.Content>
	</Card.Root>
</main>
