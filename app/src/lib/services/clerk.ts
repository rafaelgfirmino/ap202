import { browser } from '$app/environment';
import { PUBLIC_CLERK_PUBLISHABLE_KEY } from '$env/static/public';

const publishableKey = PUBLIC_CLERK_PUBLISHABLE_KEY || import.meta.env.PUBLIC_CLERK_PUBLISHABLE_KEY;

type ClerkInstance = InstanceType<(typeof import('@clerk/clerk-js'))['Clerk']>;
type ClerkSignIn = NonNullable<Awaited<ReturnType<typeof getClerk>>['client']>['signIn'];
type SignInResource = NonNullable<ClerkSignIn>;

export type SecondFactorStrategy = 'email_code' | 'phone_code' | 'totp' | 'backup_code';

export interface SecondFactorOption {
	strategy: SecondFactorStrategy;
	label: string;
	description: string;
	emailAddressId?: string;
	phoneNumberId?: string;
	isPrepared: boolean;
}

interface SecondFactorResolutionComplete {
	status: 'complete';
}

interface SecondFactorResolutionNeedsSecondFactor {
	status: 'needs_second_factor';
	options: SecondFactorOption[];
	selectedStrategy: SecondFactorStrategy;
}

export type PasswordSignInResult =
	| {
			status: 'complete';
	  }
	| {
			status: 'needs_second_factor';
			options: SecondFactorOption[];
			selectedStrategy: SecondFactorStrategy;
	  };

let clerkPromise: Promise<ClerkInstance> | null = null;

/**
 * Inicializa uma instancia unica do Clerk no navegador.
 * A rota de login reutiliza esta funcao para evitar multiplos carregamentos do SDK.
 */
export async function getClerk() {
	if (!browser) {
		throw new Error('O Clerk só pode ser inicializado no navegador.');
	}

	if (!publishableKey) {
		throw new Error('Defina PUBLIC_CLERK_PUBLISHABLE_KEY para habilitar o login.');
	}

	if (!clerkPromise) {
		clerkPromise = (async () => {
			const { Clerk } = await import('@clerk/clerk-js');
			const clerk = new Clerk(publishableKey);

			await clerk.load({
				signInUrl: '/security/login',
				signUpUrl: '/security/login'
			});

			return clerk;
		})();
	}

	return clerkPromise;
}

/**
 * Executa o fluxo de login com email e senha usando o client-side SDK do Clerk.
 */
export async function signInWithPassword(params: { email: string; password: string }) {
	const clerk = await getClerk();
	const signIn = await clerk.client?.signIn.create({
		identifier: params.email,
		password: params.password
	});

	if (!signIn) {
		throw new Error('Não foi possível iniciar a autenticação no Clerk.');
	}

	return finalizeSignIn(clerk, signIn);
}

function getSecondFactorOptions(signIn: SignInResource): SecondFactorOption[] {
	const supportedFactors = signIn.supportedSecondFactors ?? [];
	const options: SecondFactorOption[] = [];

	for (const factor of supportedFactors) {
		switch (factor.strategy) {
			case 'email_code':
				options.push({
					strategy: 'email_code',
					label: 'Código por email',
					description: `Envia um código para ${factor.safeIdentifier}.`,
					emailAddressId: factor.emailAddressId,
					isPrepared: signIn.secondFactorVerification.strategy === 'email_code'
				});
				break;
			case 'phone_code':
				options.push({
					strategy: 'phone_code',
					label: 'Código por telefone',
					description: `Envia um código para ${factor.safeIdentifier}.`,
					phoneNumberId: factor.phoneNumberId,
					isPrepared: signIn.secondFactorVerification.strategy === 'phone_code'
				});
				break;
			case 'totp':
				options.push({
					strategy: 'totp',
					label: 'Aplicativo autenticador',
					description: 'Use o código gerado no seu aplicativo autenticador.',
					isPrepared: true
				});
				break;
			case 'backup_code':
				options.push({
					strategy: 'backup_code',
					label: 'Código de backup',
					description: 'Use um dos códigos de backup da sua conta.',
					isPrepared: true
				});
				break;
		}
	}

	return options;
}

function getDefaultSecondFactor(options: SecondFactorOption[]): SecondFactorOption | null {
	const orderedStrategies: SecondFactorStrategy[] = [
		'email_code',
		'phone_code',
		'totp',
		'backup_code'
	];

	for (const strategy of orderedStrategies) {
		const option = options.find((item) => item.strategy === strategy);

		if (option) {
			return option;
		}
	}

	return options[0] ?? null;
}

async function prepareSecondFactor(
	signIn: SignInResource,
	option: SecondFactorOption
): Promise<SignInResource> {
	if (option.strategy === 'email_code') {
		return signIn.prepareSecondFactor({
			strategy: 'email_code',
			emailAddressId: option.emailAddressId
		});
	}

	if (option.strategy === 'phone_code') {
		return signIn.prepareSecondFactor({
			strategy: 'phone_code',
			phoneNumberId: option.phoneNumberId
		});
	}

	return signIn;
}

async function resolveNeedsSecondFactor(
	signIn: SignInResource
): Promise<SecondFactorResolutionNeedsSecondFactor> {
	const options = getSecondFactorOptions(signIn);
	const defaultOption = getDefaultSecondFactor(options);

	if (!defaultOption) {
		throw new Error('Não foi possível identificar um segundo fator compatível para este login.');
	}

	const preparedSignIn = await prepareSecondFactor(signIn, defaultOption);
	const preparedOptions = getSecondFactorOptions(preparedSignIn);

	return {
		status: 'needs_second_factor',
		options: preparedOptions,
		selectedStrategy: defaultOption.strategy
	};
}

async function finalizeSignIn(
	clerk: ClerkInstance,
	signIn: SignInResource
): Promise<PasswordSignInResult | SecondFactorResolutionComplete> {
	if (signIn.status === 'complete' && signIn.createdSessionId) {
		await clerk.setActive({ session: signIn.createdSessionId });

		return {
			status: 'complete'
		};
	}

	if (signIn.status === 'needs_second_factor') {
		return resolveNeedsSecondFactor(signIn);
	}

	if (signIn.status === 'needs_new_password') {
		throw new Error('Sua conta precisa redefinir a senha antes de continuar.');
	}

	if (signIn.status === 'needs_client_trust') {
		throw new Error('Este dispositivo precisa de validação adicional para concluir o login.');
	}

	throw new Error('Não foi possível concluir o login com os fatores disponíveis.');
}

export async function getPendingSecondFactorState(): Promise<SecondFactorResolutionNeedsSecondFactor> {
	const clerk = await getClerk();
	const signIn = clerk.client?.signIn;

	if (!signIn || signIn.status !== 'needs_second_factor') {
		throw new Error('Nenhuma etapa adicional de autenticação está pendente.');
	}

	const options = getSecondFactorOptions(signIn);
	const selectedOption = options.find((option) => option.isPrepared) ?? getDefaultSecondFactor(options);

	if (!selectedOption) {
		throw new Error('Não foi possível recuperar os fatores adicionais deste login.');
	}

	return {
		status: 'needs_second_factor',
		options,
		selectedStrategy: selectedOption.strategy
	};
}

export async function selectSecondFactor(
	strategy: SecondFactorStrategy
): Promise<SecondFactorResolutionNeedsSecondFactor> {
	const clerk = await getClerk();
	const signIn = clerk.client?.signIn;

	if (!signIn || signIn.status !== 'needs_second_factor') {
		throw new Error('Nenhuma etapa adicional de autenticação está pendente.');
	}

	const option = getSecondFactorOptions(signIn).find((item) => item.strategy === strategy);

	if (!option) {
		throw new Error('O fator adicional selecionado não está disponível para este login.');
	}

	const preparedSignIn = await prepareSecondFactor(signIn, option);

	return {
		status: 'needs_second_factor',
		options: getSecondFactorOptions(preparedSignIn),
		selectedStrategy: option.strategy
	};
}

export async function verifySecondFactor(params: {
	strategy: SecondFactorStrategy;
	code: string;
}): Promise<PasswordSignInResult | SecondFactorResolutionComplete> {
	const clerk = await getClerk();
	const signIn = clerk.client?.signIn;

	if (!signIn || signIn.status !== 'needs_second_factor') {
		throw new Error('Nenhuma etapa adicional de autenticação está pendente.');
	}

	const normalizedCode = params.code.trim();

	if (!normalizedCode) {
		throw new Error('Informe o código de autenticação.');
	}

	const updatedSignIn = await signIn.attemptSecondFactor({
		strategy: params.strategy,
		code: normalizedCode
	});

	return finalizeSignIn(clerk, updatedSignIn);
}

/**
 * Encerra a sessao atual do usuario autenticado e redireciona para a tela de login.
 */
export async function signOutUser() {
	const clerk = await getClerk();

	await clerk.signOut({
		redirectUrl: '/security/login'
	});
}

/**
 * Normaliza os erros do Clerk para uma mensagem curta exibida na interface.
 */
export function getClerkErrorMessage(error: unknown) {
	if (typeof error === 'object' && error !== null && 'errors' in error) {
		const clerkErrors = Reflect.get(error, 'errors');

		if (Array.isArray(clerkErrors) && clerkErrors.length > 0) {
			const firstError = clerkErrors[0];

			if (
				typeof firstError === 'object' &&
				firstError !== null &&
				'longMessage' in firstError &&
				typeof Reflect.get(firstError, 'longMessage') === 'string'
			) {
				return Reflect.get(firstError, 'longMessage') as string;
			}

			if (
				typeof firstError === 'object' &&
				firstError !== null &&
				'message' in firstError &&
				typeof Reflect.get(firstError, 'message') === 'string'
			) {
				return Reflect.get(firstError, 'message') as string;
			}
		}
	}

	if (error instanceof Error) {
		return error.message;
	}

	return 'Não foi possível concluir o login.';
}
