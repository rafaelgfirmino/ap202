import { Route, Routes, Navigate } from 'react-router';
import { Layout14 } from '@/components/layouts/layout-14';
import { Layout14Page } from '@/pages/layout-14/page';
import { LoginPage } from '@/pages/login/page';
import { SignUpPage } from '@/pages/signup/page';
import { ForgotPasswordPage } from '@/pages/forgot-password/page';
import { CreateCondominiumPage } from '@/pages/create-condominium/page';
import { RequireAuth } from '@/auth/require-auth';
import { CondominiumDetailPage } from '@/pages/condominiums/detail/page';
import { CondominiumUnitGroupsCreatePage } from '@/pages/condominiums/unit-groups/create/page';
import { CondominiumUnitGroupsPage } from '@/pages/condominiums/unit-groups/page';
import { CondominiumUnitsCreatePage } from '@/pages/condominiums/units/create/page';
import { CondominiumUnitsPage } from '@/pages/condominiums/units/page';
import { CondominiumSelectPage } from '@/pages/condominiums/select/page';
import { CondominiumExpenseMonthsPage } from '@/pages/condominiums/expenses/months/page';
import { CondominiumExpensesPage } from '@/pages/condominiums/expenses/page';
import { CondominiumExpenseCreatePage } from '@/pages/condominiums/expenses/create/page';

export function AppRoutingSetup() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      <Route
        path="/create-condominium"
        element={
          <RequireAuth condominiumPolicy="forbid">
            <CreateCondominiumPage />
          </RequireAuth>
        }
      />

      <Route
        path="/select-condominium"
        element={
          <RequireAuth condominiumPolicy="skip">
            <CondominiumSelectPage />
          </RequireAuth>
        }
      />

      <Route
        element={
          <RequireAuth condominiumPolicy="require">
            <Layout14 />
          </RequireAuth>
        }
      >
        <Route path="/layout-14" element={<Layout14Page />} />
        <Route path="/condominiums" element={<Layout14Page />} />
        <Route path="/condominiums/:code" element={<CondominiumDetailPage />} />
        <Route path="/condominiums/:code/configuration" element={<CondominiumDetailPage />} />
        <Route path="/condominiums/:code/unit-groups" element={<CondominiumUnitGroupsPage />} />
        <Route path="/condominiums/:code/unit-groups/create" element={<CondominiumUnitGroupsCreatePage />} />
        <Route path="/condominiums/:code/unit-groups/:id/edit" element={<CondominiumUnitGroupsCreatePage />} />
        <Route path="/condominiums/:code/units" element={<CondominiumUnitsPage />} />
        <Route path="/condominiums/:code/units/create" element={<CondominiumUnitsCreatePage />} />
        <Route path="/condominiums/:code/expenses" element={<CondominiumExpenseMonthsPage />} />
        <Route path="/condominiums/:code/expenses/:month" element={<CondominiumExpensesPage />} />
        <Route path="/condominiums/:code/expenses/:month/create" element={<CondominiumExpenseCreatePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/layout-14" replace />} />
    </Routes>
  );
}
