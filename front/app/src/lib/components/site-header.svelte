<script lang="ts">
	import SidebarIcon from "@lucide/svelte/icons/sidebar";
	import HeaderUserMenu from "./header-user-menu.svelte";
	import SearchForm from "./search-form.svelte";
	import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";

	const sidebar = Sidebar.useSidebar();
	const user = {
		name: "shadcn",
		email: "m@example.com",
		avatar: "/avatars/shadcn.jpg",
	};
</script>

<header id="site-header" class="bg-background sticky top-0 z-50 flex w-full items-center border-b">
	<div id="site-header-content" class="flex h-(--header-height) w-full items-center gap-2 px-4">
		<Button id="site-header-toggle" class="size-8" variant="ghost" size="icon" onclick={sidebar.toggle}>
			<SidebarIcon />
		</Button>
		<Separator id="site-header-separator" orientation="vertical" class="me-2 h-4" />
		<Breadcrumb.Root id="site-header-breadcrumb" class="hidden sm:block">
			<Breadcrumb.List>
				<Breadcrumb.Item>
					<Breadcrumb.Link href="##">Build Your Application</Breadcrumb.Link>
				</Breadcrumb.Item>
				<Breadcrumb.Separator />
				<Breadcrumb.Item>
					<Breadcrumb.Page>Data Fetching</Breadcrumb.Page>
				</Breadcrumb.Item>
			</Breadcrumb.List>
		</Breadcrumb.Root>
		<div id="site-header-right" class="ml-auto flex items-center gap-2">
			<SearchForm id="site-header-search" class="w-full sm:w-auto" />
			<div id="site-header-user">
				<HeaderUserMenu {user} />
			</div>
		</div>
	</div>
</header>
