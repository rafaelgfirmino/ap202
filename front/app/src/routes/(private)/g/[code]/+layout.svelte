<script lang="ts">
	import Logo from '$lib/components/app/logo/index.svelte';
	import MenuBar from '$lib/components/app/menubar/menubar.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	let { children } = $props();
</script>

<div id="group-layout-header" class="border-b border-gray-100 flex bg-white p-1  justify-center items-center min-h-[3rem] max-h-[2rem]">
	<div id="group-layout-header-logo" class="px-5">
		<Logo class="h-6" />
	</div>
	<div class="flex-1 flex">
		<div id="group-layout-header-menu" class="flex-1">
			<MenuBar/>
		</div>
		<div id="group-layout-header-right" class="px-10">a
				ola mundo
				</div>
	</div>
</div>
<div id="group-layout-header" class=" border-b border-gray-100 bg-white flex grid-cols-[4rem_auto_4rem] px-30 justify-left items-center">

<Button variant="outline">Adicionar </Button>
  <Button variant="outline" size="icon" aria-label="Submit">
	->
</Button>
</div>
<div id="group-layout-content">
	{@render children()}
	</div>