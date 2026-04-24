export type SupplierBankAccountType = 'corrente' | 'poupanca' | 'pagamento';
export type SupplierPixKeyType = 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';

export interface SupplierBankAccount {
	bank_name: string;
	agency: string;
	account_number: string;
	account_type: SupplierBankAccountType;
	pix_key_type: SupplierPixKeyType;
	pix_key: string;
}

export interface Fornecedor {
	id: number;
	condominiumCode: string;
	name: string;
	document: string;
	category: string;
	contact_name: string;
	email: string;
	phone: string;
	bank_account: SupplierBankAccount;
	active: boolean;
	created_at: string;
}

export interface CreateFornecedorInput {
	name: string;
	document: string;
	category: string;
	contact_name: string;
	email: string;
	phone: string;
	bank_account: SupplierBankAccount;
}

export interface FornecedorListResponse {
	data: Fornecedor[];
	total: number;
}

const fornecedoresStore = new Map<string, Fornecedor[]>();
let nextFornecedorId = 50;

function seedFornecedores(condominiumCode: string): void {
	const now = new Date().toISOString();

	fornecedoresStore.set(condominiumCode, [
		{
			id: 1,
			condominiumCode,
			name: 'Elevadores Prime',
			document: '12.345.678/0001-90',
			category: 'Manutenção',
			contact_name: 'Carla Souza',
			email: 'atendimento@elevadoresprime.com.br',
			phone: '(31) 3333-1010',
			bank_account: {
				bank_name: 'Banco do Brasil',
				agency: '1234-5',
				account_number: '98765-4',
				account_type: 'corrente',
				pix_key_type: 'cnpj',
				pix_key: '12.345.678/0001-90'
			},
			active: true,
			created_at: now
		},
		{
			id: 2,
			condominiumCode,
			name: 'Limpeza Total BH',
			document: '23.456.789/0001-10',
			category: 'Limpeza',
			contact_name: 'Marcos Lima',
			email: 'financeiro@limpezatotalbh.com.br',
			phone: '(31) 3444-2020',
			bank_account: {
				bank_name: 'Caixa Econômica',
				agency: '2345',
				account_number: '0034567-8',
				account_type: 'corrente',
				pix_key_type: 'email',
				pix_key: 'financeiro@limpezatotalbh.com.br'
			},
			active: true,
			created_at: now
		},
		{
			id: 3,
			condominiumCode,
			name: 'Segura Portaria',
			document: '34.567.890/0001-21',
			category: 'Segurança',
			contact_name: 'Renata Alves',
			email: 'contratos@seguraportaria.com.br',
			phone: '(31) 3555-3030',
			bank_account: {
				bank_name: 'Itaú',
				agency: '4567',
				account_number: '11223-4',
				account_type: 'pagamento',
				pix_key_type: 'phone',
				pix_key: '+553135553030'
			},
			active: true,
			created_at: now
		}
	]);
}

function getFornecedoresForCode(condominiumCode: string): Fornecedor[] {
	if (!fornecedoresStore.has(condominiumCode)) {
		seedFornecedores(condominiumCode);
	}

	return fornecedoresStore.get(condominiumCode)!;
}

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function listFornecedores(condominiumCode: string): Promise<FornecedorListResponse> {
	await delay(120);
	const data = [...getFornecedoresForCode(condominiumCode)].sort((a, b) =>
		a.name.localeCompare(b.name)
	);

	return {
		data,
		total: data.length
	};
}

export async function createFornecedor(
	condominiumCode: string,
	input: CreateFornecedorInput
): Promise<Fornecedor> {
	await delay(180);

	const fornecedores = getFornecedoresForCode(condominiumCode);
	const fornecedor: Fornecedor = {
		id: nextFornecedorId++,
		condominiumCode,
		name: input.name,
		document: input.document,
		category: input.category,
		contact_name: input.contact_name,
		email: input.email,
		phone: input.phone,
		bank_account: input.bank_account,
		active: true,
		created_at: new Date().toISOString()
	};

	fornecedores.push(fornecedor);

	return { ...fornecedor };
}
