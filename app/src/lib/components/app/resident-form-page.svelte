<script lang="ts">
	import { goto } from '$app/navigation';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import PencilLineIcon from '@lucide/svelte/icons/pencil-line';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import UserIcon from '@lucide/svelte/icons/user';
	import { onMount } from 'svelte';
	import Logo from '$lib/components/app/logo/index.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { listUnits, type Unit } from '$lib/services/units.js';
	import {
		createResident,
		deleteResident,
		getResident,
		updateResident,
		type Resident
	} from '$lib/services/residents.js';
	import { cn } from '$lib/utils.js';

	interface Props {
		mode: 'create' | 'edit' | 'view';
		condominiumCode: string;
		residentId?: number | null;
	}

	let { mode, condominiumCode, residentId = null }: Props = $props();

	let units = $state<Unit[]>([]);
	let resident = $state<Resident | null>(null);
	let isLoading = $state(true);
	let isSubmitting = $state(false);
	let isDeleting = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');

	let formName = $state('');
	let formCpf = $state('');
	let formEmail = $state('');
	let formPhone = $state('');
	let formUnitKey = $state('');
	let formType = $state<'owner' | 'tenant'>('owner');
	let formMoveInDate = $state('');

	const isEditMode = $derived(mode === 'edit');
	const isViewMode = $derived(mode === 'view');
	const isCreateMode = $derived(mode === 'create');

	const selectedUnit = $derived(
		units.find((u) => String(u.id) === formUnitKey) ?? null
	);

	function getTypeLabel(type: 'owner' | 'tenant'): string {
		return type === 'owner' ? 'Proprietário' : 'Inquilino';
	}

	function getViewTitle(r: Resident | null): string {
		if (!r) return 'Ver morador';
		return `${r.name} • ${getTypeLabel(r.type)}${r.unit_code ? ` • ${r.unit_code}` : ''}`;
	}

	function normalizeCpf(value: string): string {
		const digits = value.replaceAll(/\D/g, '').slice(0, 11);
		if (digits.length <= 3) return digits;
		if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
		if (digits.length <= 9)
			return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
		return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
	}

	function normalizePhone(value: string): string {
		const digits = value.replaceAll(/\D/g, '').slice(0, 11);
		if (digits.length === 0) return '';
		if (digits.length <= 2) return `(${digits}`;
		if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
		return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
	}

	function getUnitOptionLabel(unit: Unit): string {
		const floor = unit.floor?.trim();
		const floorLabel = floor ? `${floor}º andar · ` : '';
		return `${floorLabel}${unit.identifier} — ${unit.code}`;
	}

	function formatDate(dateString: string | null): string {
		if (!dateString) return 'Não informada';
		const [year, month, day] = dateString.split('-');
		if (!year || !month || !day) return dateString;
		return `${day}/${month}/${year}`;
	}

	function hydrateForm(source: Resident): void {
		resident = source;
		formName = source.name;
		formCpf = source.cpf;
		formEmail = source.email;
		formPhone = source.phone;
		formUnitKey = source.unit_id != null ? String(source.unit_id) : '';
		formType = source.type;
		formMoveInDate = source.move_in_date ?? '';
	}

	function resetForm(): void {
		formName = '';
		formCpf = '';
		formEmail = '';
		formPhone = '';
		formUnitKey = units.length > 0 ? String(units[0]!.id) : '';
		formType = 'owner';
		formMoveInDate = '';
	}

	async function loadPageData(): Promise<void> {
		isLoading = true;
		errorMessage = '';

		try {
			units = (await listUnits(condominiumCode)).data;

			if (isEditMode || isViewMode) {
				if (!residentId || residentId <= 0) {
					throw new Error('Morador inválido.');
				}
				const loaded = await getResident(condominiumCode, residentId);
				hydrateForm(loaded);
			} else {
				resetForm();
			}
		} catch (error) {
			errorMessage =
				error instanceof Error
					? error.message
					: 'Não foi possível carregar o formulário do morador.';
		} finally {
			isLoading = false;
		}
	}

	async function handleCreate(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		errorMessage = '';
		successMessage = '';

		if (formName.trim().length === 0) {
			errorMessage = 'Informe o nome completo do morador.';
			return;
		}

		const cpfDigits = formCpf.replaceAll(/\D/g, '');
		if (cpfDigits.length !== 11) {
			errorMessage = 'Informe um CPF válido com 11 dígitos.';
			return;
		}

		isSubmitting = true;

		try {
			await createResident(condominiumCode, {
				unit_id: selectedUnit?.id ?? null,
				unit_code: selectedUnit?.code ?? null,
				name: formName.trim(),
				cpf: formCpf,
				email: formEmail.trim(),
				phone: formPhone,
				type: formType,
				move_in_date: formMoveInDate || null
			});

			await goto(`/g/${condominiumCode}/moradores`);
		} catch (error) {
			errorMessage =
				error instanceof Error ? error.message : 'Não foi possível cadastrar o morador.';
		} finally {
			isSubmitting = false;
		}
	}

	async function handleUpdate(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		errorMessage = '';
		successMessage = '';

		if (!resident) {
			errorMessage = 'Selecione um morador válido para edição.';
			return;
		}

		if (formName.trim().length === 0) {
			errorMessage = 'Informe o nome completo do morador.';
			return;
		}

		const cpfDigits = formCpf.replaceAll(/\D/g, '');
		if (cpfDigits.length !== 11) {
			errorMessage = 'Informe um CPF válido com 11 dígitos.';
			return;
		}

		isSubmitting = true;

		try {
			await updateResident(condominiumCode, resident.id, {
				unit_id: selectedUnit?.id ?? null,
				unit_code: selectedUnit?.code ?? null,
				name: formName.trim(),
				cpf: formCpf,
				email: formEmail.trim(),
				phone: formPhone,
				type: formType,
				move_in_date: formMoveInDate || null
			});

			await goto(`/g/${condominiumCode}/moradores`);
		} catch (error) {
			errorMessage =
				error instanceof Error ? error.message : 'Não foi possível atualizar o morador.';
		} finally {
			isSubmitting = false;
		}
	}

	async function handleDelete(): Promise<void> {
		if (!resident) {
			errorMessage = 'Selecione um morador válido para exclusão.';
			return;
		}

		errorMessage = '';
		successMessage = '';
		isDeleting = true;

		try {
			await deleteResident(condominiumCode, resident.id);
			await goto(`/g/${condominiumCode}/moradores`);
		} catch (error) {
			errorMessage =
				error instanceof Error ? error.message : 'Não foi possível excluir o morador.';
		} finally {
			isDeleting = false;
		}
	}

	onMount(async () => {
		await loadPageData();
	});
</script>

<main class="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-5 sm:px-6">
	<section class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
		<div class="flex flex-col gap-1">
			<h1 class="text-2xl font-semibold tracking-tight text-foreground">
				{isEditMode ? 'Editar morador' : isViewMode ? getViewTitle(resident) : 'Novo morador'}
			</h1>
		</div>

		<div class="flex flex-wrap items-center justify-end gap-2">
			{#if isViewMode && residentId}
				<Button
					type="button"
					onclick={() => {
						void goto(`/g/${condominiumCode}/moradores/${residentId}/editar`);
					}}
				>
					<PencilLineIcon class="mr-2 size-4" />
					Editar morador
				</Button>
			{/if}

			<Button
				type="button"
				variant="outline"
				onclick={() => {
					void goto(`/g/${condominiumCode}/moradores`);
				}}
			>
				<ArrowLeftIcon class="mr-2 size-4" />
				Voltar para listagem
			</Button>
		</div>
	</section>

	{#if isLoading}
		<Card.Root>
			<Card.Content class="py-10">
				<div class="flex flex-col items-center justify-center gap-4 text-center">
					<div class="rounded-2xl border border-border/70 bg-background p-4 shadow-sm">
						<Logo class="h-10" />
					</div>
					<p class="text-sm text-muted-foreground">Carregando...</p>
				</div>
			</Card.Content>
		</Card.Root>
	{:else}
		<div class="flex flex-col gap-4">
			{#if errorMessage}
				<div
					class="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
				>
					{errorMessage}
				</div>
			{/if}

			{#if successMessage}
				<div
					class="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
				>
					{successMessage}
				</div>
			{/if}

			{#if isCreateMode || isEditMode}
				<Card.Root>
					<Card.Header>
						<Card.Title>{isCreateMode ? 'Cadastro do morador' : 'Dados do morador'}</Card.Title>
						<Card.Description>
							{isCreateMode
								? 'Preencha os dados do novo morador e associe-o a uma unidade.'
								: 'Atualize os dados do morador conforme necessário.'}
						</Card.Description>
					</Card.Header>
					<Card.Content>
						<form
							class="flex flex-col gap-4"
							onsubmit={isCreateMode ? handleCreate : handleUpdate}
						>
							<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div class="space-y-2 sm:col-span-2">
									<Label for="resident-name">Nome completo</Label>
									<Input
										id="resident-name"
										value={formName}
										placeholder="Ex.: João da Silva"
										disabled={isSubmitting}
										oninput={(event) => {
											const target = event.currentTarget as HTMLInputElement;
											formName = target.value;
										}}
									/>
								</div>

								<div class="space-y-2">
									<Label for="resident-cpf">CPF</Label>
									<Input
										id="resident-cpf"
										value={formCpf}
										placeholder="000.000.000-00"
										inputmode="numeric"
										disabled={isSubmitting}
										oninput={(event) => {
											const target = event.currentTarget as HTMLInputElement;
											formCpf = normalizeCpf(target.value);
										}}
									/>
								</div>

								<div class="space-y-2">
									<Label for="resident-type">Tipo</Label>
									<select
										id="resident-type"
										class="flex h-9 w-full rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50"
										value={formType}
										disabled={isSubmitting}
										onchange={(event) => {
											const target = event.currentTarget as HTMLSelectElement;
											formType = target.value as 'owner' | 'tenant';
										}}
									>
										<option value="owner">Proprietário</option>
										<option value="tenant">Inquilino</option>
									</select>
								</div>

								<div class="space-y-2">
									<Label for="resident-phone">Telefone</Label>
									<Input
										id="resident-phone"
										value={formPhone}
										placeholder="(00) 90000-0000"
										inputmode="tel"
										disabled={isSubmitting}
										oninput={(event) => {
											const target = event.currentTarget as HTMLInputElement;
											formPhone = normalizePhone(target.value);
										}}
									/>
								</div>

								<div class="space-y-2">
									<Label for="resident-email">E-mail</Label>
									<Input
										id="resident-email"
										type="email"
										value={formEmail}
										placeholder="morador@email.com"
										disabled={isSubmitting}
										oninput={(event) => {
											const target = event.currentTarget as HTMLInputElement;
											formEmail = target.value;
										}}
									/>
								</div>

								<div class="space-y-2">
									<Label for="resident-unit">Unidade</Label>
									<select
										id="resident-unit"
										class="flex h-9 w-full rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50"
										value={formUnitKey}
										disabled={isSubmitting}
										onchange={(event) => {
											const target = event.currentTarget as HTMLSelectElement;
											formUnitKey = target.value;
										}}
									>
										<option value="">Sem unidade</option>
										{#each units as unit (unit.id)}
											<option value={String(unit.id)}>{getUnitOptionLabel(unit)}</option>
										{/each}
									</select>
									<p class="text-xs text-muted-foreground">
										Opcional. Associe o morador a uma unidade do condomínio.
									</p>
								</div>

								<div class="space-y-2">
									<Label for="resident-move-in-date">Data de entrada</Label>
									<Input
										id="resident-move-in-date"
										type="date"
										value={formMoveInDate}
										disabled={isSubmitting}
										oninput={(event) => {
											const target = event.currentTarget as HTMLInputElement;
											formMoveInDate = target.value;
										}}
									/>
									<p class="text-xs text-muted-foreground">
										Opcional. Data em que o morador passou a residir no condomínio.
									</p>
								</div>
							</div>

							<div class="flex items-center justify-between gap-3">
								<Button
									type="button"
									variant="ghost"
									onclick={resetForm}
									disabled={isSubmitting}
								>
									Limpar
								</Button>
								<Button type="submit" disabled={isSubmitting}>
									{#if isSubmitting}
										{isCreateMode ? 'Cadastrando...' : 'Salvando...'}
									{:else}
										{isCreateMode ? 'Cadastrar morador' : 'Salvar alterações'}
									{/if}
								</Button>
							</div>
						</form>
					</Card.Content>
				</Card.Root>

				{#if isEditMode && resident}
					<Card.Root>
						<Card.Header>
							<Card.Title>Excluir morador</Card.Title>
							<Card.Description>
								Esta ação remove permanentemente o cadastro do morador.
							</Card.Description>
						</Card.Header>
						<Card.Content>
							<div class="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
								<div class="flex items-start justify-between gap-3">
									<div class="space-y-1">
										<h2 class="font-semibold text-foreground">Remover morador</h2>
										<p class="text-sm text-muted-foreground">
											O cadastro será excluído e o morador deixará de constar na listagem.
										</p>
									</div>
									<Button
										type="button"
										variant="destructive"
										disabled={isDeleting}
										onclick={handleDelete}
									>
										<Trash2Icon class="mr-2 size-4" />
										{isDeleting ? 'Excluindo...' : 'Excluir'}
									</Button>
								</div>
							</div>
						</Card.Content>
					</Card.Root>
				{/if}
			{:else if isViewMode && resident}
				<Card.Root>
					<Card.Header>
						<Card.Title>Dados do morador</Card.Title>
					</Card.Header>
					<Card.Content>
						<div class="flex flex-col gap-6">
							<div class="flex items-center gap-4">
								<div class="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
									<UserIcon class="size-7" />
								</div>
								<div>
									<div class="text-lg font-semibold text-foreground">{resident.name}</div>
									<span
										class={cn(
											'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
											resident.type === 'owner'
												? 'bg-sky-100 text-sky-700'
												: 'bg-amber-100 text-amber-700'
										)}
									>
										{getTypeLabel(resident.type)}
									</span>
								</div>
							</div>

							<div class="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
								<div>
									<div class="text-xs font-medium uppercase tracking-wider text-muted-foreground">
										CPF
									</div>
									<div class="mt-1 font-mono text-sm text-foreground">{resident.cpf || '—'}</div>
								</div>

								<div>
									<div class="text-xs font-medium uppercase tracking-wider text-muted-foreground">
										Telefone
									</div>
									<div class="mt-1 text-sm text-foreground">{resident.phone || '—'}</div>
								</div>

								<div>
									<div class="text-xs font-medium uppercase tracking-wider text-muted-foreground">
										E-mail
									</div>
									<div class="mt-1 text-sm text-foreground">{resident.email || '—'}</div>
								</div>

								<div>
									<div class="text-xs font-medium uppercase tracking-wider text-muted-foreground">
										Unidade
									</div>
									<div class="mt-1 text-sm text-foreground">
										{resident.unit_code ?? '—'}
									</div>
								</div>

								<div>
									<div class="text-xs font-medium uppercase tracking-wider text-muted-foreground">
										Data de entrada
									</div>
									<div class="mt-1 text-sm text-foreground">
										{formatDate(resident.move_in_date)}
									</div>
								</div>

								<div>
									<div class="text-xs font-medium uppercase tracking-wider text-muted-foreground">
										Cadastrado em
									</div>
									<div class="mt-1 text-sm text-foreground">
										{new Date(resident.created_at).toLocaleDateString('pt-BR')}
									</div>
								</div>
							</div>
						</div>
					</Card.Content>
				</Card.Root>
			{/if}
		</div>
	{/if}
</main>
