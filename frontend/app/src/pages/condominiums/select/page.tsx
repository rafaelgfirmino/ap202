import { Building2, ChevronRight } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScreenLoader } from '@/components/screen-loader';
import { useCondominiumContext } from '@/contexts/condominium-context';

export function CondominiumSelectPage() {
  const navigate = useNavigate();
  const { isLoading, condominiums, hasCondominium, activeCondominium, selectCondominium } = useCondominiumContext();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!hasCondominium) {
      navigate('/create-condominium', { replace: true });
      return;
    }

    if (activeCondominium) {
      navigate(`/condominiums/${activeCondominium.code}`, { replace: true });
    }
  }, [activeCondominium, hasCondominium, isLoading, navigate]);

  if (isLoading) {
    return <ScreenLoader />;
  }

  if (!hasCondominium || activeCondominium) {
    return null;
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-12rem)] w-full max-w-4xl flex-col justify-center gap-8">
      <div className="space-y-3 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Building2 className="size-7" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Escolha o condomínio</h1>
        <p className="mx-auto max-w-2xl text-sm text-muted-foreground">
          Seu acesso possui mais de um condomínio vinculado. Selecione qual condomínio deseja abrir nesta sessão.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {condominiums.map((condominium) => (
          <Card key={condominium.code} className="border-border/80 transition-colors hover:border-primary/40">
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3">
                <span className="truncate">{condominium.name}</span>
                <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
                  {condominium.code}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Entrar neste condomínio e atualizar o menu lateral com o contexto selecionado.
              </p>
              <Button
                variant="primary"
                className="w-full"
                onClick={() => {
                  selectCondominium(condominium.code);
                  navigate(`/condominiums/${condominium.code}`, { replace: true });
                }}
              >
                Acessar condomínio
                <ChevronRight />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
