import type { RateioMethod, EntryScope } from './balancete.js';

export type LCEntryType = 'entrada' | 'saida';
export type LCOrigin = 'conta_a_pagar' | 'pagamento_condomino' | 'manual';

export interface LivroCaixaEntry {
	id: number;
	condominiumCode: string;
	date: string; // "YYYY-MM-DD"
	description: string;
	category: string;
	type: LCEntryType;
	value: number;
	bank_account_id: number;
	bank_account_name: string;
	origin: LCOrigin;
	origin_id: number | null;
	scope: EntryScope;
	scope_value: string | null;
	rateio_method: RateioMethod | null;
	created_at: string;
}

const livroCaixaStore = new Map<string, LivroCaixaEntry[]>();
let nextLCId = 1000;

function seedLC(condominiumCode: string): void {
	const now = new Date().toISOString();

	const entries: LivroCaixaEntry[] = [
		// March 2026 — saídas
		{
			id: nextLCId++,
			condominiumCode,
			date: '2026-03-09',
			description: 'Limpeza das áreas comuns',
			category: 'Limpeza',
			type: 'saida',
			value: 450,
			bank_account_id: 1,
			bank_account_name: 'Conta Corrente BB',
			origin: 'conta_a_pagar',
			origin_id: null,
			scope: 'geral',
			scope_value: null,
			rateio_method: 'fracao',
			created_at: now
		},
		{
			id: nextLCId++,
			condominiumCode,
			date: '2026-03-12',
			description: 'Conta de água - Março',
			category: 'Serviços',
			type: 'saida',
			value: 850,
			bank_account_id: 1,
			bank_account_name: 'Conta Corrente BB',
			origin: 'conta_a_pagar',
			origin_id: null,
			scope: 'geral',
			scope_value: null,
			rateio_method: 'fracao',
			created_at: now
		},
		{
			id: nextLCId++,
			condominiumCode,
			date: '2026-03-15',
			description: 'Portaria e vigilância - Março',
			category: 'Segurança',
			type: 'saida',
			value: 3200,
			bank_account_id: 1,
			bank_account_name: 'Conta Corrente BB',
			origin: 'conta_a_pagar',
			origin_id: null,
			scope: 'geral',
			scope_value: null,
			rateio_method: 'fracao',
			created_at: now
		},
		{
			id: nextLCId++,
			condominiumCode,
			date: '2026-03-18',
			description: 'Conta de luz - Março',
			category: 'Serviços',
			type: 'saida',
			value: 1200,
			bank_account_id: 1,
			bank_account_name: 'Conta Corrente BB',
			origin: 'conta_a_pagar',
			origin_id: null,
			scope: 'geral',
			scope_value: null,
			rateio_method: 'fracao',
			created_at: now
		},

		// March 2026 — entradas
		{
			id: nextLCId++,
			condominiumCode,
			date: '2026-03-05',
			description: 'Taxa cond. Apto 101 - Março',
			category: 'Taxa condominial',
			type: 'entrada',
			value: 480,
			bank_account_id: 1,
			bank_account_name: 'Conta Corrente BB',
			origin: 'pagamento_condomino',
			origin_id: null,
			scope: 'geral',
			scope_value: null,
			rateio_method: null,
			created_at: now
		},
		{
			id: nextLCId++,
			condominiumCode,
			date: '2026-03-05',
			description: 'Taxa cond. Apto 201 - Março',
			category: 'Taxa condominial',
			type: 'entrada',
			value: 480,
			bank_account_id: 1,
			bank_account_name: 'Conta Corrente BB',
			origin: 'pagamento_condomino',
			origin_id: null,
			scope: 'geral',
			scope_value: null,
			rateio_method: null,
			created_at: now
		},
		{
			id: nextLCId++,
			condominiumCode,
			date: '2026-03-06',
			description: 'Taxa cond. Apto 102 - Março',
			category: 'Taxa condominial',
			type: 'entrada',
			value: 480,
			bank_account_id: 1,
			bank_account_name: 'Conta Corrente BB',
			origin: 'pagamento_condomino',
			origin_id: null,
			scope: 'geral',
			scope_value: null,
			rateio_method: null,
			created_at: now
		},
		{
			id: nextLCId++,
			condominiumCode,
			date: '2026-03-10',
			description: 'Taxa cond. Apto 301 - Março',
			category: 'Taxa condominial',
			type: 'entrada',
			value: 480,
			bank_account_id: 1,
			bank_account_name: 'Conta Corrente BB',
			origin: 'pagamento_condomino',
			origin_id: null,
			scope: 'geral',
			scope_value: null,
			rateio_method: null,
			created_at: now
		},
		{
			id: nextLCId++,
			condominiumCode,
			date: '2026-03-10',
			description: 'Taxa cond. Apto 202 - Março',
			category: 'Taxa condominial',
			type: 'entrada',
			value: 480,
			bank_account_id: 1,
			bank_account_name: 'Conta Corrente BB',
			origin: 'pagamento_condomino',
			origin_id: null,
			scope: 'geral',
			scope_value: null,
			rateio_method: null,
			created_at: now
		},
		{
			id: nextLCId++,
			condominiumCode,
			date: '2026-03-15',
			description: 'Aluguel salão de festas',
			category: 'Aluguel',
			type: 'entrada',
			value: 500,
			bank_account_id: 2,
			bank_account_name: 'Caixa Física',
			origin: 'manual',
			origin_id: null,
			scope: 'geral',
			scope_value: null,
			rateio_method: null,
			created_at: now
		},

		// April 2026 — saídas
		{
			id: nextLCId++,
			condominiumCode,
			date: '2026-04-09',
			description: 'Limpeza das áreas comuns - Abril',
			category: 'Limpeza',
			type: 'saida',
			value: 450,
			bank_account_id: 1,
			bank_account_name: 'Conta Corrente BB',
			origin: 'conta_a_pagar',
			origin_id: null,
			scope: 'geral',
			scope_value: null,
			rateio_method: 'fracao',
			created_at: now
		},
		{
			id: nextLCId++,
			condominiumCode,
			date: '2026-04-12',
			description: 'Conta de água - Abril',
			category: 'Serviços',
			type: 'saida',
			value: 870,
			bank_account_id: 1,
			bank_account_name: 'Conta Corrente BB',
			origin: 'conta_a_pagar',
			origin_id: null,
			scope: 'geral',
			scope_value: null,
			rateio_method: 'fracao',
			created_at: now
		},

		// April 2026 — entradas
		{
			id: nextLCId++,
			condominiumCode,
			date: '2026-04-05',
			description: 'Taxa cond. Apto 101 - Abril',
			category: 'Taxa condominial',
			type: 'entrada',
			value: 490,
			bank_account_id: 1,
			bank_account_name: 'Conta Corrente BB',
			origin: 'pagamento_condomino',
			origin_id: null,
			scope: 'geral',
			scope_value: null,
			rateio_method: null,
			created_at: now
		},
		{
			id: nextLCId++,
			condominiumCode,
			date: '2026-04-05',
			description: 'Taxa cond. Apto 201 - Abril',
			category: 'Taxa condominial',
			type: 'entrada',
			value: 490,
			bank_account_id: 1,
			bank_account_name: 'Conta Corrente BB',
			origin: 'pagamento_condomino',
			origin_id: null,
			scope: 'geral',
			scope_value: null,
			rateio_method: null,
			created_at: now
		},
		{
			id: nextLCId++,
			condominiumCode,
			date: '2026-04-06',
			description: 'Taxa cond. Apto 102 - Abril',
			category: 'Taxa condominial',
			type: 'entrada',
			value: 490,
			bank_account_id: 1,
			bank_account_name: 'Conta Corrente BB',
			origin: 'pagamento_condomino',
			origin_id: null,
			scope: 'geral',
			scope_value: null,
			rateio_method: null,
			created_at: now
		}
	];

	livroCaixaStore.set(condominiumCode, entries);
}

function getLivroCaixaForCode(condominiumCode: string): LivroCaixaEntry[] {
	if (!livroCaixaStore.has(condominiumCode)) {
		seedLC(condominiumCode);
	}
	return livroCaixaStore.get(condominiumCode)!;
}

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function listLivroCaixaEntries(
	condominiumCode: string,
	month?: string
): Promise<LivroCaixaEntry[]> {
	await delay(100);
	let entries = [...getLivroCaixaForCode(condominiumCode)];
	if (month) {
		entries = entries.filter((e) => e.date.startsWith(month));
	}
	return entries.sort((a, b) => b.date.localeCompare(a.date));
}

export async function createLivroCaixaEntry(
	condominiumCode: string,
	entry: Omit<LivroCaixaEntry, 'id' | 'created_at'>
): Promise<LivroCaixaEntry> {
	await delay(150);
	const entries = getLivroCaixaForCode(condominiumCode);
	const newEntry: LivroCaixaEntry = {
		...entry,
		id: nextLCId++,
		created_at: new Date().toISOString()
	};
	entries.push(newEntry);
	return { ...newEntry };
}
