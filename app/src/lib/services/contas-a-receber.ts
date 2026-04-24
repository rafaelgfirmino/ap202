export type ReceivableStatus = 'open' | 'pending' | 'overdue' | 'paid' | 'canceled';
export type ReceivableSourceType = 'condominium_fee' | 'extra_fee' | 'agreement' | 'fine' | 'interest' | 'other';

export interface ContaAReceber {
	id: number;
	condominium_id: number;
	condominiumCode: string;
	unit_id: number;
	unit_label: string;
	resident_name: string;
	competence_month: string;
	due_date: string;
	amount_cents: number;
	status: ReceivableStatus;
	source_type: ReceivableSourceType;
	created_at: string;
}

const receivablesStore = new Map<string, ContaAReceber[]>();

function seedReceivables(condominiumCode: string): void {
	const now = new Date().toISOString();

	receivablesStore.set(condominiumCode, [
		{
			id: 301,
			condominium_id: 1,
			condominiumCode,
			unit_id: 101,
			unit_label: 'Apto 101',
			resident_name: 'Marina Alves',
			competence_month: '2026-04',
			due_date: '2026-04-10',
			amount_cents: 49000,
			status: 'paid',
			source_type: 'condominium_fee',
			created_at: now
		},
		{
			id: 302,
			condominium_id: 1,
			condominiumCode,
			unit_id: 102,
			unit_label: 'Apto 102',
			resident_name: 'Carlos Mendes',
			competence_month: '2026-04',
			due_date: '2026-04-10',
			amount_cents: 49000,
			status: 'overdue',
			source_type: 'condominium_fee',
			created_at: now
		},
		{
			id: 303,
			condominium_id: 1,
			condominiumCode,
			unit_id: 201,
			unit_label: 'Apto 201',
			resident_name: 'Renata Lima',
			competence_month: '2026-04',
			due_date: '2026-04-20',
			amount_cents: 25000,
			status: 'open',
			source_type: 'extra_fee',
			created_at: now
		},
		{
			id: 304,
			condominium_id: 1,
			condominiumCode,
			unit_id: 202,
			unit_label: 'Apto 202',
			resident_name: 'João Batista',
			competence_month: '2026-04',
			due_date: '2026-04-05',
			amount_cents: 53500,
			status: 'overdue',
			source_type: 'condominium_fee',
			created_at: now
		},
		{
			id: 305,
			condominium_id: 1,
			condominiumCode,
			unit_id: 301,
			unit_label: 'Apto 301',
			resident_name: 'Patrícia Rocha',
			competence_month: '2026-05',
			due_date: '2026-05-10',
			amount_cents: 49000,
			status: 'pending',
			source_type: 'condominium_fee',
			created_at: now
		}
	]);
}

function getReceivablesForCode(condominiumCode: string): ContaAReceber[] {
	if (!receivablesStore.has(condominiumCode)) {
		seedReceivables(condominiumCode);
	}

	return receivablesStore.get(condominiumCode)!;
}

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function listContasAReceber(
	condominiumCode: string,
	filters?: { month?: string; statuses?: ReceivableStatus[] }
): Promise<ContaAReceber[]> {
	await delay(90);
	let receivables = [...getReceivablesForCode(condominiumCode)];

	if (filters?.month) {
		receivables = receivables.filter((item) => item.competence_month === filters.month);
	}

	if (filters?.statuses?.length) {
		receivables = receivables.filter((item) => filters.statuses!.includes(item.status));
	}

	return receivables.sort((a, b) => a.due_date.localeCompare(b.due_date));
}
