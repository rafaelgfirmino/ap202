<script lang="ts">
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import SiteHeader from "$lib/components/site-header.svelte";
	import AppSidebar from "$lib/components/app-sidebar.svelte";
</script>

<div id="sidebar-16-page" class="[--header-height:calc(--spacing(14))]">
	<Sidebar.Provider id="sidebar-16-provider" class="flex min-h-svh">
		<div id="sidebar-16-body" class="flex flex-1">
			<AppSidebar />
			<Sidebar.Inset id="sidebar-16-inset">
				<SiteHeader />
				<div id="sidebar-16-content" class="flex flex-1 flex-col gap-4 p-4">
					<div id="sidebar-16-stats-grid" class="grid auto-rows-min gap-4 md:grid-cols-3">
						<div id="sidebar-16-stat-card-1" class="bg-muted/50 aspect-video rounded-xl"></div>
						<div id="sidebar-16-stat-card-2" class="bg-muted/50 aspect-video rounded-xl"></div>
						<div id="sidebar-16-stat-card-3" class="bg-muted/50 aspect-video rounded-xl"></div>
					</div>
					<div id="sidebar-16-main-panel" class="bg-muted/50 min-h-screen flex-1 rounded-xl md:min-h-min"></div>
				</div>
			</Sidebar.Inset>
		</div>
	</Sidebar.Provider>
</div>
