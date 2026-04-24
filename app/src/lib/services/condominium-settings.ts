import { browser } from '$app/environment';
import type { RateioMethod } from '$lib/services/balancete.js';
import { getAccessToken } from '$lib/services/auth.js';
import { getUserDashboardData } from '$lib/services/users.js';

export type CondominiumFeeRule = 'equal' | 'proportional';

export interface CondominiumSettings {
	condominiumCode: string;
	rateio_method: RateioMethod;
}

export interface CondominiumAddress {
	street: string;
	number: string;
	neighborhood: string;
	city: string;
	state: string;
	zip_code: string;
}

export interface CondominiumGeneralSettings {
	id: number;
	code: string;
	name: string;
	phone: string;
	email: string;
	fee_rule: CondominiumFeeRule;
	rateio_method: RateioMethod;
	land_area: number | null;
	built_area_sum: number;
	address: CondominiumAddress;
	syndic_name: string | null;
	syndic_email: string | null;
}

interface CondominiumApiResponse {
	id: number;
	code: string;
	name: string;
	phone: string;
	email: string;
	fee_rule: CondominiumFeeRule;
	land_area: number | null;
	built_area_sum: number;
	address: CondominiumAddress;
}

interface ApiErrorResponse {
	error?: string;
	message?: string;
}

function mapFeeRuleToRateioMethod(feeRule: CondominiumFeeRule): RateioMethod {
	return feeRule === 'proportional' ? 'fracao' : 'igual';
}

async function parseResponse<T>(response: Response): Promise<T> {
	if (response.ok) {
		return (await response.json()) as T;
	}

	let payload: ApiErrorResponse | null = null;

	try {
		payload = (await response.json()) as ApiErrorResponse;
	} catch {
		payload = null;
	}

	throw new Error(payload?.message ?? 'Não foi possível concluir a operação.');
}

async function fetchCondominium(condominiumCode: string): Promise<CondominiumApiResponse> {
	const token = await getAccessToken();
	const response = await fetch(`/api/v1/condominiums/${condominiumCode}`, {
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	return parseResponse<CondominiumApiResponse>(response);
}

async function resolveSyndic(condominiumCode: string): Promise<{
	syndic_name: string | null;
	syndic_email: string | null;
}> {
	if (!browser) {
		return {
			syndic_name: null,
			syndic_email: null
		};
	}

	try {
		const dashboard = await getUserDashboardData(condominiumCode, {
			role: 'sindico',
			status: 'active'
		});
		const syndic = dashboard.users[0];

		return {
			syndic_name: syndic?.name ?? null,
			syndic_email: syndic?.email ?? null
		};
	} catch {
		return {
			syndic_name: null,
			syndic_email: null
		};
	}
}

function toGeneralSettings(
	condominium: CondominiumApiResponse,
	syndic: { syndic_name: string | null; syndic_email: string | null }
): CondominiumGeneralSettings {
	return {
		...condominium,
		rateio_method: mapFeeRuleToRateioMethod(condominium.fee_rule),
		syndic_name: syndic.syndic_name,
		syndic_email: syndic.syndic_email
	};
}

export async function getCondominiumSettings(condominiumCode: string): Promise<CondominiumSettings> {
	const condominium = await fetchCondominium(condominiumCode);

	return {
		condominiumCode,
		rateio_method: mapFeeRuleToRateioMethod(condominium.fee_rule)
	};
}

export async function getCondominiumGeneralSettings(
	condominiumCode: string
): Promise<CondominiumGeneralSettings> {
	const [condominium, syndic] = await Promise.all([
		fetchCondominium(condominiumCode),
		resolveSyndic(condominiumCode)
	]);

	return toGeneralSettings(condominium, syndic);
}

export async function updateCondominiumFeeRule(
	condominiumCode: string,
	feeRule: CondominiumFeeRule
): Promise<CondominiumGeneralSettings> {
	const token = await getAccessToken();
	const response = await fetch(`/api/v1/condominiums/${condominiumCode}/fee-rule`, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`
		},
		body: JSON.stringify({
			fee_rule: feeRule
		})
	});

	const condominium = await parseResponse<CondominiumApiResponse>(response);
	const syndic = await resolveSyndic(condominiumCode);

	return toGeneralSettings(condominium, syndic);
}

export async function updateCondominiumLandArea(
	condominiumCode: string,
	landArea: number | null
): Promise<CondominiumGeneralSettings> {
	const token = await getAccessToken();
	const response = await fetch(`/api/v1/condominiums/${condominiumCode}/land-area`, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`
		},
		body: JSON.stringify({
			land_area: landArea
		})
	});

	const condominium = await parseResponse<CondominiumApiResponse>(response);
	const syndic = await resolveSyndic(condominiumCode);

	return toGeneralSettings(condominium, syndic);
}
