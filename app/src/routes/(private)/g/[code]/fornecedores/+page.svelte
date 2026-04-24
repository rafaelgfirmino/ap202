<script lang="ts">
	import PlusIcon from '@lucide/svelte/icons/plus';
	import SearchIcon from '@lucide/svelte/icons/search';
	import { onMount } from 'svelte';
	import CardEmpty from '$lib/components/app/card-empty/index.svelte';
	import SuppliersDataTable, {
		type SupplierListRow
	} from '$lib/components/app/SuppliersDataTable.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import {
		createFornecedor,
		listFornecedores,
		type CreateFornecedorInput,
		type Fornecedor,
		type SupplierBankAccountType,
		type SupplierPixKeyType
	} from '$lib/services/fornecedores.js';

	interface Props {
		params: {
			code: string;
		};
	}

	let { params }: Props = $props();

	let fornecedores = $state<Fornecedor[]>([]);
	let searchTerm = $state('');
	let isLoading = $state(true);
	let isSubmitting = $state(false);
	let errorMessage = $state('');
	let dialogError = $state('');
	let showCreateDialog = $state(false);

	let formName = $state('');
	let formDocument = $state('');
	let formCategory = $state('Manutenção');
	let formContactName = $state('');
	let formEmail = $state('');
	let formPhone = $state('');
	let formBankName = $state('');
	let formAgency = $state('');
	let formAccountNumber = $state('');
	let formAccountType = $state<SupplierBankAccountType>('corrente');
	let formPixKeyType = $state<SupplierPixKeyType>('cnpj');
	let formPixKey = $state('');

	const hasFornecedores = $derived(fornecedores.length > 0);

	const supplierRows = $derived(
		fornecedores
			.map(
				(fornecedor) =>
					({
						id: fornecedor.id,
						name: fornecedor.name,
						document: fornecedor.document,
						category: fornecedor.category,
						contactName: fornecedor.contact_name,
						email: fornecedor.email,
						phone: fornecedor.phone,
						bankAccountLabel: formatBankAccount(fornecedor),
						pixKeyLabel: formatPixKey(fornecedor),
						statusLabel: fornecedor.active ? 'Ativo' : 'Inativo'
					}) satisfies SupplierListRow
			)
			.filter((fornecedor) => {
				const normalizedSearch = searchTerm.trim().toLowerCase();

				if (normalizedSearch.length === 0) {
					return true;
				}

				return [
					fornecedor.name,
					fornecedor.document,
					fornecedor.category,
					fornecedor.contactName,
					fornecedor.email,
					fornecedor.phone,
					fornecedor.bankAccountLabel,
					fornecedor.pixKeyLabel,
					fornecedor.statusLabel
				]
					.join(' ')
					.toLowerCase()
					.includes(normalizedSearch);
			})
	);

	const supplierCategories = [
		'Manutenção',
		'Limpeza',
		'Segurança',
		'Elétrica',
		'Hidráulica',
		'Paisagismo',
		'Administração',
		'Água',
		'Luz/Energia',
		'Portaria',
		'Fundo de Reserva',
		'Outro'
	];

	const bankAccountTypes: { value: SupplierBankAccountType; label: string }[] = [
		{ value: 'corrente', label: 'Conta corrente' },
		{ value: 'poupanca', label: 'Conta poupança' },
		{ value: 'pagamento', label: 'Conta de pagamento' }
	];

	const pixKeyTypes: { value: SupplierPixKeyType; label: string }[] = [
		{ value: 'cnpj', label: 'CNPJ' },
		{ value: 'cpf', label: 'CPF' },
		{ value: 'email', label: 'E-mail' },
		{ value: 'phone', label: 'Telefone' },
		{ value: 'random', label: 'Chave aleatória' }
	];

	function getBankAccountTypeLabel(value: SupplierBankAccountType): string {
		return bankAccountTypes.find((type) => type.value === value)?.label ?? 'Conta';
	}

	function getPixKeyTypeLabel(value: SupplierPixKeyType): string {
		return pixKeyTypes.find((type) => type.value === value)?.label ?? 'Pix';
	}

	function formatBankAccount(fornecedor: Fornecedor): string {
		const bankAccount = fornecedor.bank_account;

		if (!bankAccount.bank_name && !bankAccount.agency && !bankAccount.account_number) {
			return 'Dados bancários não informados';
		}

		return [
			bankAccount.bank_name,
			bankAccount.agency ? `Ag. ${bankAccount.agency}` : '',
			bankAccount.account_number ? `Conta ${bankAccount.account_number}` : '',
			getBankAccountTypeLabel(bankAccount.account_type)
		]
			.filter(Boolean)
			.join(' · ');
	}

	function formatPixKey(fornecedor: Fornecedor): string {
		const bankAccount = fornecedor.bank_account;

		if (!bankAccount.pix_key) {
			return 'Pix não informado';
		}

		return `${getPixKeyTypeLabel(bankAccount.pix_key_type)}: ${bankAccount.pix_key}`;
	}

	function resetForm(): void {
		formName = '';
		formDocument = '';
		formCategory = 'Manutenção';
		formContactName = '';
		formEmail = '';
		formPhone = '';
		formBankName = '';
		formAgency = '';
		formAccountNumber = '';
		formAccountType = 'corrente';
		formPixKeyType = 'cnpj';
		formPixKey = '';
		dialogError = '';
	}

	function openCreateDialog(): void {
		resetForm();
		showCreateDialog = true;
	}

	async function loadPageData(): Promise<void> {
		isLoading = true;
		errorMessage = '';

		try {
			const response = await listFornecedores(params.code);
			fornecedores = response.data;
		} catch (error) {
			errorMessage =
				error instanceof Error ? error.message : 'Não foi possível carregar os fornecedores.';
		} finally {
			isLoading = false;
		}
	}

	async function handleCreateFornecedor(): Promise<void> {
		dialogError = '';

		if (!formName.trim()) {
			dialogError = 'Informe o nome do fornecedor.';
			return;
		}

		isSubmitting = true;

		const input: CreateFornecedorInput = {
			name: formName.trim(),
			document: formDocument.trim(),
			category: formCategory,
			contact_name: formContactName.trim(),
			email: formEmail.trim(),
			phone: formPhone.trim(),
			bank_account: {
				bank_name: formBankName.trim(),
				agency: formAgency.trim(),
				account_number: formAccountNumber.trim(),
				account_type: formAccountType,
				pix_key_type: formPixKeyType,
				pix_key: formPixKey.trim()
			}
		};

		try {
			const fornecedor = await createFornecedor(params.code, input);
			fornecedores = [...fornecedores, fornecedor].sort((a, b) => a.name.localeCompare(b.name));
			showCreateDialog = false;
			resetForm();
		} catch (error) {
			dialogError =
				error instanceof Error ? error.message : 'Não foi possível criar o fornecedor.';
		} finally {
			isSubmitting = false;
		}
	}

	onMount(async () => {
		await loadPageData();
	});
</script>

<svelte:head>
	<title>Fornecedores</title>
</svelte:head>

<main
	id="suppliers-page-root"
	data-test="suppliers-page-root"
	class="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6"
>
	<section
		id="suppliers-page-header"
		data-test="suppliers-page-header"
		class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"
	>
		<div id="suppliers-page-title-group" data-test="suppliers-page-title-group" class="flex flex-col gap-1">
			<h1
				id="suppliers-page-title"
				data-test="suppliers-page-title"
				class="text-2xl font-semibold tracking-tight text-foreground"
			>
				Fornecedores
			</h1>
			<p id="suppliers-page-subtitle" data-test="suppliers-page-subtitle" class="text-sm text-muted-foreground">
				Mantenha a base de fornecedores usada nos lançamentos de contas a pagar.
			</p>
		</div>

		<Button id="suppliers-create-button" data-test="suppliers-create-button" type="button" onclick={openCreateDialog}>
			<PlusIcon class="mr-2 size-4" />
			Novo fornecedor
		</Button>
	</section>

	<Dialog.Root bind:open={showCreateDialog}>
		<Dialog.Content class="max-h-[90vh] w-[calc(100vw-2rem)] max-w-none overflow-y-auto sm:max-w-[1180px]">
			<Dialog.Header>
				<Dialog.Title>Novo fornecedor</Dialog.Title>
				<Dialog.Description>
					Cadastre os dados principais, bancários e Pix para usar em contas a pagar.
				</Dialog.Description>
			</Dialog.Header>

			<div id="supplier-dialog-form" data-test="supplier-dialog-form" class="grid gap-4 py-2">
				{#if dialogError}
					<div
						id="supplier-dialog-error"
						data-test="supplier-dialog-error"
						class="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{dialogError}
					</div>
				{/if}

				<div
					id="supplier-main-fields-grid"
					data-test="supplier-main-fields-grid"
					class="grid gap-4 sm:grid-cols-2"
				>
					<div id="supplier-name-field" data-test="supplier-name-field" class="space-y-2 sm:col-span-2">
						<Label for="supplier-name-input">Nome</Label>
						<Input
							id="supplier-name-input"
							data-test="supplier-name-input"
							value={formName}
							placeholder="Ex.: Elevadores Prime"
							disabled={isSubmitting}
							oninput={(event) => {
								formName = (event.currentTarget as HTMLInputElement).value;
							}}
						/>
					</div>

					<div id="supplier-document-field" data-test="supplier-document-field" class="space-y-2">
						<Label for="supplier-document-input">CNPJ/CPF</Label>
						<Input
							id="supplier-document-input"
							data-test="supplier-document-input"
							value={formDocument}
							placeholder="00.000.000/0000-00"
							disabled={isSubmitting}
							oninput={(event) => {
								formDocument = (event.currentTarget as HTMLInputElement).value;
							}}
						/>
					</div>

					<div id="supplier-category-field" data-test="supplier-category-field" class="space-y-2">
						<Label for="supplier-category-select">Categoria</Label>
						<select
							id="supplier-category-select"
							data-test="supplier-category-select"
							class="flex h-9 w-full rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
							value={formCategory}
							disabled={isSubmitting}
							onchange={(event) => {
								formCategory = (event.currentTarget as HTMLSelectElement).value;
							}}
						>
							{#each supplierCategories as category}
								<option value={category}>{category}</option>
							{/each}
						</select>
					</div>

					<div id="supplier-contact-field" data-test="supplier-contact-field" class="space-y-2">
						<Label for="supplier-contact-input">Contato</Label>
						<Input
							id="supplier-contact-input"
							data-test="supplier-contact-input"
							value={formContactName}
							placeholder="Nome do responsável"
							disabled={isSubmitting}
							oninput={(event) => {
								formContactName = (event.currentTarget as HTMLInputElement).value;
							}}
						/>
					</div>

					<div id="supplier-phone-field" data-test="supplier-phone-field" class="space-y-2">
						<Label for="supplier-phone-input">Telefone</Label>
						<Input
							id="supplier-phone-input"
							data-test="supplier-phone-input"
							value={formPhone}
							placeholder="(31) 99999-9999"
							disabled={isSubmitting}
							oninput={(event) => {
								formPhone = (event.currentTarget as HTMLInputElement).value;
							}}
						/>
					</div>

					<div id="supplier-email-field" data-test="supplier-email-field" class="space-y-2 sm:col-span-2">
						<Label for="supplier-email-input">E-mail</Label>
						<Input
							id="supplier-email-input"
							data-test="supplier-email-input"
							type="email"
							value={formEmail}
							placeholder="financeiro@fornecedor.com.br"
							disabled={isSubmitting}
							oninput={(event) => {
								formEmail = (event.currentTarget as HTMLInputElement).value;
							}}
						/>
					</div>
				</div>

				<div
					id="supplier-bank-section"
					data-test="supplier-bank-section"
					class="grid gap-4 rounded-lg border border-border bg-muted/20 p-3"
				>
					<div
						id="supplier-bank-section-header"
						data-test="supplier-bank-section-header"
						class="space-y-1"
					>
						<h2
							id="supplier-bank-section-title"
							data-test="supplier-bank-section-title"
							class="text-sm font-semibold text-foreground"
						>
							Dados bancários
						</h2>
						<p
							id="supplier-bank-section-description"
							data-test="supplier-bank-section-description"
							class="text-xs text-muted-foreground"
						>
							Informe uma conta ou uma chave Pix para pagamentos ao fornecedor.
						</p>
					</div>

					<div id="supplier-bank-name-field" data-test="supplier-bank-name-field" class="space-y-2">
						<Label for="supplier-bank-name-input">Banco</Label>
						<Input
							id="supplier-bank-name-input"
							data-test="supplier-bank-name-input"
							value={formBankName}
							placeholder="Ex.: Banco do Brasil"
							disabled={isSubmitting}
							oninput={(event) => {
								formBankName = (event.currentTarget as HTMLInputElement).value;
							}}
						/>
					</div>

					<div
						id="supplier-bank-account-grid"
						data-test="supplier-bank-account-grid"
						class="grid gap-4 sm:grid-cols-2"
					>
						<div id="supplier-bank-agency-field" data-test="supplier-bank-agency-field" class="space-y-2">
							<Label for="supplier-bank-agency-input">Agência</Label>
							<Input
								id="supplier-bank-agency-input"
								data-test="supplier-bank-agency-input"
								value={formAgency}
								placeholder="0000"
								disabled={isSubmitting}
								oninput={(event) => {
									formAgency = (event.currentTarget as HTMLInputElement).value;
								}}
							/>
						</div>

						<div id="supplier-bank-account-field" data-test="supplier-bank-account-field" class="space-y-2">
							<Label for="supplier-bank-account-input">Conta</Label>
							<Input
								id="supplier-bank-account-input"
								data-test="supplier-bank-account-input"
								value={formAccountNumber}
								placeholder="00000-0"
								disabled={isSubmitting}
								oninput={(event) => {
									formAccountNumber = (event.currentTarget as HTMLInputElement).value;
								}}
							/>
						</div>
					</div>

					<div id="supplier-bank-account-type-field" data-test="supplier-bank-account-type-field" class="space-y-2">
						<Label for="supplier-bank-account-type-select">Tipo de conta</Label>
						<select
							id="supplier-bank-account-type-select"
							data-test="supplier-bank-account-type-select"
							class="flex h-9 w-full rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
							value={formAccountType}
							disabled={isSubmitting}
							onchange={(event) => {
								formAccountType = (event.currentTarget as HTMLSelectElement).value as SupplierBankAccountType;
							}}
						>
							{#each bankAccountTypes as type}
								<option value={type.value}>{type.label}</option>
							{/each}
						</select>
					</div>

					<div
						id="supplier-pix-grid"
						data-test="supplier-pix-grid"
						class="grid gap-4 sm:grid-cols-[160px_1fr]"
					>
						<div id="supplier-pix-key-type-field" data-test="supplier-pix-key-type-field" class="space-y-2">
							<Label for="supplier-pix-key-type-select">Tipo de Pix</Label>
							<select
								id="supplier-pix-key-type-select"
								data-test="supplier-pix-key-type-select"
								class="flex h-9 w-full rounded-md border border-input bg-input/20 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
								value={formPixKeyType}
								disabled={isSubmitting}
								onchange={(event) => {
									formPixKeyType = (event.currentTarget as HTMLSelectElement).value as SupplierPixKeyType;
								}}
							>
								{#each pixKeyTypes as type}
									<option value={type.value}>{type.label}</option>
								{/each}
							</select>
						</div>

						<div id="supplier-pix-key-field" data-test="supplier-pix-key-field" class="space-y-2">
							<Label for="supplier-pix-key-input">Chave Pix</Label>
							<Input
								id="supplier-pix-key-input"
								data-test="supplier-pix-key-input"
								value={formPixKey}
								placeholder="Chave Pix do fornecedor"
								disabled={isSubmitting}
								oninput={(event) => {
									formPixKey = (event.currentTarget as HTMLInputElement).value;
								}}
							/>
						</div>
					</div>
				</div>
			</div>

			<Dialog.Footer>
				<Button
					id="supplier-dialog-cancel"
					data-test="supplier-dialog-cancel"
					type="button"
					variant="outline"
					disabled={isSubmitting}
					onclick={() => {
						showCreateDialog = false;
					}}
				>
					Cancelar
				</Button>
				<Button
					id="supplier-dialog-submit"
					data-test="supplier-dialog-submit"
					type="button"
					disabled={isSubmitting}
					onclick={handleCreateFornecedor}
				>
					{isSubmitting ? 'Salvando...' : 'Criar fornecedor'}
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title>Listagem de fornecedores</Card.Title>
		</Card.Header>
		<Card.Content class="flex flex-col gap-4">
			<div
				id="suppliers-list-toolbar"
				data-test="suppliers-list-toolbar"
				class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
			>
				<div id="suppliers-list-count" data-test="suppliers-list-count" class="text-sm text-muted-foreground">
					{fornecedores.length} fornecedores cadastrados.
				</div>

				<div id="suppliers-search-wrapper" data-test="suppliers-search-wrapper" class="relative w-full lg:max-w-xs">
					<SearchIcon
						class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
					/>
					<Input
						id="suppliers-search-input"
						data-test="suppliers-search-input"
						value={searchTerm}
						placeholder="Buscar por nome, documento ou contato"
						class="pl-9"
						oninput={(event) => {
							searchTerm = (event.currentTarget as HTMLInputElement).value;
						}}
					/>
				</div>
			</div>

			{#if isLoading}
				<div id="suppliers-loading" data-test="suppliers-loading" class="text-sm text-muted-foreground">
					Carregando fornecedores...
				</div>
			{:else if errorMessage}
				<div
					id="suppliers-error"
					data-test="suppliers-error"
					class="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
				>
					{errorMessage}
				</div>
			{:else if !hasFornecedores}
				<CardEmpty
					title="Nenhum fornecedor cadastrado"
					description="Cadastre fornecedores para vincular despesas e organizar as contas a pagar."
					actionLabel="Novo fornecedor"
					onAction={openCreateDialog}
				/>
			{:else if supplierRows.length === 0}
				<div
					id="suppliers-empty-filter"
					data-test="suppliers-empty-filter"
					class="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground"
				>
					Nenhum fornecedor encontrado para o filtro informado.
				</div>
			{:else}
				<SuppliersDataTable rows={supplierRows} />
			{/if}
		</Card.Content>
	</Card.Root>
</main>
