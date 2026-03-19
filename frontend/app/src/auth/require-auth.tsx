import type { PropsWithChildren } from 'react';
import { useAuth } from '@clerk/react-router';
import { Navigate, useLocation } from 'react-router-dom';

export function RequireAuth({ children }: PropsWithChildren) {
  const location = useLocation();
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
