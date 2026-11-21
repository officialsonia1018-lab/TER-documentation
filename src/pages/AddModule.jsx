import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, PlusCircle } from 'lucide-react';
import { useModules } from '../context/ModuleContext.jsx';
import ModuleForm from '../components/modules/ModuleForm.jsx';

// Admin-only page: create a new documentation card.

export default function AddModule() {
  const { addModule, showToast } = useModules();
  const navigate = useNavigate();

  const handleSubmit = (payload) => {
    const created = addModule(payload);
    showToast(`"${created.title}" added`, 'success');
    navigate(`/module/${created.id}`);
  };

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1 text-xs text-slate-500">
          <li>
            <Link to="/dashboard" className="hover:text-indigo-600 hover:underline">
              Home
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight className="h-3 w-3" />
          </li>
          <li aria-current="page" className="font-medium text-slate-700">
            Add Card
          </li>
        </ol>
      </nav>

      <header className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <PlusCircle className="h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Add documentation card</h1>
          <p className="text-sm text-slate-500">
            Create a new TER documentation module. It becomes visible to every visitor once saved.
          </p>
        </div>
      </header>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <ModuleForm
          submitLabel="Add card"
          onSubmit={handleSubmit}
          onCancel={() => navigate('/dashboard')}
        />
      </div>
    </div>
  );
}
