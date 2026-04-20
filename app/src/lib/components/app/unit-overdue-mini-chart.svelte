<script lang="ts">
	import type { UnitOverdueHistoryPoint } from '$lib/components/app/units-data-table.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { cn } from '$lib/utils.js';

	interface Props {
		values: UnitOverdueHistoryPoint[];
		tone: 'positive' | 'negative';
		onCharge?: (payload: { monthLabel: string; amount: number }) => void;
		onAgreement?: (payload: { monthLabel: string; amount: number }) => void;
	}

	let { values, tone, onCharge, onAgreement }: Props = $props();

	function formatCurrency(value: number): string {
		return value.toLocaleString('pt-BR', {
			style: 'currency',
			currency: 'BRL',
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		});
	}

	function getHistoryMax(historyValues: UnitOverdueHistoryPoint[]): number {
		return Math.max(...historyValues.map((item) => getAmountValue(item.amount)), 1);
	}

	function formatMonthLabel(referenceDate: string): string {
		return new Intl.DateTimeFormat('pt-BR', { month: 'short' })
			.format(new Date(referenceDate))
			.replace('.', '')
			.toLowerCase();
	}

	function getAmountValue(value: unknown): number {
		if (typeof value === 'number' && Number.isFinite(value)) {
			return value;
		}

		if (typeof value === 'string') {
			const normalized = Number(value.replace(',', '.'));
			return Number.isFinite(normalized) ? normalized : 0;
		}

		if (value && typeof value === 'object') {
			const candidate = value as Record<string, unknown>;

			for (const key of ['amount', 'value', 'total', 'openAmount', 'accumulated', 'balance']) {
				const nestedValue = candidate[key];

				if (typeof nestedValue === 'number' && Number.isFinite(nestedValue)) {
					return nestedValue;
				}

				if (typeof nestedValue === 'string') {
					const normalized = Number(nestedValue.replace(',', '.'));
					if (Number.isFinite(normalized)) {
						return normalized;
					}
				}
			}
		}

		return 0;
	}
</script>

<div class="flex h-11 items-end gap-1.5">
	{#each values as { referenceDate, amount }}
		<div class="flex flex-1 flex-col items-center justify-end gap-1">
			<Tooltip.Root>
				<Tooltip.Trigger class="block w-full">
					<span
						class="flex h-8 w-full items-end overflow-hidden rounded-sm bg-muted"
						tabindex="-1"
						aria-label={`${formatMonthLabel(referenceDate)}: ${formatCurrency(getAmountValue(amount))}`}
					>
						<span
							class={cn(
								'w-full rounded-t-sm',
								tone === 'positive' ? 'bg-emerald-400' : 'bg-rose-400'
							)}
							style={`height: ${Math.max((getAmountValue(amount) / getHistoryMax(values)) * 100, tone === 'positive' ? 12 : 18)}%; min-height: ${tone === 'positive' ? 4 : 8}px;`}
						></span>
					</span>
				</Tooltip.Trigger>
				<Tooltip.Content side="top" class="max-w-none">
					<div class="flex min-w-44 flex-col gap-2">
						<div class="flex items-center justify-between gap-3">
							<div class="flex flex-col gap-0.5">
								<span class="text-[11px] font-medium text-white uppercase">
									{formatMonthLabel(referenceDate)}
								</span>
								<span class="text-[11px] text-white/70">
									{tone === 'positive' ? 'Valor pago' : 'Em aberto'}
								</span>
							</div>
							<span
								class={cn(
									'font-semibold',
									tone === 'positive' ? 'text-emerald-600' : 'text-rose-600'
								)}
							>
								{tone === 'negative' && getAmountValue(amount) > 0 ? '- ' : ''}
								{formatCurrency(getAmountValue(amount))}
							</span>
						</div>
						{#if tone === 'negative' && getAmountValue(amount) > 0}
							<div class="flex items-center justify-end gap-2">
								<Button
									type="button"
									variant="outline"
									size="xs"
									class="border-background/20 bg-transparent text-rose-300 hover:bg-background/10 hover:text-rose-200"
									onclick={(event) => {
										event.stopPropagation();
										onCharge?.({
											monthLabel: formatMonthLabel(referenceDate),
											amount: getAmountValue(amount)
										});
									}}
								>
									Cobrar
								</Button>
								<Button
									type="button"
									size="xs"
									class="bg-rose-500 text-white hover:bg-rose-400"
									onclick={(event) => {
										event.stopPropagation();
										onAgreement?.({
											monthLabel: formatMonthLabel(referenceDate),
											amount: getAmountValue(amount)
										});
									}}
								>
									Gerar acordo
								</Button>
							</div>
						{/if}
					</div>
				</Tooltip.Content>
			</Tooltip.Root>
			<span class="text-[10px] text-muted-foreground">{formatMonthLabel(referenceDate)}</span>
		</div>
	{/each}
</div>
