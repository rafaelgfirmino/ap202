<script lang="ts">
	import * as Popover from '$lib/components/ui/popover/index.js';
	import AlertTriangleIcon from '@lucide/svelte/icons/triangle-alert';
	import BadgeCheckIcon from '@lucide/svelte/icons/badge-check';
	import PhoneIcon from '@lucide/svelte/icons/phone';

	type UnitStatus = 'adimplente' | 'vencido';

	let {
		w = 72,
		h = 64,
		apartmentNumber,
		residentName,
		status,
		totalOpenAmount = 'R$ 420',
		lateInstallments = 1,
		contactPhone = '(11) 99999-9999'
	}: {
		w?: number;
		h?: number;
		apartmentNumber: string;
		residentName: string;
		status: UnitStatus;
		totalOpenAmount?: string;
		lateInstallments?: number;
		contactPhone?: string;
	} = $props();

	let open = $state(false);

	function getStatusClasses(unitStatus: UnitStatus): string {
		if (unitStatus === 'adimplente') {
			return 'border-[1.5px]  border-[#4ADE80] bg-[#F0FDF4] text-[#15803D]';
		}

		return 'border-[1.5px] border-solid border-[#FCA5A5] bg-[#FEF2F2] text-[#B91C1C]';
	}

	function getFinancialStatusLabel(unitStatus: UnitStatus): string {
		if (unitStatus === 'adimplente') return 'Em dia';
		return 'Vencido';
	}

	function getFinancialStatusClasses(unitStatus: UnitStatus): string {
		if (unitStatus === 'adimplente') {
			return 'bg-[#DCFCE7] text-[#166534]';
		}

		return 'bg-[#FEF2F2] text-[#B91C1C]';
	}

	function getFinancialStatusIcon(unitStatus: UnitStatus): typeof BadgeCheckIcon | typeof AlertTriangleIcon {
		if (unitStatus === 'adimplente') {
			return BadgeCheckIcon;
		}

		return AlertTriangleIcon;
	}

	const StatusIcon = $derived(getFinancialStatusIcon(status));
</script>

<Popover.Root bind:open>
	<Popover.Trigger
		id={`unit-card-trigger-${apartmentNumber}`}
		class={`flex cursor-pointer flex-col items-center justify-center gap-1 p-2 text-left outline-none ${getStatusClasses(status)}`}
		aria-label={`Abrir detalhes da unidade ${apartmentNumber}`}
		style={`min-width: ${w}px; max-width: ${w}px; min-height: ${h}px; max-height: ${h}px;`}
		onmouseenter={() => (open = true)}
		onmouseleave={() => (open = false)}
		onfocus={() => (open = true)}
		onblur={() => (open = false)}
	>
		<span
			id={`unit-card-root-${apartmentNumber}`}
			class="flex w-full flex-col items-center justify-center gap-1"
		>
			<span
				id={`unit-card-number-${apartmentNumber}`}
				class="w-full text-center text-sm font-semibold leading-none"
			>
				{apartmentNumber}
			</span>
			<span
				id={`unit-card-user-name-${apartmentNumber}`}
				class="w-full truncate text-center text-[12px] leading-tight"
			>
				{residentName}
			</span>
		</span>
	</Popover.Trigger>

	<Popover.Content
		id={`unit-card-popover-${apartmentNumber}`}
		side="top"
		align="center"
		sideOffset={10}
		class="w-[220px] gap-0 border-0 bg-[#171717] p-0 text-white shadow-none ring-0"
		onmouseenter={() => (open = true)}
		onmouseleave={() => (open = false)}
	>
		<div id={`unit-card-popover-content-${apartmentNumber}`} class="relative flex flex-col">
			<div id={`unit-card-popover-header-${apartmentNumber}`} class="border-b border-white/10 px-4 py-3">
				<div class="flex justify-end">
					<span
						id={`unit-card-popover-status-value-${apartmentNumber}`}
						class={`shrink-0 inline-flex items-center gap-1 px-2 py-1 font-semibold ${getFinancialStatusClasses(status)}`}
					>
						<StatusIcon id={`unit-card-popover-status-icon-${apartmentNumber}`} class="size-3" />
						{getFinancialStatusLabel(status)}
					</span>
				</div>
				<div
					id={`unit-card-popover-unit-${apartmentNumber}`}
					class="mt-2 text-[12px] font-semibold text-white"
				>
					Apartamento {apartmentNumber}
				</div>
				<div
					id={`unit-card-popover-title-${apartmentNumber}`}
					class="mt-1 truncate text-[12px] text-white/70"
				>
					{residentName}
				</div>
			</div>

			<div id={`unit-card-popover-body-${apartmentNumber}`} class="flex flex-col gap-3 px-4 py-3 text-[12px]">
				<div id={`unit-card-popover-total-open-${apartmentNumber}`} class="grid grid-cols-[1fr_auto] items-center gap-2">
					<span id={`unit-card-popover-total-open-label-${apartmentNumber}`} class="text-white/60">
						Total em aberto
					</span>
					<span
						id={`unit-card-popover-total-open-value-${apartmentNumber}`}
						class="whitespace-nowrap font-semibold text-white"
					>
						{totalOpenAmount}
					</span>
				</div>

				<div id={`unit-card-popover-installments-${apartmentNumber}`} class="grid grid-cols-[1fr_auto] items-center gap-2">
					<span id={`unit-card-popover-installments-label-${apartmentNumber}`} class="text-white/60">
						Meses em aberto
					</span>
					<span
						id={`unit-card-popover-installments-value-${apartmentNumber}`}
						class="whitespace-nowrap font-semibold text-white"
					>
						{lateInstallments}
					</span>
				</div>

				<div id={`unit-card-popover-contact-${apartmentNumber}`} class="border-t border-white/10 pt-3">
					<span id={`unit-card-popover-contact-label-${apartmentNumber}`} class="block text-white/60">
						Telefone de contato
					</span>
					<span
						id={`unit-card-popover-contact-value-${apartmentNumber}`}
						class="mt-1 flex items-center gap-2 truncate font-medium text-white"
					>
						<PhoneIcon id={`unit-card-popover-contact-icon-${apartmentNumber}`} class="size-3" />    
						{contactPhone}
					</span>
				</div>
                
			</div>

			<div
				id={`unit-card-popover-arrow-${apartmentNumber}`}
				class="absolute left-1/2 top-full size-3 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-[#171717]"
			></div>
		</div>
	</Popover.Content>
</Popover.Root>
