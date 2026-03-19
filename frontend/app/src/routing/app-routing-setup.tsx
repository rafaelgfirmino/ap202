import { Route, Routes, Navigate } from 'react-router';
import { Layout14 } from '@/components/layouts/layout-14';
import { Layout14Page } from '@/pages/layout-14/page';
import { LoginPage } from '@/pages/login/page';
import { SignUpPage } from '@/pages/signup/page';
import { ForgotPasswordPage } from '@/pages/forgot-password/page';
import { RequireAuth } from '@/auth/require-auth';

export function AppRoutingSetup() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      <Route
        element={
          <RequireAuth>
            <Layout14 />
          </RequireAuth>
        }
      >
        <Route path="/layout-14" element={<Layout14Page />} />
      </Route>
      <Route path="*" element={<Navigate to="/layout-14" replace />} />
    </Routes>
  );
}
