<script lang="ts" module>
	import SquareTerminalIcon from "@lucide/svelte/icons/square-terminal";
	import BotIcon from "@lucide/svelte/icons/bot";
	import BookOpenIcon from "@lucide/svelte/icons/book-open";
	import Settings2Icon from "@lucide/svelte/icons/settings-2";
	import LifeBuoyIcon from "@lucide/svelte/icons/life-buoy";
	import SendIcon from "@lucide/svelte/icons/send";
	import FrameIcon from "@lucide/svelte/icons/frame";
	import PieChartIcon from "@lucide/svelte/icons/pie-chart";
	import MapIcon from "@lucide/svelte/icons/map";
	import CommandIcon from "@lucide/svelte/icons/command";
	import ChevronsUpDownIcon from "@lucide/svelte/icons/chevrons-up-down";

	const data = {
		user: {
			name: "shadcn",
			email: "m@example.com",
			avatar: "/avatars/shadcn.jpg",
		},
		navMain: [
			{
				title: "Playground",
				url: "#",
				icon: SquareTerminalIcon,
				isActive: true,
				items: [
					{
						title: "History",
						url: "#",
					},
					{
						title: "Starred",
						url: "#",
					},
					{
						title: "Settings",
						url: "#",
					},
				],
			},
			{
				title: "Models",
				url: "#",
				icon: BotIcon,
				items: [
					{
						title: "Genesis",
						url: "#",
					},
					{
						title: "Explorer",
						url: "#",
					},
					{
						title: "Quantum",
						url: "#",
					},
				],
			},
			{
				title: "Documentation",
				url: "#",
				icon: BookOpenIcon,
				items: [
					{
						title: "Introduction",
						url: "#",
					},
					{
						title: "Get Started",
						url: "#",
					},
					{
						title: "Tutorials",
						url: "#",
					},
					{
						title: "Changelog",
						url: "#",
					},
				],
			},
			{
				title: "Settings",
				url: "#",
				icon: Settings2Icon,
				items: [
					{
						title: "General",
						url: "#",
					},
					{
						title: "Team",
						url: "#",
					},
					{
						title: "Billing",
						url: "#",
					},
					{
						title: "Limits",
						url: "#",
					},
				],
			},
		],
		navSecondary: [
			{
				title: "Support",
				url: "#",
				icon: LifeBuoyIcon,
			},
			{
				title: "Feedback",
				url: "#",
				icon: SendIcon,
			},
		],
		condominiums: [
			{
				name: "Residencial Alameda",
				plan: "Ativo",
			},
			{
				name: "Condominio Jardim das Flores",
				plan: "8 blocos",
			},
			{
				name: "Vila do Lago",
				plan: "12 unidades",
			},
		],
		projects: [
			{
				name: "Design Engineering",
				url: "#",
				icon: FrameIcon,
			},
			{
				name: "Sales & Marketing",
				url: "#",
				icon: PieChartIcon,
			},
			{
				name: "Travel",
				url: "#",
				icon: MapIcon,
			},
		],
	};
</script>

<script lang="ts">
	import type { ComponentProps } from "svelte";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import NavMain from "./nav-main.svelte";
	import NavProjects from "./nav-projects.svelte";
	import NavSecondary from "./nav-secondary.svelte";

	let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();
	let selectedCondominium = $state(data.condominiums[0].name);

	const activeCondominium = $derived(
		data.condominiums.find((condominium) => condominium.name === selectedCondominium) ??
			data.condominiums[0]
	);
</script>

<Sidebar.Root
	bind:ref
	class="h-svh"
	{...restProps}
>
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Sidebar.MenuButton
								id="condominium-switcher-trigger"
								size="lg"
								class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
								{...props}
							>
								<div
									id="condominium-switcher-icon"
									class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
								>
									<CommandIcon class="size-4" />
								</div>
								<div
									id="condominium-switcher-summary"
									class="grid flex-1 text-start text-sm leading-tight"
								>
									<span id="condominium-switcher-name" class="truncate font-medium">
										{activeCondominium.name}
									</span>
									<span id="condominium-switcher-meta" class="truncate text-xs">
										Trocar de condominio
									</span>
								</div>
								<ChevronsUpDownIcon class="ml-auto size-4" />
							</Sidebar.MenuButton>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content
						id="condominium-switcher-menu"
						class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
						side="bottom"
						align="start"
						sideOffset={6}
					>
						<DropdownMenu.Label id="condominium-switcher-menu-label" class="text-xs">
							Trocar de condominio
						</DropdownMenu.Label>
						<DropdownMenu.Separator />
						<DropdownMenu.RadioGroup bind:value={selectedCondominium}>
							{#each data.condominiums as condominium (condominium.name)}
								<DropdownMenu.RadioItem
									id={`condominium-option-${condominium.name.toLowerCase().replaceAll(" ", "-")}`}
									value={condominium.name}
								>
									<div
										id={`condominium-option-content-${condominium.name.toLowerCase().replaceAll(" ", "-")}`}
										class="flex flex-col"
									>
										<span
											id={`condominium-option-name-${condominium.name.toLowerCase().replaceAll(" ", "-")}`}
											class="font-medium"
										>
											{condominium.name}
										</span>
										<span
											id={`condominium-option-meta-${condominium.name.toLowerCase().replaceAll(" ", "-")}`}
											class="text-muted-foreground text-[11px]"
										>
											{condominium.plan}
										</span>
									</div>
								</DropdownMenu.RadioItem>
							{/each}
						</DropdownMenu.RadioGroup>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>
	<Sidebar.Content>
		<NavMain items={data.navMain} />
		<NavProjects projects={data.projects} />
		<NavSecondary items={data.navSecondary} class="mt-auto" />
	</Sidebar.Content>
</Sidebar.Root>
