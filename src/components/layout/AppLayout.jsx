import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

// Main layout.
// - Public visitors: full-width documentation, no sidebar, no login/logout UI.
// - Admin (logged in at /login): sidebar appears with add / edit / delete authority.

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100">
      {isAdmin ? <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} /> : null}

      <div className={`flex min-h-screen flex-col ${isAdmin ? 'lg:pl-64' : ''}`}>
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>

        <footer className="border-t border-slate-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
          <p className="text-xs text-slate-400">
            TER Documentation Portal - documentation and training companion for the Travel &amp;
            Expense Reimbursement application.
          </p>
        </footer>
      </div>
    </div>
  );
}
