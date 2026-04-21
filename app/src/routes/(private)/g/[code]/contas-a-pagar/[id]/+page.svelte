<script lang="ts">
	import ContaAPagarFormPage from '$lib/components/app/conta-a-pagar-form-page.svelte';

	interface Props {
		params: { code: string; id: string };
	}

	let { params }: Props = $props();
</script>

<svelte:head>
	<title>Editar conta a pagar</title>
</svelte:head>

<ContaAPagarFormPage
	condominiumCode={params.code}
	contaId={Number.isFinite(Number(params.id)) ? Number(params.id) : null}
/>
