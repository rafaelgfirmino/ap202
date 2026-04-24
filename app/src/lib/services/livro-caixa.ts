import type { EntryScope, RateioMethod } from './balancete.js';
import { listBankAccounts } from './bank-accounts.js';

export type CashFlowEntryType = 'credit' | 'debit';
export type CashFlowStatus = 'pending' | 'confirmed' | 'reconciled' | 'canceled' | 'reversed';
export type CashFlowSourceType =
	| 'manual'
	| 'charge'
	| 'payment'
	| 'settlement'
	| 'reversal'
	| 'agreement'
	| 'fine'
	| 'interest'
	| 'expense'
	| 'transfer';
export type FinancialCategoryType = 'income' | 'expense';

export interface FinancialCategory {
	id: number;
	condominium_id: number;
	condominiumCode: string;
	name: string;
	type: FinancialCategoryType;
	parent_id: number | null;
	active: boolean;
}

export interface CashFlowAttachment {
	id: number;
	condominium_id: number;
	condominiumCode: string;
	cash_flow_entry_id: number;
	file_name: string;
	file_url: string;
	file_type: string;
	created_at: string;
}

export interface ReconciliationRecord {
	id: number;
	condominium_id: number;
	condominiumCode: string;
	financial_account_id: number;
	cash_flow_entry_id: number;
	bank_transaction_id: string;
	amount_cents: number;
	reconciled_at: string;
	created_at: string;
}

export interface LivroCaixaEntry {
	id: number;
	condominium_id: number;
	condominiumCode: string;
	financial_account_id: number;
	financial_account_name: string;
	type: CashFlowEntryType;
	status: CashFlowStatus;
	category_id: number;
	category: string;
	description: string;
	amount_cents: number;
	due_date: string;
	competence_date: string;
	occurred_at: string | null;
	paid_at: string | null;
	source_type: CashFlowSourceType;
	source_id: number | null;
	notes: string;
	created_by: string;
	created_at: string;
	updated_at: string;
	attachments: CashFlowAttachment[];
	reconciliation_record: ReconciliationRecord | null;
	scope: EntryScope;
	scope_value: string | null;
	rateio_method: RateioMethod | null;
	// Compatibility fields for balancete/rateio screens while the frontend is being migrated.
	value: number;
	date: string;
	bank_account_id: number;
	bank_account_name: string;
	origin: CashFlowSourceType;
	origin_id: number | null;
}

export interface CreateLivroCaixaEntryInput {
	condominiumCode: string;
	date?: string;
	description: string;
	category: string;
	type: CashFlowEntryType;
	value?: number;
	amount_cents?: number;
	bank_account_id?: number;
	financial_account_id?: number;
	bank_account_name?: string;
	origin?: CashFlowSourceType;
	source_type?: CashFlowSourceType;
	origin_id?: number | null;
	source_id?: number | null;
	scope: EntryScope;
	scope_value: string | null;
	rateio_method: RateioMethod | null;
	status?: CashFlowStatus;
	due_date?: string;
	competence_date?: string;
	occurred_at?: string | null;
	paid_at?: string | null;
	notes?: string;
	created_by?: string;
}

export interface CashFlowSummary {
	current_balance_cents: number;
	projected_balance_cents: number;
	period_income_cents: number;
	period_expense_cents: number;
	related_overdue_cents: number;
}

const categoriesStore = new Map<string, FinancialCategory[]>();
const entriesStore = new Map<string, LivroCaixaEntry[]>();
let nextEntryId = 1000;
let nextAttachmentId = 5000;
let nextReconciliationId = 8000;

function toCents(value: number): number {
	return Math.round(value * 100);
}

function toReais(amountCents: number): number {
	return amountCents / 100;
}

function getEffectiveDate(entry: Pick<LivroCaixaEntry, 'paid_at' | 'occurred_at' | 'due_date'>): string {
	return entry.paid_at ?? entry.occurred_at ?? entry.due_date;
}

function seedCategories(condominiumCode: string): void {
	categoriesStore.set(condominiumCode, [
		{ id: 1, condominium_id: 1, condominiumCode, name: 'Taxa condominial', type: 'income', parent_id: null, active: true },
		{ id: 2, condominium_id: 1, condominiumCode, name: 'Aluguel de espaço', type: 'income', parent_id: null, active: true },
		{ id: 3, condominium_id: 1, condominiumCode, name: 'Multa e juros', type: 'income', parent_id: null, active: true },
		{ id: 4, condominium_id: 1, condominiumCode, name: 'Limpeza', type: 'expense', parent_id: null, active: true },
		{ id: 5, condominium_id: 1, condominiumCode, name: 'Água', type: 'expense', parent_id: null, active: true },
		{ id: 6, condominium_id: 1, condominiumCode, name: 'Segurança', type: 'expense', parent_id: null, active: true },
		{ id: 7, condominium_id: 1, condominiumCode, name: 'Energia', type: 'expense', parent_id: null, active: true },
		{ id: 8, condominium_id: 1, condominiumCode, name: 'Obras e melhorias', type: 'expense', parent_id: null, active: true },
		{ id: 9, condominium_id: 1, condominiumCode, name: 'Transferência entre contas', type: 'expense', parent_id: null, active: true }
	]);
}

function getCategoriesForCode(condominiumCode: string): FinancialCategory[] {
	if (!categoriesStore.has(condominiumCode)) {
		seedCategories(condominiumCode);
	}

	return categoriesStore.get(condominiumCode)!;
}

function getCategoryId(condominiumCode: string, categoryName: string, type: CashFlowEntryType): number {
	const categoryType: FinancialCategoryType = type === 'credit' ? 'income' : 'expense';
	const categories = getCategoriesForCode(condominiumCode);
	const category = categories.find((item) => item.name === categoryName && item.type === categoryType);

	return category?.id ?? categories.find((item) => item.type === categoryType)?.id ?? 1;
}

function createAttachment(
	condominiumCode: string,
	entryId: number,
	fileName: string,
	fileType: string
): CashFlowAttachment {
	return {
		id: nextAttachmentId++,
		condominium_id: 1,
		condominiumCode,
		cash_flow_entry_id: entryId,
		file_name: fileName,
		file_url: `/mock/attachments/${entryId}/${fileName}`,
		file_type: fileType,
		created_at: new Date().toISOString()
	};
}

function createReconciliation(
	condominiumCode: string,
	entryId: number,
	financialAccountId: number,
	amountCents: number
): ReconciliationRecord {
	const now = new Date().toISOString();

	return {
		id: nextReconciliationId++,
		condominium_id: 1,
		condominiumCode,
		financial_account_id: financialAccountId,
		cash_flow_entry_id: entryId,
		bank_transaction_id: `OFX-${entryId}`,
		amount_cents: amountCents,
		reconciled_at: now,
		created_at: now
	};
}

function makeEntry(
	condominiumCode: string,
	input: Omit<CreateLivroCaixaEntryInput, 'condominiumCode'> & {
		id?: number;
		category_id?: number;
		attachments?: CashFlowAttachment[];
		reconciliation_record?: ReconciliationRecord | null;
	}
): LivroCaixaEntry {
	const now = new Date().toISOString();
	const amountCents = input.amount_cents ?? toCents(input.value ?? 0);
	const financialAccountId = input.financial_account_id ?? input.bank_account_id ?? 1;
	const sourceType = input.source_type ?? input.origin ?? 'manual';
	const sourceId = input.source_id ?? input.origin_id ?? null;
	const dueDate = input.due_date ?? input.date ?? new Date().toISOString().slice(0, 10);
	const occurredAt = input.occurred_at ?? input.date ?? null;
	const paidAt = input.paid_at ?? (input.status === 'pending' ? null : input.date ?? null);
	const id = input.id ?? nextEntryId++;
	const status = input.status ?? 'confirmed';
	const reconciliationRecord =
		input.reconciliation_record ??
		(status === 'reconciled'
			? createReconciliation(condominiumCode, id, financialAccountId, amountCents)
			: null);
	const entryBase = {
		id,
		condominium_id: 1,
		condominiumCode,
		financial_account_id: financialAccountId,
		financial_account_name: input.bank_account_name ?? 'Conta principal',
		type: input.type,
		status,
		category_id: input.category_id ?? getCategoryId(condominiumCode, input.category, input.type),
		category: input.category,
		description: input.description,
		amount_cents: amountCents,
		due_date: dueDate,
		competence_date: input.competence_date ?? dueDate,
		occurred_at: occurredAt,
		paid_at: paidAt,
		source_type: sourceType,
		source_id: sourceId,
		notes: input.notes ?? '',
		created_by: input.created_by ?? 'Sistema',
		created_at: now,
		updated_at: now,
		attachments: input.attachments ?? [],
		reconciliation_record: reconciliationRecord,
		scope: input.scope,
		scope_value: input.scope_value,
		rateio_method: input.rateio_method
	} satisfies Omit<
		LivroCaixaEntry,
		'value' | 'date' | 'bank_account_id' | 'bank_account_name' | 'origin' | 'origin_id'
	>;

	return {
		...entryBase,
		value: toReais(amountCents),
		date: getEffectiveDate(entryBase),
		bank_account_id: financialAccountId,
		bank_account_name: entryBase.financial_account_name,
		origin: sourceType,
		origin_id: sourceId
	};
}

function seedEntries(condominiumCode: string): void {
	const entries = [
		makeEntry(condominiumCode, {
			description: 'Taxa condominial Apto 101 - Março',
			category: 'Taxa condominial',
			type: 'credit',
			value: 480,
			date: '2026-03-05',
			bank_account_id: 1,
			bank_account_name: 'Conta principal',
			source_type: 'payment',
			source_id: 101,
			scope: 'geral',
			scope_value: null,
			rateio_method: null,
			status: 'reconciled'
		}),
		makeEntry(condominiumCode, {
			description: 'Taxa condominial Apto 201 - Março',
			category: 'Taxa condominial',
			type: 'credit',
			value: 480,
			date: '2026-03-05',
			bank_account_id: 1,
			bank_account_name: 'Conta principal',
			source_type: 'payment',
			source_id: 201,
			scope: 'geral',
			scope_value: null,
			rateio_method: null,
			status: 'confirmed'
		}),
		makeEntry(condominiumCode, {
			description: 'Limpeza das áreas comuns - Março',
			category: 'Limpeza',
			type: 'debit',
			value: 450,
			date: '2026-03-09',
			bank_account_id: 1,
			bank_account_name: 'Conta principal',
			source_type: 'expense',
			source_id: 200,
			scope: 'geral',
			scope_value: null,
			rateio_method: 'fracao',
			status: 'reconciled'
		}),
		makeEntry(condominiumCode, {
			description: 'Conta de água - Março',
			category: 'Água',
			type: 'debit',
			value: 850,
			date: '2026-03-12',
			bank_account_id: 1,
			bank_account_name: 'Conta principal',
			source_type: 'expense',
			source_id: 201,
			scope: 'geral',
			scope_value: null,
			rateio_method: 'fracao',
			status: 'confirmed'
		}),
		makeEntry(condominiumCode, {
			description: 'Aluguel salão de festas',
			category: 'Aluguel de espaço',
			type: 'credit',
			value: 500,
			date: '2026-03-15',
			bank_account_id: 3,
			bank_account_name: 'Conta de obras',
			source_type: 'manual',
			source_id: null,
			scope: 'geral',
			scope_value: null,
			rateio_method: null,
			status: 'confirmed',
			attachments: [createAttachment(condominiumCode, nextEntryId, 'recibo-salao.pdf', 'application/pdf')]
		}),
		makeEntry(condominiumCode, {
			description: 'Portaria e vigilância - Março',
			category: 'Segurança',
			type: 'debit',
			value: 3200,
			date: '2026-03-15',
			bank_account_id: 1,
			bank_account_name: 'Conta principal',
			source_type: 'expense',
			source_id: 202,
			scope: 'geral',
			scope_value: null,
			rateio_method: 'fracao',
			status: 'confirmed'
		}),
		makeEntry(condominiumCode, {
			description: 'Taxa condominial Apto 101 - Abril',
			category: 'Taxa condominial',
			type: 'credit',
			value: 490,
			date: '2026-04-05',
			bank_account_id: 1,
			bank_account_name: 'Conta principal',
			source_type: 'payment',
			source_id: 301,
			scope: 'geral',
			scope_value: null,
			rateio_method: null,
			status: 'confirmed'
		}),
		makeEntry(condominiumCode, {
			description: 'Taxa condominial Apto 202 - Abril',
			category: 'Taxa condominial',
			type: 'credit',
			value: 490,
			date: '2026-04-10',
			bank_account_id: 1,
			bank_account_name: 'Conta principal',
			source_type: 'charge',
			source_id: 302,
			scope: 'geral',
			scope_value: null,
			rateio_method: null,
			status: 'pending',
			due_date: '2026-04-10',
			occurred_at: null,
			paid_at: null
		}),
		makeEntry(condominiumCode, {
			description: 'Limpeza das áreas comuns - Abril',
			category: 'Limpeza',
			type: 'debit',
			value: 450,
			date: '2026-04-09',
			bank_account_id: 1,
			bank_account_name: 'Conta principal',
			source_type: 'expense',
			source_id: 204,
			scope: 'geral',
			scope_value: null,
			rateio_method: 'fracao',
			status: 'confirmed'
		}),
		makeEntry(condominiumCode, {
			description: 'Reserva para pintura da fachada',
			category: 'Transferência entre contas',
			type: 'debit',
			value: 1200,
			date: '2026-04-15',
			bank_account_id: 1,
			bank_account_name: 'Conta principal',
			source_type: 'transfer',
			source_id: 9001,
			scope: 'geral',
			scope_value: null,
			rateio_method: null,
			status: 'confirmed'
		}),
		makeEntry(condominiumCode, {
			description: 'Entrada no fundo de reserva para pintura',
			category: 'Taxa condominial',
			type: 'credit',
			value: 1200,
			date: '2026-04-15',
			bank_account_id: 2,
			bank_account_name: 'Fundo de reserva',
			source_type: 'transfer',
			source_id: 9001,
			scope: 'geral',
			scope_value: null,
			rateio_method: null,
			status: 'confirmed'
		}),
		makeEntry(condominiumCode, {
			description: 'Conta de água - Abril',
			category: 'Água',
			type: 'debit',
			value: 870,
			date: '2026-04-20',
			bank_account_id: 1,
			bank_account_name: 'Conta principal',
			source_type: 'expense',
			source_id: 205,
			scope: 'geral',
			scope_value: null,
			rateio_method: 'fracao',
			status: 'pending',
			due_date: '2026-04-20',
			occurred_at: null,
			paid_at: null
		}),
		makeEntry(condominiumCode, {
			description: 'Estorno de cobrança duplicada Apto 102',
			category: 'Multa e juros',
			type: 'debit',
			value: 45,
			date: '2026-04-22',
			bank_account_id: 1,
			bank_account_name: 'Conta principal',
			source_type: 'reversal',
			source_id: 302,
			scope: 'geral',
			scope_value: null,
			rateio_method: null,
			status: 'reversed'
		})
	];

	entriesStore.set(condominiumCode, entries);
}

function getEntriesForCode(condominiumCode: string): LivroCaixaEntry[] {
	if (!entriesStore.has(condominiumCode)) {
		seedEntries(condominiumCode);
	}

	return entriesStore.get(condominiumCode)!;
}

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function listFinancialCategories(condominiumCode: string): Promise<FinancialCategory[]> {
	await delay(50);
	return [...getCategoriesForCode(condominiumCode)];
}

export async function listLivroCaixaEntries(
	condominiumCode: string,
	month?: string
): Promise<LivroCaixaEntry[]> {
	await delay(100);
	let entries = [...getEntriesForCode(condominiumCode)];

	if (month) {
		entries = entries.filter((entry) => entry.competence_date.startsWith(month));
	}

	return entries.sort((a, b) => getEffectiveDate(b).localeCompare(getEffectiveDate(a)));
}

export async function createLivroCaixaEntry(
	condominiumCode: string,
	entry: CreateLivroCaixaEntryInput
): Promise<LivroCaixaEntry> {
	await delay(150);

	const accounts = await listBankAccounts(condominiumCode);
	const financialAccountId = entry.financial_account_id ?? entry.bank_account_id ?? accounts[0]?.id ?? 1;
	const financialAccount = accounts.find((account) => account.id === financialAccountId);
	const entries = getEntriesForCode(condominiumCode);
	const newEntry = makeEntry(condominiumCode, {
		...entry,
		financial_account_id: financialAccountId,
		bank_account_id: financialAccountId,
		bank_account_name: entry.bank_account_name ?? financialAccount?.name ?? 'Conta principal'
	});

	entries.push(newEntry);

	return { ...newEntry };
}

export async function calculateCashFlowSummary(
	condominiumCode: string,
	accountId?: number | 'all',
	month?: string
): Promise<CashFlowSummary> {
	const [accounts, entries] = await Promise.all([
		listBankAccounts(condominiumCode),
		listLivroCaixaEntries(condominiumCode)
	]);
	const accountIds =
		accountId && accountId !== 'all' ? [accountId] : accounts.map((account) => account.id);
	const initialBalanceCents = accounts
		.filter((account) => accountIds.includes(account.id))
		.reduce((sum, account) => sum + account.initial_balance_cents, 0);
	const scopedEntries = entries.filter((entry) => accountIds.includes(entry.financial_account_id));
	const realizedEntries = scopedEntries.filter((entry) =>
		['confirmed', 'reconciled'].includes(entry.status)
	);
	const pendingEntries = scopedEntries.filter((entry) => entry.status === 'pending');
	const signedAmount = (entry: LivroCaixaEntry): number =>
		entry.type === 'credit' ? entry.amount_cents : -entry.amount_cents;
	const currentBalanceCents =
		initialBalanceCents + realizedEntries.reduce((sum, entry) => sum + signedAmount(entry), 0);
	const projectedBalanceCents =
		currentBalanceCents + pendingEntries.reduce((sum, entry) => sum + signedAmount(entry), 0);
	const periodEntries = month
		? scopedEntries.filter((entry) => entry.competence_date.startsWith(month))
		: scopedEntries;
	const periodIncomeCents = periodEntries
		.filter((entry) => entry.type === 'credit' && ['confirmed', 'reconciled'].includes(entry.status))
		.reduce((sum, entry) => sum + entry.amount_cents, 0);
	const periodExpenseCents = periodEntries
		.filter((entry) => entry.type === 'debit' && ['confirmed', 'reconciled'].includes(entry.status))
		.reduce((sum, entry) => sum + entry.amount_cents, 0);
	const relatedOverdueCents = pendingEntries
		.filter((entry) => entry.type === 'credit' && entry.due_date < new Date().toISOString().slice(0, 10))
		.reduce((sum, entry) => sum + entry.amount_cents, 0);

	return {
		current_balance_cents: currentBalanceCents,
		projected_balance_cents: projectedBalanceCents,
		period_income_cents: periodIncomeCents,
		period_expense_cents: periodExpenseCents,
		related_overdue_cents: relatedOverdueCents
	};
}
