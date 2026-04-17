<script lang="ts">
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
	import Clock3Icon from '@lucide/svelte/icons/clock-3';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import Building2Icon from '@lucide/svelte/icons/building-2';
	import BadgePercentIcon from '@lucide/svelte/icons/badge-percent';

	type InsightTone = 'danger' | 'neutral' | 'success' | 'info' | 'highlight';

	let {
		id = 'insight-overdue',
		title = '10 inadimplentes',
		description = 'R$ 5.200 em aberto · Bloco B critico',
		tone = 'danger'
	}: {
		id?: string;
		title?: string;
		description?: string;
		tone?: InsightTone;
	} = $props();

	function getToneClasses(tone: InsightTone): string {
		if (tone === 'danger') {
			return 'border-[#FECACA] bg-[#FFF5F5] text-[#DC2626]';
		}

		if (tone === 'neutral') {
			return 'border-[#CBD5E1] bg-[#F8FAFC] text-[#475569]';
		}

		if (tone === 'success') {
			return 'border-[#86EFAC] bg-[#F0FDF4] text-[#16A34A]';
		}

		if (tone === 'info') {
			return 'border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]';
		}

		return 'border-[#DDD6FE] bg-[#F5F3FF] text-[#7C3AED]';
	}

	function getIconContainerClasses(tone: InsightTone): string {
		if (tone === 'danger') {
			return 'bg-[#FEE2E2] text-[#DC2626]';
		}

		if (tone === 'neutral') {
			return 'bg-[#E2E8F0] text-[#475569]';
		}

		if (tone === 'success') {
			return 'bg-[#DCFCE7] text-[#16A34A]';
		}

		if (tone === 'info') {
			return 'bg-[#DBEAFE] text-[#2563EB]';
		}

		return 'bg-[#EDE9FE] text-[#7C3AED]';
	}

	function getDescriptionClasses(tone: InsightTone): string {
		if (tone === 'danger') return 'text-[#EF4444]';
		if (tone === 'neutral') return 'text-[#64748B]';
		if (tone === 'success') return 'text-[#59B56F]';
		if (tone === 'info') return 'text-[#5B84F7]';
		return 'text-[#8B5CF6]';
	}

	function getIcon(tone: InsightTone) {
		if (tone === 'danger') return CircleAlertIcon;
		if (tone === 'neutral') return Clock3Icon;
		if (tone === 'success') return CircleCheckIcon;
		if (tone === 'info') return Building2Icon;
		return BadgePercentIcon;
	}

	const Icon = $derived(getIcon(tone));
</script>

<article
	id={`card-insight-item-${id}`}
	class={`flex h-auto min-h-[50px] w-full min-w-0 items-center gap-2 rounded-md border px-3 py-2 ${getToneClasses(tone)}`}
>
	<div
		id={`card-insight-icon-container-${id}`}
		class={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${getIconContainerClasses(tone)}`}
	>
		<Icon id={`card-insight-icon-${id}`} class="size-4" />
	</div>

	<div id={`card-insight-content-${id}`} class="flex min-w-0 flex-col">
		<h3
			id={`card-insight-title-${id}`}
			class="truncate py-1 text-[12px] leading-none font-semibold"
		>
			{title}
		</h3>
		<p
			id={`card-insight-description-${id}`}
			class={`truncate text-[12px] leading-tight ${getDescriptionClasses(tone)}`}
		>
			{description}
		</p>
	</div>
</article>
