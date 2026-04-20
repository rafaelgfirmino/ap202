export interface Resident {
	id: number;
	condominiumCode: string;
	unit_id: number | null;
	unit_code: string | null;
	name: string;
	cpf: string;
	email: string;
	phone: string;
	type: 'owner' | 'tenant';
	active: boolean;
	move_in_date: string | null;
	created_at: string;
	updated_at: string;
}

export interface CreateResidentInput {
	unit_id: number | null;
	unit_code: string | null;
	name: string;
	cpf: string;
	email: string;
	phone: string;
	type: 'owner' | 'tenant';
	move_in_date: string | null;
}

export type UpdateResidentInput = CreateResidentInput;

interface ResidentListResponse {
	data: Resident[];
	total: number;
}

let nextId = 100;

const mockStore = new Map<string, Resident[]>();

const SEED_NAMES = [
	'Carlos Alberto Mendes',
	'Ana Paula Rodrigues',
	'Roberto Ferreira da Silva',
	'Mariana Costa Oliveira',
	'João Henrique Santos'
];

const SEED_CPFS = [
	'123.456.789-00',
	'987.654.321-11',
	'456.789.123-22',
	'321.654.987-33',
	'789.123.456-44'
];

const SEED_PHONES = [
	'(11) 98765-4321',
	'(11) 91234-5678',
	'(21) 99876-5432',
	'(21) 98888-7777',
	'(31) 97654-3210'
];

const SEED_UNIT_CODES = ['BL-A-101', 'BL-A-102', 'BL-B-201', 'BL-B-202', 'TW-1-301'];

const SEED_TYPES: Array<'owner' | 'tenant'> = ['owner', 'tenant', 'owner', 'tenant', 'owner'];

const SEED_MOVE_IN_DATES = ['2020-01-15', '2021-03-20', '2019-07-01', '2022-11-10', '2023-05-22'];

function seedData(condominiumCode: string): Resident[] {
	const now = new Date().toISOString();
	return SEED_NAMES.map((name, i) => ({
		id: nextId++,
		condominiumCode,
		unit_id: i + 1,
		unit_code: SEED_UNIT_CODES[i] ?? null,
		name,
		cpf: SEED_CPFS[i] ?? '',
		email: `${name.toLowerCase().split(' ')[0]}@email.com`,
		phone: SEED_PHONES[i] ?? '',
		type: SEED_TYPES[i] ?? 'owner',
		active: true,
		move_in_date: SEED_MOVE_IN_DATES[i] ?? null,
		created_at: now,
		updated_at: now
	}));
}

function getStore(condominiumCode: string): Resident[] {
	if (!mockStore.has(condominiumCode)) {
		mockStore.set(condominiumCode, seedData(condominiumCode));
	}
	return mockStore.get(condominiumCode)!;
}

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function listResidents(condominiumCode: string): Promise<ResidentListResponse> {
	await delay(150);
	const data = getStore(condominiumCode);
	return { data: [...data], total: data.length };
}

export async function getResident(condominiumCode: string, residentId: number): Promise<Resident> {
	await delay(100);
	const store = getStore(condominiumCode);
	const resident = store.find((r) => r.id === residentId);
	if (!resident) {
		throw new Error('Morador não encontrado.');
	}
	return { ...resident };
}

export async function createResident(
	condominiumCode: string,
	input: CreateResidentInput
): Promise<Resident> {
	await delay(200);
	const store = getStore(condominiumCode);
	const now = new Date().toISOString();
	const newResident: Resident = {
		id: nextId++,
		condominiumCode,
		...input,
		active: true,
		created_at: now,
		updated_at: now
	};
	store.push(newResident);
	return { ...newResident };
}

export async function updateResident(
	condominiumCode: string,
	residentId: number,
	input: UpdateResidentInput
): Promise<Resident> {
	await delay(200);
	const store = getStore(condominiumCode);
	const index = store.findIndex((r) => r.id === residentId);
	if (index === -1) {
		throw new Error('Morador não encontrado.');
	}
	const updated: Resident = {
		...store[index]!,
		...input,
		updated_at: new Date().toISOString()
	};
	store[index] = updated;
	return { ...updated };
}

export async function deleteResident(
	condominiumCode: string,
	residentId: number
): Promise<void> {
	await delay(150);
	const store = getStore(condominiumCode);
	const index = store.findIndex((r) => r.id === residentId);
	if (index === -1) {
		throw new Error('Morador não encontrado.');
	}
	store.splice(index, 1);
}
