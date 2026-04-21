<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { getClerkErrorMessage } from '$lib/services/clerk.js';
	import {
		getAuthenticatedUser,
		isAuthenticated,
		type AuthenticatedUser
	} from '$lib/services/auth.js';
	import { Separator } from '$lib/components/ui/separator/index.js';

	let { children } = $props();
	let user = $state<AuthenticatedUser | null>(null);
	let isLoadingSession = $state(true);

	onMount(async () => {
		try {
			const authenticated = await isAuthenticated();
			if (!authenticated) {
				await goto('/security/login');
				return;
			}
			user = await getAuthenticatedUser();
		} catch (error) {
			console.error(getClerkErrorMessage(error));
			await goto('/security/login');
		} finally {
			isLoadingSession = false;
		}
	});
</script>

{#if isLoadingSession}
	<div
		id="resident-layout-loading"
		data-test="resident-layout-loading"
		class="flex min-h-screen items-center justify-center"
	>
		<p class="text-sm text-muted-foreground">Carregando sessão...</p>
	</div>
{:else if user}
	<div id="resident-layout-root" data-test="resident-layout-root" class="min-h-screen bg-background">
		<header
			id="resident-layout-header"
			data-test="resident-layout-header"
			class="sticky top-0 z-20 border-b bg-background/95 backdrop-blur"
		>
			<div
				id="resident-layout-header-content"
				data-test="resident-layout-header-content"
				class="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6"
			>
				<div class="flex items-center gap-3">
					<span class="text-sm font-semibold tracking-tight text-foreground">AP202</span>
					<Separator orientation="vertical" class="h-5" />
					<span class="text-sm text-muted-foreground">Portal do Morador</span>
				</div>
				<span class="text-sm text-muted-foreground">{user.name}</span>
			</div>
		</header>

		<div
			id="resident-layout-body"
			data-test="resident-layout-body"
			class="mx-auto max-w-7xl px-4 py-6 sm:px-6"
		>
			{@render children()}
		</div>
	</div>
{/if}
