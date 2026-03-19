import type { FormEvent } from 'react';
import { useState } from 'react';
import { useSignUp } from '@clerk/react-router/legacy';
import { Link, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardHeading,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function SignUpPage() {
  const navigate = useNavigate();
  const { isLoaded, signUp, setActive } = useSignUp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();

    if (!isLoaded) return;

    setSubmitting(true);
    setError(null);

    try {
      await signUp.create({
        emailAddress: email,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: unknown) {
      const extracted =
        typeof err === 'object' &&
        err !== null &&
        'errors' in err &&
        Array.isArray((err as { errors?: Array<{ longMessage?: string }> }).errors)
          ? (err as { errors: Array<{ longMessage?: string }> }).errors[0]?.longMessage
          : undefined;

      setError(extracted || 'Falha ao criar conta.');
    } finally {
      setSubmitting(false);
    }
  }

  async function onVerify(e: FormEvent) {
    e.preventDefault();

    if (!isLoaded) return;

    setSubmitting(true);
    setError(null);

    try {
      const result = await signUp.attemptEmailAddressVerification({ code });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        navigate('/layout-14', { replace: true });
        return;
      }

      setError('Não foi possível verificar o código.');
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
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardHeading>
              <CardTitle>Criar conta</CardTitle>
              <CardDescription>Crie sua conta para continuar</CardDescription>
            </CardHeading>
          </CardHeader>
          <CardContent>
            {!pendingVerification ? (
              <form className="space-y-4" onSubmit={onSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                {error && <div className="text-sm text-destructive">{error}</div>}

                <Button type="submit" className="w-full" disabled={!isLoaded || submitting}>
                  Criar conta
                </Button>

                <div className="text-sm text-muted-foreground">
                  Já tem conta?{' '}
                  <Link to="/login" className="text-primary hover:underline">
                    Entrar
                  </Link>
                </div>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={onVerify}>
                <div className="space-y-2">
                  <Label htmlFor="code">Código</Label>
                  <Input
                    id="code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                  />
                </div>

                {error && <div className="text-sm text-destructive">{error}</div>}

                <Button type="submit" className="w-full" disabled={!isLoaded || submitting}>
                  Verificar
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
