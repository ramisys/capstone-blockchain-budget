import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { ProtectedRoute } from '../components/guards/ProtectedRoute';
import { PublicRoute } from '../components/guards/PublicRoute';
import { Login } from '../pages/Login';
import { Dashboard } from '../pages/Dashboard';
import { Profile } from '../pages/Profile';
import { Forbidden } from '../pages/Forbidden';
import { NotFound } from '../pages/NotFound';

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route path="/403" element={<Forbidden />} />
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<NotFound />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
