<script lang="ts">
	import './layout.css';

	let { children } = $props();
</script>

<svelte:head>
	<link id="app-favicon-96" rel="icon" type="image/png" sizes="96x96" href="/media/app/favicon-96x96.png" />
	<link id="app-favicon-32" rel="icon" type="image/png" sizes="32x32" href="/media/app/favicon-32x32.png" />
	<link id="app-favicon-16" rel="icon" type="image/png" sizes="16x16" href="/media/app/favicon-16x16.png" />
</svelte:head>
{@render children()}
