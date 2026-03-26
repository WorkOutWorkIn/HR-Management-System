import { Navigate, useLocation } from 'react-router-dom';
import { APP_ROUTES, hasAnyRole } from '@hrms/shared';
import { PageLoader } from '@/components/common/PageLoader';
import { useAuth } from '@/hooks/useAuth';

export function ProtectedRoute({
  allowedRoles,
  allowPendingPasswordChange = false,
  pendingPasswordChangeOnly = false,
  children,
}) {
  const location = useLocation();
  const { isAuthenticated, isBootstrapping, user } = useAuth();

  if (isBootstrapping) {
    return <PageLoader label="Restoring session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to={APP_ROUTES.LOGIN} />;
  }

  if (user?.mustChangePassword && !allowPendingPasswordChange) {
    return <Navigate replace state={{ from: location }} to={APP_ROUTES.SETUP_PASSWORD} />;
  }

  if (pendingPasswordChangeOnly && !user?.mustChangePassword) {
    return <Navigate replace to={APP_ROUTES.PROFILE} />;
  }

  if (allowedRoles?.length && !hasAnyRole(user?.role, allowedRoles)) {
    return <Navigate replace to="/forbidden" />;
  }

  return children;
}
