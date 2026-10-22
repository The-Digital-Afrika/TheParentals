import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function RequireRole({ roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <p role="status">Loading your account…</p>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  const role = String(user.role || '').toUpperCase();
  if (roles && !roles.includes(role)) return <Navigate to={role === 'ADMIN' ? '/admin-dashboard' : role === 'PROVIDER' ? '/provider-dashboard' : '/client-dashboard'} replace />;
  return children;
}
