<script lang="ts" module>
	import BadgeDollarSignIcon from "@lucide/svelte/icons/badge-dollar-sign";
	import BlocksIcon from "@lucide/svelte/icons/blocks";
	import Building2Icon from "@lucide/svelte/icons/building-2";
	import BuildingIcon from "@lucide/svelte/icons/building";
	import ChartColumnIcon from "@lucide/svelte/icons/chart-column";
	import DoorOpenIcon from "@lucide/svelte/icons/door-open";
	import FolderOpenIcon from "@lucide/svelte/icons/folder-open";
	import LandmarkIcon from "@lucide/svelte/icons/landmark";
	import LayoutDashboardIcon from "@lucide/svelte/icons/layout-dashboard";
	import MapIcon from "@lucide/svelte/icons/map";
	import MegaphoneIcon from "@lucide/svelte/icons/megaphone";
	import PaletteIcon from "@lucide/svelte/icons/palette";
	import PlugIcon from "@lucide/svelte/icons/plug";
	import SettingsIcon from "@lucide/svelte/icons/settings";
	import ShieldCheckIcon from "@lucide/svelte/icons/shield-check";
	import UserCogIcon from "@lucide/svelte/icons/user-cog";
	import UsersIcon from "@lucide/svelte/icons/users";
	import WrenchIcon from "@lucide/svelte/icons/wrench";

	type NavItem = {
		title: string;
		url: string;
		// This should be `Component` after @lucide/svelte updates types.
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		icon?: any;
		isActive?: boolean;
		items?: NavItem[];
	};

	const data = {
		user: {
			name: "shadcn",
			email: "m@example.com",
			avatar: "",
		},
		teams: [],
		navMain: [
			{
				title: "Dashboard",
				url: "#",
				icon: LayoutDashboardIcon,
				isActive: true,
			},
			{
				title: "Estrutura",
				url: "#",
				icon: Building2Icon,
				items: [
					{
						title: "Grupos",
						url: "#",
						icon: BlocksIcon,
					},
					{
						title: "Unidades",
						url: "#",
						icon: DoorOpenIcon,
					},
					{
						title: "Áreas comuns",
						url: "#",
						icon: MapIcon,
					},
				],
			},
			{
				title: "Moradores",
				url: "#",
				icon: UsersIcon,
			},
			{
				title: "Financeiro",
				url: "#",
				icon: LandmarkIcon,
			},
			{
				title: "Balancetes",
				url: "#",
				icon: ChartColumnIcon,
			},
			{
				title: "Comunicados",
				url: "#",
				icon: MegaphoneIcon,
			},
			{
				title: "Chamados",
				url: "#",
				icon: WrenchIcon,
			},
			{
				title: "Documentos",
				url: "#",
				icon: FolderOpenIcon,
			},
			{
				title: "Usuários",
				url: "#",
				icon: ShieldCheckIcon,
			},
			{
				title: "Configurações",
				url: "#",
				icon: SettingsIcon,
				isActive: true,
				items: [
					{
						title: "Geral",
						url: "#",
						icon: BuildingIcon,
					},
					{
						title: "Cobrança",
						url: "#",
						icon: BadgeDollarSignIcon,
					},
					{
						title: "Usuários",
						url: "#",
						icon: UserCogIcon,
					},
					{
						title: "Integrações",
						url: "#",
						icon: PlugIcon,
					},
					{
						title: "Personalização",
						url: "#",
						icon: PaletteIcon,
					},
				],
			},
		] satisfies NavItem[],
	};
</script>

<script lang="ts">
	import NavMain from "./nav-main.svelte";
	import NavUser from "./nav-user.svelte";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import type { ComponentProps } from "svelte";

	let {
		ref = $bindable(null),
		collapsible = "icon",
		...restProps
	}: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<Sidebar.Root bind:ref {collapsible} {...restProps}>
	<Sidebar.Content>
		<NavMain items={data.navMain} />
	</Sidebar.Content>
	<Sidebar.Footer>
		<NavUser user={data.user} />
	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>
