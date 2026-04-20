import { getAccessToken } from '$lib/services/auth.js';

export interface Unit {
	id: number;
	condominium_id: number;
	code: string;
	identifier: string;
	group_type?: string;
	group_name?: string;
	floor?: string;
	description?: string;
	private_area?: number | null;
	ideal_fraction?: number | null;
	active: boolean;
	created_at: string;
	updated_at: string;
}

interface UnitListResponse {
	data: Unit[];
	total: number;
}

interface ApiErrorResponse {
	error?: string;
	message?: string;
}

export interface CreateUnitInput {
	identifier: string;
	group_type: string;
	group_name: string;
	floor: string;
	description: string;
	private_area: number | null;
}

export interface UpdateUnitPrivateAreaInput {
	private_area: number | null;
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
 * Cria uma nova unidade vinculada a um grupo ja cadastrado.
 */
export async function createUnit(condominiumCode: string, input: CreateUnitInput): Promise<Unit> {
	const token = await getAccessToken();
	const response = await fetch(`/api/v1/condominiums/${condominiumCode}/units`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(input)
	});

	return parseApiResponse<Unit>(response);
}

/**
 * Lista as unidades do condominio para apoiar os insights e regras da tela de grupos.
 */
export async function listUnits(condominiumCode: string): Promise<UnitListResponse> {
	const token = await getAccessToken();
	const response = await fetch(`/api/v1/condominiums/${condominiumCode}/units`, {
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	return parseApiResponse<UnitListResponse>(response);
}

/**
 * Busca o detalhe individual de uma unidade.
 */
export async function getUnit(condominiumCode: string, unitId: number): Promise<Unit> {
	const token = await getAccessToken();
	const response = await fetch(`/api/v1/condominiums/${condominiumCode}/units/${unitId}`, {
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	return parseApiResponse<Unit>(response);
}

/**
 * Atualiza somente a area privativa da unidade, conforme contrato da API atual.
 */
export async function updateUnitPrivateArea(
	condominiumCode: string,
	unitId: number,
	input: UpdateUnitPrivateAreaInput
): Promise<Unit> {
	const token = await getAccessToken();
	const response = await fetch(
		`/api/v1/condominiums/${condominiumCode}/units/${unitId}/private-area`,
		{
			method: 'PATCH',
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(input)
		}
	);

	return parseApiResponse<Unit>(response);
}

/**
 * Exclui uma unidade quando permitida pelas regras de negocio do backend.
 */
export async function deleteUnit(condominiumCode: string, unitId: number): Promise<void> {
	const token = await getAccessToken();
	const response = await fetch(`/api/v1/condominiums/${condominiumCode}/units/${unitId}`, {
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
