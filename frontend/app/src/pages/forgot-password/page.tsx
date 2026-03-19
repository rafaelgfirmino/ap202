import type { FormEvent } from 'react';
import { useState } from 'react';
import { useSignIn } from '@clerk/react-router/legacy';
import { Link, useNavigate } from 'react-router-dom';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { isLoaded, signIn, setActive } = useSignIn();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'email' | 'reset'>('email');

  async function onRequestReset(e: FormEvent) {
    e.preventDefault();

    if (!isLoaded) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      });

      setSuccess('Código de verificação enviado para seu e-mail!');
      setStep('reset');
    } catch (err: unknown) {
      const extracted =
        typeof err === 'object' &&
        err !== null &&
        'errors' in err &&
        Array.isArray((err as { errors?: Array<{ longMessage?: string }> }).errors)
          ? (err as { errors: Array<{ longMessage?: string }> }).errors[0]?.longMessage
          : undefined;

      setError(extracted || 'Falha ao enviar código. Verifique o e-mail informado.');
    } finally {
      setSubmitting(false);
    }
  }

  async function onResetPassword(e: FormEvent) {
    e.preventDefault();

    if (!isLoaded || !signIn) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password: newPassword,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        setSuccess('Senha redefinida com sucesso! Redirecionando...');
        setTimeout(() => {
          navigate('/layout-14', { replace: true });
        }, 1500);
        return;
      }

      setError('Não foi possível redefinir a senha.');
    } catch (err: unknown) {
      const extracted =
        typeof err === 'object' &&
        err !== null &&
        'errors' in err &&
        Array.isArray((err as { errors?: Array<{ longMessage?: string }> }).errors)
          ? (err as { errors: Array<{ longMessage?: string }> }).errors[0]?.longMessage
          : undefined;

      setError(extracted || 'Falha ao redefinir senha. Verifique o código e tente novamente.');
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
          <div className="mb-8">
            <Link 
              to="/login" 
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para login
            </Link>
            
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              {step === 'email' ? 'Recuperar senha' : 'Redefinir senha'}
            </h1>
            <p className="text-sm text-gray-600">
              {step === 'email' 
                ? 'Digite seu e-mail para receber o código de recuperação'
                : 'Digite o código recebido e sua nova senha'
              }
            </p>
          </div>

          {step === 'email' ? (
            <form className="space-y-5" onSubmit={onRequestReset}>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm text-gray-700">
                  E-mail:
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

              {error && <div className="text-sm text-red-600">{error}</div>}
              {success && <div className="text-sm text-green-600">{success}</div>}

              <Button 
                type="submit" 
                className="w-full bg-indigo-900 hover:bg-indigo-800 text-white font-medium py-6 text-base"
                disabled={!isLoaded || submitting}
              >
                {submitting ? 'Enviando...' : 'Enviar código'}
              </Button>
            </form>
          ) : (
            <form className="space-y-5" onSubmit={onResetPassword}>
              <div className="space-y-2">
                <Label htmlFor="code" className="text-sm text-gray-700">
                  Código de verificação:
                </Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="bg-blue-50 border-blue-100 focus:border-blue-300 focus:ring-blue-300"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm text-gray-700">
                  Nova senha:
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-blue-50 border-blue-100 focus:border-blue-300 focus:ring-blue-300"
                  required
                />
              </div>

              {error && <div className="text-sm text-red-600">{error}</div>}
              {success && <div className="text-sm text-green-600">{success}</div>}

              <Button 
                type="submit" 
                className="w-full bg-indigo-900 hover:bg-indigo-800 text-white font-medium py-6 text-base"
                disabled={!isLoaded || submitting}
              >
                {submitting ? 'Redefinindo...' : 'Redefinir senha'}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setCode('');
                  setNewPassword('');
                  setError(null);
                  setSuccess(null);
                }}
                className="w-full text-sm text-gray-600 hover:text-gray-900"
              >
                Não recebeu o código? Enviar novamente
              </button>
            </form>
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
            
            <rect x="300" y="200" width="200" height="200" rx="8" fill="#3B82F6" opacity="0.1"/>
            
            <g transform="translate(350, 250)">
              <circle cx="50" cy="50" r="40" fill="#2563EB" opacity="0.2"/>
              <path d="M 50 30 L 50 50 L 65 50" stroke="#1E40AF" strokeWidth="4" strokeLinecap="round" fill="none"/>
              <circle cx="50" cy="50" r="35" stroke="#2563EB" strokeWidth="3" fill="none"/>
            </g>
            
            <path d="M 320 350 Q 350 320 380 350" stroke="#3B82F6" strokeWidth="2" fill="none" opacity="0.3"/>
            <path d="M 420 350 Q 450 320 480 350" stroke="#3B82F6" strokeWidth="2" fill="none" opacity="0.3"/>
          </svg>
        </div>
      </div>
    </div>
  );
}
