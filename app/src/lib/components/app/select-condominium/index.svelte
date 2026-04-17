<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as Command from '$lib/components/ui/command/index.js';
	import DashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import BuildingIcon from '@lucide/svelte/icons/building';
	import SquareIcon from '@lucide/svelte/icons/square';
	import CheckSquareIcon from '@lucide/svelte/icons/square-check-big';

	type Condominium = {
		id: string;
		name: string;
		code: string;
	};

	/**
	 * Lista local de condominios exibida no seletor.
	 * Pode ser substituida depois por dados vindos de `services`.
	 */
	const condominiums: Condominium[] = [
		{ id: 'condominium-ernestina-julia', name: 'Edifício Ernestina Júlia', code: 'ERN001' },
		{ id: 'condominium-parque-central', name: 'Condomínio Parque Central', code: 'PQC002' },
		{ id: 'condominium-vila-das-palmeiras', name: 'Residencial Vila das Palmeiras', code: 'VDP003' }
	];

	let open = $state(false);
	let selectedCondominiumId = $state(condominiums[0].id);

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'j' && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			open = !open;
		}
	}

	function selectCondominium(condominiumId: string) {
		selectedCondominiumId = condominiumId;
		open = false;
	}

	const selectedCondominium = $derived(
		condominiums.find((condominium) => condominium.id === selectedCondominiumId) ?? condominiums[0]
	);
</script>

<svelte:document onkeydown={handleKeydown} />

<Popover.Root bind:open>
	<Popover.Trigger
		id="select-condominium-trigger"
		class={buttonVariants({ variant: 'outline' })}
		aria-label="Selecionar condomínio"
	>
		<DashboardIcon />
		<span id="select-condominium-trigger-label">{selectedCondominium.name}</span>
	</Popover.Trigger>

	<Popover.Content id="select-condominium-content" class="w-80 p-0">
		<Command.Root id="select-condominium-command" class="rounded-lg border shadow-md">
			<Command.Input
				id="select-condominium-input"
				placeholder="Digite o nome ou código do condomínio..."
			/>

			<Command.List id="select-condominium-list">
				<Command.Empty id="select-condominium-empty">
					Nenhum condomínio encontrado.
				</Command.Empty>

				<Command.Group id="select-condominium-group" heading="Condomínios">
					{#each condominiums as condominium}
							<Command.Item
							id={`select-condominium-item-${condominium.id}`}
							value={`${condominium.name} ${condominium.code}`}
							onSelect={() => selectCondominium(condominium.id)}
							class={selectedCondominiumId === condominium.id
								? 'bg-muted text-foreground'
								: undefined}
						>
							{#if selectedCondominiumId === condominium.id}
								<CheckSquareIcon
									id={`select-condominium-checkbox-selected-${condominium.id}`}
									class="text-primary size-4"
								/>
							{:else}
								<SquareIcon
									id={`select-condominium-checkbox-unselected-${condominium.id}`}
									class="text-muted-foreground size-4"
								/>
							{/if}

							<BuildingIcon id={`select-condominium-icon-${condominium.id}`} />

							<div id={`select-condominium-content-${condominium.id}`} class="flex min-w-0 flex-col">
								<span id={`select-condominium-name-${condominium.id}`} class="truncate">
									{condominium.name}
								</span>
								<span
									id={`select-condominium-code-${condominium.id}`}
									class="text-muted-foreground text-xs"
								>
									{condominium.code}
								</span>
							</div>
						</Command.Item>
					{/each}
				</Command.Group>

				<Command.Separator id="select-condominium-separator" />
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
