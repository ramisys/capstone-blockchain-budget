import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { PageSpinner } from '../ui/Spinner';

export function PublicRoute({ children }) {
  const { isAuthenticated, initializing } = useAuth();

  if (initializing) {
    return <PageSpinner />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
