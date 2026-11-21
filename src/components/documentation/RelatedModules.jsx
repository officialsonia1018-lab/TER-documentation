import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { IconResolver } from '../common/IconResolver.jsx';

// Related modules navigation shown at the bottom of the detail page.

export default function RelatedModules({ modules }) {
  if (!modules || modules.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h3 className="text-base font-semibold text-slate-900">Related modules</h3>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {modules.map((module) => (
          <Link
            key={module.id}
            to={`/module/${module.id}`}
            className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 transition-colors hover:border-indigo-300 hover:bg-indigo-50/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <IconResolver name={module.icon} className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-slate-800">
                {module.title}
              </span>
              <span className="block truncate text-xs text-slate-400">{module.category}</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </div>
  );
}
