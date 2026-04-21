import { browser } from '$app/environment';

export type UserRole =
	| 'administradora'
	| 'sindico'
	| 'subsindico'
	| 'tesoureiro'
	| 'morador'
	| 'inquilino';

export type UserLinkStatus = 'active' | 'pending' | 'unlinked';
export type TransferOutcome = 'subsindico' | 'tesoureiro';
export type TransferStatus = 'pending_acceptance' | 'accepted';

export interface CondominiumUser {
	id: number;
	globalUserId: number;
	condominiumCode: string;
	name: string;
	email: string;
	role: UserRole;
	status: UserLinkStatus;
	inviteSentAt: string | null;
	inviteAcceptedAt: string | null;
	unlinkedAt: string | null;
	specialAccessNote: string | null;
	lastActionAt: string;
}

export interface UserAuditEntry {
	id: number;
	condominiumCode: string;
	action:
		| 'invite_sent'
		| 'invite_accepted'
		| 'role_updated'
		| 'user_unlinked'
		| 'transfer_requested'
		| 'transfer_accepted'
		| 'actor_changed';
	description: string;
	actorName: string;
	createdAt: string;
	userId?: number;
	metadata?: Record<string, string>;
}

export interface ManagementTransfer {
	id: number;
	condominiumCode: string;
	fromUserId: number;
	toUserId: number;
	fromUserName: string;
	toUserName: string;
	status: TransferStatus;
	requestedAt: string;
	acceptedAt: string | null;
	previousSyndicOutcome: TransferOutcome;
}

export interface SessionActor {
	membershipId: number;
	name: string;
	role: UserRole;
	status: UserLinkStatus;
}

export interface UserDashboardData {
	users: CondominiumUser[];
	audit: UserAuditEntry[];
	transfers: ManagementTransfer[];
	availableActors: SessionActor[];
	currentActor: SessionActor;
}

export interface ListUsersFilters {
	role?: UserRole | 'all';
	status?: UserLinkStatus | 'all';
}

export interface InviteUserInput {
	email: string;
	role: UserRole;
}

interface UsersState {
	users: CondominiumUser[];
	audit: UserAuditEntry[];
	transfers: ManagementTransfer[];
	currentActorMembershipId: number;
	nextMembershipId: number;
	nextGlobalUserId: number;
	nextAuditId: number;
	nextTransferId: number;
}

export const USER_ROLE_LABELS: Record<UserRole, string> = {
	administradora: 'Administradora',
	sindico: 'Síndico',
	subsindico: 'Subsíndico',
	tesoureiro: 'Tesoureiro',
	morador: 'Morador',
	inquilino: 'Inquilino'
};

export const USER_STATUS_LABELS: Record<UserLinkStatus, string> = {
	active: 'Ativo',
	pending: 'Pendente',
	unlinked: 'Desvinculado'
};

const STORAGE_KEY_PREFIX = 'ap202-users-dashboard';
const store = new Map<string, UsersState>();

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function getStorageKey(condominiumCode: string): string {
	return `${STORAGE_KEY_PREFIX}:${condominiumCode}`;
}

function cloneState<T>(data: T): T {
	return JSON.parse(JSON.stringify(data)) as T;
}

function createSeedState(condominiumCode: string): UsersState {
	const now = new Date().toISOString();

	return {
		users: [
			{
				id: 1,
				globalUserId: 1001,
				condominiumCode,
				name: 'Marina Costa',
				email: 'marina@gestoraalpha.com',
				role: 'administradora',
				status: 'active',
				inviteSentAt: '2026-03-18T09:10:00.000Z',
				inviteAcceptedAt: '2026-03-18T14:45:00.000Z',
				unlinkedAt: null,
				specialAccessNote: null,
				lastActionAt: now
			},
			{
				id: 2,
				globalUserId: 1002,
				condominiumCode,
				name: 'Carlos Ribeiro',
				email: 'carlos@condominio.com.br',
				role: 'sindico',
				status: 'active',
				inviteSentAt: '2026-03-12T08:00:00.000Z',
				inviteAcceptedAt: '2026-03-12T11:20:00.000Z',
				unlinkedAt: null,
				specialAccessNote: null,
				lastActionAt: now
			},
			{
				id: 3,
				globalUserId: 1003,
				condominiumCode,
				name: 'Paula Martins',
				email: 'paula@condominio.com.br',
				role: 'subsindico',
				status: 'active',
				inviteSentAt: '2026-03-15T10:00:00.000Z',
				inviteAcceptedAt: '2026-03-15T12:10:00.000Z',
				unlinkedAt: null,
				specialAccessNote: null,
				lastActionAt: now
			},
			{
				id: 4,
				globalUserId: 1004,
				condominiumCode,
				name: 'Rafael Souza',
				email: 'rafael@condominio.com.br',
				role: 'tesoureiro',
				status: 'active',
				inviteSentAt: '2026-03-16T09:00:00.000Z',
				inviteAcceptedAt: '2026-03-16T13:20:00.000Z',
				unlinkedAt: null,
				specialAccessNote: null,
				lastActionAt: now
			},
			{
				id: 5,
				globalUserId: 1005,
				condominiumCode,
				name: 'Luciana Melo',
				email: 'luciana@email.com',
				role: 'morador',
				status: 'active',
				inviteSentAt: '2026-03-10T09:00:00.000Z',
				inviteAcceptedAt: '2026-03-10T15:00:00.000Z',
				unlinkedAt: null,
				specialAccessNote: null,
				lastActionAt: now
			},
			{
				id: 6,
				globalUserId: 1006,
				condominiumCode,
				name: 'Renata Lima',
				email: 'renata@email.com',
				role: 'inquilino',
				status: 'pending',
				inviteSentAt: '2026-04-18T17:20:00.000Z',
				inviteAcceptedAt: null,
				unlinkedAt: null,
				specialAccessNote: null,
				lastActionAt: '2026-04-18T17:20:00.000Z'
			},
			{
				id: 7,
				globalUserId: 1007,
				condominiumCode,
				name: 'Eduardo Braga',
				email: 'eduardo@email.com',
				role: 'morador',
				status: 'unlinked',
				inviteSentAt: '2026-02-20T11:00:00.000Z',
				inviteAcceptedAt: '2026-02-20T13:30:00.000Z',
				unlinkedAt: '2026-04-02T10:10:00.000Z',
				specialAccessNote: null,
				lastActionAt: '2026-04-02T10:10:00.000Z'
			}
		],
		audit: [
			{
				id: 1,
				condominiumCode,
				action: 'invite_sent',
				description: 'Convite enviado para Renata Lima com perfil Inquilino.',
				actorName: 'Carlos Ribeiro',
				createdAt: '2026-04-18T17:20:00.000Z',
				userId: 6
			},
			{
				id: 2,
				condominiumCode,
				action: 'user_unlinked',
				description: 'Eduardo Braga foi desvinculado deste condomínio e permanece na plataforma.',
				actorName: 'Carlos Ribeiro',
				createdAt: '2026-04-02T10:10:00.000Z',
				userId: 7
			}
		],
		transfers: [],
		currentActorMembershipId: 2,
		nextMembershipId: 8,
		nextGlobalUserId: 1008,
		nextAuditId: 3,
		nextTransferId: 1
	};
}

function persistState(condominiumCode: string, state: UsersState): void {
	store.set(condominiumCode, state);
	if (!browser) {
		return;
	}

	window.localStorage.setItem(getStorageKey(condominiumCode), JSON.stringify(state));
}

function getState(condominiumCode: string): UsersState {
	const cached = store.get(condominiumCode);
	if (cached) {
		return cached;
	}

	if (browser) {
		const raw = window.localStorage.getItem(getStorageKey(condominiumCode));
		if (raw) {
			const parsed = JSON.parse(raw) as UsersState;
			store.set(condominiumCode, parsed);
			return parsed;
		}
	}

	const seeded = createSeedState(condominiumCode);
	persistState(condominiumCode, seeded);
	return seeded;
}

function getCurrentActor(state: UsersState): SessionActor {
	const actor = state.users.find((user) => user.id === state.currentActorMembershipId);
	if (!actor) {
		throw new Error('Nao foi possivel identificar o perfil ativo da sessao.');
	}

	return {
		membershipId: actor.id,
		name: actor.name,
		role: actor.role,
		status: actor.status
	};
}

function getAvailableActors(state: UsersState): SessionActor[] {
	return state.users
		.filter((user) => user.status === 'active')
		.filter((user) => ['administradora', 'sindico', 'subsindico', 'tesoureiro'].includes(user.role))
		.map((user) => ({
			membershipId: user.id,
			name: user.name,
			role: user.role,
			status: user.status
		}));
}

function appendAuditEntry(
	condominiumCode: string,
	state: UsersState,
	entry: Omit<UserAuditEntry, 'id' | 'condominiumCode'>
): void {
	state.audit.unshift({
		id: state.nextAuditId++,
		condominiumCode,
		...entry
	});
}

function findUser(state: UsersState, membershipId: number): CondominiumUser {
	const user = state.users.find((entry) => entry.id === membershipId);
	if (!user) {
		throw new Error('Usuario nao encontrado neste condominio.');
	}
	return user;
}

function formatNameFromEmail(email: string): string {
	const localPart = email.split('@')[0] ?? email;
	return localPart
		.split(/[._-]+/)
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');
}

function sortUsers(users: CondominiumUser[]): CondominiumUser[] {
	const statusOrder: Record<UserLinkStatus, number> = {
		active: 0,
		pending: 1,
		unlinked: 2
	};

	return [...users].sort((left, right) => {
		const byStatus = statusOrder[left.status] - statusOrder[right.status];
		if (byStatus !== 0) {
			return byStatus;
		}
		return left.name.localeCompare(right.name, 'pt-BR');
	});
}

export async function getUserDashboardData(
	condominiumCode: string,
	filters: ListUsersFilters = {}
): Promise<UserDashboardData> {
	await delay(120);
	const state = getState(condominiumCode);
	const filteredUsers = state.users.filter((user) => {
		const matchesRole = !filters.role || filters.role === 'all' || user.role === filters.role;
		const matchesStatus =
			!filters.status || filters.status === 'all' || user.status === filters.status;
		return matchesRole && matchesStatus;
	});

	return cloneState({
		users: sortUsers(filteredUsers),
		audit: state.audit,
		transfers: state.transfers,
		availableActors: getAvailableActors(state),
		currentActor: getCurrentActor(state)
	});
}

export async function inviteUser(
	condominiumCode: string,
	input: InviteUserInput
): Promise<CondominiumUser> {
	await delay(180);
	const state = getState(condominiumCode);
	const actor = getCurrentActor(state);
	const normalizedEmail = input.email.trim().toLowerCase();

	if (!normalizedEmail) {
		throw new Error('Informe o e-mail do usuario.');
	}

	const existingUser = state.users.find((user) => user.email.toLowerCase() === normalizedEmail);

	if (existingUser && existingUser.status !== 'unlinked') {
		throw new Error('Este usuario ja possui um vinculo ativo ou pendente com o condominio.');
	}

	const now = new Date().toISOString();

	if (existingUser) {
		existingUser.role = input.role;
		existingUser.status = 'pending';
		existingUser.inviteSentAt = now;
		existingUser.inviteAcceptedAt = null;
		existingUser.unlinkedAt = null;
		existingUser.specialAccessNote = null;
		existingUser.lastActionAt = now;

		appendAuditEntry(condominiumCode, state, {
			action: 'invite_sent',
			description: `Novo convite enviado para ${existingUser.name} com perfil ${USER_ROLE_LABELS[input.role]}.`,
			actorName: actor.name,
			createdAt: now,
			userId: existingUser.id
		});

		persistState(condominiumCode, state);
		return cloneState(existingUser);
	}

	const user: CondominiumUser = {
		id: state.nextMembershipId++,
		globalUserId: state.nextGlobalUserId++,
		condominiumCode,
		name: formatNameFromEmail(normalizedEmail),
		email: normalizedEmail,
		role: input.role,
		status: 'pending',
		inviteSentAt: now,
		inviteAcceptedAt: null,
		unlinkedAt: null,
		specialAccessNote: null,
		lastActionAt: now
	};

	state.users.push(user);
	appendAuditEntry(condominiumCode, state, {
		action: 'invite_sent',
		description: `Convite enviado para ${user.email} com perfil ${USER_ROLE_LABELS[input.role]}.`,
		actorName: actor.name,
		createdAt: now,
		userId: user.id
	});
	persistState(condominiumCode, state);
	return cloneState(user);
}

export async function simulateInviteAcceptance(
	condominiumCode: string,
	membershipId: number
): Promise<CondominiumUser> {
	await delay(120);
	const state = getState(condominiumCode);
	const user = findUser(state, membershipId);

	if (user.status !== 'pending') {
		throw new Error('Somente convites pendentes podem ser aceitos.');
	}

	const now = new Date().toISOString();
	user.status = 'active';
	user.inviteAcceptedAt = now;
	user.lastActionAt = now;

	appendAuditEntry(condominiumCode, state, {
		action: 'invite_accepted',
		description: `${user.name} aceitou o convite e agora esta com acesso ativo ao condominio.`,
		actorName: user.name,
		createdAt: now,
		userId: user.id
	});

	persistState(condominiumCode, state);
	return cloneState(user);
}

export async function updateUserRole(
	condominiumCode: string,
	membershipId: number,
	role: UserRole
): Promise<CondominiumUser> {
	await delay(180);
	const state = getState(condominiumCode);
	const actor = getCurrentActor(state);
	const user = findUser(state, membershipId);

	if (user.status === 'unlinked') {
		throw new Error('Nao e possivel editar a role de um usuario desvinculado.');
	}

	const previousRole = user.role;
	user.role = role;
	user.lastActionAt = new Date().toISOString();

	appendAuditEntry(condominiumCode, state, {
		action: 'role_updated',
		description: `${user.name} teve a role alterada de ${USER_ROLE_LABELS[previousRole]} para ${USER_ROLE_LABELS[role]}.`,
		actorName: actor.name,
		createdAt: user.lastActionAt,
		userId: user.id
	});

	persistState(condominiumCode, state);
	return cloneState(user);
}

export async function unlinkUser(
	condominiumCode: string,
	membershipId: number
): Promise<CondominiumUser> {
	await delay(180);
	const state = getState(condominiumCode);
	const actor = getCurrentActor(state);
	const user = findUser(state, membershipId);

	if (user.status === 'unlinked') {
		throw new Error('Este usuario ja esta desvinculado.');
	}

	const now = new Date().toISOString();
	user.status = 'unlinked';
	user.unlinkedAt = now;
	user.specialAccessNote = null;
	user.lastActionAt = now;

	appendAuditEntry(condominiumCode, state, {
		action: 'user_unlinked',
		description: `${user.name} foi removido deste condominio e continua cadastrado na plataforma.`,
		actorName: actor.name,
		createdAt: now,
		userId: user.id
	});

	if (state.currentActorMembershipId === user.id) {
		const fallbackActor = getAvailableActors(state).find((entry) => entry.membershipId !== user.id);
		if (fallbackActor) {
			state.currentActorMembershipId = fallbackActor.membershipId;
		}
	}

	persistState(condominiumCode, state);
	return cloneState(user);
}

export async function setCurrentUserActor(
	condominiumCode: string,
	membershipId: number
): Promise<SessionActor> {
	await delay(80);
	const state = getState(condominiumCode);
	const actor = findUser(state, membershipId);

	if (actor.status !== 'active') {
		throw new Error('Somente usuarios ativos podem representar a sessao.');
	}

	state.currentActorMembershipId = actor.id;
	appendAuditEntry(condominiumCode, state, {
		action: 'actor_changed',
		description: `Sessao demonstrativa alterada para ${actor.name}.`,
		actorName: actor.name,
		createdAt: new Date().toISOString(),
		userId: actor.id
	});
	persistState(condominiumCode, state);
	return cloneState(getCurrentActor(state));
}

export async function requestManagementTransfer(
	condominiumCode: string,
	targetMembershipId: number,
	previousSyndicOutcome: TransferOutcome
): Promise<ManagementTransfer> {
	await delay(200);
	const state = getState(condominiumCode);
	const actor = getCurrentActor(state);

	if (actor.role !== 'sindico') {
		throw new Error('Somente o sindico pode iniciar a transferencia de gestao.');
	}

	const target = findUser(state, targetMembershipId);
	if (target.role !== 'administradora' || target.status !== 'active') {
		throw new Error('Selecione uma administradora ativa para receber a gestao.');
	}

	const hasPendingTransfer = state.transfers.some(
		(transfer) => transfer.status === 'pending_acceptance'
	);
	if (hasPendingTransfer) {
		throw new Error('Ja existe uma transferencia aguardando aceite.');
	}

	const now = new Date().toISOString();
	const transfer: ManagementTransfer = {
		id: state.nextTransferId++,
		condominiumCode,
		fromUserId: actor.membershipId,
		toUserId: target.id,
		fromUserName: actor.name,
		toUserName: target.name,
		status: 'pending_acceptance',
		requestedAt: now,
		acceptedAt: null,
		previousSyndicOutcome
	};

	state.transfers.unshift(transfer);
	appendAuditEntry(condominiumCode, state, {
		action: 'transfer_requested',
		description: `${actor.name} iniciou a transferencia de gestao para ${target.name}.`,
		actorName: actor.name,
		createdAt: now,
		userId: target.id
	});
	persistState(condominiumCode, state);
	return cloneState(transfer);
}

export async function acceptManagementTransfer(
	condominiumCode: string,
	transferId: number
): Promise<ManagementTransfer> {
	await delay(200);
	const state = getState(condominiumCode);
	const actor = getCurrentActor(state);
	const transfer = state.transfers.find((entry) => entry.id === transferId);

	if (!transfer) {
		throw new Error('Transferencia de gestao nao encontrada.');
	}
	if (transfer.status !== 'pending_acceptance') {
		throw new Error('Esta transferencia ja foi concluida.');
	}
	if (actor.membershipId !== transfer.toUserId) {
		throw new Error('Somente a administradora selecionada pode aceitar a transferencia.');
	}

	const previousSyndic = findUser(state, transfer.fromUserId);
	const targetAdmin = findUser(state, transfer.toUserId);
	const now = new Date().toISOString();

	transfer.status = 'accepted';
	transfer.acceptedAt = now;

	previousSyndic.role = transfer.previousSyndicOutcome;
	previousSyndic.specialAccessNote = null;
	previousSyndic.lastActionAt = now;

	targetAdmin.lastActionAt = now;

	appendAuditEntry(condominiumCode, state, {
		action: 'transfer_accepted',
		description: `${targetAdmin.name} aceitou a transferencia e assumiu a gestao do condominio.`,
		actorName: actor.name,
		createdAt: now,
		userId: targetAdmin.id,
		metadata: {
			previousSyndicOutcome: transfer.previousSyndicOutcome
		}
	});

	persistState(condominiumCode, state);
	return cloneState(transfer);
}
