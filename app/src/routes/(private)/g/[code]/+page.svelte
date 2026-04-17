<!-- src/lib/components/app-header.svelte -->
<script lang="ts">
	import OverdueChart from '$lib/components/admin/charts/overdue.svelte';
	import BlockMap from '$lib/components/app/blocs/index.svelte';
	import CardInsights from '$lib/components/app/card-insight/index.svelte';
  import SpectMonth from '$lib/components/admin/charts/spect-month/index.svelte';
</script>
	<div id="insights-grid" class=" bg-white grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5 p-2 ">
		<CardInsights
			id="insight-overdue"
			title="10 Inadimplentes"
			description="R$ 5.000,00"
			tone="danger"
		/>
		<CardInsights
			id="insight-pending"
			title="0 Aguardando pagamento"
			description="R$ 5.000,00"
			tone="neutral"
		/>
		<CardInsights
			id="insight-paid"
			title="20 Adimplentes"
			description="R$ 5.000,00"
			tone="success"
		/>
		<CardInsights
			id="insight-receivable"
			title="Total a receber"
			description="15.000,00"
			tone="info"
		/>
		<CardInsights
			id="insight-cash"
			title="Total em caixa"
			description="15.000,00"
			tone="highlight"
		/>
	</div>