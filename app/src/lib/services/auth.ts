import { browser } from '$app/environment';
import { getClerk, signOutUser } from '$lib/services/clerk.js';

export interface AuthenticatedUser {
	id: number;
	first_name: string;
	last_name: string;
	name: string;
	email: string;
	created_at: string;
}

export interface UserCondominium {
	id: number;
	code: string;
	name: string;
}

export interface CreateCondominiumInput {
	name: string;
	phone: string;
	email: string;
	landArea?: number | null;
	address: {
		street: string;
		number: string;
		neighborhood: string;
		city: string;
		state: string;
		zip_code: string;
	};
	cnpj: {
		cnpj: string;
		razao_social: string;
		descricao?: string;
	};
}

interface ApiErrorResponse {
	error?: string;
	message?: string;
}

/**
 * Recupera o token ativo do Clerk para uso nas chamadas autenticadas do frontend.
 */
export async function getAccessToken(): Promise<string> {
	const clerk = await getClerk();
	const token = await clerk.session?.getToken();

	if (!token) {
		throw new Error('Nao foi possivel identificar a sessao autenticada.');
	}

	return token;
}

async function parseAuthenticatedResponse<T>(response: Response): Promise<T> {
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

	throw new Error(payload?.message ?? 'Nao foi possivel concluir a operacao.');
}

/**
 * Busca o usuario autenticado no backend validando o token emitido pelo Clerk.
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedUser> {
	const token = await getAccessToken();
	const response = await fetch('/api/v1/me', {
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	return parseAuthenticatedResponse<AuthenticatedUser>(response);
}

/**
 * Lista os condominios disponiveis para o usuario autenticado.
 */
export async function listMyCondominiums(): Promise<UserCondominium[]> {
	const token = await getAccessToken();
	const response = await fetch('/api/v1/me/condominiums', {
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	return parseAuthenticatedResponse<UserCondominium[]>(response);
}

export async function createCondominium(input: CreateCondominiumInput): Promise<UserCondominium> {
	const token = await getAccessToken();
	const response = await fetch('/condominiums', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`
		},
		body: JSON.stringify({
			name: input.name,
			phone: input.phone,
			email: input.email,
			land_area: input.landArea ?? null,
			address: {
				street: input.address.street,
				number: input.address.number,
				neighborhood: input.address.neighborhood,
				city: input.address.city,
				state: input.address.state,
				zip_code: input.address.zip_code
			},
			cnpjs: [
				{
					cnpj: input.cnpj.cnpj,
					razao_social: input.cnpj.razao_social,
					descricao: input.cnpj.descricao ?? '',
					principal: true,
					ativo: true
				}
			]
		})
	});

	return parseAuthenticatedResponse<UserCondominium>(response);
}

/**
 * Resolve a rota inicial do usuario autenticado a partir do primeiro condominio disponivel.
 */
export async function getInitialRoute(): Promise<string> {
	const condominiums = await listMyCondominiums();
	const firstCondominium = condominiums[0];

	if (!firstCondominium?.code) {
		return '/';
	}

	return `/g/${firstCondominium.code}`;
}

/**
 * Retorna o estado de autenticacao atual do Clerk no navegador.
 */
export async function isAuthenticated(): Promise<boolean> {
	if (!browser) {
		return false;
	}

	const clerk = await getClerk();
	return Boolean(clerk.isSignedIn && clerk.session);
}

/**
 * Encerra a sessao ativa do Clerk e limpa o acesso ao backend autenticado.
 */
export async function logout(): Promise<void> {
	await signOutUser();
}
