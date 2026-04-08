import { useCondominiumContext } from '@/contexts/condominium-context';

interface CondominiumCheckResult {
  isLoading: boolean;
  hasCondominium: boolean;
  condominiumsCount: number;
  hasActiveCondominium: boolean;
  error: string | null;
}

export function useCondominiumCheck(): CondominiumCheckResult {
  const { isLoading, hasCondominium, condominiums, hasActiveCondominium, error } = useCondominiumContext();

  return { isLoading, hasCondominium, condominiumsCount: condominiums.length, hasActiveCondominium, error };
}
