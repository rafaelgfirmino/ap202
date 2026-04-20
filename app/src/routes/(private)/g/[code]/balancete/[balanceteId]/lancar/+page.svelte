<script lang="ts">
	import LancamentoFormPage from '$lib/components/app/lancamento-form-page.svelte';

	interface Props {
		params: { code: string; balanceteId: string };
	}

	let { params }: Props = $props();
</script>

<svelte:head>
	<title>Novo lançamento</title>
</svelte:head>

<LancamentoFormPage
	condominiumCode={params.code}
	balanceteId={Number.isFinite(Number(params.balanceteId)) ? Number(params.balanceteId) : 0}
/>
