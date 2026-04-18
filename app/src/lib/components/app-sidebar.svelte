<script lang="ts">
	import { page } from "$app/state";
	import type { AuthenticatedUser } from "$lib/services/auth.js";
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
	import NavMain from "./nav-main.svelte";
	import NavUser from "./nav-user.svelte";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import type { ComponentProps } from "svelte";

	type NavItem = {
		title: string;
		url: string;
		// This should be `Component` after @lucide/svelte updates types.
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		icon?: any;
		isActive?: boolean;
		items?: NavItem[];
	};

	let {
		ref = $bindable(null),
		collapsible = "icon",
		user = {
			name: "Usuario",
			email: "",
			avatar: "",
		},
		...restProps
	}: ComponentProps<typeof Sidebar.Root> & {
		user?: Pick<AuthenticatedUser, "name" | "email"> & { avatar?: string };
	} = $props();

	const condominiumCode = $derived(page.params.code ?? "");
	const dashboardUrl = $derived(condominiumCode ? `/g/${condominiumCode}` : "/");
	const groupsUrl = $derived(condominiumCode ? `/g/${condominiumCode}/grupos` : "#");
	const unitsUrl = $derived(condominiumCode ? `/g/${condominiumCode}/unidades` : "#");

	const navMain = $derived([
		{
			title: "Dashboard",
			url: dashboardUrl,
			icon: LayoutDashboardIcon,
			isActive: page.url.pathname === dashboardUrl,
		},
		{
			title: "Estrutura",
			url: "#",
			icon: Building2Icon,
			isActive: page.url.pathname.startsWith(condominiumCode ? `/g/${condominiumCode}/` : "/g/"),
			items: [
				{
					title: "Grupos",
					url: groupsUrl,
					icon: BlocksIcon,
				},
				{
					title: "Unidades",
					url: unitsUrl,
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
	] satisfies NavItem[]);
</script>

<Sidebar.Root bind:ref {collapsible} {...restProps}>
	<Sidebar.Content>
		<NavMain items={navMain} />
	</Sidebar.Content>
	<Sidebar.Footer>
		<NavUser user={{ ...user, avatar: user.avatar ?? "" }} />
	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>
