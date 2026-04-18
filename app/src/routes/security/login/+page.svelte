<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import Logo from '$lib/components/app/logo/index.svelte';
	import { getInitialRoute } from '$lib/services/auth.js';
	import { getClerk, getClerkErrorMessage, signInWithPassword } from '$lib/services/clerk.js';
	import Building2Icon from '@lucide/svelte/icons/building-2';
	import CarFrontIcon from '@lucide/svelte/icons/car-front';
	import HouseIcon from '@lucide/svelte/icons/house';

	let email = $state('');
	let password = $state('');
	let errorMessage = $state('');
	let isLoading = $state(false);

	async function redirectToInitialPage(): Promise<void> {
		await goto(await getInitialRoute());
	}

	onMount(async () => {
		try {
			const clerk = await getClerk();

			if (clerk.isSignedIn) {
				await redirectToInitialPage();
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

			await signInWithPassword({ email, password });
			await redirectToInitialPage();
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
</script>

<svelte:head>
	<title>Login | AP202</title>
</svelte:head>

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
						Entrar
					</Card.Title>
				</Card.Header>

				<Card.Content id="security-login-form-content" class="px-0">
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
