<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import FolderCodeIcon from '@lucide/svelte/icons/folder-code';
	import { Button } from '$lib/components/ui/button/index.js';

	/**
	 * Estado vazio reutilizavel para a tela de grupos/blocos.
	 * O CTA pode ser conectado ao formulario da pagina chamadora.
	 */
	interface Props {
		title?: string;
		description?: string;
		actionLabel?: string;
		onAction?: () => void;
	}

	let {
		title = 'Nenhum bloco cadastrado',
		description = 'Parece que ainda nao ha blocos cadastrados para este condominio. Comece criando um bloco para organizar suas unidades e lancamentos. Voce pode criar quantos blocos quiser e edita-los posteriormente desde que nao tenham sido utilizados em lancamentos ou rateios.',
		actionLabel = 'Criar bloco',
		onAction
	}: Props = $props();
</script>

<Card.Root id="card-empty-root" data-test="card-empty-root">
	<Card.Content id="card-empty-content" data-test="card-empty-content">
		<Empty.Root id="card-empty-state" data-test="card-empty-state">
			<Empty.Header id="card-empty-header" data-test="card-empty-header">
				<Empty.Media id="card-empty-media" data-test="card-empty-media" variant="icon">
					<FolderCodeIcon id="card-empty-media-icon" data-test="card-empty-media-icon" />
				</Empty.Media>
				<Empty.Title id="card-empty-title" data-test="card-empty-title">{title}</Empty.Title>
			</Empty.Header>
			<Empty.Content id="card-empty-body" data-test="card-empty-body">
				<div
					id="card-empty-stack"
					data-test="card-empty-stack"
					class="flex flex-col items-center justify-center gap-4"
				>
					<div
						id="card-empty-description-wrapper"
						data-test="card-empty-description-wrapper"
						class="flex max-w-2xl flex-col items-start"
					>
						<span
							id="card-empty-description"
							data-test="card-empty-description"
							class="text-muted-foreground block text-sm"
						>
							{description}
						</span>
					</div>

					<Button
						id="card-empty-action"
						data-test="card-empty-action"
						type="button"
						onclick={() => onAction?.()}
					>
						{actionLabel}
					</Button>
				</div>
			</Empty.Content>
		</Empty.Root>
	</Card.Content>
</Card.Root>
