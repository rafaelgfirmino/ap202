<script lang="ts">
	import type { Component, ComponentProps } from "svelte";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";

	let {
		items,
		versions,
		...restProps
	}: {
		items: {
			title: string;
			url: string;
			icon: Component;
		}[];
		versions?: {
			frontend: string;
			backend: string;
		};
	} & ComponentProps<typeof Sidebar.Group> = $props();
</script>

<Sidebar.Group id="sidebar-secondary-group" {...restProps}>
	<Sidebar.GroupContent id="sidebar-secondary-content">
		<Sidebar.Menu id="sidebar-secondary-menu">
			{#each items as item (item.title)}
				<Sidebar.MenuItem id={`sidebar-secondary-item-${item.title.toLowerCase()}`}>
					<Sidebar.MenuButton
						id={`sidebar-secondary-button-${item.title.toLowerCase()}`}
						size="sm"
					>
						{#snippet child({ props })}
							<a
								id={`sidebar-secondary-link-${item.title.toLowerCase()}`}
								href={item.url}
								{...props}
							>
								<item.icon />
								<span>{item.title}</span>
							</a>
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			{/each}
		</Sidebar.Menu>
		{#if versions}
			<div
				id="sidebar-version-card"
				class="text-sidebar-foreground/50 mt-3 px-2 text-[11px]"
			>
				<div id="sidebar-version-label" class="sr-only">
					Version
				</div>
				<div id="sidebar-version-value" class="font-medium">
					v{versions.frontend} / {versions.backend}
				</div>
			</div>
		{/if}
	</Sidebar.GroupContent>
</Sidebar.Group>
