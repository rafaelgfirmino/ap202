<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import Logo from '$lib/components/app/logo/index.svelte';
	import { getInitialRoute } from '$lib/services/auth.js';
	import {
		getClerk,
		getClerkErrorMessage,
		getPendingSecondFactorState,
		selectSecondFactor,
		signInWithPassword,
		type SecondFactorOption,
		type SecondFactorStrategy,
		verifySecondFactor
	} from '$lib/services/clerk.js';
	import Building2Icon from '@lucide/svelte/icons/building-2';
	import CarFrontIcon from '@lucide/svelte/icons/car-front';
	import HouseIcon from '@lucide/svelte/icons/house';

	let email = $state('');
	let password = $state('');
	let verificationCode = $state('');
	let errorMessage = $state('');
	let isLoading = $state(false);
	let loginStep = $state<'password' | 'second-factor'>('password');
	let secondFactorOptions = $state<SecondFactorOption[]>([]);
	let selectedSecondFactorStrategy = $state<SecondFactorStrategy>('email_code');

	const activeSecondFactor = $derived(
		secondFactorOptions.find((option) => option.strategy === selectedSecondFactorStrategy) ?? null
	);
	const secondFactorTitle = $derived.by(() => {
		if (!activeSecondFactor) {
			return 'Verificação adicional';
		}

		return activeSecondFactor.label;
	});
	const secondFactorDescription = $derived.by(() => {
		if (!activeSecondFactor) {
			return 'Confirme a autenticação para concluir o acesso.';
		}

		return activeSecondFactor.description;
	});
	const secondFactorPlaceholder = $derived.by(() => {
		if (selectedSecondFactorStrategy === 'backup_code') {
			return 'Informe o código de backup';
		}

		if (selectedSecondFactorStrategy === 'totp') {
			return 'Informe o código do autenticador';
		}

		return 'Informe o código recebido';
	});
	const secondFactorButtonLabel = $derived.by(() => {
		if (isLoading) {
			return 'Validando...';
		}

		return 'Confirmar código';
	});

	function setSecondFactorState(options: SecondFactorOption[], strategy: SecondFactorStrategy): void {
		secondFactorOptions = options;
		selectedSecondFactorStrategy = strategy;
		loginStep = 'second-factor';
		verificationCode = '';
	}

	async function redirectToInitialPage(): Promise<void> {
		await goto(await getInitialRoute());
	}

	onMount(async () => {
		try {
			const clerk = await getClerk();

			if (clerk.isSignedIn) {
				await redirectToInitialPage();
				return;
			}

			if (clerk.client?.signIn?.status === 'needs_second_factor') {
				const pendingState = await getPendingSecondFactorState();

				setSecondFactorState(pendingState.options, pendingState.selectedStrategy);
			}
		} catch (error) {
			errorMessage = getClerkErrorMessage(error);
		}
	});

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		errorMessage = '';
		isLoading = true;

		try {
			const clerk = await getClerk();

			if (clerk.isSignedIn) {
				await redirectToInitialPage();
				return;
			}

			const result = await signInWithPassword({ email, password });

			if (result.status === 'complete') {
				await redirectToInitialPage();
				return;
			}

			setSecondFactorState(result.options, result.selectedStrategy);
		} catch (error) {
			const message = getClerkErrorMessage(error);

			if (message === "You're already signed in.") {
				await redirectToInitialPage();
				return;
			}

			errorMessage = message;
		} finally {
			isLoading = false;
		}
	}

	async function handleSecondFactorSelection(strategy: SecondFactorStrategy): Promise<void> {
		errorMessage = '';
		isLoading = true;

		try {
			const result = await selectSecondFactor(strategy);
			setSecondFactorState(result.options, result.selectedStrategy);
		} catch (error) {
			errorMessage = getClerkErrorMessage(error);
		} finally {
			isLoading = false;
		}
	}

	async function handleSecondFactorSubmit(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		errorMessage = '';
		isLoading = true;

		try {
			const result = await verifySecondFactor({
				strategy: selectedSecondFactorStrategy,
				code: verificationCode
			});

			if (result.status === 'complete') {
				await redirectToInitialPage();
				return;
			}

			setSecondFactorState(result.options, result.selectedStrategy);
		} catch (error) {
			errorMessage = getClerkErrorMessage(error);
		} finally {
			isLoading = false;
		}
	}

	function handleBackToPassword(): void {
		loginStep = 'password';
		secondFactorOptions = [];
		verificationCode = '';
		errorMessage = '';
	}
</script>

<main
	id="security-login-page"
	class="from-background to-muted/40 flex min-h-screen items-center justify-center bg-gradient-to-br px-4 py-8"
>
	<section
		id="security-login-shell"
		class="bg-card ring-border grid w-full max-w-6xl overflow-hidden ring-1 lg:grid-cols-[1fr_1.12fr]"
	>
		<div
			id="security-login-form-panel"
			class="flex min-h-[42rem] flex-col justify-center px-6 py-8 sm:px-10 lg:px-12"
		>
			<Card.Root
				id="security-login-form-wrap"
				class="mx-auto w-full max-w-md gap-8 bg-transparent py-0 ring-0"
			>
				<div id="security-login-brand" class="flex justify-center lg:justify-start">
					<div
						id="security-login-brand-badge"
						class="flex h-20 w-40 items-center justify-center overflow-hidden"
					>
						<Logo />
					</div>
				</div>

				<Card.Header id="security-login-heading" class="space-y-2 px-0">
					<Card.Title
						id="security-login-title"
						class="text-foreground text-5xl font-semibold text-center tracking-tight"
					>
						{loginStep === 'password' ? 'Entrar' : secondFactorTitle}
					</Card.Title>
					<Card.Description
						id="security-login-description"
						class="text-center text-sm leading-relaxed"
					>
						{#if loginStep === 'password'}
							Entre com seu email e senha para acessar o AP202.
						{:else}
							{secondFactorDescription}
						{/if}
					</Card.Description>
				</Card.Header>

				<Card.Content id="security-login-form-content" class="px-0">
					{#if loginStep === 'password'}
						<form id="security-login-form" class="space-y-5" onsubmit={handleSubmit}>
							<div id="security-login-email-field" class="space-y-2">
								<Label id="security-login-email-label" for="security-login-email-input">Email</Label>
								<Input
									id="security-login-email-input"
									type="email"
									placeholder="admin@ap202.com"
									autocomplete="email"
									bind:value={email}
									required
								/>
							</div>

							<div id="security-login-password-field" class="space-y-2">
								<Label id="security-login-password-label" for="security-login-password-input">
									Password
								</Label>
								<Input
									id="security-login-password-input"
									type="password"
									placeholder="••••••"
									autocomplete="current-password"
									bind:value={password}
									required
								/>
							</div>

							{#if errorMessage}
								<p
									id="security-login-error-message"
									class="text-destructive border border-current px-4 py-2 text-xs"
								>
									{errorMessage}
								</p>
							{/if}

							<Button
								id="security-login-submit-button"
								type="submit"
								disabled={isLoading}
								class="h-12 w-full text-sm"
							>
								{isLoading ? 'Entrando...' : 'Entrar'}
							</Button>
						</form>
					{:else}
						<div id="security-login-second-factor" class="space-y-5">
							<div id="security-login-factor-options" class="grid gap-2">
								{#each secondFactorOptions as option}
									<Button
										id={`security-login-factor-option-${option.strategy}`}
										type="button"
										variant={selectedSecondFactorStrategy === option.strategy ? 'default' : 'outline'}
										class="h-auto justify-start px-4 py-3 text-left"
										disabled={isLoading}
										onclick={() => handleSecondFactorSelection(option.strategy)}
									>
										<span class="flex flex-col items-start gap-1">
											<span class="text-sm font-medium">{option.label}</span>
											<span class="text-xs opacity-80">{option.description}</span>
										</span>
									</Button>
								{/each}
							</div>

							<form
								id="security-login-second-factor-form"
								class="space-y-5"
								onsubmit={handleSecondFactorSubmit}
							>
								<div id="security-login-code-field" class="space-y-2">
									<Label id="security-login-code-label" for="security-login-code-input">
										Código de verificação
									</Label>
									<Input
										id="security-login-code-input"
										type="text"
										placeholder={secondFactorPlaceholder}
										autocomplete="one-time-code"
										bind:value={verificationCode}
										required
									/>
								</div>

								{#if errorMessage}
									<p
										id="security-login-error-message"
										class="text-destructive border border-current px-4 py-2 text-xs"
									>
										{errorMessage}
									</p>
								{/if}

								<div id="security-login-second-factor-actions" class="grid gap-3 sm:grid-cols-2">
									<Button
										id="security-login-confirm-second-factor-button"
										type="submit"
										disabled={isLoading}
										class="h-12 w-full text-sm"
									>
										{secondFactorButtonLabel}
									</Button>

									<Button
										id="security-login-back-button"
										type="button"
										variant="outline"
										disabled={isLoading}
										class="h-12 w-full text-sm"
										onclick={handleBackToPassword}
									>
										Voltar
									</Button>
								</div>
							</form>
						</div>
					{/if}
				</Card.Content>
			</Card.Root>
		</div>

		<div
			id="security-login-illustration-panel"
			class="from-background to-muted/40 border-border/80 flex items-center justify-center border-t px-5 py-6 lg:border-t-0 lg:border-l lg:px-8"
		>
			<div
				id="security-login-illustration-frame"
				class="bg-background flex w-full max-w-2xl items-center justify-center p-5 shadow-sm ring-1 ring-black/5"
			>
				<div
					id="security-login-illustration-inner"
					class="bg-muted/20 relative flex aspect-square w-full items-center justify-center overflow-hidden border border-slate-200 p-6"
				>
					<div
						id="security-login-cloud-top-left"
						class="absolute left-8 top-16 h-4 w-10 border border-slate-400 bg-white"
					></div>
					<div
						id="security-login-cloud-top-center"
						class="absolute top-6 h-4 w-16 border border-slate-400 bg-white"
					></div>
					<div
						id="security-login-cloud-top-right"
						class="absolute right-12 top-10 h-4 w-10 border border-slate-400 bg-white"
					></div>
					<div
						id="security-login-cloud-right"
						class="absolute right-0 top-1/3 h-16 w-6 border border-slate-400 bg-white"
					></div>
					<div
						id="security-login-cloud-left"
						class="absolute left-0 top-1/3 h-16 w-6 border border-slate-400 bg-white"
					></div>

					<div
						id="security-login-city"
						class="relative flex w-full max-w-lg items-end justify-center gap-6 border-b-2 border-slate-700 pb-5"
					>
						<div
							id="security-login-building-left"
							class="relative flex h-56 w-24 flex-col border-2 border-slate-700 bg-white"
						>
							<div id="security-login-building-left-roof" class="h-2 border-b-2 border-slate-700"></div>
							<div id="security-login-building-left-center" class="bg-primary absolute inset-y-1 left-1/2 w-4 -translate-x-1/2"></div>
							<div id="security-login-building-left-windows" class="grid flex-1 grid-cols-2 gap-4 p-3">
								{#each Array.from({ length: 8 }) as _, index}
									<div
										id={`security-login-building-left-window-${index + 1}`}
										class="h-6 border border-slate-700 bg-slate-50"
									></div>
								{/each}
							</div>
						</div>

						<div id="security-login-building-center-wrap" class="relative flex flex-col items-center">
							<div
								id="security-login-building-center-roof"
								class="border-primary absolute -top-6 h-0 w-0 border-x-[28px] border-b-[22px] border-x-transparent"
							></div>
							<div
								id="security-login-building-center"
								class="mt-2 flex h-32 w-28 flex-col justify-end border-2 border-slate-700 bg-white"
							>
								<div id="security-login-building-center-windows" class="grid grid-cols-2 gap-4 px-4 pt-7">
									<div id="security-login-building-center-window-1" class="h-6 border border-slate-700"></div>
									<div id="security-login-building-center-window-2" class="h-6 border border-slate-700"></div>
								</div>
								<div
									id="security-login-building-center-door"
									class="mx-auto mt-8 h-9 w-6 border-x-2 border-t-2 border-slate-700"
								></div>
							</div>
						</div>

						<div
							id="security-login-building-right"
							class="relative flex h-52 w-32 flex-col border-2 border-slate-700 bg-white"
						>
							<div id="security-login-building-right-roof" class="h-6 border-b-2 border-slate-700"></div>
							<div id="security-login-building-right-windows" class="grid flex-1 grid-cols-3 gap-3 p-3">
								{#each Array.from({ length: 12 }) as _, index}
									<div
										id={`security-login-building-right-window-${index + 1}`}
										class="h-5 border border-slate-700 bg-slate-50"
									></div>
								{/each}
							</div>
						</div>

						<div
							id="security-login-car"
							class="absolute bottom-[-1.25rem] left-1/2 flex h-10 w-20 -translate-x-1/2 items-end justify-center"
						>
							<div
								id="security-login-car-body"
								class="relative h-8 w-full border-2 border-slate-700 bg-white"
							>
								<div
									id="security-login-car-window"
									class="absolute left-1/2 top-1 h-3 w-8 -translate-x-1/2 bg-primary"
								></div>
							</div>
							<div
								id="security-login-car-wheel-left"
								class="absolute bottom-[-0.3rem] left-3 h-4 w-4 border-2 border-slate-700 bg-white"
							></div>
							<div
								id="security-login-car-wheel-right"
								class="absolute bottom-[-0.3rem] right-3 h-4 w-4 border-2 border-slate-700 bg-white"
							></div>
						</div>
					</div>

					<div id="security-login-illustration-icons" class="pointer-events-none absolute inset-0">
						<Building2Icon
							id="security-login-building-icon"
							class="text-primary/10 absolute bottom-14 right-14 size-28"
						/>
						<HouseIcon
							id="security-login-house-icon"
							class="text-primary/10 absolute bottom-24 left-14 size-20"
						/>
						<CarFrontIcon
							id="security-login-car-icon"
							class="text-primary/10 absolute bottom-8 left-1/2 size-16 -translate-x-1/2"
						/>
					</div>
				</div>
			</div>
		</div>
	</section>
</main>
