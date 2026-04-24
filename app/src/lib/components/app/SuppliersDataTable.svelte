<script lang="ts">
	import Building2Icon from '@lucide/svelte/icons/building-2';
	import LandmarkIcon from '@lucide/svelte/icons/landmark';
	import MailIcon from '@lucide/svelte/icons/mail';
	import PhoneIcon from '@lucide/svelte/icons/phone';
	import ChevronsLeftIcon from '@lucide/svelte/icons/chevrons-left';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import ChevronsRightIcon from '@lucide/svelte/icons/chevrons-right';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { cn } from '$lib/utils.js';

	export interface SupplierListRow {
		id: number;
		name: string;
		document: string;
		category: string;
		contactName: string;
		email: string;
		phone: string;
		bankAccountLabel: string;
		pixKeyLabel: string;
		statusLabel: string;
	}

	interface Props {
		rows: SupplierListRow[];
	}

	let { rows }: Props = $props();

	let pageSize = $state(10);
	let currentPage = $state(1);

	const totalPages = $derived(Math.max(1, Math.ceil(rows.length / pageSize)));
	const pagedRows = $derived(rows.slice((currentPage - 1) * pageSize, currentPage * pageSize));

	$effect(() => {
		rows;
		currentPage = 1;
	});

	$effect(() => {
		pageSize;
		currentPage = 1;
	});

	$effect(() => {
		if (currentPage > totalPages) {
			currentPage = totalPages;
		}
	});
</script>

<div id="suppliers-data-table-root" data-test="suppliers-data-table-root" class="flex flex-col gap-4">
	<div
		id="suppliers-data-table-container"
		data-test="suppliers-data-table-container"
		class="overflow-hidden rounded-lg border"
	>
		<Table.Root class="text-sm">
			<Table.Header class="bg-muted/35">
				<Table.Row class="hover:bg-transparent">
					<Table.Head class="w-72 pl-4">Fornecedor</Table.Head>
					<Table.Head class="w-36">Categoria</Table.Head>
					<Table.Head>Contato</Table.Head>
					<Table.Head class="w-56">Dados bancários</Table.Head>
					<Table.Head class="w-28">Status</Table.Head>
				</Table.Row>
			</Table.Header>

			<Table.Body>
				{#each pagedRows as row (row.id)}
					<Table.Row>
						<Table.Cell class="pl-4">
							<div
								id={`supplier-row-identity-${row.id}`}
								data-test="supplier-row-identity"
								class="flex min-w-0 items-center gap-2"
							>
								<Building2Icon class="size-4 shrink-0 text-muted-foreground" />
								<div
									id={`supplier-row-main-${row.id}`}
									data-test="supplier-row-main"
									class="min-w-0"
								>
									<div
										id={`supplier-row-name-${row.id}`}
										data-test="supplier-row-name"
										class="font-medium text-foreground"
									>
										{row.name}
									</div>
									<div
										id={`supplier-row-document-${row.id}`}
										data-test="supplier-row-document"
										class="truncate text-xs text-muted-foreground"
									>
										{row.document || 'Documento não informado'}
									</div>
								</div>
							</div>
						</Table.Cell>

						<Table.Cell class="text-muted-foreground">{row.category}</Table.Cell>

						<Table.Cell>
							<div
								id={`supplier-row-contact-${row.id}`}
								data-test="supplier-row-contact"
								class="flex flex-col gap-1"
							>
								<div
									id={`supplier-row-contact-name-${row.id}`}
									data-test="supplier-row-contact-name"
									class="font-medium text-foreground"
								>
									{row.contactName || 'Sem contato'}
								</div>
								<div
									id={`supplier-row-contact-details-${row.id}`}
									data-test="supplier-row-contact-details"
									class="flex flex-col gap-1 text-xs text-muted-foreground md:flex-row md:gap-3"
								>
									<span
										id={`supplier-row-email-${row.id}`}
										data-test="supplier-row-email"
										class="inline-flex items-center gap-1"
									>
										<MailIcon class="size-3" />
										{row.email || 'Sem e-mail'}
									</span>
									<span
										id={`supplier-row-phone-${row.id}`}
										data-test="supplier-row-phone"
										class="inline-flex items-center gap-1"
									>
										<PhoneIcon class="size-3" />
										{row.phone || 'Sem telefone'}
									</span>
								</div>
							</div>
						</Table.Cell>

						<Table.Cell>
							<div
								id={`supplier-row-bank-account-${row.id}`}
								data-test="supplier-row-bank-account"
								class="flex min-w-0 items-start gap-2"
							>
								<LandmarkIcon class="mt-0.5 size-4 shrink-0 text-muted-foreground" />
								<div
									id={`supplier-row-bank-account-details-${row.id}`}
									data-test="supplier-row-bank-account-details"
									class="min-w-0"
								>
									<div
										id={`supplier-row-bank-account-label-${row.id}`}
										data-test="supplier-row-bank-account-label"
										class="truncate text-sm text-foreground"
									>
										{row.bankAccountLabel}
									</div>
									<div
										id={`supplier-row-pix-key-${row.id}`}
										data-test="supplier-row-pix-key"
										class="truncate text-xs text-muted-foreground"
									>
										{row.pixKeyLabel}
									</div>
								</div>
							</div>
						</Table.Cell>

						<Table.Cell>
							<span
								id={`supplier-row-status-${row.id}`}
								data-test="supplier-row-status"
								class="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700"
							>
								{row.statusLabel}
							</span>
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>

	<div
		id="suppliers-data-table-pagination"
		data-test="suppliers-data-table-pagination"
		class="flex flex-col gap-3 px-1 lg:flex-row lg:items-center lg:justify-between"
	>
		<div id="suppliers-data-table-count" data-test="suppliers-data-table-count" class="text-sm text-muted-foreground">
			Mostrando {pagedRows.length} de {rows.length} fornecedores encontrados.
		</div>

		<div
			id="suppliers-data-table-pagination-controls"
			data-test="suppliers-data-table-pagination-controls"
			class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end"
		>
			<div
				id="suppliers-data-table-page-size"
				data-test="suppliers-data-table-page-size"
				class="flex items-center gap-2 sm:shrink-0"
			>
				<Label class="text-sm font-medium whitespace-nowrap">Linhas por página</Label>
				<div
					id="suppliers-data-table-page-size-options"
					data-test="suppliers-data-table-page-size-options"
					class="flex items-center overflow-hidden rounded-md border border-input"
				>
					{#each [5, 10, 20, 30] as size}
						<button
							id={`suppliers-page-size-${size}`}
							data-test="suppliers-page-size-option"
							type="button"
							class={cn(
								'h-9 min-w-10 border-r px-3 text-sm font-medium transition-colors last:border-r-0',
								pageSize === size
									? 'bg-primary text-primary-foreground'
									: 'bg-background text-foreground hover:bg-muted'
							)}
							onclick={() => {
								pageSize = size;
							}}
						>
							{size}
						</button>
					{/each}
				</div>
			</div>

			<div
				id="suppliers-data-table-page-nav"
				data-test="suppliers-data-table-page-nav"
				class="flex flex-wrap items-center gap-2 sm:justify-end"
			>
				<div
					id="suppliers-data-table-page-label"
					data-test="suppliers-data-table-page-label"
					class="text-sm font-medium whitespace-nowrap text-foreground"
				>
					Página {currentPage} de {totalPages}
				</div>
				<div id="suppliers-data-table-page-buttons" data-test="suppliers-data-table-page-buttons" class="flex items-center gap-2">
					<Button
						variant="outline"
						size="icon"
						class="hidden sm:flex"
						disabled={currentPage <= 1}
						onclick={() => {
							currentPage = 1;
						}}
					>
						<ChevronsLeftIcon class="size-4" />
					</Button>
					<Button
						variant="outline"
						size="icon"
						disabled={currentPage <= 1}
						onclick={() => {
							currentPage -= 1;
						}}
					>
						<ChevronLeftIcon class="size-4" />
					</Button>
					<Button
						variant="outline"
						size="icon"
						disabled={currentPage >= totalPages}
						onclick={() => {
							currentPage += 1;
						}}
					>
						<ChevronRightIcon class="size-4" />
					</Button>
					<Button
						variant="outline"
						size="icon"
						class="hidden sm:flex"
						disabled={currentPage >= totalPages}
						onclick={() => {
							currentPage = totalPages;
						}}
					>
						<ChevronsRightIcon class="size-4" />
					</Button>
				</div>
			</div>
		</div>
	</div>
</div>
