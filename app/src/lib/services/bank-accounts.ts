export interface BankAccount {
	id: number;
	condominium_id: number;
	condominiumCode: string;
	name: string;
	bank_name: string;
	type: 'checking' | 'savings' | 'cash' | 'reserve' | 'investment' | 'gateway';
	agency: string;
	account_number: string;
	pix_key: string;
	gateway_account_id: string | null;
	initial_balance_cents: number;
	active: boolean;
	created_at: string;
	updated_at: string;
}

export interface CreateBankAccountInput {
	name: string;
	type: BankAccount['type'];
	bank_name: string;
	agency: string;
	account_number: string;
	pix_key: string;
	gateway_account_id: string | null;
	initial_balance_cents: number;
}

const bankAccountsStore = new Map<string, BankAccount[]>();
let nextBankAccountId = 20;

function seedForCode(condominiumCode: string): void {
	const now = new Date().toISOString();

	bankAccountsStore.set(condominiumCode, [
		{
			id: 1,
			condominium_id: 1,
			condominiumCode,
			name: 'Conta principal',
			bank_name: 'Banco do Brasil',
			type: 'checking',
			agency: '1234-5',
			account_number: '98765-4',
			pix_key: 'financeiro@ap202.com.br',
			gateway_account_id: null,
			initial_balance_cents: 1250000,
			active: true,
			created_at: now,
			updated_at: now
		},
		{
			id: 2,
			condominium_id: 1,
			condominiumCode,
			name: 'Fundo de reserva',
			bank_name: 'Itaú',
			type: 'reserve',
			agency: '4321',
			account_number: '11223-4',
			pix_key: 'reserva@ap202.com.br',
			gateway_account_id: null,
			initial_balance_cents: 820000,
			active: true,
			created_at: now,
			updated_at: now
		},
		{
			id: 3,
			condominium_id: 1,
			condominiumCode,
			name: 'Conta de obras',
			bank_name: 'Caixa Econômica',
			type: 'checking',
			agency: '0021',
			account_number: '00034567-8',
			pix_key: 'obras@ap202.com.br',
			gateway_account_id: null,
			initial_balance_cents: 300000,
			active: true,
			created_at: now,
			updated_at: now
		},
		{
			id: 4,
			condominium_id: 1,
			condominiumCode,
			name: 'Subconta do gateway',
			bank_name: 'Gateway AP202',
			type: 'gateway',
			agency: '',
			account_number: '',
			pix_key: '',
			gateway_account_id: 'gw_ap202_001',
			initial_balance_cents: 0,
			active: true,
			created_at: now,
			updated_at: now
		}
	]);
}

function getBankAccountsForCode(condominiumCode: string): BankAccount[] {
	if (!bankAccountsStore.has(condominiumCode)) {
		seedForCode(condominiumCode);
	}
	return bankAccountsStore.get(condominiumCode)!;
}

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function listBankAccounts(condominiumCode: string): Promise<BankAccount[]> {
	await delay(50);
	return [...getBankAccountsForCode(condominiumCode)];
}

export async function createBankAccount(
	condominiumCode: string,
	input: CreateBankAccountInput
): Promise<BankAccount> {
	await delay(120);

	const now = new Date().toISOString();
	const accounts = getBankAccountsForCode(condominiumCode);
	const account: BankAccount = {
		id: nextBankAccountId++,
		condominium_id: 1,
		condominiumCode,
		name: input.name,
		type: input.type,
		bank_name: input.bank_name,
		agency: input.agency,
		account_number: input.account_number,
		pix_key: input.pix_key,
		gateway_account_id: input.gateway_account_id,
		initial_balance_cents: input.initial_balance_cents,
		active: true,
		created_at: now,
		updated_at: now
	};

	accounts.push(account);

	return { ...account };
}
