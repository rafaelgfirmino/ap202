<script lang="ts">
	import Building2Icon from '@lucide/svelte/icons/building-2';
	import LandmarkIcon from '@lucide/svelte/icons/landmark';
	import MapPinnedIcon from '@lucide/svelte/icons/map-pinned';
	import UserRoundIcon from '@lucide/svelte/icons/user-round';
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		getCondominiumGeneralSettings,
		updateCondominiumFeeRule,
		updateCondominiumLandArea,
		type CondominiumFeeRule,
		type CondominiumGeneralSettings
	} from '$lib/services/condominium-settings.js';

	interface Props {
		condominiumCode: string;
	}

	interface InfoCardItem {
		id: string;
		label: string;
		value: string;
		description: string;
		icon: typeof Building2Icon;
	}

	let { condominiumCode }: Props = $props();

	let settings = $state<CondominiumGeneralSettings | null>(null);
	let feeRule = $state<CondominiumFeeRule>('equal');
	let landAreaInput = $state('');
	let isLoading = $state(true);
	let isSavingFeeRule = $state(false);
	let isSavingLandArea = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');

	const feeRuleLabel = $derived.by(() => {
		if (!settings) {
			return '—';
		}

		return settings.fee_rule === 'proportional'
			? 'Fração ideal / proporcional'
			: 'Igual por unidade';
	});
	const landAreaLabel = $derived.by(() => {
		if (!settings || settings.land_area == null) {
			return 'Não informada';
		}

		return `${new Intl.NumberFormat('pt-BR').format(settings.land_area)} m²`;
	});
	const formattedAddress = $derived.by(() => {
		if (!settings) {
			return '—';
		}

		return `${settings.address.street}, ${settings.address.number} · ${settings.address.neighborhood} · ${settings.address.city}/${settings.address.state} · CEP ${settings.address.zip_code}`;
	});
	const syndicLabel = $derived.by(() => settings?.syndic_name ?? 'Não identificado');
	const syndicSupportLabel = $derived.by(() =>
		settings?.syndic_email
			? `Responsável atual identificado pela role de Síndico: ${settings.syndic_email}.`
			: 'Nenhum usuário ativo com role de Síndico foi encontrado.'
	);
	const builtAreaLabel = $derived.by(() => {
		if (!settings || settings.built_area_sum <= 0) {
			return 'Ainda não calculada';
		}

		return `${new Intl.NumberFormat('pt-BR').format(settings.built_area_sum)} m²`;
	});
	const infoCards = $derived.by(() => {
		if (!settings) {
			return [] as InfoCardItem[];
		}

		return [
			{
				id: 'syndic',
				label: 'Síndico responsável',
				value: syndicLabel,
				description: syndicSupportLabel,
				icon: UserRoundIcon
			},
			{
				id: 'fee-rule',
				label: 'Cobrança padrão',
				value: feeRuleLabel,
				description: 'Define se o rateio base do condomínio é igual por unidade ou proporcional.',
				icon: LandmarkIcon
			},
			{
				id: 'land-area',
				label: 'Área do terreno',
				value: landAreaLabel,
				description: `Área construída consolidada: ${builtAreaLabel}.`,
				icon: MapPinnedIcon
			}
		] satisfies InfoCardItem[];
	});

	function resetFeedback(): void {
		errorMessage = '';
		successMessage = '';
	}

	function syncForm(nextSettings: CondominiumGeneralSettings): void {
		settings = nextSettings;
		feeRule = nextSettings.fee_rule;
		landAreaInput = nextSettings.land_area != null ? String(nextSettings.land_area) : '';
	}

	async function loadSettings(): Promise<void> {
		isLoading = true;
		resetFeedback();

		try {
			const nextSettings = await getCondominiumGeneralSettings(condominiumCode);
			syncForm(nextSettings);
		} catch (error) {
			errorMessage =
				error instanceof Error
					? error.message
					: 'Não foi possível carregar as informações do condomínio.';
		} finally {
			isLoading = false;
		}
	}

	async function handleFeeRuleSubmit(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		resetFeedback();
		isSavingFeeRule = true;

		try {
			const nextSettings = await updateCondominiumFeeRule(condominiumCode, feeRule);
			syncForm(nextSettings);
			successMessage = 'Cobrança padrão atualizada com sucesso.';
		} catch (error) {
			errorMessage =
				error instanceof Error
					? error.message
					: 'Não foi possível atualizar a cobrança padrão do condomínio.';
		} finally {
			isSavingFeeRule = false;
		}
	}

	async function handleLandAreaSubmit(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		resetFeedback();
		isSavingLandArea = true;

		try {
			const normalizedValue = landAreaInput.trim().replace(',', '.');
			const parsedLandArea =
				normalizedValue.length === 0 ? null : Number.parseFloat(normalizedValue);

			if (parsedLandArea != null && Number.isNaN(parsedLandArea)) {
				throw new Error('Informe uma área do terreno válida em metros quadrados.');
			}

			const nextSettings = await updateCondominiumLandArea(condominiumCode, parsedLandArea);
			syncForm(nextSettings);
			successMessage = 'Área do terreno atualizada com sucesso.';
		} catch (error) {
			errorMessage =
				error instanceof Error
					? error.message
					: 'Não foi possível atualizar a área do terreno.';
		} finally {
			isSavingLandArea = false;
		}
	}

	onMount(() => {
		void loadSettings();
	});
</script>

<section
	id="condominium-general-settings-root"
	data-test="condominium-general-settings-root"
	class="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6"
>
	<header
		id="condominium-general-settings-header"
		data-test="condominium-general-settings-header"
		class="flex flex-col gap-2"
	>
		<div
			id="condominium-general-settings-title-group"
			data-test="condominium-general-settings-title-group"
			class="flex flex-col gap-1"
		>
			<h1
				id="condominium-general-settings-title"
				data-test="condominium-general-settings-title"
				class="text-2xl font-semibold tracking-tight text-foreground"
			>
				Informações gerais do condomínio
			</h1>
			<p
				id="condominium-general-settings-subtitle"
				data-test="condominium-general-settings-subtitle"
				class="max-w-3xl text-sm text-muted-foreground"
			>
				Centralize os dados principais do condomínio, identifique o síndico atual e ajuste a
				regra padrão de cobrança.
			</p>
		</div>
	</header>

	{#if isLoading}
		<div
			id="condominium-general-settings-loading"
			data-test="condominium-general-settings-loading"
			class="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground"
		>
			Carregando informações do condomínio...
		</div>
	{:else}
		{#if errorMessage}
			<div
				id="condominium-general-settings-error"
				data-test="condominium-general-settings-error"
				class="rounded-2xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
			>
				{errorMessage}
			</div>
		{/if}

		{#if successMessage}
			<div
				id="condominium-general-settings-success"
				data-test="condominium-general-settings-success"
				class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
			>
				{successMessage}
			</div>
		{/if}

		{#if settings}
			<section
				id="condominium-general-settings-info-grid"
				data-test="condominium-general-settings-info-grid"
				class="grid gap-4 lg:grid-cols-3"
			>
				{#each infoCards as card}
					<Card.Root
						id={`condominium-general-settings-info-card-${card.id}`}
						data-test={`condominium-general-settings-info-card-${card.id}`}
						class="gap-4 rounded-3xl border border-border bg-card p-5 shadow-sm"
					>
						<div
							id={`condominium-general-settings-info-card-header-${card.id}`}
							data-test={`condominium-general-settings-info-card-header-${card.id}`}
							class="flex items-start justify-between gap-3"
						>
							<div
								id={`condominium-general-settings-info-card-copy-${card.id}`}
								data-test={`condominium-general-settings-info-card-copy-${card.id}`}
								class="space-y-1"
							>
								<p
									id={`condominium-general-settings-info-card-label-${card.id}`}
									data-test={`condominium-general-settings-info-card-label-${card.id}`}
									class="text-sm text-muted-foreground"
								>
									{card.label}
								</p>
								<h2
									id={`condominium-general-settings-info-card-value-${card.id}`}
									data-test={`condominium-general-settings-info-card-value-${card.id}`}
									class="text-lg font-semibold text-foreground"
								>
									{card.value}
								</h2>
							</div>
							<div
								id={`condominium-general-settings-info-card-icon-${card.id}`}
								data-test={`condominium-general-settings-info-card-icon-${card.id}`}
								class="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary"
							>
								<card.icon class="h-5 w-5" aria-hidden="true" />
							</div>
						</div>
						<p
							id={`condominium-general-settings-info-card-description-${card.id}`}
							data-test={`condominium-general-settings-info-card-description-${card.id}`}
							class="text-sm leading-6 text-muted-foreground"
						>
							{card.description}
						</p>
					</Card.Root>
				{/each}
			</section>

			<section
				id="condominium-general-settings-detail-grid"
				data-test="condominium-general-settings-detail-grid"
				class="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]"
			>
				<Card.Root
					id="condominium-general-settings-overview-card"
					data-test="condominium-general-settings-overview-card"
					class="gap-6 rounded-3xl border border-border bg-card p-6 shadow-sm"
				>
					<Card.Header
						id="condominium-general-settings-overview-header"
						data-test="condominium-general-settings-overview-header"
						class="space-y-2 px-0"
					>
						<Card.Title
							id="condominium-general-settings-overview-title"
							data-test="condominium-general-settings-overview-title"
							class="text-xl"
						>
							Dados básicos
						</Card.Title>
						<Card.Description
							id="condominium-general-settings-overview-description"
							data-test="condominium-general-settings-overview-description"
							class="text-sm leading-6"
						>
							Informações cadastrais e endereço principal utilizados como referência nas demais
							rotinas do condomínio.
						</Card.Description>
					</Card.Header>

					<div
						id="condominium-general-settings-overview-content"
						data-test="condominium-general-settings-overview-content"
						class="grid gap-4 md:grid-cols-2"
					>
						<div
							id="condominium-general-settings-name-wrap"
							data-test="condominium-general-settings-name-wrap"
							class="space-y-1"
						>
							<p
								id="condominium-general-settings-name-label"
								data-test="condominium-general-settings-name-label"
								class="text-sm text-muted-foreground"
							>
								Condomínio
							</p>
							<p
								id="condominium-general-settings-name-value"
								data-test="condominium-general-settings-name-value"
								class="text-base font-medium text-foreground"
							>
								{settings.name}
							</p>
						</div>

						<div
							id="condominium-general-settings-code-wrap"
							data-test="condominium-general-settings-code-wrap"
							class="space-y-1"
						>
							<p
								id="condominium-general-settings-code-label"
								data-test="condominium-general-settings-code-label"
								class="text-sm text-muted-foreground"
							>
								Código
							</p>
							<p
								id="condominium-general-settings-code-value"
								data-test="condominium-general-settings-code-value"
								class="text-base font-medium text-foreground"
							>
								{settings.code}
							</p>
						</div>

						<div
							id="condominium-general-settings-phone-wrap"
							data-test="condominium-general-settings-phone-wrap"
							class="space-y-1"
						>
							<p
								id="condominium-general-settings-phone-label"
								data-test="condominium-general-settings-phone-label"
								class="text-sm text-muted-foreground"
							>
								Telefone principal
							</p>
							<p
								id="condominium-general-settings-phone-value"
								data-test="condominium-general-settings-phone-value"
								class="text-base font-medium text-foreground"
							>
								{settings.phone}
							</p>
						</div>

						<div
							id="condominium-general-settings-email-wrap"
							data-test="condominium-general-settings-email-wrap"
							class="space-y-1"
						>
							<p
								id="condominium-general-settings-email-label"
								data-test="condominium-general-settings-email-label"
								class="text-sm text-muted-foreground"
							>
								Email principal
							</p>
							<p
								id="condominium-general-settings-email-value"
								data-test="condominium-general-settings-email-value"
								class="text-base font-medium text-foreground"
							>
								{settings.email}
							</p>
						</div>

						<div
							id="condominium-general-settings-address-wrap"
							data-test="condominium-general-settings-address-wrap"
							class="space-y-1 md:col-span-2"
						>
							<p
								id="condominium-general-settings-address-label"
								data-test="condominium-general-settings-address-label"
								class="text-sm text-muted-foreground"
							>
								Endereço
							</p>
							<p
								id="condominium-general-settings-address-value"
								data-test="condominium-general-settings-address-value"
								class="text-base font-medium leading-7 text-foreground"
							>
								{formattedAddress}
							</p>
						</div>
					</div>
				</Card.Root>

				<div
					id="condominium-general-settings-actions-column"
					data-test="condominium-general-settings-actions-column"
					class="grid gap-4"
				>
					<Card.Root
						id="condominium-general-settings-fee-rule-card"
						data-test="condominium-general-settings-fee-rule-card"
						class="gap-5 rounded-3xl border border-border bg-card p-6 shadow-sm"
					>
						<Card.Header
							id="condominium-general-settings-fee-rule-header"
							data-test="condominium-general-settings-fee-rule-header"
							class="space-y-2 px-0"
						>
							<Card.Title
								id="condominium-general-settings-fee-rule-title"
								data-test="condominium-general-settings-fee-rule-title"
								class="text-xl"
							>
								Cobrança padrão
							</Card.Title>
							<Card.Description
								id="condominium-general-settings-fee-rule-description"
								data-test="condominium-general-settings-fee-rule-description"
								class="text-sm leading-6"
							>
								Defina se a cobrança base será igual por unidade ou proporcional por fração ideal.
							</Card.Description>
						</Card.Header>

						<form
							id="condominium-general-settings-fee-rule-form"
							data-test="condominium-general-settings-fee-rule-form"
							class="space-y-4"
							onsubmit={handleFeeRuleSubmit}
						>
							<div
								id="condominium-general-settings-fee-rule-field-wrap"
								data-test="condominium-general-settings-fee-rule-field-wrap"
								class="space-y-2"
							>
								<Label
									id="condominium-general-settings-fee-rule-label"
									for="condominium-general-settings-fee-rule-select"
								>
									Regra de cobrança
								</Label>
								<select
									id="condominium-general-settings-fee-rule-select"
									data-test="condominium-general-settings-fee-rule-select"
									class="border-input bg-background ring-offset-background flex h-10 w-full rounded-md border px-3 py-2 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
									bind:value={feeRule}
								>
									<option
										id="condominium-general-settings-fee-rule-equal"
										data-test="condominium-general-settings-fee-rule-equal"
										value="equal"
									>
										Igual por unidade
									</option>
									<option
										id="condominium-general-settings-fee-rule-proportional"
										data-test="condominium-general-settings-fee-rule-proportional"
										value="proportional"
									>
										Proporcional por fração ideal
									</option>
								</select>
								<p
									id="condominium-general-settings-fee-rule-help"
									data-test="condominium-general-settings-fee-rule-help"
									class="text-xs leading-5 text-muted-foreground"
								>
									Se já existirem cobranças lançadas, o backend pode bloquear a alteração para
									preservar a consistência do histórico.
								</p>
							</div>

							<Button
								id="condominium-general-settings-fee-rule-submit"
								data-test="condominium-general-settings-fee-rule-submit"
								type="submit"
								disabled={isSavingFeeRule}
								class="h-11 w-full"
							>
								{isSavingFeeRule ? 'Salvando cobrança...' : 'Salvar cobrança padrão'}
							</Button>
						</form>
					</Card.Root>

					<Card.Root
						id="condominium-general-settings-land-area-card"
						data-test="condominium-general-settings-land-area-card"
						class="gap-5 rounded-3xl border border-border bg-card p-6 shadow-sm"
					>
						<Card.Header
							id="condominium-general-settings-land-area-header"
							data-test="condominium-general-settings-land-area-header"
							class="space-y-2 px-0"
						>
							<Card.Title
								id="condominium-general-settings-land-area-title"
								data-test="condominium-general-settings-land-area-title"
								class="text-xl"
							>
								Área do terreno
							</Card.Title>
							<Card.Description
								id="condominium-general-settings-land-area-description"
								data-test="condominium-general-settings-land-area-description"
								class="text-sm leading-6"
							>
								Use esse campo para manter a referência física do condomínio atualizada em metros
								quadrados.
							</Card.Description>
						</Card.Header>

						<form
							id="condominium-general-settings-land-area-form"
							data-test="condominium-general-settings-land-area-form"
							class="space-y-4"
							onsubmit={handleLandAreaSubmit}
						>
							<div
								id="condominium-general-settings-land-area-field-wrap"
								data-test="condominium-general-settings-land-area-field-wrap"
								class="space-y-2"
							>
								<Label
									id="condominium-general-settings-land-area-label"
									for="condominium-general-settings-land-area-input"
								>
									Área total do terreno (m²)
								</Label>
								<Input
									id="condominium-general-settings-land-area-input"
									data-test="condominium-general-settings-land-area-input"
									type="text"
									inputmode="decimal"
									placeholder="Ex.: 1200"
									bind:value={landAreaInput}
								/>
								<p
									id="condominium-general-settings-land-area-help"
									data-test="condominium-general-settings-land-area-help"
									class="text-xs leading-5 text-muted-foreground"
								>
									Deixe em branco se você ainda não tiver essa informação consolidada.
								</p>
							</div>

							<Button
								id="condominium-general-settings-land-area-submit"
								data-test="condominium-general-settings-land-area-submit"
								type="submit"
								disabled={isSavingLandArea}
								class="h-11 w-full"
							>
								{isSavingLandArea ? 'Salvando área...' : 'Salvar área do terreno'}
							</Button>
						</form>
					</Card.Root>
				</div>
			</section>
		{/if}
	{/if}
</section>
