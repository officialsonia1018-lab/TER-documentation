import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, ExternalLink, LogOut, Menu, Search } from 'lucide-react';
import { TER_APP_URL } from '../../data/appLinks.js';
import { useAuth } from '../../context/AuthContext.jsx';
import RoleBadge from '../common/RoleBadge.jsx';

// Top header.
// Public visitors (no login): brand + search only - no account, logout or role UI.
// Admin: menu button for the sidebar, account details, role badge and logout.

function initials(name) {
  if (!name) {
    return 'A';
  }
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export default function Header({ onMenuClick }) {
  const { currentUser, currentRole, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const handleSearch = (event) => {
    event.preventDefault();
    const trimmed = query.trim();
    navigate(trimmed ? `/dashboard?q=${encodeURIComponent(trimmed)}` : '/dashboard');
  };

  const handleLogout = () => {
    logout();
    navigate('/dashboard', { replace: true });
  };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        {isAdmin ? (
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open navigation"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 lg:hidden"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
        ) : (
          <Link to="/dashboard" className="flex shrink-0 items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600">
              <BookOpen className="h-5 w-5 text-white" aria-hidden="true" />
            </span>
            <span className="hidden sm:block">
              <span className="block text-sm font-semibold leading-tight text-slate-900">
                TER Portal
              </span>
              <span className="block text-[11px] leading-tight text-slate-400">Documentation</span>
            </span>
          </Link>
        )}

        <form onSubmit={handleSearch} className="ml-auto w-full max-w-md" role="search">
          <label htmlFor="header-search" className="sr-only">
            Search documentation modules
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              id="header-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search documentation modules..."
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pr-3 pl-9 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </form>

        {!isAdmin ? (
          <a
            href={TER_APP_URL}
            target="_blank"
            rel="noreferrer"
            className="hidden shrink-0 items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:inline-flex"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            Open TER App
          </a>
        ) : null}

        {isAdmin ? (
          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-800">{currentUser?.name || 'Administrator'}</p>
              <p className="text-xs text-slate-400">{currentUser?.email || ''}</p>
            </div>

            <div
              className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white"
              aria-hidden="true"
              title={currentUser?.name || 'Administrator'}
            >
              {initials(currentUser?.name)}
            </div>

            <div className="hidden sm:block">
              <RoleBadge roleKey={currentRole} />
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              title="Exit admin mode"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
