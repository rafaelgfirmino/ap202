<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import { onMount } from 'svelte';
	import CardEmpty from '$lib/components/app/card-empty/index.svelte';
	import ContaAPagarFormPage from '$lib/components/app/conta-a-pagar-form-page.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import {
		listContasAPagar,
		markAsPaid,
		deleteConta,
		type ContaAPagar
	} from '$lib/services/contas-a-pagar.js';
	import { listBankAccounts, type BankAccount } from '$lib/services/bank-accounts.js';
	import { cn } from '$lib/utils.js';
	import posthog from 'posthog-js';

	interface Props {
		params: { code: string };
	}

	let { params }: Props = $props();

	let contas = $state<ContaAPagar[]>([]);
	let bankAccounts = $state<BankAccount[]>([]);
	let isLoading = $state(true);
	let errorMessage = $state('');

	// Create/edit dialog
	let showFormDialog = $state(false);
	let formContaId = $state<number | null>(null);

	type StatusFilter = 'all' | 'pending' | 'paid';
	let statusFilter = $state<StatusFilter>('all');
	let monthFilter = $state(new Date().toISOString().slice(0, 7));

	// Mark as paid dialog
	let showPayDialog = $state(false);
	let payTarget = $state<ContaAPagar | null>(null);
	let payDate = $state(new Date().toISOString().slice(0, 10));
	let payBankAccountId = $state('');
	let isPaying = $state(false);
	let payError = $state('');

	// Delete confirmation dialog
	let showDeleteDialog = $state(false);
	let deleteTarget = $state<ContaAPagar | null>(null);
	let isDeleting = $state(false);
	let deleteError = $state('');

	function formatDate(date: string): string {
		const [year, month, day] = date.split('-');
		return `${day}/${month}/${year}`;
	}

	function formatCurrency(value: number): string {
		return value.toLocaleString('pt-BR', {
			style: 'currency',
			currency: 'BRL',
			minimumFractionDigits: 2
		});
	}

	function isOverdue(conta: ContaAPagar): boolean {
		if (conta.status !== 'pending') return false;
		const today = new Date().toISOString().slice(0, 10);
		return conta.due_date < today;
	}

	async function loadData(): Promise<void> {
		isLoading = true;
		errorMessage = '';
		try {
			const [contasList, bankList] = await Promise.all([
				listContasAPagar(params.code, {
					status: statusFilter === 'all' ? undefined : statusFilter,
					month: monthFilter || undefined
				}),
				listBankAccounts(params.code)
			]);
			contas = contasList;
			bankAccounts = bankList;
			if (bankAccounts.length > 0 && !payBankAccountId) {
				payBankAccountId = String(bankAccounts[0]!.id);
			}
		} catch (error) {
			errorMessage =
				error instanceof Error ? error.message : 'Não foi possível carregar as contas.';
		} finally {
			isLoading = false;
		}
	}

	function openPayDialog(conta: ContaAPagar): void {
		payTarget = conta;
		payDate = new Date().toISOString().slice(0, 10);
		payBankAccountId = bankAccounts.length > 0 ? String(bankAccounts[0]!.id) : '';
		payError = '';
		showPayDialog = true;
	}

	function openCreateDialog(): void {
		formContaId = null;
		showFormDialog = true;
	}

	function openEditDialog(conta: ContaAPagar): void {
		formContaId = conta.id;
		showFormDialog = true;
	}

	async function handleFormSaved(): Promise<void> {
		showFormDialog = false;
		formContaId = null;
		await loadData();
	}

	async function handleMarkAsPaid(): Promise<void> {
		if (!payTarget) return;
		payError = '';
		if (!payDate) {
			payError = 'Informe a data do pagamento.';
			return;
		}
		if (!payBankAccountId) {
			payError = 'Selecione a conta bancária.';
			return;
		}
		isPaying = true;
		try {
			await markAsPaid(params.code, payTarget.id, {
				payment_date: payDate,
				bank_account_id: Number(payBankAccountId)
			});
			posthog.capture('conta_a_pagar_paid', {
				condominium_code: params.code,
				conta_id: payTarget.id,
				value: payTarget.value,
				category: payTarget.category
			});
			showPayDialog = false;
			payTarget = null;
			await loadData();
		} catch (error) {
			posthog.captureException(error);
			payError = error instanceof Error ? error.message : 'Não foi possível registrar o pagamento.';
		} finally {
			isPaying = false;
		}
	}

	function openDeleteDialog(conta: ContaAPagar): void {
		deleteTarget = conta;
		deleteError = '';
		showDeleteDialog = true;
	}

	async function handleDelete(): Promise<void> {
		if (!deleteTarget) return;
		deleteError = '';
		isDeleting = true;
		try {
			const deletedId = deleteTarget.id;
			await deleteConta(params.code, deletedId);
			posthog.capture('conta_a_pagar_deleted', {
				condominium_code: params.code,
				conta_id: deletedId
			});
			showDeleteDialog = false;
			deleteTarget = null;
			await loadData();
		} catch (error) {
			posthog.captureException(error);
			deleteError = error instanceof Error ? error.message : 'Não foi possível excluir a conta.';
		} finally {
			isDeleting = false;
		}
	}

	onMount(async () => {
		await loadData();
	});
</script>

<svelte:head>
	<title>Contas a Pagar</title>
</svelte:head>

<main class="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6">
	<!-- HEADER -->
	<section class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
		<div>
			<h1 class="text-2xl font-semibold tracking-tight text-foreground">Contas a Pagar</h1>
			<p class="mt-1 text-sm text-muted-foreground">
				Gerencie despesas a pagar e registre os pagamentos realizados.
			</p>
		</div>
		<Button type="button" onclick={openCreateDialog}>
			<PlusIcon class="mr-2 size-4" />
			Nova conta
		</Button>
	</section>

	<!-- CREATE/EDIT DIALOG -->
	<Dialog.Root bind:open={showFormDialog}>
		<Dialog.Content
			class="max-h-[90vh] w-[calc(100vw-2rem)] max-w-none overflow-y-auto sm:max-w-[1180px]"
		>
			<Dialog.Header>
				<Dialog.Title
					>{formContaId == null ? 'Nova conta a pagar' : 'Editar conta a pagar'}</Dialog.Title
				>
				<Dialog.Description>
					{formContaId == null
						? 'Cadastre a despesa sem sair da listagem.'
						: 'Atualize os dados da conta selecionada.'}
				</Dialog.Description>
			</Dialog.Header>

			{#key formContaId}
				<ContaAPagarFormPage
					condominiumCode={params.code}
					contaId={formContaId}
					mode="embedded"
					onSaved={handleFormSaved}
					onCancel={() => {
						showFormDialog = false;
						formContaId = null;
					}}
				/>
			{/key}
		</Dialog.Content>
	</Dialog.Root>

	<!-- MARK AS PAID DIALOG -->
	<Dialog.Root bind:open={showPayDialog}>
		<Dialog.Content class="max-w-sm">
			<Dialog.Header>
				<Dialog.Title>Marcar como pago</Dialog.Title>
				<Dialog.Description>
					{#if payTarget}
						<span class="font-medium text-foreground">{payTarget.description}</span>
						&nbsp;·&nbsp;
						<span class="font-semibold text-foreground">{formatCurrency(payTarget.value)}</span>
					{/if}
				</Dialog.Description>
			</Dialog.Header>

			<div class="flex flex-col gap-4 py-2">
				{#if payError}
					<div
						class="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{payError}
					</div>
				{/if}

				<div class="space-y-2">
					<Label for="pay-date">Data do pagamento</Label>
					<Input
						id="pay-date"
						type="date"
						value={payDate}
						oninput={(e) => {
							payDate = (e.currentTarget as HTMLInputElement).value;
						}}
					/>
				</div>

				<div class="space-y-2">
					<Label for="pay-bank">Conta bancária</Label>
					<select
						id="pay-bank"
						class="flex h-9 w-full rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
						value={payBankAccountId}
						onchange={(e) => {
							payBankAccountId = (e.currentTarget as HTMLSelectElement).value;
						}}
					>
						<option value="">Selecione a conta…</option>
						{#each bankAccounts as account (account.id)}
							<option value={String(account.id)}>{account.name}</option>
						{/each}
					</select>
				</div>
			</div>

			<Dialog.Footer>
				<Button
					variant="outline"
					onclick={() => {
						showPayDialog = false;
					}}
					disabled={isPaying}
				>
					Cancelar
				</Button>
				<Button onclick={handleMarkAsPaid} disabled={isPaying}>
					{isPaying ? 'Registrando…' : 'Confirmar pagamento'}
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>

	<!-- DELETE DIALOG -->
	<Dialog.Root bind:open={showDeleteDialog}>
		<Dialog.Content class="max-w-sm">
			<Dialog.Header>
				<Dialog.Title>Excluir conta</Dialog.Title>
				<Dialog.Description>
					{#if deleteTarget}
						Deseja excluir "<span class="font-medium text-foreground"
							>{deleteTarget.description}</span
						>"? Esta ação não pode ser desfeita.
					{/if}
				</Dialog.Description>
			</Dialog.Header>

			{#if deleteError}
				<div
					class="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
				>
					{deleteError}
				</div>
			{/if}

			<Dialog.Footer>
				<Button
					variant="outline"
					onclick={() => {
						showDeleteDialog = false;
					}}
					disabled={isDeleting}
				>
					Cancelar
				</Button>
				<Button variant="destructive" onclick={handleDelete} disabled={isDeleting}>
					{isDeleting ? 'Excluindo…' : 'Excluir'}
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>

	<!-- FILTER BAR -->
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<!-- Status tabs -->
		<div class="flex items-center gap-1 rounded-lg border bg-muted/30 p-1">
			{#each [['all', 'Todas'], ['pending', 'Pendentes'], ['paid', 'Pagas']] as [StatusFilter, string][] as [value, label]}
				<button
					type="button"
					class={cn(
						'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
						statusFilter === value
							? 'bg-background text-foreground shadow-sm'
							: 'text-muted-foreground hover:text-foreground'
					)}
					onclick={async () => {
						statusFilter = value;
						await loadData();
					}}
				>
					{label}
				</button>
			{/each}
		</div>

		<!-- Month filter -->
		<div class="flex items-center gap-2">
			<Label for="month-filter" class="shrink-0 text-sm text-muted-foreground">Competência</Label>
			<Input
				id="month-filter"
				type="month"
				value={monthFilter}
				class="w-40"
				oninput={async (e) => {
					monthFilter = (e.currentTarget as HTMLInputElement).value;
					await loadData();
				}}
			/>
		</div>
	</div>

	<!-- TABLE CARD -->
	<Card.Root>
		<Card.Header>
			<Card.Title>Contas a pagar</Card.Title>
		</Card.Header>
		<Card.Content class="p-0">
			{#if isLoading}
				<div class="px-6 py-8 text-sm text-muted-foreground">Carregando contas…</div>
			{:else if errorMessage}
				<div
					class="mx-6 mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
				>
					{errorMessage}
				</div>
			{:else if contas.length === 0}
				<div class="p-4">
					<CardEmpty
						title="Nenhuma conta encontrada"
						description="Não há contas a pagar para os filtros selecionados. Clique em 'Nova conta' para cadastrar uma despesa."
						actionLabel="Nova conta"
						onAction={openCreateDialog}
					/>
				</div>
			{:else}
				<Tooltip.Provider>
					<Table.Root class="text-sm">
						<Table.Header class="bg-muted/35">
							<Table.Row class="hover:bg-transparent">
								<Table.Head class="w-36 pl-6">Vencimento</Table.Head>
								<Table.Head>Descrição</Table.Head>
								<Table.Head class="w-44">Fornecedor</Table.Head>
								<Table.Head class="w-32">Categoria</Table.Head>
								<Table.Head class="w-24">Escopo</Table.Head>
								<Table.Head class="w-32 text-right">Valor</Table.Head>
								<Table.Head class="w-28">Status</Table.Head>
								<Table.Head class="w-32 pr-6 text-right">Ações</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each contas as conta (conta.id)}
								<Table.Row>
									<!-- Vencimento -->
									<Table.Cell class="pl-6">
										<span
											class={cn(
												'text-sm',
												isOverdue(conta) ? 'font-semibold text-rose-600' : 'text-foreground'
											)}
										>
											{formatDate(conta.due_date)}
										</span>
									</Table.Cell>

									<!-- Descrição -->
									<Table.Cell class="font-medium text-foreground">
										{conta.description}
									</Table.Cell>

									<!-- Fornecedor -->
									<Table.Cell class="text-muted-foreground">
										{conta.supplier_name || 'Fornecedor não informado'}
									</Table.Cell>

									<!-- Categoria -->
									<Table.Cell class="text-muted-foreground">
										{conta.category}
									</Table.Cell>

									<!-- Escopo -->
									<Table.Cell>
										<span
											class={cn(
												'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
												conta.scope === 'geral' && 'bg-sky-100 text-sky-700',
												conta.scope === 'bloco' && 'bg-purple-100 text-purple-700',
												conta.scope === 'unidade' && 'bg-rose-100 text-rose-700'
											)}
										>
											{#if conta.scope === 'geral'}Geral
											{:else if conta.scope === 'bloco'}Bloco
											{:else}Unidade{/if}
										</span>
									</Table.Cell>

									<!-- Valor -->
									<Table.Cell class="text-right font-semibold text-foreground">
										{formatCurrency(conta.value)}
									</Table.Cell>

									<!-- Status -->
									<Table.Cell>
										<span
											class={cn(
												'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
												conta.status === 'pending'
													? 'bg-amber-100 text-amber-700'
													: 'bg-emerald-100 text-emerald-700'
											)}
										>
											{conta.status === 'pending' ? 'Pendente' : 'Pago'}
										</span>
									</Table.Cell>

									<!-- Ações -->
									<Table.Cell class="pr-6 text-right">
										<div class="flex items-center justify-end gap-1">
											{#if conta.status === 'pending'}
												<Tooltip.Root>
													<Tooltip.Trigger>
														<Button
															type="button"
															variant="outline"
															size="icon"
															class="size-8"
															onclick={() => openPayDialog(conta)}
														>
															<CheckIcon class="size-4" />
														</Button>
													</Tooltip.Trigger>
													<Tooltip.Content side="top">Marcar como pago</Tooltip.Content>
												</Tooltip.Root>
											{/if}

											<Tooltip.Root>
												<Tooltip.Trigger>
													<Button
														type="button"
														variant="outline"
														size="icon"
														class="size-8"
														onclick={() => openEditDialog(conta)}
													>
														<PencilIcon class="size-4" />
													</Button>
												</Tooltip.Trigger>
												<Tooltip.Content side="top">Editar</Tooltip.Content>
											</Tooltip.Root>

											{#if conta.status === 'pending'}
												<Tooltip.Root>
													<Tooltip.Trigger>
														<Button
															type="button"
															variant="outline"
															size="icon"
															class="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
															onclick={() => openDeleteDialog(conta)}
														>
															<Trash2Icon class="size-4" />
														</Button>
													</Tooltip.Trigger>
													<Tooltip.Content side="top">Excluir</Tooltip.Content>
												</Tooltip.Root>
											{/if}
										</div>
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Tooltip.Provider>
			{/if}
		</Card.Content>
	</Card.Root>
</main>
