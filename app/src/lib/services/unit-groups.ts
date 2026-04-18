import { getAccessToken } from '$lib/services/auth.js';

export interface UnitGroup {
	id: number;
	condominium_id: number;
	group_type: string;
	name: string;
	floors?: number;
	active: boolean;
	created_at: string;
}

export interface CreateUnitGroupInput {
	group_type: string;
	name: string;
	floors: number | null;
}

export interface UpdateUnitGroupInput {
	group_type: string;
	name: string;
	floors: number | null;
}

interface UnitGroupListResponse {
	data: UnitGroup[];
	total: number;
}

interface ApiErrorResponse {
	error?: string;
	message?: string;
}

async function parseApiResponse<T>(response: Response): Promise<T> {
	if (response.ok) {
		return (await response.json()) as T;
	}

	let payload: ApiErrorResponse | null = null;

	try {
		payload = (await response.json()) as ApiErrorResponse;
	} catch {
		payload = null;
	}

	throw new Error(payload?.message ?? 'Nao foi possivel concluir a operacao.');
}

/**
 * Lista os grupos cadastrados para um condominio especifico.
 */
export async function listUnitGroups(condominiumCode: string): Promise<UnitGroupListResponse> {
	const token = await getAccessToken();
	const response = await fetch(`/api/v1/condominiums/${condominiumCode}/unit-groups`, {
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	return parseApiResponse<UnitGroupListResponse>(response);
}

/**
 * Cria um novo grupo respeitando o contrato da API Go existente.
 */
export async function createUnitGroup(
	condominiumCode: string,
	input: CreateUnitGroupInput
): Promise<UnitGroup> {
	const token = await getAccessToken();
	const response = await fetch(`/api/v1/condominiums/${condominiumCode}/unit-groups`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			group_type: input.group_type,
			name: input.name,
			floors: input.floors
		})
	});

	return parseApiResponse<UnitGroup>(response);
}

/**
 * Atualiza um grupo existente usando o contrato da API Go.
 */
export async function updateUnitGroup(
	condominiumCode: string,
	groupId: number,
	input: UpdateUnitGroupInput
): Promise<UnitGroup> {
	const token = await getAccessToken();
	const response = await fetch(`/api/v1/condominiums/${condominiumCode}/unit-groups/${groupId}`, {
		method: 'PUT',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			group_type: input.group_type,
			name: input.name,
			floors: input.floors
		})
	});

	return parseApiResponse<UnitGroup>(response);
}

/**
 * Exclui um grupo quando permitido pelo backend.
 */
export async function deleteUnitGroup(condominiumCode: string, groupId: number): Promise<void> {
	const token = await getAccessToken();
	const response = await fetch(`/api/v1/condominiums/${condominiumCode}/unit-groups/${groupId}`, {
		method: 'DELETE',
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	if (response.status === 204) {
		return;
	}

	await parseApiResponse(response);
}
