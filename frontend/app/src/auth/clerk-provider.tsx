import { ClerkProvider } from '@clerk/react-router';
import type { PropsWithChildren } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardHeading, CardTitle } from '@/components/ui/card';

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export function ClerkProviderWithRouter({ children }: PropsWithChildren) {
  const navigate = useNavigate();

  if (!publishableKey) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <Card>
            <CardHeader>
              <CardHeading>
                <CardTitle>Configuração do Clerk ausente</CardTitle>
              </CardHeading>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Defina a variável de ambiente <code className="font-mono">VITE_CLERK_PUBLISHABLE_KEY</code> e reinicie o
                servidor.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      routerPush={(to: string) => navigate(to)}
      routerReplace={(to: string) => navigate(to, { replace: true })}
    >
      {children}
    </ClerkProvider>
  );
}
