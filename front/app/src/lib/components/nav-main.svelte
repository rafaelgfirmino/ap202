<script lang="ts">
	import type { Component } from "svelte";
	import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import * as Collapsible from "$lib/components/ui/collapsible/index.js";

	let {
		items,
	}: {
		items: {
			title: string;
			url: string;
			icon: Component;
			isActive?: boolean;
			items?: {
				title: string;
				url: string;
			}[];
		}[];
	} = $props();
</script>

<Sidebar.Group>
	<Sidebar.GroupLabel id="sidebar-main-group-label">Menu</Sidebar.GroupLabel>
	<Sidebar.Menu id="sidebar-main-menu">
		{#each items as item (item.title)}
			<Collapsible.Root open={item.isActive}>
				{#snippet child({ props })}
					<Sidebar.MenuItem {...props}>
						<Sidebar.MenuButton
							id={`sidebar-main-button-${item.title.toLowerCase().replaceAll(" ", "-")}`}
							tooltipContent={item.title}
						>
							{#snippet child({ props })}
								<a
									id={`sidebar-main-link-${item.title.toLowerCase().replaceAll(" ", "-")}`}
									href={item.url}
									{...props}
								>
									<item.icon />
									<span>{item.title}</span>
								</a>
							{/snippet}
						</Sidebar.MenuButton>
						{#if item.items?.length}
							<Collapsible.Trigger>
								{#snippet child({ props })}
									<Sidebar.MenuAction
										id={`sidebar-main-toggle-${item.title.toLowerCase().replaceAll(" ", "-")}`}
										{...props}
										class="data-[state=open]:rotate-90"
									>
										<ChevronRightIcon />
										<span class="sr-only">Toggle</span>
									</Sidebar.MenuAction>
								{/snippet}
							</Collapsible.Trigger>
							<Collapsible.Content>
								<Sidebar.MenuSub
									id={`sidebar-main-submenu-${item.title.toLowerCase().replaceAll(" ", "-")}`}
								>
									{#each item.items as subItem (subItem.title)}
										<Sidebar.MenuSubItem>
											<Sidebar.MenuSubButton
												id={`sidebar-main-subbutton-${subItem.title.toLowerCase().replaceAll(" ", "-")}`}
											>
												{#snippet child({ props })}
													<a
														id={`sidebar-main-sublink-${subItem.title.toLowerCase().replaceAll(" ", "-")}`}
														href={subItem.url}
														{...props}
													>
														<span>{subItem.title}</span>
													</a>
												{/snippet}
											</Sidebar.MenuSubButton>
										</Sidebar.MenuSubItem>
									{/each}
								</Sidebar.MenuSub>
							</Collapsible.Content>
						{/if}
					</Sidebar.MenuItem>
				{/snippet}
			</Collapsible.Root>
		{/each}
	</Sidebar.Menu>
</Sidebar.Group>
