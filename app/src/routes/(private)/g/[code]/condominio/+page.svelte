<script lang="ts">
	import CondominiumGeneralSettings from '$lib/components/app/CondominiumGeneralSettings.svelte';

	interface Props {
		params: {
			code: string;
		};
	}

	let { params }: Props = $props();
</script>

<svelte:head>
	<title>Condomínio | Informações gerais</title>
</svelte:head>

<CondominiumGeneralSettings condominiumCode={params.code} />
