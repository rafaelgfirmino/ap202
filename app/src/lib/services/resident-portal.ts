import { listBalancetes } from '$lib/services/balancete.js';

export interface TenantInvite {
	id: number;
	email: string;
	invitedAt: string;
	status: 'pending' | 'accepted';
}

export interface ResidentBoleto {
	balanceteId: number;
	month: string; // YYYY-MM
	dueDate: string | null;
	unitValue: number;
	isPaid: boolean;
}

export interface ResidentUnit {
	id: number;
	identifier: string;
	groupName: string;
	floor?: string;
	role: 'proprietario' | 'inquilino';
	boletos: ResidentBoleto[];
	tenantInvites: TenantInvite[];
}

export interface ResidentDashboard {
	condominiumName: string;
	units: ResidentUnit[];
}

// ── Mock state ────────────────────────────────────────────────────────────────

interface SessionUnit {
	id: number;
	identifier: string;
	groupName: string;
	floor?: string;
	role: 'proprietario' | 'inquilino';
}

const sessionUnitsStore = new Map<string, SessionUnit[]>();
const paidBoletosStore = new Set<string>(); // `${code}:${balanceteId}:${unitId}`
const tenantInvitesStore = new Map<string, TenantInvite[]>(); // `${code}:${unitId}`
let nextInviteId = 100;

function getSessionUnits(condominiumCode: string): SessionUnit[] {
	if (!sessionUnitsStore.has(condominiumCode)) {
		sessionUnitsStore.set(condominiumCode, [
			{ id: 101, identifier: '101', groupName: 'Bloco A', floor: '1º Andar', role: 'proprietario' },
			{ id: 203, identifier: '203', groupName: 'Bloco B', floor: '2º Andar', role: 'proprietario' }
		]);
	}
	return sessionUnitsStore.get(condominiumCode)!;
}

// Equal-split rateio across a fixed unit count for mock purposes
const MOCK_UNIT_COUNT = 20;

// ── Public API ────────────────────────────────────────────────────────────────

export async function getResidentDashboard(condominiumCode: string): Promise<ResidentDashboard> {
	const balancetes = await listBalancetes(condominiumCode);
	const sessionUnits = getSessionUnits(condominiumCode);
	const closedBalancetes = balancetes.filter((b) => b.status === 'closed');

	const units: ResidentUnit[] = sessionUnits.map((unit) => {
		const boletos: ResidentBoleto[] = closedBalancetes.map((balancete) => ({
			balanceteId: balancete.id,
			month: balancete.month,
			dueDate: balancete.due_date,
			unitValue: Math.round((balancete.total_expenses / MOCK_UNIT_COUNT) * 100) / 100,
			isPaid: paidBoletosStore.has(`${condominiumCode}:${balancete.id}:${unit.id}`)
		}));

		const invites = tenantInvitesStore.get(`${condominiumCode}:${unit.id}`) ?? [];

		return { ...unit, boletos, tenantInvites: [...invites] };
	});

	return {
		condominiumName: `Condomínio ${condominiumCode.toUpperCase()}`,
		units
	};
}

export async function inviteTenantToUnit(
	condominiumCode: string,
	unitId: number,
	email: string
): Promise<TenantInvite> {
	await new Promise((resolve) => setTimeout(resolve, 300));

	const key = `${condominiumCode}:${unitId}`;
	const invites = tenantInvitesStore.get(key) ?? [];

	if (invites.some((i) => i.email === email && i.status === 'pending')) {
		throw new Error('Já existe um convite pendente para este e-mail nesta unidade.');
	}

	const invite: TenantInvite = {
		id: nextInviteId++,
		email,
		invitedAt: new Date().toISOString(),
		status: 'pending'
	};
	invites.push(invite);
	tenantInvitesStore.set(key, invites);
	return invite;
}

export async function revokeInvite(
	condominiumCode: string,
	unitId: number,
	inviteId: number
): Promise<void> {
	await new Promise((resolve) => setTimeout(resolve, 200));

	const key = `${condominiumCode}:${unitId}`;
	const invites = tenantInvitesStore.get(key) ?? [];
	const idx = invites.findIndex((i) => i.id === inviteId);
	if (idx !== -1) invites.splice(idx, 1);
	tenantInvitesStore.set(key, invites);
}
