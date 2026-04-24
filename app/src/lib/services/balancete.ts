import { listBankAccounts } from '$lib/services/bank-accounts.js';
import { listContasAPagar } from '$lib/services/contas-a-pagar.js';
import { listContasAReceber, type ReceivableStatus } from '$lib/services/contas-a-receber.js';
import {
	listLivroCaixaEntries,
	type CashFlowAttachment,
	type CashFlowSourceType,
	type LivroCaixaEntry
} from '$lib/services/livro-caixa.js';

export type BalanceteStatus = 'draft' | 'closed' | 'reopened';
export type EntryScope = 'geral' | 'bloco' | 'unidade';
export type RateioMethod = 'fracao' | 'igual' | 'area';
export type BalanceReportItemType = 'income' | 'expense';

export interface Balancete {
	id: number;
	condominium_id: number;
	condominiumCode: string;
	month: string;
	status: BalanceteStatus;
	previous_balance_cents: number;
	total_income_cents: number;
	total_expense_cents: number;
	period_result_cents: number;
	final_balance_cents: number;
	generated_at: string;
	closed_at: string | null;
	generated_by: string;
	closed_by: string | null;
	due_date: string | null;
	snapshot_json: BalanceReportSnapshot | null;
	created_at: string;
	updated_at: string;
}

export interface BalanceteSummary extends Balancete {
	total_expenses: number;
	total_revenues: number;
	entry_count: number;
}

export interface BalanceReportItem {
	id: number;
	balance_report_id: number;
	type: BalanceReportItemType;
	category_id: number | null;
	category_name: string;
	description: string;
	total_cents: number;
	entries_count: number;
	confirmed_cents: number;
	reconciled_cents: number;
}

export interface BalanceReportAccount {
	id: number;
	balance_report_id: number;
	financial_account_id: number;
	account_name: string;
	previous_balance_cents: number;
	income_cents: number;
	expense_cents: number;
	transfer_in_cents: number;
	transfer_out_cents: number;
	final_balance_cents: number;
}

export interface BalanceReportOpenPayable {
	id: number;
	balance_report_id: number;
	payable_id: number;
	description: string;
	category_name: string;
	due_date: string;
	amount_cents: number;
	status: 'open' | 'pending' | 'overdue' | 'scheduled';
	days_overdue: number;
}

export interface BalanceReportOpenReceivable {
	id: number;
	balance_report_id: number;
	receivable_id: number;
	unit_id: number;
	unit_label: string;
	resident_name: string;
	competence_month: string;
	due_date: string;
	amount_cents: number;
	status: 'open' | 'pending' | 'overdue';
	days_overdue: number;
}

export interface BalanceReportDelinquencySummary {
	id: number;
	balance_report_id: number;
	overdue_amount_cents: number;
	future_amount_cents: number;
	overdue_charges_count: number;
	delinquent_units_count: number;
	delinquency_rate: number;
	main_pending_items: BalanceReportOpenReceivable[];
}

export interface BalanceReportReconciliationSummary {
	confirmed_amount_cents: number;
	reconciled_amount_cents: number;
	confirmed_count: number;
	reconciled_count: number;
	reconciliation_rate: number;
}

export interface BalanceReportTransfer {
	source_id: number;
	description: string;
	amount_cents: number;
	from_account_name: string;
	to_account_name: string;
	date: string;
}

export interface BalanceReportDomainEvent {
	id: number;
	name: string;
	description: string;
	impact: string;
}

export interface BalanceReportSnapshot {
	generated_at: string;
	previous_balance_cents: number;
	total_income_cents: number;
	total_expense_cents: number;
	period_result_cents: number;
	final_balance_cents: number;
	income_items: BalanceReportItem[];
	expense_items: BalanceReportItem[];
	account_balances: BalanceReportAccount[];
	open_payables: BalanceReportOpenPayable[];
	open_receivables: BalanceReportOpenReceivable[];
	delinquency: BalanceReportDelinquencySummary;
	reconciliation: BalanceReportReconciliationSummary;
	attachments: CashFlowAttachment[];
	transfers: BalanceReportTransfer[];
}

export interface BalanceReportPreview extends Balancete {
	condominium_name: string;
	condominium_document: string;
	condominium_address: string;
	responsible_name: string;
	income_items: BalanceReportItem[];
	expense_items: BalanceReportItem[];
	account_balances: BalanceReportAccount[];
	open_payables: BalanceReportOpenPayable[];
	open_receivables: BalanceReportOpenReceivable[];
	delinquency: BalanceReportDelinquencySummary;
	reconciliation: BalanceReportReconciliationSummary;
	attachments: CashFlowAttachment[];
	transfers: BalanceReportTransfer[];
	realized_entries: LivroCaixaEntry[];
	ignored_entries: LivroCaixaEntry[];
	modeling_notes: string[];
	business_rules: string[];
	calculation_rules: string[];
	domain_events: BalanceReportDomainEvent[];
	closing_flow: string[];
	after_closing_rules: string[];
	consistency_guards: string[];
	examples: string[];
}

let nextBalanceteId = 10;

const balancetesStore = new Map<string, Balancete[]>();

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function seedForCode(condominiumCode: string): void {
	const now = new Date().toISOString();
	const march: Balancete = {
		id: nextBalanceteId++,
		condominium_id: 1,
		condominiumCode,
		month: '2026-03',
		status: 'closed',
		previous_balance_cents: 2360000,
		total_income_cents: 146000,
		total_expense_cents: 450000,
		period_result_cents: -304000,
		final_balance_cents: 2056000,
		generated_at: '2026-03-31T20:00:00Z',
		closed_at: '2026-03-31T23:59:59Z',
		generated_by: 'Síndico AP202',
		closed_by: 'Síndico AP202',
		due_date: '2026-04-10',
		snapshot_json: null,
		created_at: now,
		updated_at: now
	};

	const april: Balancete = {
		id: nextBalanceteId++,
		condominium_id: 1,
		condominiumCode,
		month: '2026-04',
		status: 'draft',
		previous_balance_cents: 0,
		total_income_cents: 0,
		total_expense_cents: 0,
		period_result_cents: 0,
		final_balance_cents: 0,
		generated_at: now,
		closed_at: null,
		generated_by: 'Síndico AP202',
		closed_by: null,
		due_date: null,
		snapshot_json: null,
		created_at: now,
		updated_at: now
	};

	balancetesStore.set(condominiumCode, [march, april]);
}

function getBalancetesForCode(condominiumCode: string): Balancete[] {
	if (!balancetesStore.has(condominiumCode)) {
		seedForCode(condominiumCode);
	}

	return balancetesStore.get(condominiumCode)!;
}

function getMonthEnd(month: string): string {
	const [year, monthNumber] = month.split('-').map(Number);
	return new Date(year, monthNumber, 0).toISOString().slice(0, 10);
}

function getDaysOverdue(dueDate: string, referenceDate: string): number {
	if (dueDate >= referenceDate) return 0;
	const diff = new Date(`${referenceDate}T00:00:00`).getTime() - new Date(`${dueDate}T00:00:00`).getTime();
	return Math.max(0, Math.floor(diff / 86_400_000));
}

function signedAmount(entry: LivroCaixaEntry): number {
	return entry.type === 'credit' ? entry.amount_cents : -entry.amount_cents;
}

function isRealized(entry: LivroCaixaEntry): boolean {
	return entry.status === 'confirmed' || entry.status === 'reconciled';
}

function isTransfer(entry: LivroCaixaEntry): boolean {
	return entry.source_type === 'transfer';
}

function isOpenReceivableStatus(status: ReceivableStatus): status is 'open' | 'pending' | 'overdue' {
	return status === 'open' || status === 'pending' || status === 'overdue';
}

function getOpenReceivableReportStatus(
	status: ReceivableStatus,
	dueDate: string,
	referenceDate: string
): BalanceReportOpenReceivable['status'] {
	if (status === 'overdue' || dueDate < referenceDate) return 'overdue';
	if (status === 'pending') return 'pending';
	return 'open';
}

function groupEntries(
	entries: LivroCaixaEntry[],
	type: BalanceReportItemType,
	reportId: number
): BalanceReportItem[] {
	const entryType = type === 'income' ? 'credit' : 'debit';
	const grouped = new Map<string, LivroCaixaEntry[]>();

	for (const entry of entries.filter((item) => item.type === entryType && !isTransfer(item))) {
		const key = `${entry.category_id}:${entry.category}`;
		grouped.set(key, [...(grouped.get(key) ?? []), entry]);
	}

	return Array.from(grouped.values()).map((items, index) => ({
		id: reportId * 1000 + index + (type === 'income' ? 100 : 300),
		balance_report_id: reportId,
		type,
		category_id: items[0]?.category_id ?? null,
		category_name: items[0]?.category ?? 'Sem categoria',
		description: items.map((item) => item.description).slice(0, 2).join(' | '),
		total_cents: items.reduce((sum, item) => sum + item.amount_cents, 0),
		entries_count: items.length,
		confirmed_cents: items
			.filter((item) => item.status === 'confirmed')
			.reduce((sum, item) => sum + item.amount_cents, 0),
		reconciled_cents: items
			.filter((item) => item.status === 'reconciled')
			.reduce((sum, item) => sum + item.amount_cents, 0)
	}));
}

function buildTransfers(entries: LivroCaixaEntry[]): BalanceReportTransfer[] {
	const grouped = new Map<number, LivroCaixaEntry[]>();

	for (const entry of entries.filter((item) => isTransfer(item) && item.source_id)) {
		grouped.set(entry.source_id!, [...(grouped.get(entry.source_id!) ?? []), entry]);
	}

	return Array.from(grouped.entries()).map(([sourceId, items]) => {
		const debit = items.find((item) => item.type === 'debit');
		const credit = items.find((item) => item.type === 'credit');

		return {
			source_id: sourceId,
			description: debit?.description ?? credit?.description ?? 'Transferência entre contas',
			amount_cents: debit?.amount_cents ?? credit?.amount_cents ?? 0,
			from_account_name: debit?.financial_account_name ?? 'Conta de origem',
			to_account_name: credit?.financial_account_name ?? 'Conta de destino',
			date: debit?.paid_at ?? credit?.paid_at ?? debit?.due_date ?? credit?.due_date ?? ''
		};
	});
}

function buildSnapshot(report: BalanceReportPreview): BalanceReportSnapshot {
	return {
		generated_at: report.generated_at,
		previous_balance_cents: report.previous_balance_cents,
		total_income_cents: report.total_income_cents,
		total_expense_cents: report.total_expense_cents,
		period_result_cents: report.period_result_cents,
		final_balance_cents: report.final_balance_cents,
		income_items: report.income_items,
		expense_items: report.expense_items,
		account_balances: report.account_balances,
		open_payables: report.open_payables,
		open_receivables: report.open_receivables,
		delinquency: report.delinquency,
		reconciliation: report.reconciliation,
		attachments: report.attachments,
		transfers: report.transfers
	};
}

export async function listBalancetes(condominiumCode: string): Promise<BalanceteSummary[]> {
	await delay(150);
	const list = getBalancetesForCode(condominiumCode);
	const summaries = await Promise.all(
		list.map(async (balancete) => {
			const report = await buildBalanceReport(condominiumCode, balancete.id);

			return {
				...report,
				total_expenses: report.total_expense_cents / 100,
				total_revenues: report.total_income_cents / 100,
				entry_count: report.realized_entries.length
			};
		})
	);

	return summaries.sort((a, b) => b.month.localeCompare(a.month));
}

export async function getBalancete(condominiumCode: string, id: number): Promise<Balancete> {
	await delay(100);
	const list = getBalancetesForCode(condominiumCode);
	const balancete = list.find((item) => item.id === id);
	if (!balancete) throw new Error('Balancete não encontrado.');

	return { ...balancete };
}

export async function createBalancete(condominiumCode: string, month: string): Promise<Balancete> {
	await delay(150);
	const list = getBalancetesForCode(condominiumCode);
	if (list.some((item) => item.month === month)) {
		throw new Error(`Já existe um balancete para ${month}.`);
	}

	const now = new Date().toISOString();
	const balancete: Balancete = {
		id: nextBalanceteId++,
		condominium_id: 1,
		condominiumCode,
		month,
		status: 'draft',
		previous_balance_cents: 0,
		total_income_cents: 0,
		total_expense_cents: 0,
		period_result_cents: 0,
		final_balance_cents: 0,
		generated_at: now,
		closed_at: null,
		generated_by: 'Síndico AP202',
		closed_by: null,
		due_date: null,
		snapshot_json: null,
		created_at: now,
		updated_at: now
	};

	list.push(balancete);
	return { ...balancete };
}

export async function buildBalanceReport(
	condominiumCode: string,
	id: number
): Promise<BalanceReportPreview> {
	const [balancete, accounts, entries, payables, receivables] = await Promise.all([
		getBalancete(condominiumCode, id),
		listBankAccounts(condominiumCode),
		listLivroCaixaEntries(condominiumCode),
		listContasAPagar(condominiumCode),
		listContasAReceber(condominiumCode)
	]);
	const monthEnd = getMonthEnd(balancete.month);
	const periodEntries = entries.filter((entry) => entry.competence_date.startsWith(balancete.month));
	const realizedEntries = periodEntries.filter(isRealized);
	const ignoredEntries = periodEntries.filter((entry) => !isRealized(entry));
	const consolidatedEntries = realizedEntries.filter((entry) => !isTransfer(entry));
	const previousEntries = entries.filter(
		(entry) => isRealized(entry) && entry.competence_date < `${balancete.month}-01`
	);
	const initialBalanceCents = accounts.reduce((sum, account) => sum + account.initial_balance_cents, 0);
	const previousBalanceCents =
		balancete.snapshot_json?.previous_balance_cents ??
		initialBalanceCents + previousEntries.reduce((sum, entry) => sum + signedAmount(entry), 0);
	const totalIncomeCents = consolidatedEntries
		.filter((entry) => entry.type === 'credit')
		.reduce((sum, entry) => sum + entry.amount_cents, 0);
	const totalExpenseCents = consolidatedEntries
		.filter((entry) => entry.type === 'debit')
		.reduce((sum, entry) => sum + entry.amount_cents, 0);
	const periodResultCents = totalIncomeCents - totalExpenseCents;
	const finalBalanceCents = previousBalanceCents + periodResultCents;
	const openPayables: BalanceReportOpenPayable[] = payables
		.filter((item) => item.status === 'pending')
		.map((item, index) => ({
			id: id * 1000 + index + 500,
			balance_report_id: id,
			payable_id: item.id,
			description: item.description,
			category_name: item.category,
			due_date: item.due_date,
			amount_cents: Math.round(item.value * 100),
			status: item.due_date < monthEnd ? 'overdue' : 'pending',
			days_overdue: getDaysOverdue(item.due_date, monthEnd)
		}));
	const openReceivables: BalanceReportOpenReceivable[] = receivables
		.filter((item) => isOpenReceivableStatus(item.status))
		.map((item, index) => ({
			id: id * 1000 + index + 700,
			balance_report_id: id,
			receivable_id: item.id,
			unit_id: item.unit_id,
			unit_label: item.unit_label,
			resident_name: item.resident_name,
			competence_month: item.competence_month,
			due_date: item.due_date,
			amount_cents: item.amount_cents,
			status: getOpenReceivableReportStatus(item.status, item.due_date, monthEnd),
			days_overdue: getDaysOverdue(item.due_date, monthEnd)
		}));
	const overdueReceivables = openReceivables.filter((item) => item.status === 'overdue');
	const accountBalances: BalanceReportAccount[] = accounts.map((account, index) => {
		const accountPrevious =
			account.initial_balance_cents +
			previousEntries
				.filter((entry) => entry.financial_account_id === account.id)
				.reduce((sum, entry) => sum + signedAmount(entry), 0);
		const accountPeriod = realizedEntries.filter((entry) => entry.financial_account_id === account.id);
		const incomeCents = accountPeriod
			.filter((entry) => entry.type === 'credit' && !isTransfer(entry))
			.reduce((sum, entry) => sum + entry.amount_cents, 0);
		const expenseCents = accountPeriod
			.filter((entry) => entry.type === 'debit' && !isTransfer(entry))
			.reduce((sum, entry) => sum + entry.amount_cents, 0);
		const transferInCents = accountPeriod
			.filter((entry) => entry.type === 'credit' && isTransfer(entry))
			.reduce((sum, entry) => sum + entry.amount_cents, 0);
		const transferOutCents = accountPeriod
			.filter((entry) => entry.type === 'debit' && isTransfer(entry))
			.reduce((sum, entry) => sum + entry.amount_cents, 0);

		return {
			id: id * 1000 + index + 900,
			balance_report_id: id,
			financial_account_id: account.id,
			account_name: account.name,
			previous_balance_cents: accountPrevious,
			income_cents: incomeCents,
			expense_cents: expenseCents,
			transfer_in_cents: transferInCents,
			transfer_out_cents: transferOutCents,
			final_balance_cents: accountPrevious + incomeCents + transferInCents - expenseCents - transferOutCents
		};
	});
	const reconciledAmountCents = realizedEntries
		.filter((entry) => entry.status === 'reconciled')
		.reduce((sum, entry) => sum + entry.amount_cents, 0);
	const confirmedAmountCents = realizedEntries
		.filter((entry) => entry.status === 'confirmed')
		.reduce((sum, entry) => sum + entry.amount_cents, 0);
	const totalRealizedAmountCents = reconciledAmountCents + confirmedAmountCents;
	const report: BalanceReportPreview = {
		...balancete,
		previous_balance_cents: previousBalanceCents,
		total_income_cents: totalIncomeCents,
		total_expense_cents: totalExpenseCents,
		period_result_cents: periodResultCents,
		final_balance_cents: finalBalanceCents,
		condominium_name: 'Condomínio AP202',
		condominium_document: '12.345.678/0001-90',
		condominium_address: 'Rua das Acácias, 202 - Belo Horizonte/MG',
		responsible_name: balancete.closed_by ?? balancete.generated_by,
		income_items: groupEntries(consolidatedEntries, 'income', id),
		expense_items: groupEntries(consolidatedEntries, 'expense', id),
		account_balances: accountBalances,
		open_payables: openPayables,
		open_receivables: openReceivables,
		delinquency: {
			id: id * 1000 + 950,
			balance_report_id: id,
			overdue_amount_cents: overdueReceivables.reduce((sum, item) => sum + item.amount_cents, 0),
			future_amount_cents: openReceivables
				.filter((item) => item.status !== 'overdue')
				.reduce((sum, item) => sum + item.amount_cents, 0),
			overdue_charges_count: overdueReceivables.length,
			delinquent_units_count: new Set(overdueReceivables.map((item) => item.unit_id)).size,
			delinquency_rate: openReceivables.length ? overdueReceivables.length / openReceivables.length : 0,
			main_pending_items: overdueReceivables.slice(0, 4)
		},
		reconciliation: {
			confirmed_amount_cents: confirmedAmountCents,
			reconciled_amount_cents: reconciledAmountCents,
			confirmed_count: realizedEntries.filter((entry) => entry.status === 'confirmed').length,
			reconciled_count: realizedEntries.filter((entry) => entry.status === 'reconciled').length,
			reconciliation_rate: totalRealizedAmountCents ? reconciledAmountCents / totalRealizedAmountCents : 0
		},
		attachments: realizedEntries.flatMap((entry) => entry.attachments),
		transfers: buildTransfers(realizedEntries),
		realized_entries: realizedEntries,
		ignored_entries: ignoredEntries,
		modeling_notes: [
			'Balancete principal representa o realizado financeiro da competência.',
			'Livro-caixa é a base principal; contas a pagar e a receber entram como anexos de contexto.',
			'Valores monetários devem trafegar em centavos para evitar erro de arredondamento.',
			'Transferências movimentam contas financeiras, mas são neutralizadas no consolidado do condomínio.'
		],
		business_rules: [
			'Somente lançamentos confirmados ou conciliados entram no realizado.',
			'Pendentes, cancelados e estornados não alteram saldo realizado.',
			'Conta a pagar só vira despesa realizada quando gera saída no livro-caixa.',
			'Cobrança só vira receita realizada quando gera entrada no livro-caixa.',
			'Lançamento conciliado deve ser protegido contra edição direta.'
		],
		calculation_rules: [
			'Saldo anterior = saldo final fechado anterior ou saldo inicial das contas no primeiro mês.',
			'Receitas realizadas = créditos confirmados/conciliados do período, exceto transferências.',
			'Despesas realizadas = débitos confirmados/conciliados do período, exceto transferências.',
			'Resultado = receitas realizadas menos despesas realizadas.',
			'Saldo final = saldo anterior mais resultado do período.'
		],
		domain_events: [
			{ id: 1, name: 'cash_flow_entry_confirmed', description: 'Lançamento foi confirmado no caixa.', impact: 'Pode entrar no balancete da competência.' },
			{ id: 2, name: 'cash_flow_entry_reconciled', description: 'Lançamento foi conciliado com extrato.', impact: 'Continua no balancete e ganha maior confiança.' },
			{ id: 3, name: 'payable_paid', description: 'Despesa foi baixada.', impact: 'Gera saída no livro-caixa.' },
			{ id: 4, name: 'charge_paid', description: 'Cobrança foi paga.', impact: 'Gera entrada no livro-caixa.' },
			{ id: 5, name: 'balance_report_closed', description: 'Competência foi fechada.', impact: 'Snapshot passa a ser a fonte do relatório fechado.' },
			{ id: 6, name: 'balance_report_reopened', description: 'Competência foi reaberta com permissão.', impact: 'Permite recalcular e auditar diferenças.' }
		],
		closing_flow: [
			'Gerar prévia a partir do livro-caixa e pendências complementares.',
			'Conferir lançamentos não conciliados e pendências relevantes.',
			'Fechar competência salvando snapshot completo.',
			'Publicar relatório para síndico, conselho e moradores.',
			'Bloquear alteração direta no balancete fechado.'
		],
		after_closing_rules: [
			'Correção comum deve gerar ajuste financeiro na competência seguinte.',
			'Erro material pode reabrir a competência com permissão e registro de auditoria.',
			'Nunca apagar o lançamento original; usar estorno ou ajuste vinculado.'
		],
		consistency_guards: [
			'Não calcular saldo a partir de campos digitados manualmente.',
			'Usar source_type e source_id para rastrear origem de cada lançamento.',
			'Validar par de transferência com saída e entrada do mesmo valor.',
			'Impedir exclusão de lançamento conciliado.',
			'Guardar snapshot_json no fechamento para preservar prestação de contas histórica.'
		],
		examples: [
			'Saldo anterior R$ 20.560,00 + receitas R$ 490,00 - despesas R$ 450,00 = saldo final R$ 20.600,00.',
			'Transferência de R$ 1.200,00 da conta principal para o fundo altera os saldos por conta, mas o consolidado fica em R$ 0,00.',
			'Conta de água pendente de R$ 870,00 aparece em contas a pagar, mas não reduz o saldo realizado.',
			'Cobrança vencida de R$ 535,00 entra na inadimplência, mas não aumenta receita realizada.'
		]
	};

	return balancete.status === 'closed' && balancete.snapshot_json
		? { ...report, ...balancete.snapshot_json }
		: report;
}

export async function closeBalancete(
	condominiumCode: string,
	id: number,
	dueDate: string
): Promise<Balancete> {
	await delay(150);
	const list = getBalancetesForCode(condominiumCode);
	const balancete = list.find((item) => item.id === id);
	if (!balancete) throw new Error('Balancete não encontrado.');

	const report = await buildBalanceReport(condominiumCode, id);
	const now = new Date().toISOString();
	balancete.status = 'closed';
	balancete.previous_balance_cents = report.previous_balance_cents;
	balancete.total_income_cents = report.total_income_cents;
	balancete.total_expense_cents = report.total_expense_cents;
	balancete.period_result_cents = report.period_result_cents;
	balancete.final_balance_cents = report.final_balance_cents;
	balancete.generated_at = now;
	balancete.closed_at = now;
	balancete.closed_by = 'Síndico AP202';
	balancete.due_date = dueDate;
	balancete.snapshot_json = buildSnapshot(report);
	balancete.updated_at = now;

	return { ...balancete };
}

export async function reopenBalancete(condominiumCode: string, id: number): Promise<Balancete> {
	await delay(150);
	const list = getBalancetesForCode(condominiumCode);
	const balancete = list.find((item) => item.id === id);
	if (!balancete) throw new Error('Balancete não encontrado.');

	balancete.status = 'reopened';
	balancete.closed_at = null;
	balancete.closed_by = null;
	balancete.due_date = null;
	balancete.updated_at = new Date().toISOString();

	return { ...balancete };
}
