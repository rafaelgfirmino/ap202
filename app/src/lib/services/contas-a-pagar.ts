import { createLivroCaixaEntry } from './livro-caixa.js';
import { getCondominiumSettings } from './condominium-settings.js';
import { listBankAccounts } from './bank-accounts.js';

export type ContaStatus = 'pending' | 'paid';
export type EntryScope = 'geral' | 'bloco' | 'unidade';

export interface ContaAPagar {
	id: number;
	condominiumCode: string;
	description: string;
	category: string;
	value: number;
	due_date: string; // "YYYY-MM-DD"
	status: ContaStatus;
	payment_date: string | null;
	bank_account_id: number | null;
	scope: EntryScope;
	scope_value: string | null;
	created_at: string;
}

export interface CreateContaInput {
	description: string;
	category: string;
	value: number;
	due_date: string;
	scope: EntryScope;
	scope_value: string | null;
}

export interface MarkAsPaidInput {
	payment_date: string;
	bank_account_id: number;
}

const contasStore = new Map<string, ContaAPagar[]>();
let nextContaId = 200;

function seedContas(condominiumCode: string): void {
	const now = new Date().toISOString();

	// Reset nextContaId for deterministic seed ids
	nextContaId = 209;

	const entries: ContaAPagar[] = [
		// March 2026 — all paid
		{
			id: 200,
			condominiumCode,
			description: 'Limpeza das áreas comuns - Março',
			category: 'Limpeza',
			value: 450,
			due_date: '2026-03-10',
			status: 'paid',
			payment_date: '2026-03-09',
			bank_account_id: 1,
			scope: 'geral',
			scope_value: null,
			created_at: now
		},
		{
			id: 201,
			condominiumCode,
			description: 'Conta de água - Março',
			category: 'Serviços',
			value: 850,
			due_date: '2026-03-15',
			status: 'paid',
			payment_date: '2026-03-12',
			bank_account_id: 1,
			scope: 'geral',
			scope_value: null,
			created_at: now
		},
		{
			id: 202,
			condominiumCode,
			description: 'Portaria e vigilância - Março',
			category: 'Segurança',
			value: 3200,
			due_date: '2026-03-15',
			status: 'paid',
			payment_date: '2026-03-15',
			bank_account_id: 1,
			scope: 'geral',
			scope_value: null,
			created_at: now
		},
		{
			id: 203,
			condominiumCode,
			description: 'Conta de luz - Março',
			category: 'Serviços',
			value: 1200,
			due_date: '2026-03-20',
			status: 'paid',
			payment_date: '2026-03-18',
			bank_account_id: 1,
			scope: 'geral',
			scope_value: null,
			created_at: now
		},
		// April 2026
		{
			id: 204,
			condominiumCode,
			description: 'Limpeza das áreas comuns - Abril',
			category: 'Limpeza',
			value: 450,
			due_date: '2026-04-10',
			status: 'paid',
			payment_date: '2026-04-09',
			bank_account_id: 1,
			scope: 'geral',
			scope_value: null,
			created_at: now
		},
		{
			id: 205,
			condominiumCode,
			description: 'Conta de água - Abril',
			category: 'Serviços',
			value: 870,
			due_date: '2026-04-15',
			status: 'paid',
			payment_date: '2026-04-12',
			bank_account_id: 1,
			scope: 'geral',
			scope_value: null,
			created_at: now
		},
		{
			id: 206,
			condominiumCode,
			description: 'Portaria e vigilância - Abril',
			category: 'Segurança',
			value: 3200,
			due_date: '2026-04-15',
			status: 'pending',
			payment_date: null,
			bank_account_id: null,
			scope: 'geral',
			scope_value: null,
			created_at: now
		},
		{
			id: 207,
			condominiumCode,
			description: 'Conta de luz - Abril',
			category: 'Serviços',
			value: 1200,
			due_date: '2026-04-20',
			status: 'pending',
			payment_date: null,
			bank_account_id: null,
			scope: 'geral',
			scope_value: null,
			created_at: now
		},
		{
			id: 208,
			condominiumCode,
			description: 'Manutenção do elevador - Abril',
			category: 'Manutenção',
			value: 1800,
			due_date: '2026-04-25',
			status: 'pending',
			payment_date: null,
			bank_account_id: null,
			scope: 'geral',
			scope_value: null,
			created_at: now
		}
	];

	contasStore.set(condominiumCode, entries);
}

function getContasForCode(condominiumCode: string): ContaAPagar[] {
	if (!contasStore.has(condominiumCode)) {
		seedContas(condominiumCode);
	}
	return contasStore.get(condominiumCode)!;
}

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function listContasAPagar(
	condominiumCode: string,
	filters?: { status?: ContaStatus; month?: string }
): Promise<ContaAPagar[]> {
	await delay(150);
	let entries = [...getContasForCode(condominiumCode)];

	if (filters?.status) {
		entries = entries.filter((e) => e.status === filters.status);
	}
	if (filters?.month) {
		entries = entries.filter((e) => e.due_date.startsWith(filters.month!));
	}

	return entries.sort((a, b) => b.due_date.localeCompare(a.due_date));
}

export async function getContaAPagar(condominiumCode: string, id: number): Promise<ContaAPagar> {
	await delay(100);
	const entries = getContasForCode(condominiumCode);
	const conta = entries.find((e) => e.id === id);
	if (!conta) throw new Error('Conta a pagar não encontrada.');
	return { ...conta };
}

export async function createConta(
	condominiumCode: string,
	input: CreateContaInput
): Promise<ContaAPagar> {
	await delay(200);
	const entries = getContasForCode(condominiumCode);
	const conta: ContaAPagar = {
		id: nextContaId++,
		condominiumCode,
		description: input.description,
		category: input.category,
		value: input.value,
		due_date: input.due_date,
		status: 'pending',
		payment_date: null,
		bank_account_id: null,
		scope: input.scope,
		scope_value: input.scope_value,
		created_at: new Date().toISOString()
	};
	entries.push(conta);
	return { ...conta };
}

export async function updateConta(
	condominiumCode: string,
	id: number,
	input: CreateContaInput
): Promise<ContaAPagar> {
	await delay(200);
	const entries = getContasForCode(condominiumCode);
	const idx = entries.findIndex((e) => e.id === id);
	if (idx === -1) throw new Error('Conta a pagar não encontrada.');
	const existing = entries[idx]!;
	const updated: ContaAPagar = {
		...existing,
		description: input.description,
		category: input.category,
		value: input.value,
		due_date: input.due_date,
		scope: input.scope,
		scope_value: input.scope_value
	};
	entries[idx] = updated;
	return { ...updated };
}

export async function deleteConta(condominiumCode: string, id: number): Promise<void> {
	await delay(150);
	const entries = getContasForCode(condominiumCode);
	const idx = entries.findIndex((e) => e.id === id);
	if (idx === -1) throw new Error('Conta a pagar não encontrada.');
	if (entries[idx]!.status === 'paid') {
		throw new Error('Não é possível excluir uma conta já paga.');
	}
	entries.splice(idx, 1);
}

export async function markAsPaid(
	condominiumCode: string,
	id: number,
	input: MarkAsPaidInput
): Promise<ContaAPagar> {
	await delay(200);

	const entries = getContasForCode(condominiumCode);
	const idx = entries.findIndex((e) => e.id === id);
	if (idx === -1) throw new Error('Conta a pagar não encontrada.');
	const conta = entries[idx]!;

	const [bankAccounts, settings] = await Promise.all([
		listBankAccounts(condominiumCode),
		getCondominiumSettings(condominiumCode)
	]);

	const bankAccount = bankAccounts.find((b) => b.id === input.bank_account_id);
	if (!bankAccount) throw new Error('Conta bancária não encontrada.');

	await createLivroCaixaEntry(condominiumCode, {
		condominiumCode,
		date: input.payment_date,
		description: conta.description,
		category: conta.category,
		type: 'saida',
		value: conta.value,
		bank_account_id: input.bank_account_id,
		bank_account_name: bankAccount.name,
		origin: 'conta_a_pagar',
		origin_id: conta.id,
		scope: conta.scope,
		scope_value: conta.scope_value,
		rateio_method: settings.rateio_method
	});

	const updated: ContaAPagar = {
		...conta,
		status: 'paid',
		payment_date: input.payment_date,
		bank_account_id: input.bank_account_id
	};
	entries[idx] = updated;
	return { ...updated };
}
