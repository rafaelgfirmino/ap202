<script lang="ts">
	import { goto } from '$app/navigation';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import BuildingIcon from '@lucide/svelte/icons/building-2';
	import InfoIcon from '@lucide/svelte/icons/info';
	import LockIcon from '@lucide/svelte/icons/lock';
	import { onMount } from 'svelte';
	import Logo from '$lib/components/app/logo/index.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Separator from '$lib/components/ui/separator/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import {
		createEntry,
		getBalancete,
		listEntries,
		updateEntry,
		type Balancete,
		type EntryKind,
		type EntryScope,
		type RateioMethod
	} from '$lib/services/balancete.js';
	import { getCondominiumSettings } from '$lib/services/condominium-settings.js';
	import { listUnitGroups, type UnitGroup } from '$lib/services/unit-groups.js';
	import { listUnits, type Unit } from '$lib/services/units.js';
	import { cn } from '$lib/utils.js';

	interface Props {
		condominiumCode: string;
		balanceteId: number;
		entryId?: number | null;
	}

	let { condominiumCode, balanceteId, entryId = null }: Props = $props();
	const isEditing = $derived(entryId != null);

	let balancete = $state<Balancete | null>(null);
	let units = $state<Unit[]>([]);
	let groups = $state<UnitGroup[]>([]);
	let isLoading = $state(true);
	let isSubmitting = $state(false);
	let errorMessage = $state('');

	let condoRateioMethod = $state<RateioMethod>('fracao');

	let formKind = $state<EntryKind>('expense');
	let formScope = $state<EntryScope>('geral');
	let formScopeBloco = $state('');
	let formScopeUnit = $state('');
	let formValue = $state('');
	let formCategory = $state('Manutenção');
	let formDescription = $state('');

	const EXPENSE_CATEGORIES = [
		'Manutenção', 'Limpeza', 'Segurança', 'Elétrica', 'Hidráulica',
		'Paisagismo', 'Administração', 'Obra', 'Fundo de Reserva', 'Outro'
	];

	const REVENUE_CATEGORIES = ['Aluguel', 'Multa', 'Doação', 'Patrocínio', 'Outro'];

	const ROW_COLORS = [
		'bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700',
		'bg-purple-100 text-purple-700', 'bg-amber-100 text-amber-700',
		'bg-rose-100 text-rose-700', 'bg-sky-100 text-sky-700',
		'bg-indigo-100 text-indigo-700', 'bg-teal-100 text-teal-700'
	];

	const RATEIO_LABELS: Record<RateioMethod, string> = {
		fracao: 'Fração ideal',
		igual: 'Partes iguais',
		area: 'Por m²'
	};

	const RATEIO_DESCRIPTIONS: Record<RateioMethod, string> = {
		fracao: 'Proporcional à fração ideal de cada unidade.',
		igual: 'Mesmo valor para todas as unidades.',
		area: 'Proporcional à área privativa em m².'
	};

	function formatMonth(month: string): string {
		const [year, m] = month.split('-');
		const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
		return `${months[Number(m) - 1] ?? m} / ${year}`;
	}

	function getGroupTypeLabel(t: string): string {
		return ({ block: 'Bloco', tower: 'Torre', sector: 'Setor', court: 'Quadra', phase: 'Fase' } as Record<string, string>)[t] ?? t;
	}

	function getGroupLabel(g: UnitGroup): string {
		return `${getGroupTypeLabel(g.group_type)} ${g.name}`;
	}

	function getUnitLabel(u: Unit): string {
		const floor = u.floor?.trim();
		return `${floor ? `${floor}º andar · ` : ''}${u.identifier} — ${u.code}`;
	}

	function normalizeMoneyInput(v: string): string {
		return v.replaceAll(/[^0-9,]/g, '');
	}

	function parseMoney(v: string): number {
		const val = parseFloat(v.replace(',', '.'));
		return isNaN(val) ? 0 : val;
	}

	function formatCurrency(v: number): string {
		return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
	}

	function calcUnitValue(unit: Unit, total: number, scopeUnits: Unit[], method: RateioMethod): number {
		if (formScope === 'unidade') return total;
		if (method === 'igual') return total / scopeUnits.length;
		if (method === 'area') {
			const totalArea = scopeUnits.reduce((s, u) => s + (u.private_area ?? 0), 0);
			return totalArea === 0 ? total / scopeUnits.length : total * ((unit.private_area ?? 0) / totalArea);
		}
		const totalFrac = scopeUnits.reduce((s, u) => s + (u.ideal_fraction ?? 0), 0);
		return totalFrac === 0 ? total / scopeUnits.length : total * ((unit.ideal_fraction ?? 0) / totalFrac);
	}

	const parsedValue = $derived(parseMoney(formValue));
	const hasValue = $derived(parsedValue > 0);

	const scopeUnits = $derived.by(() => {
		if (formScope === 'geral') return units;
		if (formScope === 'bloco') return formScopeBloco ? units.filter((u) => u.group_name === formScopeBloco) : [];
		return formScopeUnit ? units.filter((u) => String(u.id) === formScopeUnit) : [];
	});

	const hasPreview = $derived(hasValue && scopeUnits.length > 0);

	const distribution = $derived.by(() => {
		if (!hasPreview) return [];
		return scopeUnits.map((unit) => ({ unit, value: calcUnitValue(unit, parsedValue, scopeUnits, condoRateioMethod) }));
	});

	const previewGroups = $derived.by(() => {
		if (!distribution.length) return [];
		if (formScope === 'unidade') return [{ label: 'Lançamento direto', items: distribution }];
		if (formScope === 'bloco') {
			const g = groups.find((x) => x.name === formScopeBloco);
			return [{ label: g ? getGroupLabel(g) : formScopeBloco, items: distribution }];
		}
		const map = new Map<string, typeof distribution>();
		for (const item of distribution) {
			const key = item.unit.group_name ?? 'Sem grupo';
			if (!map.has(key)) map.set(key, []);
			map.get(key)!.push(item);
		}
		return Array.from(map.entries()).map(([name, items]) => {
			const g = groups.find((x) => x.name === name);
			return { label: g ? getGroupLabel(g) : name, items };
		});
	});

	const previewMax = $derived(distribution.length ? Math.max(...distribution.map((d) => d.value)) : 0);
	const previewMin = $derived(distribution.length ? Math.min(...distribution.map((d) => d.value)) : 0);

	const selectedGroup = $derived(groups.find((g) => g.name === formScopeBloco) ?? null);
	const selectedUnit = $derived(units.find((u) => String(u.id) === formScopeUnit) ?? null);

	function getScopeLabel(): string {
		if (formScope === 'geral') return 'Geral';
		if (formScope === 'bloco') return selectedGroup ? getGroupLabel(selectedGroup) : 'Bloco';
		return selectedUnit?.code ?? 'Unidade';
	}

	async function loadPageData(): Promise<void> {
		isLoading = true;
		try {
			const [b, g, u, settings, allEntries] = await Promise.all([
				getBalancete(condominiumCode, balanceteId),
				listUnitGroups(condominiumCode),
				listUnits(condominiumCode),
				getCondominiumSettings(condominiumCode),
				entryId != null ? listEntries(condominiumCode, balanceteId) : Promise.resolve([])
			]);
			balancete = b;
			groups = g.data;
			units = u.data;
			condoRateioMethod = settings.rateio_method;
			if (groups.length > 0) formScopeBloco = groups[0]!.name;
			if (units.length > 0) formScopeUnit = String(units[0]!.id);

			if (entryId != null) {
				const entry = allEntries.find((e) => e.id === entryId);
				if (entry) {
					formKind = entry.kind;
					formScope = entry.scope;
					formValue = String(entry.total_value).replace('.', ',');
					formCategory = entry.category;
					formDescription = entry.description;
					if (entry.scope === 'bloco') formScopeBloco = entry.scope_value ?? '';
					if (entry.scope === 'unidade') formScopeUnit = entry.scope_value ?? '';
				}
			}
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Não foi possível carregar os dados.';
		} finally {
			isLoading = false;
		}
	}

	async function handleSubmit(): Promise<void> {
		errorMessage = '';
		if (!hasValue) { errorMessage = 'Informe o valor do lançamento.'; return; }
		if (formScope === 'bloco' && !formScopeBloco) { errorMessage = 'Selecione o bloco.'; return; }
		if (formScope === 'unidade' && !formScopeUnit) { errorMessage = 'Selecione a unidade.'; return; }

		isSubmitting = true;
		const input = {
			kind: formKind,
			scope: formScope,
			scope_value: formScope === 'bloco' ? formScopeBloco : formScope === 'unidade' ? formScopeUnit : null,
			category: formCategory,
			description: formDescription.trim(),
			total_value: parsedValue,
			rateio_method: formKind === 'revenue' || formScope === 'unidade' ? null : condoRateioMethod,
			due_date: null
		};
		try {
			if (isEditing && entryId != null) {
				await updateEntry(condominiumCode, balanceteId, entryId, input);
			} else {
				await createEntry(condominiumCode, balanceteId, input);
			}
			await goto(`/g/${condominiumCode}/balancete/${balanceteId}`);
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Não foi possível salvar o lançamento.';
		} finally {
			isSubmitting = false;
		}
	}

	onMount(async () => { await loadPageData(); });
</script>

<div class="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6">
	<section class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
		<div>
			<h1 class="text-2xl font-semibold tracking-tight text-foreground">{isEditing ? 'Editar lançamento' : 'Novo lançamento'}</h1>
			{#if balancete}
				<p class="mt-1 text-sm text-muted-foreground">
					Balancete de {formatMonth(balancete.month)}
				</p>
			{/if}
		</div>
		<Button type="button" variant="outline" onclick={() => void goto(`/g/${condominiumCode}/balancete/${balanceteId}`)}>
			<ArrowLeftIcon class="mr-2 size-4" />
			Voltar ao balancete
		</Button>
	</section>

	{#if isLoading}
		<Card.Root>
			<Card.Content class="py-10">
				<div class="flex flex-col items-center justify-center gap-4 text-center">
					<div class="rounded-2xl border border-border/70 bg-background p-4 shadow-sm"><Logo class="h-10" /></div>
					<p class="text-sm text-muted-foreground">Carregando...</p>
				</div>
			</Card.Content>
		</Card.Root>
	{:else if balancete?.status === 'closed'}
		<Card.Root>
			<Card.Content class="py-10">
				<div class="flex flex-col items-center justify-center gap-4 text-center">
					<div class="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
						<LockIcon class="size-6" />
					</div>
					<div>
						<p class="font-medium text-foreground">Balancete fechado</p>
						<p class="mt-1 text-sm text-muted-foreground">
							O balancete de {formatMonth(balancete.month)} está fechado e não aceita novos lançamentos.
						</p>
					</div>
					<Button variant="outline" onclick={() => void goto(`/g/${condominiumCode}/balancete/${balanceteId}`)}>
						Voltar ao balancete
					</Button>
				</div>
			</Card.Content>
		</Card.Root>
	{:else}
		<div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-[400px_1fr]">
			<!-- FORM -->
			<div class="flex flex-col gap-4">
				{#if errorMessage}
					<div class="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
						{errorMessage}
					</div>
				{/if}

				<Card.Root>
					<Card.Content class="flex flex-col gap-5 pt-5">
						<!-- KIND TOGGLE -->
						<div class="space-y-2">
							<Label>Tipo de lançamento</Label>
							<div class="grid grid-cols-2 gap-2">
								<button type="button"
									class={cn('rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors',
										formKind === 'expense'
											? 'border-foreground bg-foreground text-background'
											: 'border-input bg-background text-muted-foreground hover:bg-muted')}
									onclick={() => { formKind = 'expense'; formCategory = 'Manutenção'; }}
								>Despesa</button>
								<button type="button"
									class={cn('rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors',
										formKind === 'revenue'
											? 'border-emerald-600 bg-emerald-600 text-white'
											: 'border-input bg-background text-muted-foreground hover:bg-muted')}
									onclick={() => { formKind = 'revenue'; formCategory = 'Aluguel'; formScope = 'geral'; }}
								>Receita</button>
							</div>
							{#if formKind === 'revenue'}
								<div class="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
									<InfoIcon class="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
									<p class="text-xs text-emerald-700">Receitas são informacionais e não abaterão os valores de cobrança das unidades.</p>
								</div>
							{/if}
						</div>

						<Separator.Root />

						<!-- SCOPE -->
						{#if formKind === 'expense'}
							<div class="space-y-2">
								<Label>Escopo da despesa</Label>
								<Tabs.Root value={formScope} onValueChange={(v) => { formScope = v as EntryScope; }}>
									<Tabs.List class="w-full">
										<Tabs.Trigger value="geral" class="flex-1">Geral</Tabs.Trigger>
										<Tabs.Trigger value="bloco" class="flex-1">Bloco</Tabs.Trigger>
										<Tabs.Trigger value="unidade" class="flex-1">Unidade</Tabs.Trigger>
									</Tabs.List>
								</Tabs.Root>
								<p class="text-xs text-muted-foreground">
									{#if formScope === 'geral'}Rateado entre todas as unidades do condomínio.
									{:else if formScope === 'bloco'}Rateado apenas entre as unidades do bloco selecionado.
									{:else}Cobrado diretamente da unidade selecionada — sem rateio.{/if}
								</p>
							</div>

							{#if formScope === 'bloco' || formScope === 'unidade'}
								<div class="space-y-2">
									<Label for="scope-bloco">Bloco</Label>
									<select id="scope-bloco"
										class="flex h-9 w-full rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
										value={formScopeBloco}
										onchange={(e) => { formScopeBloco = (e.currentTarget as HTMLSelectElement).value; }}
									>
										<option value="">Selecione o bloco…</option>
										{#each groups as g (g.id)}<option value={g.name}>{getGroupLabel(g)}</option>{/each}
									</select>
								</div>
							{/if}

							{#if formScope === 'unidade'}
								<div class="space-y-2">
									<Label for="scope-unit">Unidade</Label>
									<select id="scope-unit"
										class="flex h-9 w-full rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
										value={formScopeUnit}
										onchange={(e) => { formScopeUnit = (e.currentTarget as HTMLSelectElement).value; }}
									>
										<option value="">Selecione a unidade…</option>
										{#each units.filter((u) => !formScopeBloco || u.group_name === formScopeBloco) as u (u.id)}
											<option value={String(u.id)}>{getUnitLabel(u)}</option>
										{/each}
									</select>
								</div>
							{/if}

							<Separator.Root />
						{/if}

						<!-- VALOR -->
						<div class="space-y-2">
							<Label for="form-value">Valor total</Label>
							<div class="relative">
								<span class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-semibold text-muted-foreground">R$</span>
								<Input id="form-value" value={formValue} placeholder="0,00" inputmode="decimal"
									class="h-12 pl-9 text-xl font-bold" disabled={isSubmitting}
									oninput={(e) => { formValue = normalizeMoneyInput((e.currentTarget as HTMLInputElement).value); }}
								/>
							</div>
						</div>

						<!-- CATEGORIA -->
						<div class="space-y-2">
							<Label for="form-category">Categoria</Label>
							<select id="form-category"
								class="flex h-9 w-full rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
								value={formCategory}
								onchange={(e) => { formCategory = (e.currentTarget as HTMLSelectElement).value; }}
							>
								{#each (formKind === 'expense' ? EXPENSE_CATEGORIES : REVENUE_CATEGORIES) as cat}
									<option value={cat}>{cat}</option>
								{/each}
							</select>
						</div>

						<!-- DESCRIÇÃO -->
						<div class="space-y-2">
							<Label for="form-desc">Descrição <span class="ml-1 font-normal text-muted-foreground">opcional</span></Label>
							<Textarea id="form-desc" value={formDescription} rows={2}
								placeholder="Ex.: Manutenção preventiva do elevador Bloco B…"
								disabled={isSubmitting}
								oninput={(e) => { formDescription = (e.currentTarget as HTMLTextAreaElement).value; }}
							/>
						</div>

						<!-- RATEIO (informacional) -->
						{#if formKind === 'expense' && formScope !== 'unidade'}
							<Separator.Root />
							<div class="space-y-1.5">
								<Label>Forma de rateio</Label>
								<div class="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2.5">
									<InfoIcon class="size-3.5 shrink-0 text-muted-foreground" />
									<span class="text-sm font-medium text-foreground">{RATEIO_LABELS[condoRateioMethod]}</span>
									<span class="text-xs text-muted-foreground">· configuração do condomínio</span>
								</div>
								<p class="text-xs text-muted-foreground">{RATEIO_DESCRIPTIONS[condoRateioMethod]}</p>
							</div>
						{/if}

						<Separator.Root />

						<div class="flex items-center justify-between gap-3">
							<Button type="button" variant="ghost" disabled={isSubmitting}
								onclick={() => void goto(`/g/${condominiumCode}/balancete/${balanceteId}`)}
							>Cancelar</Button>
							<Button type="button" disabled={isSubmitting || !hasValue} onclick={handleSubmit}>
								{isSubmitting ? 'Salvando…' : isEditing ? 'Salvar alterações' : formKind === 'expense' ? 'Lançar despesa' : 'Lançar receita'}
							</Button>
						</div>
					</Card.Content>
				</Card.Root>
			</div>

			<!-- PREVIEW -->
			<div class="sticky top-6">
				<Card.Root class="overflow-hidden">
					<Card.Header class="border-b bg-muted/20 py-3">
						<div class="flex items-center justify-between">
							<div>
								<Card.Title class="text-sm">Preview do rateio</Card.Title>
								<p class="mt-0.5 text-xs text-muted-foreground">
									{#if hasPreview}{formCategory} · {getScopeLabel()}{:else}Preencha o valor para visualizar{/if}
								</p>
							</div>
							{#if hasPreview}
								<div class="text-right">
									<div class="text-lg font-bold">{formatCurrency(parsedValue)}</div>
									<div class="text-xs text-muted-foreground">{scopeUnits.length} unidades</div>
								</div>
							{/if}
						</div>
					</Card.Header>

					<Card.Content class="p-0">
						{#if !hasPreview}
							<div class="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
								<div class="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
									<BuildingIcon class="size-6" />
								</div>
								<div>
									<p class="text-sm font-medium">Rateio aparece aqui</p>
									<p class="mt-1 text-xs text-muted-foreground">
										{#if !hasValue}Digite o valor do lançamento para ver a distribuição.
										{:else}Selecione o bloco ou unidade para calcular o rateio.{/if}
									</p>
								</div>
							</div>
						{:else if formKind === 'revenue'}
							<div class="flex flex-col gap-4 p-4">
								<div class="grid grid-cols-2 gap-3">
									<div class="rounded-lg border bg-background p-3">
										<div class="text-xs text-muted-foreground">Valor da receita</div>
										<div class="mt-1 text-base font-bold">{formatCurrency(parsedValue)}</div>
									</div>
									<div class="rounded-lg border bg-background p-3">
										<div class="text-xs text-muted-foreground">Categoria</div>
										<div class="mt-1 text-sm font-semibold">{formCategory}</div>
									</div>
								</div>
								<div class="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
									<InfoIcon class="mt-0.5 size-4 shrink-0 text-emerald-600" />
									<p class="text-xs text-emerald-700">Esta receita é informacional e não abate as cobranças das unidades.</p>
								</div>
							</div>
						{:else}
							<div class="flex flex-col">
								<div class="grid grid-cols-3 gap-2 border-b p-4">
									<div class="rounded-lg border bg-background p-3">
										<div class="text-xs text-muted-foreground">Total</div>
										<div class="mt-1 text-base font-bold">{formatCurrency(parsedValue)}</div>
										<div class="mt-0.5 text-[10px] text-muted-foreground">{formCategory}</div>
									</div>
									<div class="rounded-lg border bg-background p-3">
										<div class="text-xs text-muted-foreground">Unidades</div>
										<div class="mt-1 text-base font-bold">{scopeUnits.length}</div>
										<div class="mt-0.5 text-[10px] text-muted-foreground">{getScopeLabel()}</div>
									</div>
									<div class="rounded-lg border bg-background p-3">
										{#if formScope === 'unidade'}
											<div class="text-xs text-muted-foreground">Tipo</div>
											<div class="mt-1 text-sm font-bold">Direto</div>
											<div class="mt-0.5 text-[10px] text-muted-foreground">Sem rateio</div>
										{:else}
											<div class="text-xs text-muted-foreground">Menor / Maior</div>
											<div class="mt-1 text-sm font-bold">{formatCurrency(previewMin)}</div>
											<div class="mt-0.5 text-[10px] text-muted-foreground">até {formatCurrency(previewMax)}</div>
										{/if}
									</div>
								</div>

								<div class="max-h-[420px] overflow-y-auto">
									{#each previewGroups as group, gi}
										<div class="border-b last:border-b-0">
											<div class="flex items-center justify-between bg-muted/30 px-4 py-2">
												<span class="text-xs font-semibold">{group.label}</span>
												<span class="text-xs font-bold">{formatCurrency(group.items.reduce((s, i) => s + i.value, 0))}</span>
											</div>
											{#each group.items as item, idx}
												{@const color = ROW_COLORS[(gi * 8 + idx) % ROW_COLORS.length]!}
												{@const pct = previewMax > 0 ? Math.round((item.value / previewMax) * 100) : 0}
												<div class="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/20">
													<div class={cn('flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold', color)}>
														{item.unit.identifier.slice(0, 3)}
													</div>
													<div class="min-w-0 flex-1">
														<div class="truncate text-xs font-medium">{item.unit.code}</div>
														<div class="text-[10px] text-muted-foreground">
															{#if formScope !== 'unidade'}
																{#if condoRateioMethod === 'fracao'}{(item.unit.ideal_fraction ?? 0).toFixed(2)}% fração
																{:else if condoRateioMethod === 'area'}{item.unit.private_area ?? 0} m²
																{:else}1/{scopeUnits.length}{/if}
															{:else}Lançamento direto{/if}
														</div>
													</div>
													<div class="flex shrink-0 items-center gap-2">
														<div class="hidden h-1 w-12 overflow-hidden rounded-full bg-muted sm:block">
															<div class="h-full rounded-full bg-foreground transition-all" style="width:{pct}%"></div>
														</div>
														<div class="text-xs font-bold">{formatCurrency(item.value)}</div>
													</div>
												</div>
											{/each}
										</div>
									{/each}
								</div>

								{#if formScope !== 'unidade'}
									<div class="border-t bg-muted/20 px-4 py-2">
										<p class="text-[11px] text-muted-foreground">{scopeUnits.length} unidades · {RATEIO_LABELS[condoRateioMethod]} · {formCategory}</p>
									</div>
								{/if}
							</div>
						{/if}
					</Card.Content>
				</Card.Root>
			</div>
		</div>
	{/if}
</div>
