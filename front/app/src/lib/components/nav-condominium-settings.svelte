<script lang="ts">
	import type { Component } from "svelte";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";

	let {
		items,
	}: {
		items: {
			name: string;
			url: string;
			icon: Component;
		}[];
	} = $props();
</script>

<Sidebar.Group id="condominium-settings-group" class="group-data-[collapsible=icon]:hidden">
	<Sidebar.GroupLabel id="condominium-settings-label">Configuração do condomínio</Sidebar.GroupLabel>
	<Sidebar.Menu id="condominium-settings-menu">
		{#each items as item (item.name)}
			<Sidebar.MenuItem id={`condominium-settings-item-${item.name.toLowerCase()}`}>
				<Sidebar.MenuButton id={`condominium-settings-button-${item.name.toLowerCase()}`}>
					{#snippet child({ props })}
						<a
							id={`condominium-settings-link-${item.name.toLowerCase()}`}
							href={item.url}
							{...props}
						>
							<item.icon />
							<span>{item.name}</span>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		{/each}
	</Sidebar.Menu>
</Sidebar.Group>
