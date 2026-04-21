<script lang="ts">
	import ArrowRightLeftIcon from '@lucide/svelte/icons/arrow-right-left';
	import Building2Icon from '@lucide/svelte/icons/building-2';
	import HistoryIcon from '@lucide/svelte/icons/history';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import SearchIcon from '@lucide/svelte/icons/search';
	import { onMount } from 'svelte';
	import CardEmpty from '$lib/components/app/card-empty/index.svelte';
	import ManagementTransferPanel from '$lib/components/app/ManagementTransferPanel.svelte';
	import UserActivityTable from '$lib/components/app/UserActivityTable.svelte';
	import UserManagementTable from '$lib/components/app/UserManagementTable.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import {
		acceptManagementTransfer,
		getUserDashboardData,
		inviteUser,
		requestManagementTransfer,
		setCurrentUserActor,
		simulateInviteAcceptance,
		unlinkUser,
		updateUserRole,
		USER_ROLE_LABELS,
		USER_STATUS_LABELS,
		type CondominiumUser,
		type InviteUserInput,
		type ManagementTransfer,
		type SessionActor,
		type TransferOutcome,
		type UserAuditEntry,
		type UserLinkStatus,
		type UserRole
	} from '$lib/services/users.js';

	interface Props {
		params: { code: string };
	}

	let { params }: Props = $props();

	const roleOptions: Array<UserRole | 'all'> = [
		'all',
		'administradora',
		'sindico',
		'subsindico',
		'tesoureiro',
		'morador',
		'inquilino'
	];
	const statusOptions: Array<UserLinkStatus | 'all'> = ['all', 'active', 'pending', 'unlinked'];

	let users = $state<CondominiumUser[]>([]);
	let audit = $state<UserAuditEntry[]>([]);
	let transfers = $state<ManagementTransfer[]>([]);
	let availableActors = $state<SessionActor[]>([]);
	let searchTerm = $state('');
	let activeTab = $state('users');
	let currentActor = $state<SessionActor>({
		membershipId: 0,
		name: '',
		role: 'sindico',
		status: 'active'
	});

	let roleFilter = $state<UserRole | 'all'>('all');
	let statusFilter = $state<UserLinkStatus | 'all'>('all');
	let isLoading = $state(true);
	let isSubmitting = $state(false);
	let errorMessage = $state('');

	let showInviteDialog = $state(false);
	let inviteEmail = $state('');
	let inviteRole = $state<UserRole>('morador');

	let showEditDialog = $state(false);
	let showEditConfirmDialog = $state(false);
	let editTarget = $state<CondominiumUser | null>(null);
	let editRole = $state<UserRole>('morador');

	let showUnlinkDialog = $state(false);
	let unlinkTarget = $state<CondominiumUser | null>(null);

	let showTransferDialog = $state(false);
	let showTransferConfirmDialog = $state(false);
	let transferAdminId = $state('');
	let transferOutcome = $state<TransferOutcome>('subsindico');

	let showAcceptTransferDialog = $state(false);
	let acceptTransferTarget = $state<ManagementTransfer | null>(null);

	const hasUsers = $derived(users.length > 0);
	const filteredUsers = $derived(
		users.filter((user) => {
			const matchesRole = roleFilter === 'all' || user.role === roleFilter;
			const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
			const normalizedSearch = searchTerm.trim().toLowerCase();
			const matchesSearch =
				normalizedSearch.length === 0 ||
				[user.name, user.email, USER_ROLE_LABELS[user.role], USER_STATUS_LABELS[user.status]]
					.join(' ')
					.toLowerCase()
					.includes(normalizedSearch);

			return matchesRole && matchesStatus && matchesSearch;
		})
	);
	const administrators = $derived(
		users.filter((user) => user.role === 'administradora' && user.status === 'active')
	);
	const selectedTransferAdmin = $derived(
		administrators.find((user) => String(user.id) === transferAdminId) ?? null
	);

	function formatDateTime(value: string | null): string {
		if (!value) {
			return '—';
		}

		return new Intl.DateTimeFormat('pt-BR', {
			dateStyle: 'short',
			timeStyle: 'short'
		}).format(new Date(value));
	}

	function resetError(): void {
		errorMessage = '';
	}

	async function loadData(): Promise<void> {
		isLoading = true;
		resetError();

		try {
			const data = await getUserDashboardData(params.code);
			users = data.users;
			audit = data.audit;
			transfers = data.transfers;
			availableActors = data.availableActors;
			currentActor = data.currentActor;

			if (!transferAdminId && data.users.some((user) => user.role === 'administradora')) {
				const firstAdministrator = data.users.find(
					(user) => user.role === 'administradora' && user.status === 'active'
				);
				transferAdminId = firstAdministrator ? String(firstAdministrator.id) : '';
			}
		} catch (error) {
			errorMessage =
				error instanceof Error ? error.message : 'Não foi possível carregar os usuários.';
		} finally {
			isLoading = false;
		}
	}

	async function refreshData(): Promise<void> {
		await loadData();
	}

	function openInviteDialog(): void {
		inviteEmail = '';
		inviteRole = 'morador';
		resetError();
		showInviteDialog = true;
	}

	function openEditDialog(user: CondominiumUser): void {
		editTarget = user;
		editRole = user.role;
		resetError();
		showEditDialog = true;
	}

	function openUnlinkDialog(user: CondominiumUser): void {
		unlinkTarget = user;
		resetError();
		showUnlinkDialog = true;
	}

	function openTransferDialog(): void {
		const firstAdministrator = administrators[0];
		transferAdminId = firstAdministrator ? String(firstAdministrator.id) : '';
		transferOutcome = 'subsindico';
		resetError();
		showTransferDialog = true;
	}

	function openAcceptTransferDialog(transfer: ManagementTransfer): void {
		acceptTransferTarget = transfer;
		resetError();
		showAcceptTransferDialog = true;
	}

	async function handleActorChange(event: Event): Promise<void> {
		const selectedMembershipId = Number((event.currentTarget as HTMLSelectElement).value);
		if (!selectedMembershipId) {
			return;
		}

		isSubmitting = true;
		resetError();
		try {
			await setCurrentUserActor(params.code, selectedMembershipId);
			await refreshData();
		} catch (error) {
			errorMessage =
				error instanceof Error ? error.message : 'Não foi possível trocar o perfil da sessão.';
		} finally {
			isSubmitting = false;
		}
	}

	async function handleInviteSubmit(): Promise<void> {
		resetError();

		const payload: InviteUserInput = {
			email: inviteEmail,
			role: inviteRole
		};

		isSubmitting = true;
		try {
			await inviteUser(params.code, payload);
			showInviteDialog = false;
			await refreshData();
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Não foi possível enviar o convite.';
		} finally {
			isSubmitting = false;
		}
	}

	function handleEditContinue(): void {
		if (!editTarget) {
			return;
		}

		resetError();
		showEditDialog = false;
		showEditConfirmDialog = true;
	}

	async function handleConfirmRoleEdit(): Promise<void> {
		if (!editTarget) {
			return;
		}

		isSubmitting = true;
		resetError();
		try {
			await updateUserRole(params.code, editTarget.id, editRole);
			showEditConfirmDialog = false;
			editTarget = null;
			await refreshData();
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Não foi possível atualizar a role.';
		} finally {
			isSubmitting = false;
		}
	}

	async function handleConfirmUnlink(): Promise<void> {
		if (!unlinkTarget) {
			return;
		}

		isSubmitting = true;
		resetError();
		try {
			await unlinkUser(params.code, unlinkTarget.id);
			showUnlinkDialog = false;
			unlinkTarget = null;
			await refreshData();
		} catch (error) {
			errorMessage =
				error instanceof Error ? error.message : 'Não foi possível desvincular o usuário.';
		} finally {
			isSubmitting = false;
		}
	}

	async function handleAcceptInvite(user: CondominiumUser): Promise<void> {
		isSubmitting = true;
		resetError();
		try {
			await simulateInviteAcceptance(params.code, user.id);
			await refreshData();
		} catch (error) {
			errorMessage =
				error instanceof Error ? error.message : 'Não foi possível confirmar o aceite do convite.';
		} finally {
			isSubmitting = false;
		}
	}

	function handleTransferContinue(): void {
		if (!selectedTransferAdmin) {
			errorMessage = 'Selecione uma administradora para receber a gestão.';
			return;
		}

		resetError();
		showTransferDialog = false;
		showTransferConfirmDialog = true;
	}

	async function handleConfirmTransfer(): Promise<void> {
		if (!selectedTransferAdmin) {
			return;
		}

		isSubmitting = true;
		resetError();
		try {
			await requestManagementTransfer(params.code, selectedTransferAdmin.id, transferOutcome);
			showTransferConfirmDialog = false;
			await refreshData();
		} catch (error) {
			errorMessage =
				error instanceof Error ? error.message : 'Não foi possível iniciar a transferência.';
		} finally {
			isSubmitting = false;
		}
	}

	async function handleConfirmTransferAcceptance(): Promise<void> {
		if (!acceptTransferTarget) {
			return;
		}

		isSubmitting = true;
		resetError();
		try {
			await acceptManagementTransfer(params.code, acceptTransferTarget.id);
			showAcceptTransferDialog = false;
			acceptTransferTarget = null;
			await refreshData();
		} catch (error) {
			errorMessage =
				error instanceof Error ? error.message : 'Não foi possível aceitar a transferência.';
		} finally {
			isSubmitting = false;
		}
	}

	onMount(async () => {
		await loadData();
	});
</script>

<svelte:head>
	<title>Usuários</title>
</svelte:head>

<main
	id="users-page-root"
	data-test="users-page-root"
	class="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6"
>
	<section class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
		<div class="flex flex-col gap-1">
			<h1 class="text-2xl font-semibold tracking-tight text-foreground">Usuários</h1>
		</div>

		<Button type="button" disabled={isLoading || isSubmitting} onclick={openInviteDialog}>
			<PlusIcon class="mr-2 size-4" />
			Convidar usuário
		</Button>
	</section>

	{#if errorMessage}
		<div
			id="users-page-error"
			data-test="users-page-error"
			class="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
		>
			{errorMessage}
		</div>
	{/if}

	<Tabs.Root bind:value={activeTab} class="flex flex-col gap-4">
		<Tabs.List>
			<Tabs.Trigger value="users">Usuários</Tabs.Trigger>
			<Tabs.Trigger value="transfer">Transferência de Gestão</Tabs.Trigger>
			<Tabs.Trigger value="history">Histórico</Tabs.Trigger>
		</Tabs.List>

		<Tabs.Content value="users">
			<Card.Root>
				<Card.Header>
					<Card.Title>Usuários vinculados</Card.Title>
					<Card.Description>
						Gerencie os vínculos de acesso, roles e convites deste condomínio.
					</Card.Description>
				</Card.Header>
				<Card.Content class="flex flex-col gap-4">
					<div class="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
						<div class="text-sm text-muted-foreground">
							{users.length} usuários vinculados a este condomínio.
						</div>

						<div class="grid grid-cols-1 gap-3 xl:grid-cols-[280px_180px_180px_260px]">
							<div class="relative w-full">
								<SearchIcon
									class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
								/>
								<Input
									value={searchTerm}
									placeholder="Buscar por nome, e-mail ou role"
									class="pl-9"
									oninput={(event) => {
										searchTerm = (event.currentTarget as HTMLInputElement).value;
									}}
								/>
							</div>

							<select
								id="users-filter-role"
								data-test="users-filter-role"
								class="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
								value={roleFilter}
								disabled={isLoading}
								onchange={(event) => {
									roleFilter = (event.currentTarget as HTMLSelectElement).value as UserRole | 'all';
								}}
							>
								{#each roleOptions as role (role)}
									<option value={role}>
										{role === 'all' ? 'Todas as roles' : USER_ROLE_LABELS[role]}
									</option>
								{/each}
							</select>

							<select
								id="users-filter-status"
								data-test="users-filter-status"
								class="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
								value={statusFilter}
								disabled={isLoading}
								onchange={(event) => {
									statusFilter = (event.currentTarget as HTMLSelectElement).value as
										| UserLinkStatus
										| 'all';
								}}
							>
								{#each statusOptions as status (status)}
									<option value={status}>
										{status === 'all' ? 'Todos os status' : USER_STATUS_LABELS[status]}
									</option>
								{/each}
							</select>

							<select
								id="users-session-actor"
								data-test="users-session-actor"
								class="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
								value={String(currentActor.membershipId)}
								disabled={isLoading || isSubmitting}
								onchange={handleActorChange}
							>
								{#each availableActors as actor (actor.membershipId)}
									<option value={String(actor.membershipId)}>
										Sessão: {actor.name} · {USER_ROLE_LABELS[actor.role]}
									</option>
								{/each}
							</select>
						</div>
					</div>

					{#if isLoading}
						<div class="text-sm text-muted-foreground">Carregando usuários...</div>
					{:else if !hasUsers}
						<CardEmpty
							title="Nenhum usuário vinculado"
							description="Tudo pronto para começar. Clique em convidar usuário para criar o primeiro vínculo deste condomínio."
							actionLabel="Convidar usuário"
							onAction={openInviteDialog}
						/>
					{:else if filteredUsers.length === 0}
						<div
							class="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground"
						>
							Nenhum usuário encontrado para os filtros informados.
						</div>
					{:else}
						<UserManagementTable
							rows={filteredUsers}
							isBusy={isSubmitting}
							onEditRole={openEditDialog}
							onUnlink={openUnlinkDialog}
							onAcceptInvite={(user) => void handleAcceptInvite(user)}
						/>
					{/if}
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<Tabs.Content value="transfer">
			<div class="flex flex-col gap-4">
				{#if administrators.length === 0}
					<Card.Root
						id="transfer-no-admin-card"
						data-test="transfer-no-admin-card"
						class="border-dashed"
					>
						<Card.Content class="flex flex-col items-center gap-3 py-10 text-center">
							<Building2Icon class="size-8 text-muted-foreground/50" />
							<div class="space-y-1">
								<p class="text-sm font-medium text-foreground">Nenhuma administradora vinculada</p>
								<p class="max-w-sm text-sm text-muted-foreground">
									Para iniciar a transferência de gestão, vincule primeiro uma administradora a
									este condomínio na aba Usuários.
								</p>
							</div>
						</Card.Content>
					</Card.Root>
				{/if}

				<ManagementTransferPanel
					{currentActor}
					{administrators}
					{transfers}
					isBusy={isSubmitting}
					onStartTransfer={openTransferDialog}
					onAcceptTransfer={openAcceptTransferDialog}
				/>

				<Card.Root id="users-transfer-history-card" data-test="users-transfer-history-card">
					<Card.Header>
						<Card.Title class="flex items-center gap-2">
							<ArrowRightLeftIcon class="size-4" />
							Histórico de transferências
						</Card.Title>
						<Card.Description>
							Acompanhe as trocas de gestão iniciadas e concluídas neste condomínio.
						</Card.Description>
					</Card.Header>
					<Card.Content class="space-y-3">
						{#if transfers.length === 0}
							<p class="text-sm text-muted-foreground">
								Nenhuma transferência registrada até agora.
							</p>
						{:else}
							{#each transfers as transfer (transfer.id)}
								<article
									id={`users-transfer-history-item-${transfer.id}`}
									data-test="users-transfer-history-item"
									class="rounded-xl border border-border/70 bg-background p-4"
								>
									<div class="flex flex-col gap-1">
										<p class="text-sm font-medium text-foreground">
											{transfer.fromUserName} → {transfer.toUserName}
										</p>
										<p class="text-xs text-muted-foreground">
											Solicitada em {formatDateTime(transfer.requestedAt)}{#if transfer.acceptedAt}
												· Aceita em {formatDateTime(transfer.acceptedAt)}{/if}
										</p>
										<span
											class={transfer.status === 'accepted'
												? 'w-fit rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700'
												: 'w-fit rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700'}
										>
											{transfer.status === 'accepted' ? 'Concluída' : 'Aguardando aceite'}
										</span>
									</div>
								</article>
							{/each}
						{/if}
					</Card.Content>
				</Card.Root>
			</div>
		</Tabs.Content>

		<Tabs.Content value="history">
			<Card.Root id="users-activity-card" data-test="users-activity-card">
				<Card.Header>
					<Card.Title class="flex items-center gap-2">
						<HistoryIcon class="size-4" />
						Histórico de atividades
					</Card.Title>
					<Card.Description>
						Listagem cronológica de convites, aceites, alterações de acesso e transferências de
						gestão.
					</Card.Description>
				</Card.Header>
				<Card.Content>
					<UserActivityTable rows={audit} />
				</Card.Content>
			</Card.Root>
		</Tabs.Content>
	</Tabs.Root>

	<Dialog.Root bind:open={showInviteDialog}>
		<Dialog.Content class="max-w-md">
			<Dialog.Header>
				<Dialog.Title>Convidar usuário</Dialog.Title>
				<Dialog.Description>
					O usuário é global na plataforma e receberá um vínculo pendente com este condomínio.
				</Dialog.Description>
			</Dialog.Header>

			<div id="invite-dialog-form" data-test="invite-dialog-form" class="space-y-4 py-2">
				<div class="space-y-2">
					<Label for="invite-user-email">E-mail</Label>
					<Input
						id="invite-user-email"
						type="email"
						value={inviteEmail}
						placeholder="nome@empresa.com"
						disabled={isSubmitting}
						oninput={(event) => {
							inviteEmail = (event.currentTarget as HTMLInputElement).value;
						}}
					/>
				</div>

				<div class="space-y-2">
					<Label for="invite-user-role">Role</Label>
					<select
						id="invite-user-role"
						data-test="invite-user-role"
						class="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
						value={inviteRole}
						disabled={isSubmitting}
						onchange={(event) => {
							inviteRole = (event.currentTarget as HTMLSelectElement).value as UserRole;
						}}
					>
						{#each roleOptions.filter((role) => role !== 'all') as role (role)}
							<option
								id={`invite-user-role-option-${role}`}
								data-test="invite-user-role-option"
								value={role}
							>
								{USER_ROLE_LABELS[role]}
							</option>
						{/each}
					</select>
				</div>
			</div>

			<Dialog.Footer>
				<Button
					type="button"
					variant="outline"
					disabled={isSubmitting}
					onclick={() => {
						showInviteDialog = false;
					}}
				>
					Cancelar
				</Button>
				<Button type="button" disabled={isSubmitting} onclick={() => void handleInviteSubmit()}>
					Enviar convite
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>

	<Dialog.Root bind:open={showEditDialog}>
		<Dialog.Content class="max-w-md">
			<Dialog.Header>
				<Dialog.Title>Editar role</Dialog.Title>
				<Dialog.Description>
					Altere a role do usuário vinculado e confirme antes de salvar a mudança.
				</Dialog.Description>
			</Dialog.Header>

			<div id="edit-role-dialog-form" data-test="edit-role-dialog-form" class="space-y-4 py-2">
				<div class="space-y-2">
					<Label for="edit-role-user-name">Usuário</Label>
					<Input
						id="edit-role-user-name"
						value={editTarget ? `${editTarget.name} · ${editTarget.email}` : ''}
						disabled={true}
					/>
				</div>

				<div class="space-y-2">
					<Label for="edit-role-select">Nova role</Label>
					<select
						id="edit-role-select"
						data-test="edit-role-select"
						class="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
						value={editRole}
						disabled={isSubmitting}
						onchange={(event) => {
							editRole = (event.currentTarget as HTMLSelectElement).value as UserRole;
						}}
					>
						{#each roleOptions.filter((role) => role !== 'all') as role (role)}
							<option id={`edit-role-option-${role}`} data-test="edit-role-option" value={role}>
								{USER_ROLE_LABELS[role]}
							</option>
						{/each}
					</select>
				</div>
			</div>

			<Dialog.Footer>
				<Button
					type="button"
					variant="outline"
					disabled={isSubmitting}
					onclick={() => {
						showEditDialog = false;
					}}
				>
					Cancelar
				</Button>
				<Button type="button" disabled={isSubmitting} onclick={handleEditContinue}>
					Continuar
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>

	<Dialog.Root bind:open={showEditConfirmDialog}>
		<Dialog.Content class="max-w-md">
			<Dialog.Header>
				<Dialog.Title>Confirmar alteração de role</Dialog.Title>
				<Dialog.Description>
					{#if editTarget}
						Você está prestes a alterar {editTarget.name} para {USER_ROLE_LABELS[editRole]}.
					{/if}
				</Dialog.Description>
			</Dialog.Header>

			<div
				id="edit-role-confirmation-copy"
				data-test="edit-role-confirmation-copy"
				class="rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground"
			>
				Essa mudança será salva no vínculo deste condomínio e registrada no histórico de auditoria.
			</div>

			<Dialog.Footer>
				<Button
					type="button"
					variant="outline"
					disabled={isSubmitting}
					onclick={() => {
						showEditConfirmDialog = false;
					}}
				>
					Cancelar
				</Button>
				<Button type="button" disabled={isSubmitting} onclick={() => void handleConfirmRoleEdit()}>
					Salvar alteração
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>

	<Dialog.Root bind:open={showUnlinkDialog}>
		<Dialog.Content class="max-w-md">
			<Dialog.Header>
				<Dialog.Title>Confirmar desvinculação</Dialog.Title>
				<Dialog.Description>
					{#if unlinkTarget}
						O usuário {unlinkTarget.name} será removido deste condomínio, mas continuará existindo na
						plataforma.
					{/if}
				</Dialog.Description>
			</Dialog.Header>

			<div
				id="unlink-dialog-warning"
				data-test="unlink-dialog-warning"
				class="rounded-xl border border-rose-200 bg-rose-50/70 px-4 py-3 text-sm text-rose-800"
			>
				O usuário será removido deste condomínio mas continuará existindo na plataforma.
			</div>

			<div
				id="unlink-dialog-description"
				data-test="unlink-dialog-description"
				class="rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground"
			>
				Desvincular significa encerrar apenas o acesso deste condomínio. O cadastro global do
				usuário, seu e-mail e o histórico de auditoria permanecem preservados na plataforma.
			</div>

			<Dialog.Footer>
				<Button
					type="button"
					variant="outline"
					disabled={isSubmitting}
					onclick={() => {
						showUnlinkDialog = false;
					}}
				>
					Cancelar
				</Button>
				<Button
					type="button"
					variant="outline"
					class="text-rose-700 hover:text-rose-700"
					disabled={isSubmitting}
					onclick={() => void handleConfirmUnlink()}
				>
					Desvincular usuário
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>

	<Dialog.Root bind:open={showTransferDialog}>
		<Dialog.Content class="max-w-lg">
			<Dialog.Header>
				<Dialog.Title>Iniciar transferência de gestão</Dialog.Title>
				<Dialog.Description>
					Fluxo exclusivo do Síndico. A Administradora selecionada precisará aceitar para concluir.
				</Dialog.Description>
			</Dialog.Header>

			<div id="transfer-dialog-form" data-test="transfer-dialog-form" class="space-y-4 py-2">
				<div class="space-y-2">
					<Label for="transfer-admin-select">Administradora de destino</Label>
					<select
						id="transfer-admin-select"
						data-test="transfer-admin-select"
						class="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
						value={transferAdminId}
						disabled={isSubmitting}
						onchange={(event) => {
							transferAdminId = (event.currentTarget as HTMLSelectElement).value;
						}}
					>
						{#each administrators as admin (admin.id)}
							<option
								id={`transfer-admin-option-${admin.id}`}
								data-test="transfer-admin-option"
								value={String(admin.id)}
							>
								{admin.name} · {admin.email}
							</option>
						{/each}
					</select>
				</div>

				<div class="space-y-2">
					<Label for="transfer-outcome-select">Situação do síndico atual após a transferência</Label
					>
					<select
						id="transfer-outcome-select"
						data-test="transfer-outcome-select"
						class="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
						value={transferOutcome}
						disabled={isSubmitting}
						onchange={(event) => {
							transferOutcome = (event.currentTarget as HTMLSelectElement).value as TransferOutcome;
						}}
					>
						<option
							id="transfer-outcome-option-subsindico"
							data-test="transfer-outcome-option"
							value="subsindico"
						>
							Rebaixar para Subsíndico
						</option>
						<option
							id="transfer-outcome-option-tesoureiro"
							data-test="transfer-outcome-option"
							value="tesoureiro"
						>
							Rebaixar para Tesoureiro
						</option>
					</select>
				</div>
			</div>

			<Dialog.Footer>
				<Button
					type="button"
					variant="outline"
					disabled={isSubmitting}
					onclick={() => {
						showTransferDialog = false;
					}}
				>
					Cancelar
				</Button>
				<Button type="button" disabled={isSubmitting} onclick={handleTransferContinue}>
					Continuar
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>

	<Dialog.Root bind:open={showTransferConfirmDialog}>
		<Dialog.Content class="max-w-lg">
			<Dialog.Header>
				<Dialog.Title>Confirmar transferência de gestão</Dialog.Title>
				<Dialog.Description>
					{#if selectedTransferAdmin}
						A gestão será transferida para {selectedTransferAdmin.name} e só será concluída após o aceite
						da Administradora.
					{/if}
				</Dialog.Description>
			</Dialog.Header>

			<div
				id="transfer-confirm-dialog-warning"
				data-test="transfer-confirm-dialog-warning"
				class="rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-900"
			>
				Esta é a primeira confirmação do fluxo. A Administradora ainda precisará aceitar para
				assumir a gestão total.
			</div>

			<Dialog.Footer>
				<Button
					type="button"
					variant="outline"
					disabled={isSubmitting}
					onclick={() => {
						showTransferConfirmDialog = false;
					}}
				>
					Cancelar
				</Button>
				<Button type="button" disabled={isSubmitting} onclick={() => void handleConfirmTransfer()}>
					Confirmar transferência
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>

	<Dialog.Root bind:open={showAcceptTransferDialog}>
		<Dialog.Content class="max-w-lg">
			<Dialog.Header>
				<Dialog.Title>Aceitar transferência de gestão</Dialog.Title>
				<Dialog.Description>
					{#if acceptTransferTarget}
						Você está aceitando a gestão transferida por {acceptTransferTarget.fromUserName}.
					{/if}
				</Dialog.Description>
			</Dialog.Header>

			<div
				id="accept-transfer-dialog-warning"
				data-test="accept-transfer-dialog-warning"
				class="rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-900"
			>
				Este é o segundo aceite do fluxo. Após confirmar, a Administradora assume a gestão total do
				condomínio.
			</div>

			<Dialog.Footer>
				<Button
					type="button"
					variant="outline"
					disabled={isSubmitting}
					onclick={() => {
						showAcceptTransferDialog = false;
					}}
				>
					Cancelar
				</Button>
				<Button
					type="button"
					disabled={isSubmitting}
					onclick={() => void handleConfirmTransferAcceptance()}
				>
					Aceitar gestão
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
</main>
