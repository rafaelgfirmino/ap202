<script lang="ts">
	import ArrowRightLeftIcon from '@lucide/svelte/icons/arrow-right-left';
	import BellRingIcon from '@lucide/svelte/icons/bell-ring';
	import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import type { ManagementTransfer, SessionActor, CondominiumUser } from '$lib/services/users.js';
	import { USER_ROLE_LABELS } from '$lib/services/users.js';
	import { cn } from '$lib/utils.js';

	interface Props {
		currentActor: SessionActor;
		administrators: CondominiumUser[];
		transfers: ManagementTransfer[];
		isBusy?: boolean;
		onStartTransfer?: () => void;
		onAcceptTransfer?: (transfer: ManagementTransfer) => void;
	}

	let {
		currentActor,
		administrators,
		transfers,
		isBusy = false,
		onStartTransfer,
		onAcceptTransfer
	}: Props = $props();

	const pendingTransfer = $derived(
		transfers.find((transfer) => transfer.status === 'pending_acceptance') ?? null
	);

	const actorCanTransfer = $derived(currentActor.role === 'sindico');
	const actorCanAccept = $derived(
		Boolean(
			pendingTransfer &&
			currentActor.role === 'administradora' &&
			pendingTransfer.toUserId === currentActor.membershipId
		)
	);

	const transferTargetName = $derived(
		pendingTransfer
			? pendingTransfer.toUserName
			: (administrators[0]?.name ?? 'Nenhuma administradora')
	);
</script>

<Card.Root id="management-transfer-panel" data-test="management-transfer-panel">
	<Card.Header class="space-y-3">
		<div
			id="management-transfer-panel-heading"
			data-test="management-transfer-panel-heading"
			class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"
		>
			<div
				id="management-transfer-panel-copy"
				data-test="management-transfer-panel-copy"
				class="space-y-1"
			>
				<Card.Title class="flex items-center gap-2">
					<ArrowRightLeftIcon class="size-4" />
					Transferência de gestão
				</Card.Title>
				<Card.Description>
					Fluxo de dupla confirmação para o Síndico passar a gestão para uma Administradora, com
					histórico preservado e aceite obrigatório do destino.
				</Card.Description>
			</div>

			<div
				id="management-transfer-panel-actor"
				data-test="management-transfer-panel-actor"
				class="rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-sm"
			>
				<div
					id="management-transfer-panel-actor-label"
					data-test="management-transfer-panel-actor-label"
					class="text-xs tracking-[0.08em] text-muted-foreground uppercase"
				>
					Perfil da sessão
				</div>
				<div
					id="management-transfer-panel-actor-value"
					data-test="management-transfer-panel-actor-value"
					class="mt-1 font-medium text-foreground"
				>
					{currentActor.name} · {USER_ROLE_LABELS[currentActor.role]}
				</div>
			</div>
		</div>
	</Card.Header>

	<Card.Content class="flex flex-col gap-4">
		<div
			id="management-transfer-panel-status-grid"
			data-test="management-transfer-panel-status-grid"
			class="grid grid-cols-1 gap-3 xl:grid-cols-3"
		>
			<article
				id="management-transfer-panel-status-rule"
				data-test="management-transfer-panel-status-rule"
				class="rounded-xl border border-border/70 bg-background p-4"
			>
				<div class="flex items-center gap-2 text-sm font-medium text-foreground">
					<ShieldCheckIcon class="size-4 text-sky-600" />
					Permissão atual
				</div>
				<p class="mt-2 text-sm text-muted-foreground">
					{#if actorCanTransfer}
						Seu perfil atual pode iniciar a transferência.
					{:else}
						Apenas um Síndico pode iniciar a transferência de gestão.
					{/if}
				</p>
			</article>

			<article
				id="management-transfer-panel-status-target"
				data-test="management-transfer-panel-status-target"
				class="rounded-xl border border-border/70 bg-background p-4"
			>
				<div class="flex items-center gap-2 text-sm font-medium text-foreground">
					<BellRingIcon class="size-4 text-amber-600" />
					Destino atual
				</div>
				<p class="mt-2 text-sm text-muted-foreground">
					{transferTargetName}
				</p>
			</article>

			<article
				id="management-transfer-panel-status-pending"
				data-test="management-transfer-panel-status-pending"
				class={cn(
					'rounded-xl border p-4',
					pendingTransfer ? 'border-amber-200 bg-amber-50/60' : 'border-border/70 bg-background'
				)}
			>
				<div class="flex items-center gap-2 text-sm font-medium text-foreground">
					<ArrowRightLeftIcon class="size-4 text-emerald-600" />
					Estado do fluxo
				</div>
				<p class="mt-2 text-sm text-muted-foreground">
					{#if pendingTransfer}
						Aguardando aceite de {pendingTransfer.toUserName}.
					{:else}
						Nenhuma transferência pendente no momento.
					{/if}
				</p>
			</article>
		</div>

		<div
			id="management-transfer-panel-actions"
			data-test="management-transfer-panel-actions"
			class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
		>
			<p
				id="management-transfer-panel-warning"
				data-test="management-transfer-panel-warning"
				class="max-w-3xl text-sm text-muted-foreground"
			>
				O histórico do Síndico anterior é preservado e a troca só é concluída depois do aceite da
				Administradora escolhida.
			</p>

			<div
				id="management-transfer-panel-buttons"
				data-test="management-transfer-panel-buttons"
				class="flex flex-wrap gap-2"
			>
				<Button
					type="button"
					disabled={isBusy || !actorCanTransfer || Boolean(pendingTransfer)}
					onclick={() => onStartTransfer?.()}
				>
					Iniciar transferência
				</Button>

				{#if pendingTransfer && actorCanAccept}
					<Button
						type="button"
						variant="outline"
						disabled={isBusy}
						onclick={() => onAcceptTransfer?.(pendingTransfer)}
					>
						Aceitar transferência
					</Button>
				{/if}
			</div>
		</div>
	</Card.Content>
</Card.Root>
