import { Navigate, useRoutes } from 'react-router-dom';
import { APP_ROUTES, ROLES } from '@hrms/shared';
import { moduleRegistry } from '@/constants/module-registry';
import { PublicOnlyRoute } from '@/guards/PublicOnlyRoute';
import { ProtectedRoute } from '@/guards/ProtectedRoute';
import { SetupPasswordRoute } from '@/guards/SetupPasswordRoute';
import { AppShell } from '@/layouts/AppShell';
import { EmployeeDetailPage } from '@/pages/employees/EmployeeDetailPage';
import { EmployeeListPage } from '@/pages/employees/EmployeeListPage';
import { FirstTimePasswordPage } from '@/pages/auth/FirstTimePasswordPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { LeavePage } from '@/pages/leave/LeavePage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { OrgChartPage } from '@/pages/org-chart/OrgChartPage';
import { TeamViewPage } from '@/pages/org-chart/TeamViewPage';
import { PerformancePage } from '@/pages/performance/PerformancePage';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { ForbiddenPage } from '@/pages/common/ForbiddenPage';
import { ModulePlaceholderPage } from '@/pages/common/ModulePlaceholderPage';

const protectedChildren = [
  {
    index: true,
    element: <Navigate to={APP_ROUTES.DASHBOARD} replace />,
  },
  {
    path: APP_ROUTES.DASHBOARD.slice(1),
    element: <DashboardPage />,
  },
  {
    path: APP_ROUTES.PROFILE.slice(1),
    element: <ProfilePage />,
  },
  {
    path: APP_ROUTES.LEAVE.slice(1),
    element: <LeavePage />,
  },
  {
    path: APP_ROUTES.ORG_CHART.slice(1),
    element: <OrgChartPage />,
  },
  {
    path: APP_ROUTES.PERFORMANCE.slice(1),
    element: <PerformancePage />,
  },
  {
    path: APP_ROUTES.ORG_CHART_TEAM.slice(1),
    element: (
      <ProtectedRoute allowedRoles={[ROLES.MANAGER]}>
        <TeamViewPage />
      </ProtectedRoute>
    ),
  },
  {
    path: APP_ROUTES.EMPLOYEES.slice(1),
    element: (
      <ProtectedRoute allowedRoles={[ROLES.MANAGER]}>
        <EmployeeListPage />
      </ProtectedRoute>
    ),
  },
  {
    path: `${APP_ROUTES.EMPLOYEES.slice(1)}/:id`,
    element: (
      <ProtectedRoute allowedRoles={[ROLES.MANAGER]}>
        <EmployeeDetailPage />
      </ProtectedRoute>
    ),
  },
  ...moduleRegistry
    .filter((module) => module.placeholder)
    .map((module) => ({
      path: module.href.slice(1),
      element: (
        <ProtectedRoute allowedRoles={module.allowedRoles}>
          <ModulePlaceholderPage title={module.title} description={module.description} />
        </ProtectedRoute>
      ),
    })),
];

export function AppRouter() {
  return useRoutes([
    {
      path: APP_ROUTES.LOGIN,
      element: (
        <PublicOnlyRoute>
          <LoginPage />
        </PublicOnlyRoute>
      ),
    },
    {
      path: APP_ROUTES.FORGOT_PASSWORD,
      element: (
        <PublicOnlyRoute>
          <ForgotPasswordPage />
        </PublicOnlyRoute>
      ),
    },
    {
      path: APP_ROUTES.RESET_PASSWORD,
      element: <ResetPasswordPage />,
    },
    {
      path: APP_ROUTES.SETUP_PASSWORD,
      element: (
        <SetupPasswordRoute>
          <FirstTimePasswordPage />
        </SetupPasswordRoute>
      ),
    },
    {
      path: '/forbidden',
      element: <ForbiddenPage />,
    },
    {
      path: '/',
      element: (
        <ProtectedRoute>
          <AppShell />
        </ProtectedRoute>
      ),
      children: protectedChildren,
    },
    {
      path: '*',
      element: <Navigate to={APP_ROUTES.DASHBOARD} replace />,
    },
  ]);
}
