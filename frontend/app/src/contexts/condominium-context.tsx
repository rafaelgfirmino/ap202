import type { PropsWithChildren } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@clerk/react-router';

export type UserCondominium = {
  id: number;
  code: string;
  name: string;
};

type CondominiumContextValue = {
  condominiums: UserCondominium[];
  hasCondominium: boolean;
  activeCondominium: UserCondominium | null;
  hasActiveCondominium: boolean;
  isLoading: boolean;
  error: string | null;
  selectCondominium: (code: string) => void;
  clearSelection: () => void;
};

const STORAGE_KEY = 'ap202.active_condominium_code';

const CondominiumContext = createContext<CondominiumContextValue | undefined>(undefined);

export function CondominiumProvider({ children }: PropsWithChildren) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [condominiums, setCondominiums] = useState<UserCondominium[]>([]);
  const [activeCode, setActiveCode] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    setActiveCode(window.localStorage.getItem(STORAGE_KEY));
  }, []);

  useEffect(() => {
    async function loadCondominiums() {
      if (!isLoaded) {
        return;
      }

      if (!isSignedIn) {
        setCondominiums([]);
        setError(null);
        setIsLoading(false);
        setActiveCode(null);
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(STORAGE_KEY);
        }
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const token = await getToken();
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/me/condominiums`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (!response.ok) {
          throw new Error('Erro ao carregar condominios');
        }

        const data = (await response.json()) as UserCondominium[];
        setCondominiums(data);

        setActiveCode((current) => {
          const storedCode =
            current ?? (typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null);

          if (!data.length) {
            if (typeof window !== 'undefined') {
              window.localStorage.removeItem(STORAGE_KEY);
            }
            return null;
          }

          if (data.length === 1) {
            const nextCode = data[0].code;
            if (typeof window !== 'undefined') {
              window.localStorage.setItem(STORAGE_KEY, nextCode);
            }
            return nextCode;
          }

          const existing = data.find((item) => item.code === storedCode);
          if (existing) {
            if (typeof window !== 'undefined') {
              window.localStorage.setItem(STORAGE_KEY, existing.code);
            }
            return existing.code;
          }

          if (typeof window !== 'undefined') {
            window.localStorage.removeItem(STORAGE_KEY);
          }
          return null;
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        setCondominiums([]);
      } finally {
        setIsLoading(false);
      }
    }

    void loadCondominiums();
  }, [getToken, isLoaded, isSignedIn]);

  const activeCondominium = condominiums.find((item) => item.code === activeCode) ?? null;

  const value: CondominiumContextValue = {
    condominiums,
    hasCondominium: condominiums.length > 0,
    activeCondominium,
    hasActiveCondominium: activeCondominium !== null,
    isLoading,
    error,
    selectCondominium: (code: string) => {
      setActiveCode(code);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, code);
      }
    },
    clearSelection: () => {
      setActiveCode(null);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    },
  };

  return <CondominiumContext.Provider value={value}>{children}</CondominiumContext.Provider>;
}

export function useCondominiumContext() {
  const context = useContext(CondominiumContext);

  if (!context) {
    throw new Error('useCondominiumContext must be used within CondominiumProvider');
  }

  return context;
}
