import { NavLink } from 'react-router-dom';
import { BookOpen, Database, HelpCircle, LayoutDashboard, Plus, UserCircle, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getRoleById } from '../../data/roles.js';
import RoleBadge from '../common/RoleBadge.jsx';

// Admin-only navigation sidebar. Public visitors never see this.

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/add-module', label: 'Add module', icon: Plus },
  { to: '/database', label: 'Database', icon: Database },
  { to: '/profile', label: 'Profile', icon: UserCircle },
  { to: '/help', label: 'Help', icon: HelpCircle },
];

export default function Sidebar({ open, onClose }) {
  const { currentUser, currentRole } = useAuth();
  const role = getRoleById(currentRole);

  return (
    <>
      {open ? (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      ) : null}

      <aside
        aria-label="Main navigation"
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-navy-900 transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-navy-800 px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600">
              <BookOpen className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">TER Portal</p>
              <p className="text-xs text-navy-200">Documentation</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="rounded-lg p-1 text-navy-200 hover:bg-navy-800 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 lg:hidden"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-navy-100 hover:bg-navy-800 hover:text-white'
                }`
              }
            >
              <item.icon className="h-5 w-5" aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-navy-800 px-4 py-4">
          <p className="truncate text-sm font-medium text-white">{currentUser?.name || 'Administrator'}</p>
          <p className="truncate text-xs text-navy-200">{currentUser?.email || ''}</p>
          <div className="mt-2">
            <RoleBadge roleKey={currentRole} />
          </div>
          <p className="mt-3 text-xs leading-relaxed text-navy-200">
            {role ? role.description : ''}
          </p>
          <p className="mt-3 rounded-lg bg-navy-800 px-3 py-2 text-xs leading-relaxed text-navy-100">
            Admin mode: you can add, edit and delete documentation cards. Visitors see the same
            portal without the sidebar and without these actions.
          </p>
        </div>
      </aside>
    </>
  );
}
