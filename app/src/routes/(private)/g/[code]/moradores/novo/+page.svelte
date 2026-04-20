<script lang="ts">
	import ResidentFormPage from '$lib/components/app/resident-form-page.svelte';

	interface Props {
		params: {
			code: string;
		};
	}

	let { params }: Props = $props();
</script>

<svelte:head>
	<title>Novo morador</title>
</svelte:head>

<ResidentFormPage mode="create" condominiumCode={params.code} />
