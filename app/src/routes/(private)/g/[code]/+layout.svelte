<script lang="ts">
	import UnitSearchCommand from '$lib/components/app/unit-search-command/index.svelte';

	let { children, params } = $props();
</script>

<div id="group-code-layout-root">
	<UnitSearchCommand condominiumCode={params.code} />
	<div id="group-code-layout-content">
		{@render children()}
	</div>
</div>
