export interface BankAccount {
	id: number;
	condominiumCode: string;
	name: string;
	bank_name: string;
	type: 'checking' | 'savings' | 'cash';
}

const bankAccountsStore = new Map<string, BankAccount[]>();

function seedForCode(condominiumCode: string): void {
	bankAccountsStore.set(condominiumCode, [
		{
			id: 1,
			condominiumCode,
			name: 'Conta Corrente BB',
			bank_name: 'Banco do Brasil',
			type: 'checking'
		},
		{
			id: 2,
			condominiumCode,
			name: 'Caixa Física',
			bank_name: '—',
			type: 'cash'
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
