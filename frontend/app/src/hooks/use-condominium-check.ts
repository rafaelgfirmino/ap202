import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/react-router';

interface CondominiumCheckResult {
  isLoading: boolean;
  hasCondominium: boolean;
  error: string | null;
}

export function useCondominiumCheck(): CondominiumCheckResult {
  const { isLoaded, getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [hasCondominium, setHasCondominium] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkCondominium() {
      if (!isLoaded) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const token = await getToken();
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/me/condominiums`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Erro ao verificar vínculo com condomínio');
        }

        const data = await response.json();
        setHasCondominium(data && data.length > 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        setHasCondominium(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkCondominium();
  }, [isLoaded, getToken]);

  return { isLoading, hasCondominium, error };
}
