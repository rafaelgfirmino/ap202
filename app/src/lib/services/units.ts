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
