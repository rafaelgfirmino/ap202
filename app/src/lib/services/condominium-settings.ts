import type { RateioMethod } from '$lib/services/balancete.js';

export interface CondominiumSettings {
	condominiumCode: string;
	rateio_method: RateioMethod;
}

const settingsStore = new Map<string, CondominiumSettings>();

export async function getCondominiumSettings(condominiumCode: string): Promise<CondominiumSettings> {
	await new Promise((r) => setTimeout(r, 50));
	if (!settingsStore.has(condominiumCode)) {
		settingsStore.set(condominiumCode, { condominiumCode, rateio_method: 'fracao' });
	}
	return { ...settingsStore.get(condominiumCode)! };
}
