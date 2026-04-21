<script lang="ts">
	import ContaAPagarFormPage from '$lib/components/app/conta-a-pagar-form-page.svelte';

	interface Props {
		params: { code: string };
	}

	let { params }: Props = $props();
</script>

<svelte:head>
	<title>Nova conta a pagar</title>
</svelte:head>

<ContaAPagarFormPage condominiumCode={params.code} />
