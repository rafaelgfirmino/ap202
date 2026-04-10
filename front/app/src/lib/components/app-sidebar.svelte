<script lang="ts" module>
	import HouseIcon from "@lucide/svelte/icons/house";
	import SquareTerminalIcon from "@lucide/svelte/icons/square-terminal";
	import ScaleIcon from "@lucide/svelte/icons/scale";
	import Building2Icon from "@lucide/svelte/icons/building-2";
	import DoorOpenIcon from "@lucide/svelte/icons/door-open";
	import SlidersHorizontalIcon from "@lucide/svelte/icons/sliders-horizontal";
	import LifeBuoyIcon from "@lucide/svelte/icons/life-buoy";
	import SendIcon from "@lucide/svelte/icons/send";
	import ChevronsUpDownIcon from "@lucide/svelte/icons/chevrons-up-down";

	const data = {
		user: {
			name: "shadcn",
			email: "m@example.com",
			avatar: "/avatars/shadcn.jpg",
		},
		navMain: [
			{
				title: "Home",
				url: "#home",
				icon: HouseIcon,
			},
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
				title: "Balancete",
				url: "#balancete",
				icon: ScaleIcon,
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
		versions: {
			frontend: "0.0.1",
			backend: "0.0.1",
		},
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
		condominiumSettings: [
			{
				name: "Geral",
				url: "#geral",
				icon: SlidersHorizontalIcon,
			},
			{
				name: "Blocos",
				url: "#blocos",
				icon: Building2Icon,
			},
			{
				name: "Unidades",
				url: "#unidades",
				icon: DoorOpenIcon,
			},
		],
	};
</script>

<script lang="ts">
	import type { ComponentProps } from "svelte";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import NavMain from "./nav-main.svelte";
	import NavCondominiumSettings from "./nav-condominium-settings.svelte";
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
									<img
										id="condominium-switcher-icon-image"
										src="/media/app/logo-monograma.png"
										alt="Logo monograma"
										class="size-5 object-contain"
									/>
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
		<NavCondominiumSettings items={data.condominiumSettings} />
		<NavSecondary items={data.navSecondary} versions={data.versions} class="mt-auto" />
	</Sidebar.Content>
</Sidebar.Root>
