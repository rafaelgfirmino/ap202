import { browser } from '$app/environment';
import { PUBLIC_CLERK_PUBLISHABLE_KEY } from '$env/static/public';

const publishableKey = PUBLIC_CLERK_PUBLISHABLE_KEY || import.meta.env.PUBLIC_CLERK_PUBLISHABLE_KEY;

type ClerkInstance = InstanceType<(typeof import('@clerk/clerk-js'))['Clerk']>;

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

	if (signIn.status !== 'complete' || !signIn.createdSessionId) {
		throw new Error('Este login precisa de uma etapa adicional de autenticação.');
	}

	await clerk.setActive({ session: signIn.createdSessionId });

	return clerk;
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
