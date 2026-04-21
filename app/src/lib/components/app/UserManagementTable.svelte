<script lang="ts">
	import CheckCircle2Icon from '@lucide/svelte/icons/check-circle-2';
	import PencilLineIcon from '@lucide/svelte/icons/pencil-line';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import ChevronsLeftIcon from '@lucide/svelte/icons/chevrons-left';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import ChevronsRightIcon from '@lucide/svelte/icons/chevrons-right';
	import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import type { CondominiumUser, UserLinkStatus, UserRole } from '$lib/services/users.js';
	import { USER_ROLE_LABELS, USER_STATUS_LABELS } from '$lib/services/users.js';
	import { cn } from '$lib/utils.js';

	interface Props {
		rows: CondominiumUser[];
		isBusy?: boolean;
		onEditRole?: (user: CondominiumUser) => void;
		onUnlink?: (user: CondominiumUser) => void;
		onAcceptInvite?: (user: CondominiumUser) => void;
	}

	let { rows, isBusy = false, onEditRole, onUnlink, onAcceptInvite }: Props = $props();

	let pageSize = $state(10);
	let currentPage = $state(1);

	const roleToneMap: Record<UserRole, string> = {
		administradora: 'bg-slate-100 text-slate-700',
		sindico: 'bg-sky-100 text-sky-700',
		subsindico: 'bg-cyan-100 text-cyan-700',
		tesoureiro: 'bg-emerald-100 text-emerald-700',
		morador: 'bg-amber-100 text-amber-800',
		inquilino: 'bg-violet-100 text-violet-700'
	};

	const statusToneMap: Record<UserLinkStatus, string> = {
		active: 'bg-emerald-50 text-emerald-700',
		pending: 'bg-amber-50 text-amber-700',
		unlinked: 'bg-rose-50 text-rose-700'
	};

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

<div class="flex flex-col gap-4">
	<div class="overflow-hidden rounded-lg border">
		<Tooltip.Provider>
			<Table.Root class="text-sm">
				<Table.Header class="bg-muted/35">
					<Table.Row class="hover:bg-transparent">
						<Table.Head class="w-[220px] pl-4">Nome</Table.Head>
						<Table.Head class="w-[240px]">E-mail</Table.Head>
						<Table.Head class="w-[140px]">Role</Table.Head>
						<Table.Head class="w-[140px]">Status</Table.Head>
						<Table.Head class="w-[120px] pr-4 text-right">Ações</Table.Head>
					</Table.Row>
				</Table.Header>

				<Table.Body>
					{#each pagedRows as row (row.id)}
						<Table.Row>
							<Table.Cell class="pl-4">
								<div class="flex min-w-0 items-center gap-2">
									<ShieldCheckIcon class="size-4 shrink-0 text-muted-foreground" />
									<div class="min-w-0">
										<div class="truncate font-medium text-foreground">{row.name}</div>
										<div class="truncate text-xs text-muted-foreground">
											{#if row.specialAccessNote}
												{row.specialAccessNote}
											{:else}
												ID global #{row.globalUserId}
											{/if}
										</div>
									</div>
								</div>
							</Table.Cell>

							<Table.Cell class="text-muted-foreground">
								<div class="truncate">{row.email}</div>
							</Table.Cell>

							<Table.Cell>
								<span
									class={cn(
										'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
										roleToneMap[row.role]
									)}
								>
									{USER_ROLE_LABELS[row.role]}
								</span>
							</Table.Cell>

							<Table.Cell>
								<span
									class={cn(
										'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
										statusToneMap[row.status]
									)}
								>
									{USER_STATUS_LABELS[row.status]}
								</span>
							</Table.Cell>

							<Table.Cell class="pr-4 text-right">
								<div class="flex flex-nowrap items-center justify-end gap-1.5">
									{#if row.status === 'pending' && onAcceptInvite}
										<Tooltip.Root>
											<Tooltip.Trigger>
												<Button
													type="button"
													variant="outline"
													size="icon"
													class="size-8"
													aria-label="Aceitar convite"
													disabled={isBusy}
													onclick={() => onAcceptInvite(row)}
												>
													<CheckCircle2Icon class="size-4" />
												</Button>
											</Tooltip.Trigger>
											<Tooltip.Content side="top">Aceitar convite</Tooltip.Content>
										</Tooltip.Root>
									{/if}

									{#if onEditRole}
										<Tooltip.Root>
											<Tooltip.Trigger>
												<Button
													type="button"
													variant="outline"
													size="icon"
													class="size-8"
													aria-label="Editar role"
													disabled={isBusy || row.status === 'unlinked'}
													onclick={() => onEditRole(row)}
												>
													<PencilLineIcon class="size-4" />
												</Button>
											</Tooltip.Trigger>
											<Tooltip.Content side="top">Editar role</Tooltip.Content>
										</Tooltip.Root>
									{/if}

									{#if onUnlink}
										<Tooltip.Root>
											<Tooltip.Trigger>
												<Button
													type="button"
													variant="outline"
													size="icon"
													class="size-8"
													aria-label="Desvincular usuário"
													disabled={isBusy || row.status === 'unlinked'}
													onclick={() => onUnlink(row)}
												>
													<Trash2Icon class="size-4" />
												</Button>
											</Tooltip.Trigger>
											<Tooltip.Content side="top">
												Desvincular do condomínio
											</Tooltip.Content>
										</Tooltip.Root>
									{/if}
								</div>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</Tooltip.Provider>
	</div>

	<div class="flex flex-col gap-3 px-1 lg:flex-row lg:items-center lg:justify-between">
		<div class="text-sm text-muted-foreground">
			Mostrando {pagedRows.length} de {rows.length} usuários encontrados.
		</div>

		<div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
			<div class="flex items-center gap-2 sm:shrink-0">
				<Label class="text-sm font-medium whitespace-nowrap">Linhas por página</Label>
				<div class="flex items-center overflow-hidden rounded-md border border-input">
					{#each [5, 10, 20, 30] as size}
						<button
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

			<div class="flex flex-wrap items-center gap-2 sm:justify-end">
				<div class="text-sm font-medium whitespace-nowrap text-foreground">
					Página {currentPage} de {totalPages}
				</div>
				<div class="flex items-center gap-2">
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
