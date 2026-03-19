import type { FormEvent } from 'react';
import { useState } from 'react';
import { useSignIn } from '@clerk/react-router/legacy';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoaded, signIn, setActive } = useSignIn();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingSecondFactor, setPendingSecondFactor] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const fromPathname = (location.state as { from?: Location } | null)?.from?.pathname;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();

    if (!isLoaded) return;

    setSubmitting(true);
    setError(null);

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        navigate(fromPathname || '/layout-14', { replace: true });
        return;
      }

      if (result.status === 'needs_second_factor') {
        const emailSecondFactor = result.supportedSecondFactors?.find((f) => f.strategy === 'email_code');
        await result.prepareSecondFactor({
          strategy: 'email_code',
          ...(emailSecondFactor && 'emailAddressId' in emailSecondFactor && emailSecondFactor.emailAddressId
            ? { emailAddressId: emailSecondFactor.emailAddressId }
            : {}),
        });

        setPendingSecondFactor(true);
        return;
      }

      setError('Não foi possível concluir o login.');
    } catch (err: unknown) {
      const extracted =
        typeof err === 'object' &&
        err !== null &&
        'errors' in err &&
        Array.isArray((err as { errors?: Array<{ longMessage?: string }> }).errors)
          ? (err as { errors: Array<{ longMessage?: string }> }).errors[0]?.longMessage
          : undefined;

      setError(extracted || 'Falha ao entrar. Verifique seu e-mail e senha.');
    } finally {
      setSubmitting(false);
    }
  }

  async function onVerifySecondFactor(e: FormEvent) {
    e.preventDefault();

    if (!isLoaded) return;

    setSubmitting(true);
    setError(null);

    try {
      const result = await signIn.attemptSecondFactor({
        strategy: 'email_code',
        code,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        navigate(fromPathname || '/layout-14', { replace: true });
        return;
      }

      setError('Não foi possível concluir a verificação.');
    } catch (err: unknown) {
      const extracted =
        typeof err === 'object' &&
        err !== null &&
        'errors' in err &&
        Array.isArray((err as { errors?: Array<{ longMessage?: string }> }).errors)
          ? (err as { errors: Array<{ longMessage?: string }> }).errors[0]?.longMessage
          : undefined;

      setError(extracted || 'Falha ao verificar o código.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2">
      <div className="flex flex-col p-8 lg:p-12">
        <div className="mb-12">
          <img 
            src="/media/brand-logos/logo.svg" 
            alt="dadosfera" 
            className="h-12"
          />
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-md">
          {!pendingSecondFactor ? (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-semibold text-gray-900">Seja bem-vindo ao seu condomínio digital!</h1>
              </div>

              <form className="space-y-5" onSubmit={onSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm text-gray-700">
                    Usuário:
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-blue-50 border-blue-100 focus:border-blue-300 focus:ring-blue-300"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm text-gray-700">
                    Senha:
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-blue-50 border-blue-100 focus:border-blue-300 focus:ring-blue-300 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && <div className="text-sm text-red-600">{error}</div>}

                <Button 
                  type="submit" 
                  className="w-full bg-indigo-900 hover:bg-indigo-800 text-white font-medium py-6 text-base"
                  disabled={!isLoaded || submitting}
                >
                  Login
                </Button>

                <div className="text-center">
                  <Link to="/forgot-password" className="text-sm text-gray-500 hover:text-gray-700 underline">
                    Esqueceu a senha
                  </Link>
                </div>
              </form>
            </>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-semibold text-gray-900 mb-4">Verificação</h1>
                <p className="text-sm text-gray-600">
                  Enviamos um código para o seu e-mail. Digite abaixo para concluir o login.
                </p>
              </div>

              <form className="space-y-5" onSubmit={onVerifySecondFactor}>
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-sm text-gray-700">
                    Código:
                  </Label>
                  <Input
                    id="code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="bg-blue-50 border-blue-100 focus:border-blue-300 focus:ring-blue-300"
                    required
                  />
                </div>

                {error && <div className="text-sm text-red-600">{error}</div>}

                <Button 
                  type="submit" 
                  className="w-full bg-indigo-900 hover:bg-indigo-800 text-white font-medium py-6 text-base"
                  disabled={!isLoaded || submitting}
                >
                  Verificar
                </Button>
              </form>
            </>
          )}
        </div>

        <footer className="mt-auto pt-8">
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            <Link to="/roadmap" className="hover:text-gray-700">Roadmap</Link>
            <Link to="/documentation" className="hover:text-gray-700">Documentação</Link>
            <Link to="/support" className="hover:text-gray-700">Suporte</Link>
            <Link to="/terms" className="hover:text-gray-700">Termos de Uso</Link>
            <Link to="/privacy" className="hover:text-gray-700">Aviso de Privacidade</Link>
          </div>
        </footer>
      </div>

      <div className="hidden lg:flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-12">
        <div className="max-w-lg">
          <svg viewBox="0 0 800 600" className="w-full h-auto">
            <circle cx="400" cy="300" r="280" fill="#E0F2FE" opacity="0.5"/>
            <circle cx="150" cy="150" r="40" fill="#DBEAFE" opacity="0.6"/>
            <circle cx="700" cy="200" r="60" fill="#BFDBFE" opacity="0.4"/>
            <circle cx="650" cy="100" r="30" fill="#93C5FD" opacity="0.5"/>
            
            <rect x="250" y="120" width="300" height="200" rx="8" fill="#3B82F6" opacity="0.1"/>
            <rect x="270" y="140" width="260" height="8" rx="4" fill="#60A5FA" opacity="0.3"/>
            <rect x="270" y="160" width="200" height="8" rx="4" fill="#60A5FA" opacity="0.3"/>
            <rect x="270" y="180" width="240" height="8" rx="4" fill="#60A5FA" opacity="0.3"/>
            
            <rect x="280" y="220" width="100" height="60" rx="4" fill="#2563EB" opacity="0.2"/>
            
            <ellipse cx="450" cy="500" rx="120" ry="20" fill="#1E3A8A" opacity="0.1"/>
            
            <path d="M 350 350 Q 380 320 400 350 Q 420 380 450 350" stroke="#3B82F6" strokeWidth="3" fill="none" opacity="0.3"/>
            <path d="M 300 280 L 320 260 L 340 280" stroke="#2563EB" strokeWidth="2" fill="none" opacity="0.4"/>
            
            <g transform="translate(350, 280)">
              <rect x="0" y="0" width="100" height="140" rx="50" fill="#1E40AF"/>
              <rect x="10" y="10" width="80" height="120" rx="40" fill="#2563EB"/>
              
              <circle cx="35" cy="50" r="8" fill="#DBEAFE"/>
              <circle cx="65" cy="50" r="8" fill="#DBEAFE"/>
              
              <path d="M 30 75 Q 50 85 70 75" stroke="#DBEAFE" strokeWidth="3" fill="none" strokeLinecap="round"/>
              
              <rect x="-20" y="60" width="15" height="50" rx="7" fill="#1E40AF"/>
              <rect x="105" y="60" width="15" height="50" rx="7" fill="#1E40AF"/>
              
              <rect x="30" y="140" width="15" height="60" rx="7" fill="#1E40AF"/>
              <rect x="55" y="140" width="15" height="60" rx="7" fill="#1E40AF"/>
              
              <rect x="25" y="195" width="20" height="30" rx="10" fill="#1E3A8A"/>
              <rect x="55" y="195" width="20" height="30" rx="10" fill="#1E3A8A"/>
            </g>
            
            <rect x="420" y="200" width="80" height="60" rx="4" fill="#FFFFFF" opacity="0.9"/>
            <rect x="430" y="210" width="60" height="4" rx="2" fill="#3B82F6" opacity="0.5"/>
            <rect x="430" y="220" width="50" height="4" rx="2" fill="#3B82F6" opacity="0.5"/>
            <rect x="430" y="230" width="55" height="4" rx="2" fill="#3B82F6" opacity="0.5"/>
          </svg>
        </div>
      </div>
    </div>
  );
}
