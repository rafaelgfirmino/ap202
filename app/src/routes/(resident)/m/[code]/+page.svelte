<script lang="ts">
	import BuildingIcon from '@lucide/svelte/icons/building';
	import MailIcon from '@lucide/svelte/icons/mail';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import ReceiptIcon from '@lucide/svelte/icons/receipt';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import {
		getResidentDashboard,
		inviteTenantToUnit,
		revokeInvite,
		type ResidentDashboard,
		type ResidentUnit
	} from '$lib/services/resident-portal.js';

	interface Props {
		params: { code: string };
	}

	let { params }: Props = $props();

	let dashboard = $state<ResidentDashboard | null>(null);
	let isLoading = $state(true);
	let isSubmitting = $state(false);
	let errorMessage = $state('');

	let showInviteDialog = $state(false);
	let inviteUnitId = $state<number | null>(null);
	let inviteEmail = $state('');

	const inviteTargetUnit = $derived(
		dashboard?.units.find((u) => u.id === inviteUnitId) ?? null
	);

	const formatMonth = (month: string): string => {
		const [year, m] = month.split('-');
		return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(
			new Date(Number(year), Number(m) - 1, 1)
		);
	};

	const formatDate = (date: string | null): string => {
		if (!date) return '—';
		return new Intl.DateTimeFormat('pt-BR').format(new Date(date + 'T12:00:00'));
	};

	const formatCurrency = (value: number): string =>
		new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

	const formatDateTime = (value: string): string =>
		new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(
			new Date(value)
		);

	function isOverdue(dueDate: string | null): boolean {
		if (!dueDate) return false;
		return new Date(dueDate + 'T23:59:59') < new Date();
	}

	async function loadData(): Promise<void> {
		isLoading = true;
		errorMessage = '';
		try {
			dashboard = await getResidentDashboard(params.code);
		} catch (error) {
			errorMessage =
				error instanceof Error ? error.message : 'Não foi possível carregar os dados.';
		} finally {
			isLoading = false;
		}
	}

	function openInviteDialog(unit: ResidentUnit): void {
		inviteUnitId = unit.id;
		inviteEmail = '';
		errorMessage = '';
		showInviteDialog = true;
	}

	async function handleInviteSubmit(): Promise<void> {
		if (!inviteUnitId || !inviteEmail.trim()) return;
		isSubmitting = true;
		errorMessage = '';
		try {
			await inviteTenantToUnit(params.code, inviteUnitId, inviteEmail.trim());
			showInviteDialog = false;
			await loadData();
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Não foi possível enviar o convite.';
		} finally {
			isSubmitting = false;
		}
	}

	async function handleRevokeInvite(unitId: number, inviteId: number): Promise<void> {
		isSubmitting = true;
		try {
			await revokeInvite(params.code, unitId, inviteId);
			await loadData();
		} catch {
			// silent
		} finally {
			isSubmitting = false;
		}
	}

	onMount(() => {
		void loadData();
	});
</script>

<svelte:head>
	<title>Portal do Morador</title>
</svelte:head>

<div id="resident-page-root" data-test="resident-page-root" class="flex flex-col gap-6">
	<section class="flex flex-col gap-1">
		<h1 class="text-2xl font-semibold tracking-tight text-foreground">
			{dashboard?.condominiumName ?? 'Portal do Morador'}
		</h1>
		<p class="text-sm text-muted-foreground">
			Acompanhe seus boletos e gerencie o acesso das suas unidades.
		</p>
	</section>

	{#if errorMessage}
		<div
			id="resident-page-error"
			data-test="resident-page-error"
			class="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
		>
			{errorMessage}
		</div>
	{/if}

	{#if isLoading}
		<div class="text-sm text-muted-foreground">Carregando suas unidades...</div>
	{:else if !dashboard || dashboard.units.length === 0}
		<Card.Root class="border-dashed">
			<Card.Content class="flex flex-col items-center gap-3 py-12 text-center">
				<BuildingIcon class="size-8 text-muted-foreground/50" />
				<div class="space-y-1">
					<p class="text-sm font-medium text-foreground">Nenhuma unidade vinculada</p>
					<p class="max-w-sm text-sm text-muted-foreground">
						Você ainda não possui unidades vinculadas a este condomínio. Entre em contato com a
						administração.
					</p>
				</div>
			</Card.Content>
		</Card.Root>
	{:else}
		<div class="flex flex-col gap-6">
			{#each dashboard.units as unit (unit.id)}
				<Card.Root
					id={`unit-card-${unit.id}`}
					data-test="unit-card"
				>
					<Card.Header class="pb-3">
						<div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
							<div class="flex flex-col gap-0.5">
								<Card.Title class="flex items-center gap-2 text-lg">
									<BuildingIcon class="size-4 shrink-0 text-muted-foreground" />
									Apto {unit.identifier}
									{#if unit.groupName}
										<span class="text-muted-foreground">·</span>
										<span class="font-normal text-muted-foreground">{unit.groupName}</span>
									{/if}
									{#if unit.floor}
										<span class="text-muted-foreground">·</span>
										<span class="text-sm font-normal text-muted-foreground">{unit.floor}</span>
									{/if}
								</Card.Title>
							</div>

							<span
								class={unit.role === 'proprietario'
									? 'w-fit shrink-0 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700'
									: 'w-fit shrink-0 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700'}
							>
								{unit.role === 'proprietario' ? 'Proprietário' : 'Inquilino'}
							</span>
						</div>
					</Card.Header>

					<Card.Content class="flex flex-col gap-6">
						<!-- Boletos section -->
						<div id={`unit-boletos-${unit.id}`} data-test="unit-boletos" class="flex flex-col gap-3">
							<div class="flex items-center gap-2">
								<ReceiptIcon class="size-4 text-muted-foreground" />
								<h3 class="text-sm font-medium text-foreground">Boletos</h3>
							</div>

							{#if unit.boletos.length === 0}
								<p class="text-sm text-muted-foreground">
									Nenhum boleto disponível. Os boletos aparecem quando o balancete do mês é fechado.
								</p>
							{:else}
								<div class="overflow-x-auto rounded-lg border border-border/60">
									<Table.Root>
										<Table.Header>
											<Table.Row class="bg-muted/40">
												<Table.Head class="text-xs">Competência</Table.Head>
												<Table.Head class="text-xs">Vencimento</Table.Head>
												<Table.Head class="text-right text-xs">Valor</Table.Head>
												<Table.Head class="text-xs">Status</Table.Head>
												<Table.Head class="text-right text-xs">Ações</Table.Head>
											</Table.Row>
										</Table.Header>
										<Table.Body>
											{#each unit.boletos as boleto (boleto.balanceteId)}
												<Table.Row id={`boleto-row-${boleto.balanceteId}`} data-test="boleto-row">
													<Table.Cell class="text-sm">
														{formatMonth(boleto.month)}
													</Table.Cell>
													<Table.Cell
														class={boleto.dueDate && isOverdue(boleto.dueDate) && !boleto.isPaid
															? 'text-sm font-medium text-rose-600'
															: 'text-sm'}
													>
														{formatDate(boleto.dueDate)}
													</Table.Cell>
													<Table.Cell class="text-right text-sm font-medium">
														{formatCurrency(boleto.unitValue)}
													</Table.Cell>
													<Table.Cell>
														{#if boleto.isPaid}
															<span
																class="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
															>
																Pago
															</span>
														{:else if boleto.dueDate && isOverdue(boleto.dueDate)}
															<span
																class="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700"
															>
																Vencido
															</span>
														{:else}
															<span
																class="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"
															>
																Pendente
															</span>
														{/if}
													</Table.Cell>
													<Table.Cell class="text-right">
														<div class="flex items-center justify-end gap-2">
															<a
																href={`/g/${params.code}/balancete/${boleto.balanceteId}`}
																class="text-xs font-medium text-primary underline-offset-4 hover:underline"
															>
																Ver balancete
															</a>
														</div>
													</Table.Cell>
												</Table.Row>
											{/each}
										</Table.Body>
									</Table.Root>
								</div>
							{/if}
						</div>

						<!-- Tenant invites (owners only) -->
						{#if unit.role === 'proprietario'}
							<div
								id={`unit-inquilinos-${unit.id}`}
								data-test="unit-inquilinos"
								class="flex flex-col gap-3"
							>
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-2">
										<MailIcon class="size-4 text-muted-foreground" />
										<h3 class="text-sm font-medium text-foreground">Inquilinos</h3>
									</div>
									<Button
										type="button"
										size="sm"
										variant="outline"
										disabled={isSubmitting}
										onclick={() => openInviteDialog(unit)}
									>
										<PlusIcon class="mr-1.5 size-3.5" />
										Convidar inquilino
									</Button>
								</div>

								{#if unit.tenantInvites.length === 0}
									<p class="text-sm text-muted-foreground">
										Nenhum inquilino vinculado a esta unidade.
									</p>
								{:else}
									<div class="flex flex-col gap-2">
										{#each unit.tenantInvites as invite (invite.id)}
											<div
												id={`invite-item-${invite.id}`}
												data-test="invite-item"
												class="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2"
											>
												<div class="flex flex-col gap-0.5">
													<span class="text-sm font-medium text-foreground">{invite.email}</span>
													<span class="text-xs text-muted-foreground">
														Convidado em {formatDateTime(invite.invitedAt)}
													</span>
												</div>
												<div class="flex items-center gap-2">
													<span
														class={invite.status === 'accepted'
															? 'rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700'
															: 'rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700'}
													>
														{invite.status === 'accepted' ? 'Aceito' : 'Pendente'}
													</span>
													{#if invite.status === 'pending'}
														<button
															type="button"
															class="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
															disabled={isSubmitting}
															onclick={() => void handleRevokeInvite(unit.id, invite.id)}
														>
															<TrashIcon class="size-3.5" />
														</button>
													{/if}
												</div>
											</div>
										{/each}
									</div>
								{/if}
							</div>
						{/if}
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	{/if}
</div>

<!-- Invite tenant dialog -->
<Dialog.Root bind:open={showInviteDialog}>
	<Dialog.Content class="max-w-md">
		<Dialog.Header>
			<Dialog.Title>Convidar inquilino</Dialog.Title>
			<Dialog.Description>
				{#if inviteTargetUnit}
					O inquilino terá acesso ao portal para Apto {inviteTargetUnit.identifier} ·
					{inviteTargetUnit.groupName}: poderá visualizar boletos e balancetes desta unidade.
				{/if}
			</Dialog.Description>
		</Dialog.Header>

		<div id="invite-tenant-form" data-test="invite-tenant-form" class="space-y-4 py-2">
			<div class="space-y-2">
				<Label for="invite-tenant-email">E-mail do inquilino</Label>
				<Input
					id="invite-tenant-email"
					type="email"
					value={inviteEmail}
					placeholder="nome@email.com"
					disabled={isSubmitting}
					oninput={(event) => {
						inviteEmail = (event.currentTarget as HTMLInputElement).value;
					}}
				/>
			</div>

			{#if errorMessage}
				<p class="text-sm text-destructive">{errorMessage}</p>
			{/if}
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
			<Button
				type="button"
				disabled={isSubmitting || !inviteEmail.trim()}
				onclick={() => void handleInviteSubmit()}
			>
				Enviar convite
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
