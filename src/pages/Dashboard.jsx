import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  BookOpen,
  Building2,
  ClipboardList,
  Plus,
  ShieldCheck,
  Users,
  Workflow,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useModules } from '../context/ModuleContext.jsx';
import { MODULE_CATEGORIES } from '../data/terModules.js';
import { CLAIM_LIFECYCLE } from '../data/workflows.js';
import SearchBar from '../components/common/SearchBar.jsx';
import FilterBar from '../components/common/FilterBar.jsx';
import StatCard from '../components/common/StatCard.jsx';
import Button from '../components/common/Button.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import ModuleGrid from '../components/documentation/ModuleGrid.jsx';

export default function Dashboard() {
  const { currentRole } = useAuth();
  const { modules, deleteModule, showToast } = useModules();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [pendingDelete, setPendingDelete] = useState(null);

  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const audience = searchParams.get('audience') || '';
  const isAdmin = currentRole === 'admin';

  const updateParams = (changes) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => {
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
    });
    setSearchParams(next, { replace: true });
  };

  const stats = useMemo(() => {
    const total = modules.length;
    const employeeModules = modules.filter((m) => m.audience.includes('employee')).length;
    const supervisorModules = modules.filter(
      (m) => m.audience.includes('supervisor-l1') || m.audience.includes('supervisor-l2')
    ).length;
    const adminModules = modules.filter((m) => m.audience.includes('admin')).length;
    const workflowSteps = modules.reduce((sum, m) => sum + (m.workflow?.length || 0), 0);
    const importantRules = modules.reduce((sum, m) => sum + (m.rules?.length || 0), 0);
    return { total, employeeModules, supervisorModules, adminModules, workflowSteps, importantRules };
  }, [modules]);

  const filteredModules = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return modules.filter((module) => {
      const matchesQuery =
        !needle ||
        `${module.title} ${module.shortDescription} ${module.summary} ${module.category}`
          .toLowerCase()
          .includes(needle);
      const matchesCategory = !category || module.category === category;
      const matchesAudience = !audience || module.audience.includes(audience);
      return matchesQuery && matchesCategory && matchesAudience;
    });
  }, [modules, query, category, audience]);

  const importantModules = useMemo(
    () => modules.filter((module) => module.status === 'Important').slice(0, 4),
    [modules]
  );

  const handleDeleteConfirm = () => {
    if (!pendingDelete) {
      return;
    }
    deleteModule(pendingDelete.id);
    showToast(`"${pendingDelete.title}" deleted`, 'success');
    setPendingDelete(null);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">TER App Documentation Portal</h1>
          <p className="mt-1 text-sm text-slate-500">
            Learn the complete travel, expense, approval and reimbursement process.
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Open any card to read the full steps, business rules and status flow.
          </p>
        </div>

        {isAdmin ? (
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <Button onClick={() => navigate('/add-module')}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Card
            </Button>
            <p className="max-w-xs text-xs text-slate-500">
              Admin mode: use Add Card or Edit to add content sections, each with an optional image
              after the text. Changes are saved on the portal server and visible to every visitor.
            </p>
          </div>
        ) : null}
      </header>

      <section aria-label="Dashboard statistics" className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={BookOpen} label="Total Modules" value={stats.total} accent="indigo" />
        <StatCard icon={Users} label="Employee Modules" value={stats.employeeModules} accent="blue" />
        <StatCard icon={ShieldCheck} label="Supervisor Modules" value={stats.supervisorModules} accent="purple" />
        <StatCard icon={Building2} label="Admin Modules" value={stats.adminModules} accent="emerald" />
        <StatCard icon={Workflow} label="Workflow Steps" value={stats.workflowSteps} accent="amber" />
        <StatCard icon={ClipboardList} label="Important Rules" value={stats.importantRules} accent="red" />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Quick workflow - TER claim lifecycle</h2>
        <ol className="mt-3 flex flex-wrap gap-2">
          {CLAIM_LIFECYCLE.map((step, index) => (
            <li
              key={step.label}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
              title={step.detail}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                {index + 1}
              </span>
              <span className="text-xs font-medium text-slate-700">{step.label}</span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-slate-400">
          Hover a step to see what happens at that stage. Every claim starts at Supervisor L1.
        </p>
      </section>

      {importantModules.length > 0 ? (
        <section aria-label="Important modules">
          <h2 className="text-sm font-semibold text-slate-900">Important modules</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {importantModules.map((module) => (
              <button
                key={module.id}
                type="button"
                onClick={() => navigate(`/module/${module.id}`)}
                className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-left transition-colors hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                <p className="text-sm font-medium text-amber-900">{module.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-amber-800">{module.shortDescription}</p>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section aria-label="Documentation modules" className="space-y-4">
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-end lg:justify-between">
          <div className="w-full lg:max-w-sm">
            <SearchBar
              value={query}
              onChange={(value) => updateParams({ q: value })}
              placeholder="Search modules by title, category or summary..."
            />
          </div>
          <FilterBar
            categories={MODULE_CATEGORIES}
            selectedCategory={category}
            onCategoryChange={(value) => updateParams({ category: value })}
            selectedAudience={audience}
            onAudienceChange={(value) => updateParams({ audience: value })}
            onReset={() => setSearchParams({}, { replace: true })}
          />
        </div>

        <p className="text-xs text-slate-500">
          Showing {filteredModules.length} of {modules.length} modules
          {category ? ` in ${category}` : ''}
          {audience ? ` for the selected role` : ''}.
        </p>

        <ModuleGrid
          modules={filteredModules}
          onEdit={isAdmin ? (module) => navigate(`/edit-module/${module.id}`) : undefined}
          onDelete={isAdmin ? (module) => setPendingDelete(module) : undefined}
        />
      </section>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete documentation card"
        message={
          pendingDelete
            ? `Delete "${pendingDelete.title}"? It will be removed for every visitor using this portal.`
            : ''
        }
        confirmLabel="Delete card"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
