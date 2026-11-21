import { Link } from 'react-router-dom';
import { BookOpen, Info, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useModules } from '../context/ModuleContext.jsx';
import { getRoleById } from '../data/roles.js';
import RoleBadge from '../components/common/RoleBadge.jsx';
import Button from '../components/common/Button.jsx';

// Profile page: demo session user, role details and modules visible to the role.

export default function Profile() {
  const { currentUser, currentRole } = useAuth();
  const { modules } = useModules();
  const role = getRoleById(currentRole);

  const roleModules = modules.filter((module) => module.audience.includes(currentRole));
  const totalRules = modules.reduce((sum, module) => sum + (module.rules?.length || 0), 0);
  const totalSteps = modules.reduce((sum, module) => sum + (module.steps?.length || 0), 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>
        <p className="mt-1 text-sm text-slate-500">
          Administrator session details. Visitors do not have a profile - they read the portal
          without logging in.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex items-start gap-4">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-lg font-semibold text-white"
              aria-hidden="true"
            >
              {(currentUser?.name || 'Administrator')
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part.charAt(0).toUpperCase())
                .join('')}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-slate-900">
                {currentUser?.name || 'Administrator'}
              </h2>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
                <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                {currentUser?.email || 'demo@company.com'}
              </p>
              <div className="mt-2">
                <RoleBadge roleKey={currentRole} />
              </div>
            </div>
          </div>

          <dl className="mt-5 grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-slate-400">Modules visible to your role</dt>
              <dd className="mt-1 text-lg font-semibold text-slate-900">{roleModules.length}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Documented workflow steps</dt>
              <dd className="mt-1 text-lg font-semibold text-slate-900">{totalSteps}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Documented rules</dt>
              <dd className="mt-1 text-lg font-semibold text-slate-900">{totalRules}</dd>
            </div>
          </dl>

          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-medium text-slate-700">Role permissions in this portal</p>
            <p className="mt-1 text-xs text-slate-500">{role?.description}</p>
            {currentRole === 'admin' ? (
              <p className="mt-2 text-xs text-amber-700">
                As an administrator you can add, edit and delete cards. Changes are saved in this
                browser and are shown to every visitor.
              </p>
            ) : (
              <p className="mt-2 text-xs text-slate-500">
                Documentation cards are read only for visitors. Add, edit and delete actions are
                limited to the administrator.
              </p>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-indigo-900">
              <Info className="h-4 w-4" aria-hidden="true" />
              Shared session
            </p>
            <p className="mt-2 text-xs leading-relaxed text-indigo-800">
              Documentation cards and images are stored on the portal server, so every visitor sees
              the same content. Your admin session is kept in this browser tab.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              Documentation status
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {modules.length} modules are live in this portal.
            </p>
            <Link to="/dashboard" className="mt-3 inline-block">
              <Button size="sm" variant="secondary">
                <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                Browse modules
              </Button>
            </Link>
          </div>
        </aside>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">
          Modules for your role ({roleModules.length})
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {roleModules.map((module) => (
            <Link
              key={module.id}
              to={`/module/${module.id}`}
              className="rounded-lg border border-slate-200 p-3 transition-colors hover:border-indigo-300 hover:bg-indigo-50/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <p className="text-sm font-medium text-slate-800">{module.title}</p>
              <p className="mt-1 line-clamp-2 text-xs text-slate-500">{module.shortDescription}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
