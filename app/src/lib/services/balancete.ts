import { listLivroCaixaEntries } from '$lib/services/livro-caixa.js';

export type BalanceteStatus = 'open' | 'closed';
export type EntryScope = 'geral' | 'bloco' | 'unidade';
export type RateioMethod = 'fracao' | 'igual' | 'area';

export interface Balancete {
	id: number;
	condominiumCode: string;
	month: string; // "YYYY-MM"
	status: BalanceteStatus;
	created_at: string;
	closed_at: string | null;
	due_date: string | null;
}

export interface BalanceteSummary extends Balancete {
	total_expenses: number;
	total_revenues: number;
	entry_count: number;
}

let nextBalanceteId = 10;

const balancetesStore = new Map<string, Balancete[]>();

function seedForCode(condominiumCode: string): void {
	const march: Balancete = {
		id: nextBalanceteId++,
		condominiumCode,
		month: '2026-03',
		status: 'closed',
		created_at: '2026-03-01T10:00:00Z',
		closed_at: '2026-03-31T23:59:59Z',
		due_date: '2026-04-10'
	};

	const april: Balancete = {
		id: nextBalanceteId++,
		condominiumCode,
		month: '2026-04',
		status: 'open',
		created_at: '2026-04-01T10:00:00Z',
		closed_at: null,
		due_date: null
	};

	balancetesStore.set(condominiumCode, [march, april]);
}

function getBalancetesForCode(condominiumCode: string): Balancete[] {
	if (!balancetesStore.has(condominiumCode)) {
		seedForCode(condominiumCode);
	}
	return balancetesStore.get(condominiumCode)!;
}

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function listBalancetes(condominiumCode: string): Promise<BalanceteSummary[]> {
	await delay(150);
	const list = getBalancetesForCode(condominiumCode);
	const summaries = await Promise.all(
		list.map(async (b) => {
			const entries = await listLivroCaixaEntries(condominiumCode, b.month);
			const total_expenses = entries.filter((e) => e.type === 'debit').reduce((s, e) => s + e.value, 0);
			const total_revenues = entries.filter((e) => e.type === 'credit').reduce((s, e) => s + e.value, 0);
			return { ...b, total_expenses, total_revenues, entry_count: entries.length };
		})
	);
	return summaries.sort((a, b) => b.month.localeCompare(a.month));
}

export async function getBalancete(condominiumCode: string, id: number): Promise<Balancete> {
	await delay(100);
	const list = getBalancetesForCode(condominiumCode);
	const b = list.find((x) => x.id === id);
	if (!b) throw new Error('Balancete não encontrado.');
	return { ...b };
}

export async function createBalancete(condominiumCode: string, month: string): Promise<Balancete> {
	await delay(150);
	const list = getBalancetesForCode(condominiumCode);
	if (list.some((b) => b.month === month)) {
		throw new Error(`Já existe um balancete para ${month}.`);
	}
	const b: Balancete = {
		id: nextBalanceteId++,
		condominiumCode,
		month,
		status: 'open',
		created_at: new Date().toISOString(),
		closed_at: null,
		due_date: null
	};
	list.push(b);
	return { ...b };
}

export async function closeBalancete(condominiumCode: string, id: number, dueDate: string): Promise<Balancete> {
	await delay(150);
	const list = getBalancetesForCode(condominiumCode);
	const b = list.find((x) => x.id === id);
	if (!b) throw new Error('Balancete não encontrado.');
	b.status = 'closed';
	b.closed_at = new Date().toISOString();
	b.due_date = dueDate;
	return { ...b };
}

export async function reopenBalancete(condominiumCode: string, id: number): Promise<Balancete> {
	await delay(150);
	const list = getBalancetesForCode(condominiumCode);
	const b = list.find((x) => x.id === id);
	if (!b) throw new Error('Balancete não encontrado.');
	b.status = 'open';
	b.closed_at = null;
	b.due_date = null;
	return { ...b };
}
