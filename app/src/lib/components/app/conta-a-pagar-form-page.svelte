<script lang="ts">
	import { goto } from '$app/navigation';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import { onMount } from 'svelte';
	import Logo from '$lib/components/app/logo/index.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import {
		createConta,
		getContaAPagar,
		updateConta
	} from '$lib/services/contas-a-pagar.js';
	import { getCondominiumSettings } from '$lib/services/condominium-settings.js';
	import type { RateioMethod } from '$lib/services/balancete.js';
	import { listFornecedores, type Fornecedor } from '$lib/services/fornecedores.js';
	import { listUnitGroups, type UnitGroup } from '$lib/services/unit-groups.js';
	import { listUnits, type Unit } from '$lib/services/units.js';
	import { cn } from '$lib/utils.js';

	interface Props {
		condominiumCode: string;
		contaId?: number | null;
		mode?: 'page' | 'embedded';
		onSaved?: () => void | Promise<void>;
		onCancel?: () => void;
	}

	let { condominiumCode, contaId = null, mode = 'page', onSaved, onCancel }: Props = $props();

	const isEditing = $derived(contaId != null);
	const isEmbedded = $derived(mode === 'embedded');

	let groups = $state<UnitGroup[]>([]);
	let units = $state<Unit[]>([]);
	let fornecedores = $state<Fornecedor[]>([]);
	let isLoading = $state(true);
	let isSubmitting = $state(false);
	let errorMessage = $state('');

	// Form fields
	let formDescription = $state('');
	let formCategory = $state('Manutenção');
	let formSupplierId = $state('');
	let formValue = $state('');
	let formDueDate = $state('');
	let formScope = $state<'geral' | 'bloco' | 'unidade'>('geral');
	let formScopeBloco = $state('');
	let formScopeUnit = $state('');
	let formRateioMethod = $state<RateioMethod>('igual');

	const CATEGORIES = [
		'Manutenção',
		'Limpeza',
		'Segurança',
		'Elétrica',
		'Hidráulica',
		'Paisagismo',
		'Administração',
		'Água',
		'Luz/Energia',
		'Portaria',
		'Fundo de Reserva',
		'Outro'
	];

	function normalizeMoneyInput(v: string): string {
		return v.replaceAll(/[^0-9,]/g, '');
	}

	function parseMoney(v: string): number {
		const val = parseFloat(v.replace(',', '.'));
		return isNaN(val) ? 0 : val;
	}

	function getGroupTypeLabel(t: string): string {
		return (
			({ block: 'Bloco', tower: 'Torre', sector: 'Setor', court: 'Quadra', phase: 'Fase' } as Record<string, string>)[t] ?? t
		);
	}

	function getGroupLabel(g: UnitGroup): string {
		return `${getGroupTypeLabel(g.group_type)} ${g.name}`;
	}

	function getUnitLabel(u: Unit): string {
		const floor = u.floor?.trim();
		return `${floor ? `${floor}º andar · ` : ''}${u.identifier} — ${u.code}`;
	}

	const parsedValue = $derived(parseMoney(formValue));
	const hasValue = $derived(parsedValue > 0);
	const rateioMethodLabel = $derived(
		formRateioMethod === 'fracao' ? 'Fração ideal' : 'Igual por unidade'
	);
	const containerClass = $derived(
		isEmbedded
			? 'flex w-full flex-col gap-4'
			: 'mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-5 sm:px-6'
	);
	const formContentClass = $derived(
		isEmbedded ? 'grid gap-5 pt-5 lg:grid-cols-2' : 'flex flex-col gap-5 pt-5'
	);
	const fullWidthFieldClass = $derived(isEmbedded ? 'space-y-2 lg:col-span-2' : 'space-y-2');

	const filteredUnits = $derived(
		formScopeBloco ? units.filter((u) => u.group_name === formScopeBloco) : units
	);

	async function loadPageData(): Promise<void> {
		isLoading = true;
		errorMessage = '';
		try {
			const [g, u, suppliersResponse, settings] = await Promise.all([
				listUnitGroups(condominiumCode),
				listUnits(condominiumCode),
				listFornecedores(condominiumCode),
				getCondominiumSettings(condominiumCode)
			]);
			groups = g.data;
			units = u.data;
			fornecedores = suppliersResponse.data;
			formRateioMethod = settings.rateio_method;

			if (groups.length > 0) formScopeBloco = groups[0]!.name;
			if (units.length > 0) formScopeUnit = String(units[0]!.id);
			if (fornecedores.length > 0) formSupplierId = String(fornecedores[0]!.id);

			if (contaId != null) {
				const conta = await getContaAPagar(condominiumCode, contaId);
				formDescription = conta.description;
				formCategory = conta.category;
				formSupplierId = conta.supplier_id != null ? String(conta.supplier_id) : '';
				formValue = String(conta.value).replace('.', ',');
				formDueDate = conta.due_date;
				formScope = conta.scope;
				if (conta.scope === 'bloco') formScopeBloco = conta.scope_value ?? '';
				if (conta.scope === 'unidade') formScopeUnit = conta.scope_value ?? '';
				formRateioMethod = conta.rateio_method;
			}
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'Não foi possível carregar os dados.';
		} finally {
			isLoading = false;
		}
	}

	async function handleSubmit(): Promise<void> {
		errorMessage = '';
		if (!formDescription.trim()) { errorMessage = 'Informe a descrição.'; return; }
		if (!formSupplierId) { errorMessage = 'Selecione o fornecedor.'; return; }
		if (!hasValue) { errorMessage = 'Informe o valor da conta.'; return; }
		if (!formDueDate) { errorMessage = 'Informe a data de vencimento.'; return; }
		if (formScope === 'bloco' && !formScopeBloco) { errorMessage = 'Selecione o bloco.'; return; }
		if (formScope === 'unidade' && !formScopeUnit) { errorMessage = 'Selecione a unidade.'; return; }

		isSubmitting = true;
		const input = {
			description: formDescription.trim(),
			category: formCategory,
			value: parsedValue,
			due_date: formDueDate,
			supplier_id: Number(formSupplierId),
			scope: formScope,
			scope_value:
				formScope === 'bloco' ? formScopeBloco
				: formScope === 'unidade' ? formScopeUnit
				: null,
			rateio_method: formRateioMethod
		};

		try {
			if (isEditing && contaId != null) {
				await updateConta(condominiumCode, contaId, input);
			} else {
				await createConta(condominiumCode, input);
			}

			if (onSaved) {
				await onSaved();
			} else {
				await goto(`/g/${condominiumCode}/contas-a-pagar`);
			}
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'Não foi possível salvar a conta.';
		} finally {
			isSubmitting = false;
		}
	}

	function handleCancel(): void {
		if (onCancel) {
			onCancel();
			return;
		}

		void goto(`/g/${condominiumCode}/contas-a-pagar`);
	}

	onMount(async () => {
		await loadPageData();
	});
</script>

<div class={containerClass}>
	<!-- HEADER -->
	{#if !isEmbedded}
		<section class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
			<div>
				<h1 class="text-2xl font-semibold tracking-tight text-foreground">
					{isEditing ? 'Editar conta' : 'Nova conta a pagar'}
				</h1>
				<p class="mt-1 text-sm text-muted-foreground">
					{isEditing ? 'Atualize os dados da conta a pagar.' : 'Cadastre uma nova despesa a pagar.'}
				</p>
			</div>
			<Button
				type="button"
				variant="outline"
				onclick={handleCancel}
			>
				<ArrowLeftIcon class="mr-2 size-4" />
				Voltar
			</Button>
		</section>
	{/if}

	{#if isLoading}
		<Card.Root>
			<Card.Content class="py-10">
				<div class="flex flex-col items-center justify-center gap-4 text-center">
					<div class="rounded-2xl border border-border/70 bg-background p-4 shadow-sm">
						<Logo class="h-10" />
					</div>
					<p class="text-sm text-muted-foreground">Carregando…</p>
				</div>
			</Card.Content>
		</Card.Root>
	{:else}
		<div class="flex flex-col gap-4">
			{#if errorMessage}
				<div class="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
					{errorMessage}
				</div>
			{/if}

			<Card.Root>
				<Card.Content class={formContentClass}>
					<!-- DESCRIÇÃO -->
					<div class={fullWidthFieldClass}>
						<Label for="form-description">
							Descrição <span class="ml-1 font-normal text-muted-foreground">obrigatório</span>
						</Label>
						<Textarea
							id="form-description"
							value={formDescription}
							rows={2}
							placeholder="Ex.: Manutenção preventiva do elevador…"
							disabled={isSubmitting}
							oninput={(e) => { formDescription = (e.currentTarget as HTMLTextAreaElement).value; }}
						/>
					</div>

					<!-- CATEGORIA -->
					<div class="space-y-2">
						<Label for="form-category">Categoria</Label>
						<select
							id="form-category"
							class="flex h-9 w-full rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
							value={formCategory}
							onchange={(e) => { formCategory = (e.currentTarget as HTMLSelectElement).value; }}
						>
							{#each CATEGORIES as cat}
								<option value={cat}>{cat}</option>
							{/each}
						</select>
					</div>

					<!-- FORNECEDOR -->
					<div
						id="conta-a-pagar-supplier-section"
						data-test="conta-a-pagar-supplier-section"
						class="space-y-2"
					>
						<Label for="form-supplier">Fornecedor</Label>
						<select
							id="form-supplier"
							data-test="form-supplier"
							class="flex h-9 w-full rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
							value={formSupplierId}
							disabled={isSubmitting}
							onchange={(e) => {
								formSupplierId = (e.currentTarget as HTMLSelectElement).value;
							}}
						>
							<option value="">Selecione o fornecedor...</option>
							{#each fornecedores as fornecedor (fornecedor.id)}
								<option value={String(fornecedor.id)}>{fornecedor.name}</option>
							{/each}
						</select>
						<p
							id="conta-a-pagar-supplier-help"
							data-test="conta-a-pagar-supplier-help"
							class="text-xs text-muted-foreground"
						>
							O fornecedor fica vinculado ao lançamento da conta.
						</p>
					</div>

					<!-- VALOR -->
					<div class="space-y-2">
						<Label for="form-value">Valor</Label>
						<div class="relative">
							<span class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
								R$
							</span>
							<Input
								id="form-value"
								value={formValue}
								placeholder="0,00"
								inputmode="decimal"
								class="h-12 pl-9 text-xl font-bold"
								disabled={isSubmitting}
								oninput={(e) => {
									formValue = normalizeMoneyInput((e.currentTarget as HTMLInputElement).value);
								}}
							/>
						</div>
					</div>

					<!-- VENCIMENTO -->
					<div class="space-y-2">
						<Label for="form-due-date">
							Vencimento <span class="ml-1 font-normal text-muted-foreground">obrigatório</span>
						</Label>
						<Input
							id="form-due-date"
							type="date"
							value={formDueDate}
							disabled={isSubmitting}
							oninput={(e) => { formDueDate = (e.currentTarget as HTMLInputElement).value; }}
						/>
					</div>

					<!-- ESCOPO -->
					<div class={fullWidthFieldClass}>
						<Label>Escopo</Label>
						<Tabs.Root
							value={formScope}
							onValueChange={(v) => { formScope = v as 'geral' | 'bloco' | 'unidade'; }}
						>
							<Tabs.List class="w-full">
								<Tabs.Trigger value="geral" class="flex-1">Geral</Tabs.Trigger>
								<Tabs.Trigger value="bloco" class="flex-1">Por bloco</Tabs.Trigger>
								<Tabs.Trigger value="unidade" class="flex-1">Por unidade</Tabs.Trigger>
							</Tabs.List>
						</Tabs.Root>
						<p class="text-xs text-muted-foreground">
							{#if formScope === 'geral'}
								Aplicada ao condomínio como um todo.
							{:else if formScope === 'bloco'}
								Aplicada apenas às unidades do bloco selecionado.
							{:else}
								Aplicada diretamente a uma unidade específica.
							{/if}
						</p>
					</div>

					<!-- RATEIO -->
					<div
						id="conta-a-pagar-rateio-section"
						data-test="conta-a-pagar-rateio-section"
						class="space-y-2"
					>
						<Label
							id="conta-a-pagar-rateio-label"
							data-test="conta-a-pagar-rateio-label"
							for="form-rateio-method"
						>
							Forma de cobrança
						</Label>
						<select
							id="form-rateio-method"
							data-test="form-rateio-method"
							class="flex h-9 w-full rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
							value={formRateioMethod}
							disabled={isSubmitting}
							onchange={(e) => {
								formRateioMethod = (e.currentTarget as HTMLSelectElement).value as RateioMethod;
							}}
						>
							<option value="igual">Igual por unidade</option>
							<option value="fracao">Fração ideal</option>
						</select>
						<p
							id="conta-a-pagar-rateio-help"
							data-test="conta-a-pagar-rateio-help"
							class="text-xs text-muted-foreground"
						>
							Esta conta será cobrada por {rateioMethodLabel.toLowerCase()}. Em novas contas,
							o valor inicial vem da configuração do condomínio.
						</p>
					</div>

					<!-- BLOCO SELECT -->
					{#if formScope === 'bloco' || formScope === 'unidade'}
						<div class="space-y-2">
							<Label for="form-scope-bloco">Bloco</Label>
							<select
								id="form-scope-bloco"
								class="flex h-9 w-full rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
								value={formScopeBloco}
								onchange={(e) => {
									formScopeBloco = (e.currentTarget as HTMLSelectElement).value;
									// reset unit when block changes
									const first = units.find((u) => u.group_name === formScopeBloco);
									formScopeUnit = first ? String(first.id) : '';
								}}
							>
								<option value="">Selecione o bloco…</option>
								{#each groups as g (g.id)}
									<option value={g.name}>{getGroupLabel(g)}</option>
								{/each}
							</select>
						</div>
					{/if}

					<!-- UNIT SELECT -->
					{#if formScope === 'unidade'}
						<div class="space-y-2">
							<Label for="form-scope-unit">Unidade</Label>
							<select
								id="form-scope-unit"
								class={cn(
									'flex h-9 w-full rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30',
									!formScopeBloco && 'opacity-50'
								)}
								value={formScopeUnit}
								disabled={!formScopeBloco}
								onchange={(e) => { formScopeUnit = (e.currentTarget as HTMLSelectElement).value; }}
							>
								<option value="">Selecione a unidade…</option>
								{#each filteredUnits as u (u.id)}
									<option value={String(u.id)}>{getUnitLabel(u)}</option>
								{/each}
							</select>
						</div>
					{/if}

					<!-- ACTIONS -->
					<div class="flex items-center justify-between gap-3 pt-2 lg:col-span-2">
						<Button
							type="button"
							variant="ghost"
							disabled={isSubmitting}
							onclick={handleCancel}
						>
							Cancelar
						</Button>
						<Button
							type="button"
							disabled={isSubmitting || !hasValue || !formDescription.trim() || !formDueDate || !formSupplierId}
							onclick={handleSubmit}
						>
							{isSubmitting
								? 'Salvando…'
								: isEditing
								? 'Salvar alterações'
								: 'Criar conta a pagar'}
						</Button>
					</div>
				</Card.Content>
			</Card.Root>
		</div>
	{/if}
</div>
