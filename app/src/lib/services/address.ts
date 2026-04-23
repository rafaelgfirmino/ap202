import { getAccessToken } from '$lib/services/auth.js';

export interface ZipCodeAddress {
	zip_code: string;
	street: string;
	neighborhood: string;
	city: string;
	state: string;
}

interface ApiErrorResponse {
	error?: string;
	message?: string;
}

async function parseAddressResponse<T>(response: Response): Promise<T> {
	if (response.ok) {
		return (await response.json()) as T;
	}

	let payload: ApiErrorResponse | null = null;

	try {
		payload = (await response.json()) as ApiErrorResponse;
	} catch {
		payload = null;
	}

	if (response.status === 401) {
		throw new Error(payload?.message ?? 'Sua sessao expirou. Entre novamente.');
	}

	throw new Error(payload?.message ?? 'Nao foi possivel buscar o CEP.');
}

export async function lookupAddressByZipCode(zipCode: string): Promise<ZipCodeAddress> {
	const token = await getAccessToken();
	const response = await fetch(`/api/v1/address/zip-code/${zipCode}`, {
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	return parseAddressResponse<ZipCodeAddress>(response);
}
