<script lang="ts">
	import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
	import { cn } from '$lib/utils.js';

	export type FinancialStatusBadgeValue = 'adimplente' | 'inadimplente';

	interface Props {
		status: FinancialStatusBadgeValue;
		class?: string;
	}

	let { status, class: className = '' }: Props = $props();

	const label = $derived(status === 'adimplente' ? 'Adimplente' : 'Inadimplente');
</script>

<span
	id={`financial-status-badge-${status}`}
	data-test={`financial-status-badge-${status}`}
	class={cn(
		'inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium',
		status === 'adimplente'
			? 'bg-emerald-100 text-emerald-700'
			: 'bg-rose-100 text-rose-700',
		className
	)}
>
	{#if status === 'adimplente'}
		<ShieldCheckIcon class="size-3.5" aria-hidden="true" />
	{:else}
		<CircleAlertIcon class="size-3.5" aria-hidden="true" />
	{/if}
	{label}
</span>
