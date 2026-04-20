<script lang="ts">
	import UnitFormPage from '$lib/components/app/unit-form-page.svelte';

	interface Props {
		params: {
			code: string;
		};
	}

	let { params }: Props = $props();
</script>

<svelte:head>
	<title>Nova unidade</title>
</svelte:head>

<UnitFormPage mode="create" condominiumCode={params.code} />
