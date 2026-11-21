import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, PencilLine } from 'lucide-react';
import { useModules } from '../context/ModuleContext.jsx';
import ModuleForm from '../components/modules/ModuleForm.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import Button from '../components/common/Button.jsx';

// Admin-only page: edit an existing documentation card.

export default function EditModule() {
  const { id } = useParams();
  const { modules, updateModule, showToast, ready } = useModules();
  const navigate = useNavigate();

  const module = modules.find((item) => item.id === id);

  if (!ready) {
    return (
      <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Loading documentation...
      </p>
    );
  }

  if (!module) {
    return (
      <EmptyState
        icon={PencilLine}
        title="Module not found"
        message="This documentation module does not exist, or it was deleted."
        action={
          <Link to="/dashboard">
            <Button>Back to dashboard</Button>
          </Link>
        }
      />
    );
  }

  const handleSubmit = (payload) => {
    updateModule(module.id, payload);
    showToast(`"${payload.title}" updated`, 'success');
    navigate(`/module/${module.id}`);
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
          <li>
            <Link to={`/module/${module.id}`} className="hover:text-indigo-600 hover:underline">
              {module.title}
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight className="h-3 w-3" />
          </li>
          <li aria-current="page" className="font-medium text-slate-700">
            Edit Card
          </li>
        </ol>
      </nav>

      <header className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <PencilLine className="h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Edit documentation card</h1>
          <p className="text-sm text-slate-500">
            Updating &quot;{module.title}&quot;. Changes are visible to every visitor.
          </p>
        </div>
      </header>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <ModuleForm
          initialValues={module}
          submitLabel="Save changes"
          onSubmit={handleSubmit}
          onCancel={() => navigate(`/module/${module.id}`)}
        />
      </div>
    </div>
  );
}
