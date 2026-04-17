<script lang="ts">
	import * as Collapsible from "$lib/components/ui/collapsible/index.js";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";

	let {
		items,
	}: {
		items: {
			title: string;
			url: string;
			// this should be `Component` after @lucide/svelte updates types
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			icon?: any;
			isActive?: boolean;
			items?: {
				title: string;
				url: string;
				// this should be `Component` after @lucide/svelte updates types
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				icon?: any;
			}[];
		}[];
	} = $props();

	const sidebar = Sidebar.useSidebar();
	let hoveredDropdownTitle = $state<string | null>(null);

	function toId(value: string): string {
		return value
			.toLowerCase()
			.normalize("NFD")
			.replaceAll(/[\u0300-\u036f]/g, "")
			.replaceAll(/[^a-z0-9]+/g, "-")
			.replaceAll(/^-+|-+$/g, "");
	}
</script>

<Sidebar.Group>
	<Sidebar.GroupLabel>Navegação</Sidebar.GroupLabel>
	<Sidebar.Menu>
		{#each items as item (item.title)}
			{#if item.items?.length}
				<Collapsible.Root open={item.isActive} class="group/collapsible">
					{#snippet child({ props })}
						<Sidebar.MenuItem {...props}>
							{#if sidebar.state === "collapsed" && !sidebar.isMobile}
								<DropdownMenu.Root
									open={hoveredDropdownTitle === item.title}
									onOpenChange={(open) => {
										hoveredDropdownTitle = open ? item.title : null;
									}}
								>
									<DropdownMenu.Trigger
										onmouseenter={() => {
											hoveredDropdownTitle = item.title;
										}}
									>
										{#snippet child({ props })}
											<Sidebar.MenuButton
												id={`sidebar-item-${toId(item.title)}`}
												{...props}
												tooltipContent={item.title}
											>
												{#if item.icon}
													<item.icon />
												{/if}
												<span>{item.title}</span>
											</Sidebar.MenuButton>
										{/snippet}
									</DropdownMenu.Trigger>
									<DropdownMenu.Content
										id={`sidebar-dropdown-${toId(item.title)}`}
										class="min-w-48 rounded-lg"
										side="right"
										align="start"
										onmouseenter={() => {
											hoveredDropdownTitle = item.title;
										}}
										onmouseleave={() => {
											hoveredDropdownTitle = null;
										}}
									>
										<DropdownMenu.Label>{item.title}</DropdownMenu.Label>
										<DropdownMenu.Separator />
										{#each item.items ?? [] as subItem (subItem.title)}
											<DropdownMenu.Item>
												<a
													id={`sidebar-subitem-${toId(item.title)}-${toId(subItem.title)}`}
													href={subItem.url}
													class="flex w-full items-center gap-2"
												>
													{#if subItem.icon}
														<subItem.icon />
													{/if}
													<span>{subItem.title}</span>
												</a>
											</DropdownMenu.Item>
										{/each}
									</DropdownMenu.Content>
								</DropdownMenu.Root>
							{:else}
								<Collapsible.Trigger>
									{#snippet child({ props })}
										<Sidebar.MenuButton
											id={`sidebar-item-${toId(item.title)}`}
											{...props}
											tooltipContent={item.title}
										>
											{#if item.icon}
												<item.icon />
											{/if}
											<span>{item.title}</span>
											<ChevronRightIcon
												class="ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
											/>
										</Sidebar.MenuButton>
									{/snippet}
								</Collapsible.Trigger>
							{/if}
							<Collapsible.Content>
								<Sidebar.MenuSub>
									{#each item.items ?? [] as subItem (subItem.title)}
										<Sidebar.MenuSubItem>
											<Sidebar.MenuSubButton>
												{#snippet child({ props })}
													<a
														id={`sidebar-subitem-${toId(item.title)}-${toId(subItem.title)}`}
														href={subItem.url}
														{...props}
													>
														{#if subItem.icon}
															<subItem.icon />
														{/if}
														<span>{subItem.title}</span>
													</a>
												{/snippet}
											</Sidebar.MenuSubButton>
										</Sidebar.MenuSubItem>
									{/each}
								</Sidebar.MenuSub>
							</Collapsible.Content>
						</Sidebar.MenuItem>
					{/snippet}
				</Collapsible.Root>
			{:else}
				<Sidebar.MenuItem>
					<Sidebar.MenuButton isActive={item.isActive} tooltipContent={item.title}>
						{#snippet child({ props })}
							<a id={`sidebar-item-${toId(item.title)}`} href={item.url} {...props}>
								{#if item.icon}
									<item.icon />
								{/if}
								<span>{item.title}</span>
							</a>
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			{/if}
		{/each}
	</Sidebar.Menu>
</Sidebar.Group>
