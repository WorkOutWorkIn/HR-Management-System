import { Navigate } from 'react-router-dom';
import { APP_ROUTES } from '@hrms/shared';
import { PageLoader } from '@/components/common/PageLoader';
import { useAuth } from '@/hooks/useAuth';

export function PublicOnlyRoute({ children }) {
  const { isAuthenticated, isBootstrapping, user } = useAuth();

  if (isBootstrapping) {
    return <PageLoader label="Checking session..." />;
  }

  if (isAuthenticated) {
    return (
      <Navigate
        replace
        to={user?.mustChangePassword ? APP_ROUTES.SETUP_PASSWORD : APP_ROUTES.PROFILE}
      />
    );
  }

  return children;
}
