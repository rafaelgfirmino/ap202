<script lang="ts">
	import { goto } from '$app/navigation';
	import EyeIcon from '@lucide/svelte/icons/eye';
	import LockIcon from '@lucide/svelte/icons/lock';
	import LockOpenIcon from '@lucide/svelte/icons/lock-open';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import { onMount } from 'svelte';
	import CardEmpty from '$lib/components/app/card-empty/index.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import {
		createBalancete,
		listBalancetes,
		type BalanceteSummary
	} from '$lib/services/balancete.js';
	import { cn } from '$lib/utils.js';
	import posthog from 'posthog-js';

	interface Props {
		params: { code: string };
	}

	let { params }: Props = $props();

	let balancetes = $state<BalanceteSummary[]>([]);
	let isLoading = $state(true);
	let errorMessage = $state('');

	let showDialog = $state(false);
	let newMonth = $state(new Date().toISOString().slice(0, 7));
	let isCreating = $state(false);
	let createError = $state('');

	function formatMonth(month: string): string {
		const [year, m] = month.split('-');
		const months = [
			'Janeiro',
			'Fevereiro',
			'Março',
			'Abril',
			'Maio',
			'Junho',
			'Julho',
			'Agosto',
			'Setembro',
			'Outubro',
			'Novembro',
			'Dezembro'
		];
		return `${months[Number(m) - 1] ?? m} / ${year}`;
	}

	function formatCurrency(v: number): string {
		return v.toLocaleString('pt-BR', {
			style: 'currency',
			currency: 'BRL',
			minimumFractionDigits: 2
		});
	}

	function formatClosedDate(date: string | null): string {
		if (!date) return '';
		return new Date(date).toLocaleDateString('pt-BR');
	}

	async function loadBalancetes(): Promise<void> {
		isLoading = true;
		errorMessage = '';
		try {
			balancetes = await listBalancetes(params.code);
		} catch (error) {
			errorMessage =
				error instanceof Error ? error.message : 'Não foi possível carregar os balancetes.';
		} finally {
			isLoading = false;
		}
	}

	async function handleCreate(): Promise<void> {
		createError = '';
		if (!newMonth) {
			createError = 'Selecione a competência.';
			return;
		}
		isCreating = true;
		try {
			const created = await createBalancete(params.code, newMonth);
			posthog.capture('balancete_created', {
				condominium_code: params.code,
				month: newMonth,
				balancete_id: created.id
			});
			showDialog = false;
			await goto(`/g/${params.code}/balancete/${created.id}`);
		} catch (error) {
			createError = error instanceof Error ? error.message : 'Não foi possível criar o balancete.';
		} finally {
			isCreating = false;
		}
	}

	onMount(async () => {
		await loadBalancetes();
	});
</script>

<svelte:head>
	<title>Balancetes</title>
</svelte:head>

<main class="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6">
	<section class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
		<div>
			<h1 class="text-2xl font-semibold tracking-tight text-foreground">Balancetes</h1>
			<p class="mt-1 text-sm text-muted-foreground">
				Prestação de contas mensal baseada no livro-caixa, com fechamento e snapshot controlados.
			</p>
		</div>

		<Button
			type="button"
			onclick={() => {
				createError = '';
				showDialog = true;
			}}
		>
			<PlusIcon class="mr-2 size-4" />
			Abrir balancete
		</Button>
	</section>

	<!-- DIALOG: novo balancete -->
	<Dialog.Root bind:open={showDialog}>
		<Dialog.Content class="max-w-sm">
			<Dialog.Header>
				<Dialog.Title>Abrir novo balancete</Dialog.Title>
				<Dialog.Description>
					Selecione a competência mensal. O balancete nasce como rascunho e pode ser fechado após
					conferência.
				</Dialog.Description>
			</Dialog.Header>

			<div class="flex flex-col gap-4 py-2">
				{#if createError}
					<div
						class="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{createError}
					</div>
				{/if}
				<div class="space-y-2">
					<Label for="new-month">Competência</Label>
					<Input
						id="new-month"
						type="month"
						value={newMonth}
						oninput={(e) => {
							newMonth = (e.currentTarget as HTMLInputElement).value;
						}}
					/>
				</div>
			</div>

			<Dialog.Footer>
				<Button
					variant="outline"
					onclick={() => {
						showDialog = false;
					}}
					disabled={isCreating}
				>
					Cancelar
				</Button>
				<Button onclick={handleCreate} disabled={isCreating}>
					{isCreating ? 'Criando…' : 'Abrir balancete'}
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title>Histórico de balancetes</Card.Title>
		</Card.Header>
		<Card.Content class="p-0">
			{#if isLoading}
				<div class="px-6 py-8 text-sm text-muted-foreground">Carregando balancetes…</div>
			{:else if errorMessage}
				<div
					class="mx-6 mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
				>
					{errorMessage}
				</div>
			{:else if balancetes.length === 0}
				<div class="p-4">
					<CardEmpty
						title="Nenhum balancete aberto"
						description="Crie o primeiro balancete para começar a registrar despesas e receitas do condomínio."
						actionLabel="Abrir balancete"
						onAction={() => {
							showDialog = true;
						}}
					/>
				</div>
			{:else}
				<Tooltip.Provider>
					<Table.Root class="text-sm">
						<Table.Header class="bg-muted/35">
							<Table.Row class="hover:bg-transparent">
								<Table.Head class="w-50 pl-6">Competência</Table.Head>
								<Table.Head class="w-32">Status</Table.Head>
								<Table.Head class="w-40">Despesas realizadas</Table.Head>
								<Table.Head class="w-40">Receitas realizadas</Table.Head>
								<Table.Head class="w-24">Lançamentos</Table.Head>
								<Table.Head class="w-40 text-muted-foreground">Fechado em</Table.Head>
								<Table.Head class="w-20 pr-6 text-right">Ações</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each balancetes as b (b.id)}
								<Table.Row
									class="cursor-pointer"
									onclick={() => void goto(`/g/${params.code}/balancete/${b.id}`)}
								>
									<Table.Cell class="pl-6 font-medium text-foreground">
										{formatMonth(b.month)}
									</Table.Cell>

									<Table.Cell>
										<span
											class={cn(
												'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
												b.status === 'draft'
													? 'bg-emerald-100 text-emerald-700'
													: b.status === 'reopened'
														? 'bg-amber-100 text-amber-700'
														: 'bg-muted text-muted-foreground'
											)}
										>
											{#if b.status === 'draft'}
												<LockOpenIcon class="size-3" />
												Rascunho
											{:else if b.status === 'reopened'}
												<LockOpenIcon class="size-3" />
												Reaberto
											{:else}
												<LockIcon class="size-3" />
												Fechado
											{/if}
										</span>
									</Table.Cell>

									<Table.Cell class="font-medium text-rose-700">
										{formatCurrency(b.total_expenses)}
									</Table.Cell>

									<Table.Cell class="font-medium text-emerald-700">
										{formatCurrency(b.total_revenues)}
									</Table.Cell>

									<Table.Cell class="text-muted-foreground">
										{b.entry_count}
									</Table.Cell>

									<Table.Cell class="text-muted-foreground">
										{b.closed_at ? formatClosedDate(b.closed_at) : '—'}
									</Table.Cell>

									<Table.Cell class="pr-6 text-right">
										<Tooltip.Root>
											<Tooltip.Trigger>
												<Button
													type="button"
													variant="outline"
													size="icon"
													class="size-8"
													onclick={(e) => {
														e.stopPropagation();
														void goto(`/g/${params.code}/balancete/${b.id}`);
													}}
												>
													<EyeIcon class="size-4" />
												</Button>
											</Tooltip.Trigger>
											<Tooltip.Content side="top">Ver balancete</Tooltip.Content>
										</Tooltip.Root>
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
