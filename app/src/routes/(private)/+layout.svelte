<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import { getClerkErrorMessage } from '$lib/services/clerk.js';
	import { getAuthenticatedUser, isAuthenticated, type AuthenticatedUser } from '$lib/services/auth.js';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import posthog from 'posthog-js';

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
			posthog.identify(user.email, { email: user.email, name: user.name });
		} catch (error) {
			console.error(getClerkErrorMessage(error));
			await goto('/security/login');
		} finally {
			isLoadingSession = false;
		}
	});
</script>

<Sidebar.Provider>
	{#if isLoadingSession}
		<div
			id="private-layout-loading"
			data-test="private-layout-loading"
			class="flex min-h-screen w-full items-center justify-center"
		>
			<div
				id="private-layout-loading-label"
				data-test="private-layout-loading-label"
				class="text-sm text-muted-foreground"
			>
				Carregando sessao...
			</div>
		</div>
	{:else if user}
		<AppSidebar user={{ name: user.name, email: user.email, avatar: '' }} />
	<Sidebar.Inset>
		<header
			id="private-layout-header"
			class="sticky top-0 z-20 flex h-[50px] max-h-[50px] shrink-0 items-center overflow-hidden border-b bg-background/95 backdrop-blur transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-[50px]"
		>
			<div
				id="private-layout-header-content"
				class="flex h-full w-full items-center justify-between gap-4 px-4 py-2"
			>
				<div id="private-layout-header-left" class="flex min-w-0 items-center gap-3">
					<Sidebar.Trigger id="private-layout-sidebar-trigger" class="-ms-1" />
					<Separator
						id="private-layout-header-separator"
						orientation="vertical"
						class="hidden h-8 md:block"
					/>
					<Breadcrumb.Root id="private-layout-breadcrumb" class="min-w-0">
						<Breadcrumb.List id="private-layout-breadcrumb-list">
							<Breadcrumb.Item id="private-layout-breadcrumb-item-home">
								<Breadcrumb.Link
									id="private-layout-breadcrumb-link-home"
									href="/"
									class="text-xs"
								>
									AP202
								</Breadcrumb.Link>
							</Breadcrumb.Item>
							<Breadcrumb.Separator
								id="private-layout-breadcrumb-separator-dashboard"
								class="hidden sm:block"
							/>
							<Breadcrumb.Item
								id="private-layout-breadcrumb-item-dashboard"
								class="hidden sm:block"
							>
								<Breadcrumb.Page
									id="private-layout-breadcrumb-page-dashboard"
									class="truncate text-xs font-medium"
								>
									Painel administrativo
								</Breadcrumb.Page>
							</Breadcrumb.Item>
						</Breadcrumb.List>
					</Breadcrumb.Root>
				</div>
				<div id="private-layout-header-right" class="flex items-center gap-3">
					
				</div>
			</div>
		</header>
		<div id="private-layout-body" class="flex flex-1 flex-col gap-4 p-4 pt-4">
			<div
				id="private-layout-content"
				class="min-h-screen flex-1 rounded-xl bg-muted/50 p-2 md:min-h-min"
			>
				{@render children()}
			</div>
		</div>
	</Sidebar.Inset>
	{/if}
</Sidebar.Provider>
