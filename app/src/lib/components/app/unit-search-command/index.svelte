<script lang="ts">
	import { goto } from '$app/navigation';
	import FinancialStatusBadge from '$lib/components/app/FinancialStatusBadge.svelte';
	import * as Command from '$lib/components/ui/command/index.js';
	import { getUnitsByCondominiumCode, type UnitSearchItem } from '$lib/services/unit-search.js';
	import Building2Icon from '@lucide/svelte/icons/building-2';
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
	import DoorOpenIcon from '@lucide/svelte/icons/door-open';
	import { onMount } from 'svelte';

	/**
	 * Command palette global de unidades.
	 * Fica disponível dentro da área `g/[code]` e pode ser aberta pelo atalho `Ctrl+U`
	 * ou `Cmd+U`, oferecendo uma busca rápida por apartamento, morador ou bloco.
	 */
	let {
		condominiumCode
	}: {
		condominiumCode: string;
	} = $props();

	let open = $state(false);
	let searchValue = $state('');
	let units = $state<UnitSearchItem[]>([]);
	let isLoading = $state(false);
	let errorMessage = $state('');

	function handleDocumentKeydown(event: KeyboardEvent) {
		if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'u') {
			event.preventDefault();
			open = true;
		}
	}

	async function handleUnitSelect(href: string) {
		open = false;
		searchValue = '';
		await goto(href);
	}

	async function loadUnits(): Promise<void> {
		isLoading = true;
		errorMessage = '';

		try {
			units = await getUnitsByCondominiumCode(condominiumCode);
		} catch (error) {
			errorMessage =
				error instanceof Error ? error.message : 'Não foi possível carregar as unidades.';
			units = [];
		} finally {
			isLoading = false;
		}
	}

	onMount(async () => {
		await loadUnits();
	});
</script>

<svelte:document onkeydown={handleDocumentKeydown} />

<Command.Dialog
	id="unit-search-command-dialog"
	bind:open
	bind:value={searchValue}
	title="Buscar unidades"
	description="Encontre unidades do condomínio por apartamento, bloco ou morador."
	class="max-w-2xl"
>
	<Command.Input
		id="unit-search-command-input"
		placeholder="Buscar unidade, morador ou bloco..."
	/>

	<Command.List id="unit-search-command-list" class="max-h-[360px]">
		{#if isLoading}
			<div
				id="unit-search-command-loading"
				data-test="unit-search-command-loading"
				class="px-4 py-6 text-sm text-muted-foreground"
			>
				Carregando unidades...
			</div>
		{:else if errorMessage}
			<div
				id="unit-search-command-error"
				data-test="unit-search-command-error"
				class="px-4 py-6 text-sm text-destructive"
			>
				{errorMessage}
			</div>
		{/if}

		<Command.Empty id="unit-search-command-empty">
			Nenhuma unidade encontrada para essa busca.
		</Command.Empty>

		<Command.Group id="unit-search-command-group" heading="Unidades">
			{#each units as unit (unit.id)}
				<Command.Item
					id={`unit-search-command-item-${unit.id}`}
					value={`${unit.apartmentNumber} ${unit.block} ${unit.floor} ${unit.residentName} ${unit.status} ${unit.totalOpenAmountLabel}`}
					onSelect={() => handleUnitSelect(unit.href)}
					class="items-start gap-2 px-2 py-2"
				>
					<div
						id={`unit-search-command-item-icon-${unit.id}`}
						class="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border bg-muted/60"
					>
						<DoorOpenIcon class="size-3.5" />
					</div>

					<div id={`unit-search-command-item-content-${unit.id}`} class="flex min-w-0 flex-1 flex-col gap-0.5">
						<div
							id={`unit-search-command-item-header-${unit.id}`}
							class="flex min-w-0 items-center justify-between gap-2"
						>
							<div id={`unit-search-command-item-copy-${unit.id}`} class="min-w-0">
								<p
									id={`unit-search-command-item-title-${unit.id}`}
									class="truncate text-[13px] font-medium leading-tight text-foreground"
								>
									{unit.apartmentNumber}
								</p>
								<p
									id={`unit-search-command-item-resident-${unit.id}`}
									class="truncate text-[11px] leading-tight text-muted-foreground"
								>
									{unit.residentName}
								</p>
							</div>
							<FinancialStatusBadge
								status={unit.status}
								class="px-1.5 py-0.5 text-[10px] leading-none"
							/>
						</div>

						<div
							id={`unit-search-command-item-meta-${unit.id}`}
							class="flex flex-wrap items-center gap-2 text-[10px] leading-tight text-muted-foreground"
						>
							<span
								id={`unit-search-command-item-block-${unit.id}`}
								class="inline-flex items-center gap-1"
							>
								<Building2Icon class="size-3" />
								{unit.block}
							</span>
							<span id={`unit-search-command-item-floor-${unit.id}`}>{unit.floor}</span>
							<span
								id={`unit-search-command-item-balance-${unit.id}`}
								class="inline-flex items-center gap-1"
							>
								<CircleAlertIcon class="size-3" />
								{unit.totalOpenAmountLabel}
							</span>
						</div>
					</div>
				</Command.Item>
			{/each}
		</Command.Group>
	</Command.List>
</Command.Dialog>
