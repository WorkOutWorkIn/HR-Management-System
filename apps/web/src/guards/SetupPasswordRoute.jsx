import { Navigate } from 'react-router-dom';
import { APP_ROUTES } from '@hrms/shared';
import { PageLoader } from '@/components/common/PageLoader';
import { useAuth } from '@/hooks/useAuth';

export function SetupPasswordRoute({ children }) {
  const { isAuthenticated, isBootstrapping, user } = useAuth();

  if (isBootstrapping) {
    return <PageLoader label="Checking first-login access..." />;
  }

  if (!isAuthenticated) {
    return children;
  }

  if (!user?.mustChangePassword) {
    return <Navigate replace to={APP_ROUTES.PROFILE} />;
  }

  return children;
}
