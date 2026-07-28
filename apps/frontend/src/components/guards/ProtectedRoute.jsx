import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { PageSpinner } from '../ui/Spinner';

export function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, loading, initializing, user } = useAuth();
  const location = useLocation();

  if (initializing || loading) {
    return <PageSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && roles.length > 0 && user && !roles.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }

  return children;
}
