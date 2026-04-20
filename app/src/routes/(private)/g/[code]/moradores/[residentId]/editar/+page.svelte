<script lang="ts">
	import ResidentFormPage from '$lib/components/app/resident-form-page.svelte';

	interface Props {
		params: {
			code: string;
			residentId: string;
		};
	}

	let { params }: Props = $props();
</script>

<svelte:head>
	<title>Editar morador</title>
</svelte:head>

<ResidentFormPage
	mode="edit"
	condominiumCode={params.code}
	residentId={Number.isFinite(Number(params.residentId)) ? Number(params.residentId) : null}
/>
