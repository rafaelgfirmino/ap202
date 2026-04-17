<script lang="ts">
	import * as Popover from '$lib/components/ui/popover/index.js';
	import UnitCard from '$lib/components/app/unit-card/index.svelte';

	type UnitStatus = 'adimplente' | 'vencido';

	export type BlockUnit = {
		id: string;
		apartmentNumber: string;
		residentName: string;
		status: UnitStatus;
		floors: number[];
		totalOpenAmount?: string;
		lateInstallments?: number;
		contactPhone?: string;
	};

	let {
		blockName = 'Bloco A',
		totalFloors,
		columns,
		units,
		unitWidth = 72,
		unitHeight = 64,
		floorLabelWidth = 28
	}: {
		blockName?: string;
		totalFloors: number;
		columns: number;
		units: BlockUnit[];
		unitWidth?: number;
		unitHeight?: number;
		floorLabelWidth?: number;
	} = $props();

	let hoveredUnitId = $state<string | null>(null);

	/**
	 * Lista de andares exibida de cima para baixo.
	 */
	const floors = $derived(
		Array.from({ length: totalFloors }, (_, index) => totalFloors - index)
	);

	const slots = $derived(
		floors.flatMap((floor) =>
			Array.from({ length: columns }, (_, index) => ({
				floor,
				column: index + 1
			}))
		)
	);

	function getGridRowStart(startFloor: number): number {
		return totalFloors - startFloor + 1;
	}

	function getGridColumnStart(column: number): number {
		return column + 1;
	}

	const placedUnits = $derived.by(() => {
		const stackKeys = Array.from(
			new Set(
				units.map((unit) => getStackKey(unit.apartmentNumber))
			)
		).slice(0, columns);

		return units
			.map((unit) => ({
				...unit,
				column: stackKeys.indexOf(getStackKey(unit.apartmentNumber)) + 1
			}))
			.filter(
				(unit) =>
					unit.column > 0 &&
					unit.floors.length > 0 &&
					unit.floors.every((floor) => floor >= 1 && floor <= totalFloors)
			);
	});

	/**
	 * Deriva a prumada a partir do numero da unidade.
	 * Ex.: 603 -> 03, 503 -> 03, Loja 01 -> 01.
	 */
	function getStackKey(apartmentNumber: string): string {
		const digits = apartmentNumber.replace(/\D/g, '');

		if (digits.length >= 2) {
			return digits.slice(-2);
		}

		return apartmentNumber.trim().toLowerCase();
	}

	const unitSegments = $derived(
		placedUnits.flatMap((unit) =>
			[...unit.floors]
				.sort((left, right) => right - left)
				.map((floor) => ({
				...unit,
				segmentId: `${unit.id}-floor-${floor}`,
				floor
			}))
		)
	);
</script>

<section id="block-map-root" class="flex flex-col gap-4">
	<div
		id="block-map-grid"
		class="grid gap-1.5"
		style={`grid-template-columns: ${floorLabelWidth}px repeat(${columns}, ${unitWidth}px); grid-template-rows: repeat(${totalFloors}, ${unitHeight}px);`}
	>
		{#each floors as floor}
			<div
				id={`block-map-floor-label-${floor}`}
				class="text-muted-foreground flex items-center justify-end pr-2 text-xs font-medium"
				style={`grid-column: 1; grid-row: ${getGridRowStart(floor)};`}
			>
				{floor}º
			</div>
		{/each}

		{#each slots as slot}
			<Popover.Root>
				<Popover.Trigger
					id={`block-map-empty-slot-${slot.floor}-${slot.column}`}
					class="bg-muted/40 border-border/60 text-muted-foreground flex flex-col items-center justify-center rounded-sm border border-dashed"
					style={`grid-column: ${getGridColumnStart(slot.column)}; grid-row: ${getGridRowStart(slot.floor)};`}
					aria-label={`Espaco vazio no andar ${slot.floor}`}
				>
					<span id={`block-map-empty-slot-label-${slot.floor}-${slot.column}`} class="text-[10px] font-medium">
						Vazio
					</span>
				</Popover.Trigger>

				<Popover.Content
					id={`block-map-empty-slot-popover-${slot.floor}-${slot.column}`}
					side="top"
					align="center"
					sideOffset={8}
					class="w-[220px] gap-2 border-0 bg-[#171717] p-3 text-[12px] text-white shadow-none ring-0"
				>
					<div id={`block-map-empty-slot-popover-title-${slot.floor}-${slot.column}`} class="font-semibold">
						Nao ha unidade registrada
					</div>
					<div
						id={`block-map-empty-slot-popover-description-${slot.floor}-${slot.column}`}
						class="text-white/70"
					>
						Nao ha unidade registrada neste andar. Caso necessario, o andar deve ser excluido.
					</div>
				</Popover.Content>
			</Popover.Root>
		{/each}

		{#each unitSegments as segment}
			<div
				id={`block-map-unit-slot-${segment.segmentId}`}
				class={`z-10 flex transition-all duration-200 ease-out ${
					hoveredUnitId === segment.id
						? 'scale-105 shadow-sm'
						: 'scale-100'
				}`}
				style={`grid-column: ${getGridColumnStart(segment.column)}; grid-row: ${getGridRowStart(segment.floor)};`}
				onmouseenter={() => (hoveredUnitId = segment.id)}
				onmouseleave={() => (hoveredUnitId = null)}
			>
				<UnitCard
					apartmentNumber={segment.apartmentNumber}
					residentName={segment.residentName}
					status={segment.status}
					totalOpenAmount={segment.totalOpenAmount}
					lateInstallments={segment.lateInstallments}
					contactPhone={segment.contactPhone}
					w={unitWidth}
					h={unitHeight}
				/>
			</div>
		{/each}
	</div>
</section>
