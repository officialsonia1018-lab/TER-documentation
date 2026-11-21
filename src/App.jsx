import { useEffect } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import AdminRoute from './routes/AdminRoute.jsx';
import AppLayout from './components/layout/AppLayout.jsx';
import ToastMessage from './components/common/ToastMessage.jsx';
import EmptyState from './components/common/EmptyState.jsx';
import Button from './components/common/Button.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ModuleDetails from './pages/ModuleDetails.jsx';
import AddModule from './pages/AddModule.jsx';
import EditModule from './pages/EditModule.jsx';
import Profile from './pages/Profile.jsx';
import Help from './pages/Help.jsx';
import Database from './pages/Database.jsx';

// Scroll to the top whenever the route changes (documentation pages are long).
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
}

function NotFound() {
  return (
    <EmptyState
      icon={FileQuestion}
      title="Page not found"
      message="That route does not exist in the TER Documentation Portal."
      action={
        <Link to="/dashboard">
          <Button>Back to dashboard</Button>
        </Link>
      }
    />
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Admin login - the only route that shows a login form. */}
        <Route path="/login" element={<Login />} />

        {/* Everything below is public: anyone can open and read the documentation. */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/module/:id" element={<ModuleDetails />} />
          <Route path="/help" element={<Help />} />

          {/* Admin only: card management and the admin profile. */}
          <Route
            path="/add-module"
            element={
              <AdminRoute>
                <AddModule />
              </AdminRoute>
            }
          />
          <Route
            path="/edit-module/:id"
            element={
              <AdminRoute>
                <EditModule />
              </AdminRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <AdminRoute>
                <Profile />
              </AdminRoute>
            }
          />
          <Route
            path="/database"
            element={
              <AdminRoute>
                <Database />
              </AdminRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <ToastMessage />
    </>
  );
}
