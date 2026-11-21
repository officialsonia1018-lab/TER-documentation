import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Restricts a page to the Admin / TER / Accounts role.
// Non-admin users are redirected to the dashboard.

export default function AdminRoute({ children }) {
  const { isLoggedIn, currentRole } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (currentRole !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
