export type EntryKind = 'expense' | 'revenue';
export type EntryScope = 'geral' | 'bloco' | 'unidade';
export type RateioMethod = 'fracao' | 'igual' | 'area';
export type BalanceteStatus = 'open' | 'closed';

export interface Balancete {
	id: number;
	condominiumCode: string;
	month: string; // "YYYY-MM"
	status: BalanceteStatus;
	created_at: string;
	closed_at: string | null;
	due_date: string | null; // vencimento dos boletos, definido no fechamento
}

export interface BalanceteEntry {
	id: number;
	balancete_id: number;
	condominiumCode: string;
	kind: EntryKind;
	scope: EntryScope;
	scope_value: string | null;
	category: string;
	description: string;
	total_value: number;
	rateio_method: RateioMethod | null;
	due_date: string | null;
	created_at: string;
}

export interface BalanceteSummary extends Balancete {
	total_expenses: number;
	total_revenues: number;
	entry_count: number;
}

export interface CreateEntryInput {
	kind: EntryKind;
	scope: EntryScope;
	scope_value: string | null;
	category: string;
	description: string;
	total_value: number;
	rateio_method: RateioMethod | null;
	due_date: string | null;
}

let nextBalanceteId = 10;
let nextEntryId = 100;

const balancetesStore = new Map<string, Balancete[]>();
const entriesStore = new Map<number, BalanceteEntry[]>();

function seedForCode(condominiumCode: string): void {
	const now = new Date().toISOString();

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

	entriesStore.set(march.id, [
		{ id: nextEntryId++, balancete_id: march.id, condominiumCode, kind: 'expense', scope: 'geral', scope_value: null, category: 'Manutenção', description: 'Manutenção preventiva do elevador', total_value: 1200, rateio_method: 'fracao', due_date: '2026-03-15', created_at: now },
		{ id: nextEntryId++, balancete_id: march.id, condominiumCode, kind: 'expense', scope: 'geral', scope_value: null, category: 'Limpeza', description: 'Serviço de limpeza das áreas comuns', total_value: 450, rateio_method: 'igual', due_date: '2026-03-15', created_at: now },
		{ id: nextEntryId++, balancete_id: march.id, condominiumCode, kind: 'expense', scope: 'geral', scope_value: null, category: 'Segurança', description: 'Portaria e vigilância', total_value: 3200, rateio_method: 'fracao', due_date: '2026-03-15', created_at: now },
		{ id: nextEntryId++, balancete_id: march.id, condominiumCode, kind: 'revenue', scope: 'geral', scope_value: null, category: 'Aluguel', description: 'Aluguel do salão de festas', total_value: 500, rateio_method: null, due_date: null, created_at: now }
	]);

	entriesStore.set(april.id, [
		{ id: nextEntryId++, balancete_id: april.id, condominiumCode, kind: 'expense', scope: 'geral', scope_value: null, category: 'Paisagismo', description: 'Jardinagem e áreas verdes', total_value: 280, rateio_method: 'fracao', due_date: '2026-04-15', created_at: now },
		{ id: nextEntryId++, balancete_id: april.id, condominiumCode, kind: 'revenue', scope: 'geral', scope_value: null, category: 'Multa', description: 'Multa por uso irregular da área comum', total_value: 120, rateio_method: null, due_date: null, created_at: now }
	]);
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
	return [...list]
		.sort((a, b) => b.month.localeCompare(a.month))
		.map((b) => {
			const entries = entriesStore.get(b.id) ?? [];
			return {
				...b,
				total_expenses: entries.filter((e) => e.kind === 'expense').reduce((s, e) => s + e.total_value, 0),
				total_revenues: entries.filter((e) => e.kind === 'revenue').reduce((s, e) => s + e.total_value, 0),
				entry_count: entries.length
			};
		});
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
	entriesStore.set(b.id, []);
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

export async function listEntries(condominiumCode: string, balanceteId: number): Promise<BalanceteEntry[]> {
	await delay(100);
	return [...(entriesStore.get(balanceteId) ?? [])].sort((a, b) => b.id - a.id);
}

export async function createEntry(
	condominiumCode: string,
	balanceteId: number,
	input: CreateEntryInput
): Promise<BalanceteEntry> {
	await delay(200);
	const list = getBalancetesForCode(condominiumCode);
	const b = list.find((x) => x.id === balanceteId);
	if (!b) throw new Error('Balancete não encontrado.');
	if (b.status === 'closed') throw new Error('Este balancete está fechado e não aceita novos lançamentos.');
	const entries = entriesStore.get(balanceteId) ?? [];
	const entry: BalanceteEntry = {
		id: nextEntryId++,
		balancete_id: balanceteId,
		condominiumCode,
		...input,
		created_at: new Date().toISOString()
	};
	entries.push(entry);
	entriesStore.set(balanceteId, entries);
	return { ...entry };
}

export async function updateEntry(
	condominiumCode: string,
	balanceteId: number,
	entryId: number,
	input: CreateEntryInput
): Promise<BalanceteEntry> {
	await delay(200);
	const list = getBalancetesForCode(condominiumCode);
	const b = list.find((x) => x.id === balanceteId);
	if (!b) throw new Error('Balancete não encontrado.');
	if (b.status === 'closed') throw new Error('Este balancete está fechado e não pode ser editado.');
	const entries = entriesStore.get(balanceteId) ?? [];
	const idx = entries.findIndex((e) => e.id === entryId);
	if (idx === -1) throw new Error('Lançamento não encontrado.');
	const existing = entries[idx]!;
	const updated: BalanceteEntry = { ...existing, ...input };
	entries[idx] = updated;
	return { ...updated };
}

export async function deleteEntry(
	condominiumCode: string,
	balanceteId: number,
	entryId: number
): Promise<void> {
	await delay(150);
	const list = getBalancetesForCode(condominiumCode);
	const b = list.find((x) => x.id === balanceteId);
	if (!b) throw new Error('Balancete não encontrado.');
	if (b.status === 'closed') throw new Error('Não é possível excluir lançamentos de um balancete fechado.');
	const entries = entriesStore.get(balanceteId) ?? [];
	const idx = entries.findIndex((e) => e.id === entryId);
	if (idx === -1) throw new Error('Lançamento não encontrado.');
	entries.splice(idx, 1);
}
