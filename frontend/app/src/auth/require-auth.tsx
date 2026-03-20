import type { PropsWithChildren } from 'react';
import { useAuth } from '@clerk/react-router';
import { Navigate, useLocation } from 'react-router-dom';
import { useCondominiumCheck } from '@/hooks/use-condominium-check';
import { ScreenLoader } from '@/components/screen-loader';

interface RequireAuthProps extends PropsWithChildren {
  condominiumPolicy?: 'require' | 'skip' | 'forbid';
}

export function RequireAuth({ children, condominiumPolicy = 'require' }: RequireAuthProps) {
  const location = useLocation();
  const { isLoaded, isSignedIn } = useAuth();
  const { isLoading: checkingCondominium, hasCondominium } = useCondominiumCheck();

  if (!isLoaded) {
    return <ScreenLoader />;
  }

  if (!isSignedIn) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (condominiumPolicy !== 'skip') {
    if (checkingCondominium) {
      return <ScreenLoader />;
    }

    if (condominiumPolicy === 'require' && !hasCondominium) {
      return <Navigate to="/create-condominium" replace />;
    }

    if (condominiumPolicy === 'forbid' && hasCondominium) {
      return <Navigate to="/layout-14" replace />;
    }
  }

  return <>{children}</>;
}
