<script lang="ts">
	import Building2Icon from '@lucide/svelte/icons/building-2';
	import CheckCircle2Icon from '@lucide/svelte/icons/check-circle-2';
	import CircleHelpIcon from '@lucide/svelte/icons/circle-help';
	import MapPinnedIcon from '@lucide/svelte/icons/map-pinned';
	import ReceiptTextIcon from '@lucide/svelte/icons/receipt-text';
	import { Control, Description, Field, FieldErrors, Label as FormLabel } from 'formsnap';
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod4, zod4Client } from 'sveltekit-superforms/adapters';
	import { get } from 'svelte/store';
	import { z } from 'zod';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { lookupAddressByZipCode } from '$lib/services/address.js';
	import {
		createCondominium,
		type CreateCondominiumInput,
		type UserCondominium
	} from '$lib/services/auth.js';

	interface Props {
		onCreated?: (condominium: UserCondominium) => Promise<void> | void;
	}

	interface StepDefinition {
		id: number;
		title: string;
		description: string;
		icon: typeof Building2Icon;
	}

	const brazilStateOptions = [
		'AC',
		'AL',
		'AP',
		'AM',
		'BA',
		'CE',
		'DF',
		'ES',
		'GO',
		'MA',
		'MT',
		'MS',
		'MG',
		'PA',
		'PB',
		'PR',
		'PE',
		'PI',
		'RJ',
		'RN',
		'RS',
		'RO',
		'RR',
		'SC',
		'SP',
		'SE',
		'TO'
	] as const;

	const nameMessage = 'Informe o nome do condomínio.';
	const phoneMessage = 'Informe um telefone válido com DDD.';
	const emailMessage = 'Informe um email válido.';
	const landAreaMessage = 'Informe a área em m² usando apenas números.';
	const zipCodeMessage = 'Informe um CEP com 8 números.';
	const streetMessage = 'Informe a rua.';
	const numberMessage = 'Informe o número.';
	const neighborhoodMessage = 'Informe o bairro.';
	const cityMessage = 'Informe a cidade. Ex.: Belo Horizonte.';
	const stateMessage = 'Selecione a UF.';
	const cnpjMessage = 'Informe um CNPJ válido com 14 números.';
	const razaoSocialMessage = 'Informe a razão social.';
	const landAreaDescription =
		'Área física total do lote ou terreno do condomínio, em metros quadrados.';

	function validateRequiredMinLength(
		value: string,
		requiredMessage: string,
		minLength: number,
		minLengthMessage: string
	): string | null {
		const trimmedValue = value.trim();

		if (trimmedValue.length === 0) {
			return requiredMessage;
		}

		if (trimmedValue.length < minLength) {
			return minLengthMessage;
		}

		return null;
	}

	const condominiumWizardSchema = z.object({
		name: z.string().superRefine((value, ctx) => {
			const errorMessage = validateRequiredMinLength(
				value,
				nameMessage,
				3,
				'Informe ao menos 3 caracteres.'
			);

			if (errorMessage) {
				ctx.addIssue({
					code: 'custom',
					message: errorMessage
				});
			}
		}),
		phone: z
			.string()
			.superRefine((value, ctx) => {
				const trimmedValue = value.trim();
				if (trimmedValue.length === 0) {
					ctx.addIssue({
						code: 'custom',
						message: phoneMessage
					});
					return;
				}

				const digits = onlyDigits(value);
				if (digits.length < 10 || digits.length > 11) {
					ctx.addIssue({
						code: 'custom',
						message: phoneMessage
					});
				}
			}),
		email: z.email(emailMessage),
		landArea: z
			.string()
			.trim()
			.refine((value) => {
				if (value === '') return true;
				return /^\d+([.,]\d+)?$/.test(value);
			}, landAreaMessage),
		zipCode: z
			.string()
			.superRefine((value, ctx) => {
				const trimmedValue = value.trim();
				if (trimmedValue.length === 0) {
					ctx.addIssue({
						code: 'custom',
						message: zipCodeMessage
					});
					return;
				}

				if (onlyDigits(value).length !== 8) {
					ctx.addIssue({
						code: 'custom',
						message: zipCodeMessage
					});
				}
			}),
		street: z.string().trim().min(1, streetMessage),
		number: z.string().trim().min(1, numberMessage),
		neighborhood: z.string().trim().min(1, neighborhoodMessage),
		city: z
			.string()
			.superRefine((value, ctx) => {
				const trimmedValue = value.trim();
				if (trimmedValue.length === 0) {
					ctx.addIssue({
						code: 'custom',
						message: cityMessage
					});
					return;
				}

				if (!/[a-zA-ZÀ-ÿ]/.test(trimmedValue)) {
					ctx.addIssue({
						code: 'custom',
						message: cityMessage
					});
				}
			}),
		regionState: z
			.string()
			.trim()
			.refine((value) => brazilStateOptions.includes(value as (typeof brazilStateOptions)[number]), stateMessage),
		cnpj: z
			.string()
			.superRefine((value, ctx) => {
				const trimmedValue = value.trim();
				if (trimmedValue.length === 0) {
					ctx.addIssue({
						code: 'custom',
						message: cnpjMessage
					});
					return;
				}

				if (onlyDigits(value).length !== 14) {
					ctx.addIssue({
						code: 'custom',
						message: cnpjMessage
					});
				}
			}),
		razaoSocial: z.string().superRefine((value, ctx) => {
			const errorMessage = validateRequiredMinLength(
				value,
				razaoSocialMessage,
				3,
				'Informe ao menos 3 caracteres.'
			);

			if (errorMessage) {
				ctx.addIssue({
					code: 'custom',
					message: errorMessage
				});
			}
		})
	});

	type CondominiumWizardFormData = z.infer<typeof condominiumWizardSchema>;
	type StepFieldName = keyof CondominiumWizardFormData;

	const stepFields: Record<number, StepFieldName[]> = {
		1: ['name', 'phone', 'email', 'landArea'],
		2: ['zipCode', 'street', 'number', 'neighborhood', 'city', 'regionState'],
		3: ['cnpj', 'razaoSocial']
	};

	const stepValidators = {
		1: zod4(
			condominiumWizardSchema.pick({
				name: true,
				phone: true,
				email: true,
				landArea: true
			})
		),
		2: zod4(
			condominiumWizardSchema.pick({
				zipCode: true,
				street: true,
				number: true,
				neighborhood: true,
				city: true,
				regionState: true
			})
		),
		3: zod4(
			condominiumWizardSchema.pick({
				cnpj: true,
				razaoSocial: true
			})
		)
	} as const;

	let { onCreated }: Props = $props();

	const steps: StepDefinition[] = [
		{
			id: 1,
			title: 'Dados básicos',
			description: 'Nome e contatos do condomínio.',
			icon: Building2Icon
		},
		{
			id: 2,
			title: 'Endereço',
			description: 'Localização para identificar o condomínio.',
			icon: MapPinnedIcon
		},
		{
			id: 3,
			title: 'CNPJ',
			description: 'Documento principal para concluir o cadastro.',
			icon: ReceiptTextIcon
		}
	];

	let currentStep = $state(1);
	let isSubmitting = $state(false);
	let errorMessage = $state('');
	let isZipCodeLookupLoading = $state(false);
	let zipCodeLookupMessage = $state('');
	let zipCodeLookupStatus = $state<'idle' | 'success' | 'error'>('idle');
	let lastZipCodeLookup = $state('');

	const condominiumForm = superForm(defaults(zod4(condominiumWizardSchema)), {
		validators: zod4Client(condominiumWizardSchema),
		SPA: true,
		validationMethod: 'onblur'
	});

	const { form: formData, errors } = condominiumForm;

	function onlyDigits(value: string): string {
		return value.replace(/\D/g, '');
	}

	function normalizeState(value: string): string {
		return value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 2);
	}

	function formatZipCode(value: string): string {
		const digits = onlyDigits(value).slice(0, 8);

		if (digits.length <= 5) {
			return digits;
		}

		return `${digits.slice(0, 5)}-${digits.slice(5)}`;
	}

	function getStepErrorCount(step: number): number {
		const currentErrors = get(errors);

		return stepFields[step].filter((fieldName) => {
			const fieldErrors = currentErrors[fieldName];
			return Array.isArray(fieldErrors) && fieldErrors.length > 0;
		}).length;
	}

	async function validateCurrentStep(): Promise<void> {
		if (currentStep === 1) {
			await condominiumForm.validateForm({
				update: true,
				schema: stepValidators[1]
			});
			return;
		}

		if (currentStep === 2) {
			await condominiumForm.validateForm({
				update: true,
				schema: stepValidators[2]
			});
			return;
		}

		await condominiumForm.validateForm({
			update: true,
			schema: stepValidators[3]
		});
	}

	async function goToNextStep(): Promise<void> {
		errorMessage = '';
		await validateCurrentStep();

		if (getStepErrorCount(currentStep) > 0) {
			return;
		}

		currentStep += 1;
	}

	function goToPreviousStep(): void {
		errorMessage = '';
		currentStep -= 1;
	}

	function handlePhoneInput(event: Event): void {
		const value = (event.currentTarget as HTMLInputElement).value;
		formData.update((data) => ({ ...data, phone: value }));
	}

	function handleLandAreaInput(event: Event): void {
		const value = (event.currentTarget as HTMLInputElement).value;
		formData.update((data) => ({ ...data, landArea: value }));
	}

	function handleCnpjInput(event: Event): void {
		const value = (event.currentTarget as HTMLInputElement).value;
		formData.update((data) => ({ ...data, cnpj: value }));
	}

	function handleZipCodeInput(event: Event): void {
		const formattedZipCode = formatZipCode((event.currentTarget as HTMLInputElement).value);

		formData.update((data) => ({ ...data, zipCode: formattedZipCode }));

		if (onlyDigits(formattedZipCode).length < 8) {
			lastZipCodeLookup = '';
			zipCodeLookupMessage = '';
			zipCodeLookupStatus = 'idle';
		}
	}

	async function lookupZipCode(): Promise<void> {
		const data = get(formData);
		const cleanZipCode = onlyDigits(data.zipCode);

		if (cleanZipCode.length !== 8) {
			zipCodeLookupStatus = 'error';
			zipCodeLookupMessage = zipCodeMessage;
			return;
		}

		if (cleanZipCode === lastZipCodeLookup) {
			return;
		}

		isZipCodeLookupLoading = true;
		zipCodeLookupMessage = '';
		zipCodeLookupStatus = 'idle';

		try {
			const address = await lookupAddressByZipCode(cleanZipCode);
			formData.update((currentData) => ({
				...currentData,
				zipCode: formatZipCode(address.zip_code),
				street: address.street,
				neighborhood: address.neighborhood,
				city: address.city,
				regionState: normalizeState(address.state)
			}));

			lastZipCodeLookup = cleanZipCode;
			zipCodeLookupStatus = 'success';
			zipCodeLookupMessage = 'Endereço preenchido a partir do CEP. Confira o número.';

			await condominiumForm.validateForm({
				update: true,
				schema: stepValidators[2]
			});
		} catch (error) {
			lastZipCodeLookup = '';
			zipCodeLookupStatus = 'error';
			zipCodeLookupMessage =
				error instanceof Error ? error.message : 'Não foi possível buscar o CEP.';
		} finally {
			isZipCodeLookupLoading = false;
		}
	}

	async function handleZipCodeBlur(): Promise<void> {
		const data = get(formData);
		if (onlyDigits(data.zipCode).length === 8) {
			await lookupZipCode();
		}
	}

	async function handleSubmit(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		errorMessage = '';

		const validation = await condominiumForm.validateForm({
			update: true,
			focusOnError: true
		});

		if (!validation.valid) {
			return;
		}

		isSubmitting = true;

		try {
			const data = get(formData);
			const payload: CreateCondominiumInput = {
				name: data.name.trim(),
				phone: onlyDigits(data.phone),
				email: data.email.trim(),
				landArea: data.landArea.trim() ? Number(data.landArea.replace(',', '.')) : null,
				address: {
					street: data.street.trim(),
					number: data.number.trim(),
					neighborhood: data.neighborhood.trim(),
					city: data.city.trim(),
					state: normalizeState(data.regionState),
					zip_code: onlyDigits(data.zipCode)
				},
				cnpj: {
					cnpj: onlyDigits(data.cnpj),
					razao_social: data.razaoSocial.trim()
				}
			};

			const condominium = await createCondominium(payload);
			await onCreated?.(condominium);
		} catch (error) {
			errorMessage =
				error instanceof Error ? error.message : 'Não foi possível criar o condomínio.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<Card.Root
	id="create-condominium-wizard"
	data-test="create-condominium-wizard"
	class="rounded-[2rem] border-slate-200 shadow-none"
>
	<Card.Content
		id="create-condominium-wizard-content"
		data-test="create-condominium-wizard-content"
		class="p-6 sm:p-8"
	>
		<div
			id="create-condominium-wizard-header"
			data-test="create-condominium-wizard-header"
			class="space-y-4"
		>
			<div
				id="create-condominium-wizard-badge"
				data-test="create-condominium-wizard-badge"
				class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-secondary px-4 py-2 text-sm font-medium text-primary"
			>
				<CheckCircle2Icon class="h-4 w-4" aria-hidden="true" />
				Cadastre seu condomínio
			</div>

			<div
				id="create-condominium-wizard-copy"
				data-test="create-condominium-wizard-copy"
				class="space-y-2"
			>
				<h2
					id="create-condominium-wizard-title"
					data-test="create-condominium-wizard-title"
					class="text-3xl font-semibold tracking-tight"
				>
					Crie seu condomínio em poucos passos
				</h2>
				<p
					id="create-condominium-wizard-description"
					data-test="create-condominium-wizard-description"
					class="leading-7 text-muted-foreground"
				>
					O cadastro é guiado. Você preenche os dados principais e já entra no condomínio
					criado ao finalizar.
				</p>
			</div>

			<div
				id="create-condominium-wizard-steps"
				data-test="create-condominium-wizard-steps"
				class="grid gap-3 md:grid-cols-3"
			>
				{#each steps as step}
					<div
						id={`create-condominium-wizard-step-${step.id}`}
						data-test={`create-condominium-wizard-step-${step.id}`}
						class={[
							'rounded-[1.5rem] border px-4 py-4',
							currentStep === step.id
								? 'border-primary bg-primary/5'
								: 'border-slate-200 bg-background'
						]}
					>
						<div
							id={`create-condominium-wizard-step-icon-wrap-${step.id}`}
							data-test={`create-condominium-wizard-step-icon-wrap-${step.id}`}
							class="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary"
						>
							<step.icon class="h-4 w-4 text-primary" aria-hidden="true" />
						</div>
						<p
							id={`create-condominium-wizard-step-title-${step.id}`}
							data-test={`create-condominium-wizard-step-title-${step.id}`}
							class="font-semibold"
						>
							{step.title}
						</p>
						<p
							id={`create-condominium-wizard-step-description-${step.id}`}
							data-test={`create-condominium-wizard-step-description-${step.id}`}
							class="mt-1 text-sm text-muted-foreground"
						>
							{step.description}
						</p>
					</div>
				{/each}
			</div>
		</div>

		<form
			id="create-condominium-wizard-form"
			data-test="create-condominium-wizard-form"
			class="mt-8 space-y-6"
			onsubmit={handleSubmit}
		>
			{#if currentStep === 1}
				<div
					id="create-condominium-wizard-step-panel-1"
					data-test="create-condominium-wizard-step-panel-1"
					class="grid gap-5 md:grid-cols-2"
				>
					<div
						id="create-condominium-wizard-field-name-wrap"
						data-test="create-condominium-wizard-field-name-wrap"
						class="space-y-2 md:col-span-2"
					>
						<Field form={condominiumForm} name="name">
							<Control>
								{#snippet children({ props })}
									<FormLabel>Nome do condomínio</FormLabel>
									<Input
										{...props}
										data-test="create-condominium-wizard-field-name"
										bind:value={$formData.name}
										placeholder="Ex.: Condomínio Jardim das Flores"
									/>
								{/snippet}
							</Control>
							<FieldErrors class="mt-2 space-y-1 text-sm font-medium text-destructive" />
							<Description>Use o nome como o condomínio é conhecido no dia a dia.</Description>
						</Field>
					</div>

					<div
						id="create-condominium-wizard-field-phone-wrap"
						data-test="create-condominium-wizard-field-phone-wrap"
						class="space-y-2"
					>
						<Field form={condominiumForm} name="phone">
							<Control>
								{#snippet children({ props })}
									<FormLabel>Telefone do condomínio, síndico ou responsável</FormLabel>
									<Input
										{...props}
										data-test="create-condominium-wizard-field-phone"
										bind:value={$formData.phone}
										oninput={handlePhoneInput}
										placeholder="Ex.: (11) 99999-9999"
									/>
								{/snippet}
							</Control>
							<FieldErrors class="mt-2 space-y-1 text-sm font-medium text-destructive" />
							<Description>Esse será o contato principal para o cadastro inicial.</Description>
						</Field>
					</div>

					<div
						id="create-condominium-wizard-field-email-wrap"
						data-test="create-condominium-wizard-field-email-wrap"
						class="space-y-2"
					>
						<Field form={condominiumForm} name="email">
							<Control>
								{#snippet children({ props })}
									<FormLabel>Email</FormLabel>
									<Input
										{...props}
										data-test="create-condominium-wizard-field-email"
										type="email"
										bind:value={$formData.email}
										placeholder="contato@condominio.com"
									/>
								{/snippet}
							</Control>
							<FieldErrors class="mt-2 space-y-1 text-sm font-medium text-destructive" />
							<Description>Usaremos esse email para comunicações e acesso inicial.</Description>

						</Field>
					</div>

					<div
						id="create-condominium-wizard-field-land-area-wrap"
						data-test="create-condominium-wizard-field-land-area-wrap"
						class="space-y-2"
					>
						<Field form={condominiumForm} name="landArea">
							<Control>
								{#snippet children({ props })}
									<div
										id="create-condominium-wizard-field-land-area-label-wrap"
										data-test="create-condominium-wizard-field-land-area-label-wrap"
										class="flex items-center gap-2"
									>
										<FormLabel>Área total do terreno (m²)</FormLabel>
										<Tooltip.Provider>
											<Tooltip.Root>
												<Tooltip.Trigger
													id="create-condominium-wizard-field-land-area-help-trigger"
													data-test="create-condominium-wizard-field-land-area-help-trigger"
													data-fs-description={landAreaDescription}
													type="button"
													class="text-muted-foreground transition-colors hover:text-foreground"
												>
													<CircleHelpIcon class="h-4 w-4" aria-hidden="true" />
												</Tooltip.Trigger>
												<Tooltip.Content
													id="create-condominium-wizard-field-land-area-help-content"
													data-test="create-condominium-wizard-field-land-area-help-content"
												>
													{landAreaDescription}
												</Tooltip.Content>
											</Tooltip.Root>
										</Tooltip.Provider>
									</div>
									<Input
										{...props}
										data-test="create-condominium-wizard-field-land-area"
										bind:value={$formData.landArea}
										oninput={handleLandAreaInput}
										placeholder="Opcional. Ex.: área total do lote do condomínio"
									/>
								{/snippet}
							</Control>
							<FieldErrors class="mt-2 space-y-1 text-sm font-medium text-destructive" />
							<Description>Se preferir, você pode preencher esse campo depois.</Description>
						</Field>
					</div>
				</div>
			{/if}

			{#if currentStep === 2}
				<div
					id="create-condominium-wizard-step-panel-2"
					data-test="create-condominium-wizard-step-panel-2"
					class="grid gap-5 md:grid-cols-2"
				>
					<div
						id="create-condominium-wizard-field-zip-wrap"
						data-test="create-condominium-wizard-field-zip-wrap"
						class="space-y-2"
					>
						<Field form={condominiumForm} name="zipCode">
							<Control>
								{#snippet children({ props })}
									<FormLabel>CEP</FormLabel>
									<Input
										{...props}
										data-test="create-condominium-wizard-field-zip"
										bind:value={$formData.zipCode}
										onblur={() => void handleZipCodeBlur()}
										oninput={handleZipCodeInput}
										placeholder="Ex.: 01001-000"
									/>
								{/snippet}
							</Control>
							<FieldErrors class="mt-2 space-y-1 text-sm font-medium text-destructive" />
							<Description>
								{#if isZipCodeLookupLoading}
									Buscando endereço pelo CEP...
								{:else if zipCodeLookupMessage}
									{zipCodeLookupMessage}
								{:else}
									Informe o CEP primeiro para preencher rua, bairro, cidade e UF automaticamente.
								{/if}
							</Description>
						</Field>
					</div>

					<div
						id="create-condominium-wizard-field-number-wrap"
						data-test="create-condominium-wizard-field-number-wrap"
						class="space-y-2"
					>
						<Field form={condominiumForm} name="number">
							<Control>
								{#snippet children({ props })}
									<FormLabel>Número</FormLabel>
									<Input
										{...props}
										data-test="create-condominium-wizard-field-number"
										bind:value={$formData.number}
										placeholder="Ex.: 120"
									/>
								{/snippet}
							</Control>
							<FieldErrors class="mt-2 space-y-1 text-sm font-medium text-destructive" />
							<Description>Informe o número do endereço do condomínio.</Description>
						</Field>
					</div>

					<div
						id="create-condominium-wizard-field-street-wrap"
						data-test="create-condominium-wizard-field-street-wrap"
						class="space-y-2 md:col-span-2"
					>
						<Field form={condominiumForm} name="street">
							<Control>
								{#snippet children({ props })}
									<FormLabel>Rua</FormLabel>
									<Input
										{...props}
										data-test="create-condominium-wizard-field-street"
										bind:value={$formData.street}
										placeholder="Rua preenchida pelo CEP"
									/>
								{/snippet}
							</Control>
							<FieldErrors class="mt-2 space-y-1 text-sm font-medium text-destructive" />
							<Description>Você pode ajustar a rua manualmente, se necessário.</Description>
						</Field>
					</div>

					<div
						id="create-condominium-wizard-field-neighborhood-wrap"
						data-test="create-condominium-wizard-field-neighborhood-wrap"
						class="space-y-2"
					>
						<Field form={condominiumForm} name="neighborhood">
							<Control>
								{#snippet children({ props })}
									<FormLabel>Bairro</FormLabel>
									<Input
										{...props}
										data-test="create-condominium-wizard-field-neighborhood"
										bind:value={$formData.neighborhood}
										placeholder="Bairro preenchido pelo CEP"
									/>
								{/snippet}
							</Control>
							<FieldErrors class="mt-2 space-y-1 text-sm font-medium text-destructive" />
							<Description>Confirme se o bairro retornado pelo CEP está correto.</Description>
						</Field>
					</div>

					<div
						id="create-condominium-wizard-field-city-wrap"
						data-test="create-condominium-wizard-field-city-wrap"
						class="space-y-2"
					>
						<Field form={condominiumForm} name="city">
							<Control>
								{#snippet children({ props })}
									<FormLabel>Cidade</FormLabel>
									<Input
										{...props}
										data-test="create-condominium-wizard-field-city"
										bind:value={$formData.city}
										placeholder="Cidade preenchida pelo CEP"
									/>
								{/snippet}
							</Control>
							<FieldErrors class="mt-2 space-y-1 text-sm font-medium text-destructive" />
							<Description>Use o nome completo da cidade.</Description>
						</Field>
					</div>

					<div
						id="create-condominium-wizard-field-state-wrap"
						data-test="create-condominium-wizard-field-state-wrap"
						class="space-y-2"
					>
						<Field form={condominiumForm} name="regionState">
							<Control>
								{#snippet children({ props })}
									<FormLabel>UF</FormLabel>
									<select
										{...props}
										data-test="create-condominium-wizard-field-state"
										bind:value={$formData.regionState}
										class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
									>
										<option
											id="create-condominium-wizard-field-state-option-empty"
											data-test="create-condominium-wizard-field-state-option-empty"
											value=""
										>
											Selecione a UF
										</option>
										{#each brazilStateOptions as stateOption}
											<option
												id={`create-condominium-wizard-field-state-option-${stateOption.toLowerCase()}`}
												data-test={`create-condominium-wizard-field-state-option-${stateOption.toLowerCase()}`}
												value={stateOption}
											>
												{stateOption}
											</option>
										{/each}
									</select>
								{/snippet}
							</Control>
							<FieldErrors class="mt-2 space-y-1 text-sm font-medium text-destructive" />
							<Description>Selecione a UF do endereço do condomínio.</Description>
						</Field>
					</div>
				</div>
			{/if}

			{#if currentStep === 3}
				<div
					id="create-condominium-wizard-step-panel-3"
					data-test="create-condominium-wizard-step-panel-3"
					class="grid gap-5 md:grid-cols-2"
				>
					<div
						id="create-condominium-wizard-field-cnpj-wrap"
						data-test="create-condominium-wizard-field-cnpj-wrap"
						class="space-y-2"
					>
						<Field form={condominiumForm} name="cnpj">
							<Control>
								{#snippet children({ props })}
									<FormLabel>CNPJ</FormLabel>
									<Input
										{...props}
										data-test="create-condominium-wizard-field-cnpj"
										bind:value={$formData.cnpj}
										oninput={handleCnpjInput}
										placeholder="00.000.000/0000-00"
									/>
								{/snippet}
							</Control>
							<FieldErrors class="mt-2 space-y-1 text-sm font-medium text-destructive" />
							<Description>Informe o CNPJ principal do condomínio.</Description>
						</Field>
					</div>

					<div
						id="create-condominium-wizard-field-razao-social-wrap"
						data-test="create-condominium-wizard-field-razao-social-wrap"
						class="space-y-2 md:col-span-2"
					>
						<Field form={condominiumForm} name="razaoSocial">
							<Control>
								{#snippet children({ props })}
									<FormLabel>Razão social</FormLabel>
									<Input
										{...props}
										data-test="create-condominium-wizard-field-razao-social"
										bind:value={$formData.razaoSocial}
										placeholder="Ex.: Condomínio Jardim das Flores SPE LTDA"
									/>
								{/snippet}
							</Control>
							<FieldErrors class="mt-2 space-y-1 text-sm font-medium text-destructive" />
							<Description>Use a razão social exatamente como consta no CNPJ.</Description>
						</Field>
					</div>
				</div>
			{/if}

			{#if errorMessage}
				<p
					id="create-condominium-wizard-error"
					data-test="create-condominium-wizard-error"
					class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
				>
					{errorMessage}
				</p>
			{/if}

			<div
				id="create-condominium-wizard-actions"
				data-test="create-condominium-wizard-actions"
				class="flex flex-wrap justify-between gap-3 border-t border-slate-200 pt-6"
			>
				<div
					id="create-condominium-wizard-actions-left"
					data-test="create-condominium-wizard-actions-left"
				>
					{#if currentStep > 1}
						<Button
							id="create-condominium-wizard-back-button"
							data-test="create-condominium-wizard-back-button"
							type="button"
							variant="outline"
							onclick={goToPreviousStep}
						>
							Voltar
						</Button>
					{/if}
				</div>

				<div
					id="create-condominium-wizard-actions-right"
					data-test="create-condominium-wizard-actions-right"
					class="flex gap-3"
				>
					{#if currentStep < 3}
						<Button
							id="create-condominium-wizard-next-button"
							data-test="create-condominium-wizard-next-button"
							type="button"
							onclick={() => void goToNextStep()}
						>
							Continuar
						</Button>
					{:else}
						<Button
							id="create-condominium-wizard-submit-button"
							data-test="create-condominium-wizard-submit-button"
							type="submit"
							disabled={isSubmitting}
						>
							{isSubmitting ? 'Criando condomínio...' : 'Criar condomínio'}
						</Button>
					{/if}
				</div>
			</div>
		</form>
	</Card.Content>
</Card.Root>
