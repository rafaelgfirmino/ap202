<script lang="ts">
	import UnitFormPage from '$lib/components/app/unit-form-page.svelte';

	interface Props {
		params: {
			code: string;
			unitId: string;
		};
	}

	let { params }: Props = $props();
</script>

<svelte:head>
	<title>Editar unidade</title>
</svelte:head>

<UnitFormPage
	mode="edit"
	condominiumCode={params.code}
	unitId={Number.isFinite(Number(params.unitId)) ? Number(params.unitId) : null}
/>
