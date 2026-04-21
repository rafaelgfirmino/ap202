<script lang="ts">
	import { page } from '$app/state';
	import type { AuthenticatedUser } from '$lib/services/auth.js';
	import BlocksIcon from '@lucide/svelte/icons/blocks';
	import BookOpenIcon from '@lucide/svelte/icons/book-open';
	import Building2Icon from '@lucide/svelte/icons/building-2';
	import ChartColumnIcon from '@lucide/svelte/icons/chart-column';
	import ClipboardListIcon from '@lucide/svelte/icons/clipboard-list';
	import DoorOpenIcon from '@lucide/svelte/icons/door-open';
	import LandmarkIcon from '@lucide/svelte/icons/landmark';
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import MapIcon from '@lucide/svelte/icons/map';
	import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
	import UsersIcon from '@lucide/svelte/icons/users';
	import NavMain from './nav-main.svelte';
	import NavUser from './nav-user.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { ComponentProps } from 'svelte';

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
		collapsible = 'icon',
		user = {
			name: 'Usuario',
			email: '',
			avatar: ''
		},
		...restProps
	}: ComponentProps<typeof Sidebar.Root> & {
		user?: Pick<AuthenticatedUser, 'name' | 'email'> & { avatar?: string };
	} = $props();

	const condominiumCode = $derived(page.params.code ?? '');
	const dashboardUrl = $derived(condominiumCode ? `/g/${condominiumCode}` : '/');
	const groupsUrl = $derived(condominiumCode ? `/g/${condominiumCode}/grupos` : '#');
	const unitsUrl = $derived(condominiumCode ? `/g/${condominiumCode}/unidades` : '#');
	const residentsUrl = $derived(condominiumCode ? `/g/${condominiumCode}/moradores` : '#');
	const usersUrl = $derived(condominiumCode ? `/g/${condominiumCode}/usuarios` : '#');
	const contasUrl = $derived(condominiumCode ? `/g/${condominiumCode}/contas-a-pagar` : '#');
	const livroCaixaUrl = $derived(condominiumCode ? `/g/${condominiumCode}/livro-caixa` : '#');
	const balanceteUrl = $derived(condominiumCode ? `/g/${condominiumCode}/balancete` : '#');
	const financeiroActive = $derived(
		page.url.pathname.startsWith(
			condominiumCode ? `/g/${condominiumCode}/contas-a-pagar` : '/contas-a-pagar'
		) ||
			page.url.pathname.startsWith(
				condominiumCode ? `/g/${condominiumCode}/livro-caixa` : '/livro-caixa'
			) ||
			page.url.pathname.startsWith(
				condominiumCode ? `/g/${condominiumCode}/balancete` : '/balancete'
			)
	);

	const navMain = $derived([
		{
			title: 'Dashboard',
			url: dashboardUrl,
			icon: LayoutDashboardIcon,
			isActive: page.url.pathname === dashboardUrl
		},
		{
			title: 'Estrutura',
			url: '#',
			icon: Building2Icon,
			isActive: page.url.pathname.startsWith(condominiumCode ? `/g/${condominiumCode}/` : '/g/'),
			items: [
				{
					title: 'Grupos',
					url: groupsUrl,
					icon: BlocksIcon
				},
				{
					title: 'Unidades',
					url: unitsUrl,
					icon: DoorOpenIcon
				},
				{
					title: 'Áreas comuns',
					url: '#',
					icon: MapIcon
				}
			]
		},
		{
			title: 'Moradores',
			url: residentsUrl,
			icon: UsersIcon,
			isActive: page.url.pathname.startsWith(
				condominiumCode ? `/g/${condominiumCode}/moradores` : '/moradores'
			)
		},
		{
			title: 'Financeiro',
			url: '#',
			icon: LandmarkIcon,
			isActive: financeiroActive,
			items: [
				{
					title: 'Contas a Pagar',
					url: contasUrl,
					icon: ClipboardListIcon,
					isActive: page.url.pathname.startsWith(
						condominiumCode ? `/g/${condominiumCode}/contas-a-pagar` : '/contas-a-pagar'
					)
				},
				{
					title: 'Livro Caixa',
					url: livroCaixaUrl,
					icon: BookOpenIcon,
					isActive: page.url.pathname.startsWith(
						condominiumCode ? `/g/${condominiumCode}/livro-caixa` : '/livro-caixa'
					)
				},
				{
					title: 'Balancetes',
					url: balanceteUrl,
					icon: ChartColumnIcon,
					isActive: page.url.pathname.startsWith(
						condominiumCode ? `/g/${condominiumCode}/balancete` : '/balancete'
					)
				}
			]
		},
		{
			title: 'Usuários',
			url: usersUrl,
			icon: ShieldCheckIcon,
			isActive: page.url.pathname.startsWith(
				condominiumCode ? `/g/${condominiumCode}/usuarios` : '/usuarios'
			)
		}
	] satisfies NavItem[]);
</script>

<Sidebar.Root bind:ref {collapsible} {...restProps}>
	<Sidebar.Content>
		<NavMain items={navMain} />
	</Sidebar.Content>
	<Sidebar.Footer>
		<NavUser user={{ ...user, avatar: user.avatar ?? '' }} />
	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>
