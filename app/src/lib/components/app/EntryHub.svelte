<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import Building2Icon from '@lucide/svelte/icons/building-2';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
	import CreateCondominiumWizard from '$lib/components/app/CreateCondominiumWizard.svelte';
	import Logo from '$lib/components/app/logo/index.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import {
		getAuthenticatedUser,
		isAuthenticated,
		listMyCondominiums,
		logout,
		type AuthenticatedUser,
		type UserCondominium
	} from '$lib/services/auth.js';

	const createAccountHref =
		'https://wa.me/5511999999999?text=Ol%C3%A1%21%20Quero%20criar%20uma%20conta%20no%20AP202.';

	let isLoading = $state(true);
	let errorMessage = $state('');
	let user = $state<AuthenticatedUser | null>(null);
	let condominiums = $state<UserCondominium[]>([]);

	async function loadEntryState(): Promise<void> {
		errorMessage = '';

		try {
			const authenticated = await isAuthenticated();

			if (!authenticated) {
				await goto('/security/login');
				return;
			}

			const [loadedUser, loadedCondominiums] = await Promise.all([
				getAuthenticatedUser(),
				listMyCondominiums()
			]);

			if (loadedCondominiums.length === 1 && loadedCondominiums[0]?.code) {
				await goto(`/g/${loadedCondominiums[0].code}`);
				return;
			}

			user = loadedUser;
			condominiums = loadedCondominiums;
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Não foi possível carregar seus condomínios.';
		} finally {
			isLoading = false;
		}
	}

	async function enterCondominium(code: string): Promise<void> {
		await goto(`/g/${code}`);
	}

	async function handleCondominiumCreated(condominium: UserCondominium): Promise<void> {
		await goto(`/g/${condominium.code}`);
	}

	async function handleLogout(): Promise<void> {
		await logout();
	}

	onMount(async () => {
		await loadEntryState();
	});
</script>

<svelte:head>
	<title>Entrar | AP202</title>
</svelte:head>

<main
	id="entry-hub-page"
	data-test="entry-hub-page"
	class="min-h-screen bg-background text-foreground"
>
	<section
		id="entry-hub-shell"
		data-test="entry-hub-shell"
		class="flex min-h-screen w-full flex-col px-5 py-6 sm:px-8 lg:px-10"
	>
		<header
			id="entry-hub-header"
			data-test="entry-hub-header"
			class="flex items-center justify-between gap-4 border-b border-slate-200 pb-5"
		>
			<div
				id="entry-hub-brand-wrap"
				data-test="entry-hub-brand-wrap"
				class="flex items-center gap-4"
			>
				<div
					id="entry-hub-brand-logo-wrap"
					data-test="entry-hub-brand-logo-wrap"
					class="flex h-14 items-center"
				>
					<Logo class="h-10" />
				</div>
				<div
					id="entry-hub-brand-copy"
					data-test="entry-hub-brand-copy"
					class="space-y-1"
				>
					<p
						id="entry-hub-brand-title"
						data-test="entry-hub-brand-title"
						class="text-lg font-semibold"
					>
						Área de entrada do AP202
					</p>
				</div>
			</div>

			<div
				id="entry-hub-header-actions"
				data-test="entry-hub-header-actions"
				class="flex items-center gap-3"
			>
				<Button
					id="entry-hub-header-logout-button"
					data-test="entry-hub-header-logout-button"
					onclick={() => void handleLogout()}
					variant="outline"
					class="hidden sm:inline-flex"
				>
					<LogOutIcon aria-hidden="true" />
					Sair
				</Button>
			</div>
		</header>

		{#if isLoading}
			<div
				id="entry-hub-loading-state"
				data-test="entry-hub-loading-state"
				class="flex flex-1 items-center justify-center"
			>
				<div
					id="entry-hub-loading-card"
					data-test="entry-hub-loading-card"
					class="rounded-[2rem] border border-slate-200 px-8 py-10 text-center"
				>
					<p
						id="entry-hub-loading-title"
						data-test="entry-hub-loading-title"
						class="text-lg font-semibold"
					>
						Verificando seu acesso
					</p>
					<p
						id="entry-hub-loading-description"
						data-test="entry-hub-loading-description"
						class="mt-2 text-sm text-muted-foreground"
					>
						Estamos preparando sua entrada.
					</p>
				</div>
			</div>
		{:else}
			<div
				id="entry-hub-content"
				data-test="entry-hub-content"
				class="flex flex-1 items-center justify-center py-10"
			>
				<div id="entry-hub-list-column" data-test="entry-hub-list-column" class="w-full max-w-3xl">
					{#if errorMessage}
						<div
							id="entry-hub-error-state"
							data-test="entry-hub-error-state"
							class="rounded-[2rem] border border-rose-200 bg-rose-50 p-6 sm:p-8"
						>
							<p
								id="entry-hub-error-title"
								data-test="entry-hub-error-title"
								class="text-2xl font-semibold text-rose-700"
							>
								Não foi possível carregar seus dados
							</p>
							<p
								id="entry-hub-error-description"
								data-test="entry-hub-error-description"
								class="mt-3 leading-7 text-rose-700/90"
							>
								{errorMessage}
							</p>
							<div
								id="entry-hub-error-actions"
								data-test="entry-hub-error-actions"
								class="mt-4 flex flex-wrap gap-3"
							>
								<Button
									id="entry-hub-error-retry-button"
									data-test="entry-hub-error-retry-button"
									onclick={() => void loadEntryState()}
								>
									Tentar novamente
								</Button>
								<Button
									id="entry-hub-error-login-button"
									data-test="entry-hub-error-login-button"
									href="/security/login"
									variant="outline"
								>
									Ir para login
								</Button>
							</div>
						</div>
					{:else if condominiums.length > 0}
						<Card.Root
							id="entry-hub-selection-card"
							data-test="entry-hub-selection-card"
							class="rounded-[2rem] border-slate-200 shadow-none"
						>
							<Card.Content
								id="entry-hub-selection-card-content"
								data-test="entry-hub-selection-card-content"
								class="p-6 sm:p-8"
							>
								<div
									id="entry-hub-copy-badge"
									data-test="entry-hub-copy-badge"
									class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-secondary px-4 py-2 text-sm font-medium text-primary"
								>
									<ShieldCheckIcon class="h-4 w-4" aria-hidden="true" />
									Escolha o condomínio
								</div>

								<h1
									id="entry-hub-title"
									data-test="entry-hub-title"
									class="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl"
								>
									{user ? `Olá, ${user.first_name || user.name}.` : 'Entre no AP202.'}
								</h1>

								<p
									id="entry-hub-description"
									data-test="entry-hub-description"
									class="mt-3 max-w-2xl leading-7 text-muted-foreground"
								>
									Selecione abaixo o condomínio que deseja acessar ou entre com outra conta.
								</p>

								<div
									id="entry-hub-top-actions"
									data-test="entry-hub-top-actions"
									class="mt-6 flex flex-wrap gap-3"
								>
									<Button
										id="entry-hub-header-login-button"
										data-test="entry-hub-header-login-button"
										href="/security/login"
										variant="outline"
									>
										Entrar com outra conta
									</Button>
									<Button
										id="entry-hub-header-create-account-button"
										data-test="entry-hub-header-create-account-button"
										href={createAccountHref}
										target="_blank"
										rel="noreferrer"
										variant="outline"
									>
										Criar conta
									</Button>
								</div>

								<div
									id="entry-hub-condominiums-grid"
									data-test="entry-hub-condominiums-grid"
									class="mt-8 grid gap-3"
								>
							{#each condominiums as condominium, index}
								<Card.Root
									id={`entry-hub-condominium-card-${index + 1}`}
									data-test={`entry-hub-condominium-card-${index + 1}`}
									class="rounded-[1.5rem] border-slate-200 shadow-none transition-colors hover:bg-secondary/40"
								>
									<Card.Content
										id={`entry-hub-condominium-card-content-${index + 1}`}
										data-test={`entry-hub-condominium-card-content-${index + 1}`}
										class="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
									>
										<div
											id={`entry-hub-condominium-card-copy-${index + 1}`}
											data-test={`entry-hub-condominium-card-copy-${index + 1}`}
											class="flex items-start gap-4"
										>
											<div
												id={`entry-hub-condominium-card-icon-${index + 1}`}
												data-test={`entry-hub-condominium-card-icon-${index + 1}`}
												class="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary"
											>
												<Building2Icon class="h-5 w-5 text-primary" aria-hidden="true" />
											</div>
											<div
												id={`entry-hub-condominium-card-text-${index + 1}`}
												data-test={`entry-hub-condominium-card-text-${index + 1}`}
												class="space-y-2"
											>
												<p
													id={`entry-hub-condominium-card-name-${index + 1}`}
													data-test={`entry-hub-condominium-card-name-${index + 1}`}
													class="text-xl font-semibold"
												>
													{condominium.name}
												</p>
												<p
													id={`entry-hub-condominium-card-code-${index + 1}`}
													data-test={`entry-hub-condominium-card-code-${index + 1}`}
													class="text-sm text-muted-foreground"
												>
													Código: {condominium.code}
												</p>
											</div>
										</div>

										<Button
											id={`entry-hub-condominium-card-button-${index + 1}`}
											data-test={`entry-hub-condominium-card-button-${index + 1}`}
											onclick={() => void enterCondominium(condominium.code)}
										>
											Entrar
										</Button>
									</Card.Content>
								</Card.Root>
							{/each}
								</div>
							</Card.Content>
						</Card.Root>
					{:else}
						<div
							id="entry-hub-empty-state"
							data-test="entry-hub-empty-state"
							class="space-y-5"
						>
							<div id="entry-hub-empty-copy" data-test="entry-hub-empty-copy" class="space-y-2">
								<p
									id="entry-hub-empty-title"
									data-test="entry-hub-empty-title"
									class="text-3xl font-semibold"
								>
									Vamos criar seu primeiro condomínio
								</p>
								<p
									id="entry-hub-empty-description"
									data-test="entry-hub-empty-description"
									class="max-w-2xl leading-7 text-muted-foreground"
								>
									Sua conta está pronta, mas ainda não existe um condomínio vinculado. Siga o
									passo a passo abaixo para criar o condomínio por conta própria e entrar em
									seguida.
								</p>
							</div>

							<div
								id="entry-hub-empty-actions"
								data-test="entry-hub-empty-actions"
								class="flex flex-wrap gap-3"
							>
								<Button
									id="entry-hub-empty-login-button"
									data-test="entry-hub-empty-login-button"
									href="/security/login"
									variant="outline"
								>
									Entrar com outra conta
								</Button>
								<Button
									id="entry-hub-empty-create-account-button"
									data-test="entry-hub-empty-create-account-button"
									href={createAccountHref}
									target="_blank"
									rel="noreferrer"
								>
									Criar conta
								</Button>
							</div>

							<CreateCondominiumWizard onCreated={handleCondominiumCreated} />
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</section>
</main>
