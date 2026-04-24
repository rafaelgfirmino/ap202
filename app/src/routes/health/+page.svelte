<script lang="ts">
	const renderedAt = new Date().toLocaleString('pt-BR', {
		dateStyle: 'short',
		timeStyle: 'medium'
	});
</script>

<svelte:head>
	<title>Health Check | AP202</title>
</svelte:head>

<main id="health-check-page" data-test="health-check-page" class="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
	<section id="health-check-card" data-test="health-check-card" class="w-full max-w-md rounded-3xl border bg-background p-6 shadow-sm">
		<div id="health-check-status-row" data-test="health-check-status-row" class="flex items-center gap-3">
			<div id="health-check-status-dot" data-test="health-check-status-dot" class="size-3 rounded-full bg-emerald-500"></div>
			<p id="health-check-status-label" data-test="health-check-status-label" class="text-sm font-medium text-emerald-700">Aplicação online</p>
		</div>

		<h1 id="health-check-title" data-test="health-check-title" class="mt-4 text-2xl font-semibold tracking-tight text-foreground">
			AP202 Health Check
		</h1>
		<p id="health-check-description" data-test="health-check-description" class="mt-2 text-sm text-muted-foreground">
			O frontend carregou corretamente e está pronto para responder no Render.
		</p>

		<div id="health-check-details" data-test="health-check-details" class="mt-6 space-y-3 rounded-2xl border bg-muted/30 p-4 text-sm">
			<div id="health-check-app-row" data-test="health-check-app-row" class="flex items-center justify-between gap-4">
				<span id="health-check-app-label" data-test="health-check-app-label" class="text-muted-foreground">App</span>
				<span id="health-check-app-value" data-test="health-check-app-value" class="font-medium text-foreground">AP202</span>
			</div>
			<div id="health-check-status-detail-row" data-test="health-check-status-detail-row" class="flex items-center justify-between gap-4">
				<span id="health-check-status-detail-label" data-test="health-check-status-detail-label" class="text-muted-foreground">Status</span>
				<span id="health-check-status-detail-value" data-test="health-check-status-detail-value" class="font-medium text-foreground">OK</span>
			</div>
			<div id="health-check-rendered-row" data-test="health-check-rendered-row" class="flex items-center justify-between gap-4">
				<span id="health-check-rendered-label" data-test="health-check-rendered-label" class="text-muted-foreground">Renderizado em</span>
				<span id="health-check-rendered-value" data-test="health-check-rendered-value" class="font-medium text-foreground">{renderedAt}</span>
			</div>
		</div>
	</section>
</main>
