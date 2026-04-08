import { Navigate } from 'react-router-dom';
import { ScreenLoader } from '@/components/screen-loader';
import { useCondominiumContext } from '@/contexts/condominium-context';

export function Layout14Page() {
  const { isLoading, hasCondominium, activeCondominium } = useCondominiumContext();

  if (isLoading) {
    return <ScreenLoader />;
  }

  if (!hasCondominium) {
    return <Navigate to="/create-condominium" replace />;
  }

  if (!activeCondominium) {
    return <Navigate to="/select-condominium" replace />;
  }

  return <Navigate to={`/condominiums/${activeCondominium.code}`} replace />;
}
