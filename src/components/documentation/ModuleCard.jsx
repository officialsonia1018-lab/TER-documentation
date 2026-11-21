import { Link } from 'react-router-dom';
import { ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { IconResolver } from '../common/IconResolver.jsx';
import Badge from '../common/Badge.jsx';
import RoleBadge from '../common/RoleBadge.jsx';
import Button from '../common/Button.jsx';

// Every module links to the official TER app on Google Play.
export const DEMO_LINK_LABEL = 'Open TER App';
export const NO_URL_MESSAGE = 'TER app link is not configured for this module.';

export default function ModuleCard({ module, onEdit, onDelete }) {
  return (
    <article className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
          <IconResolver name={module.icon} className="h-6 w-6" />
        </div>
        <Badge color={module.status === 'Important' ? 'amber' : 'slate'}>{module.status}</Badge>
      </div>

      <h3 className="mt-4 text-base font-semibold text-slate-900">{module.title}</h3>
      <p className="mt-1 line-clamp-2 text-sm text-slate-500">{module.shortDescription}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge color="indigo">{module.category}</Badge>
        {module.audience.slice(0, 2).map((audienceKey) => (
          <RoleBadge key={audienceKey} roleKey={audienceKey} />
        ))}
        {module.audience.length > 2 ? (
          <Badge color="slate">+{module.audience.length - 2} more</Badge>
        ) : null}
      </div>

      <div className="mt-auto pt-4">
        {module.liveUrl ? (
          <a
            href={module.liveUrl}
            target="_blank"
            rel="noreferrer"
            title="Open the TER app on Google Play"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition-colors hover:border-indigo-300 hover:bg-indigo-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            {DEMO_LINK_LABEL}
          </a>
        ) : (
          <p className="text-xs text-slate-400">{NO_URL_MESSAGE}</p>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
        <Link to={`/module/${module.id}`}>
          <Button size="sm">View Details</Button>
        </Link>
        {onEdit ? (
          <Button size="sm" variant="secondary" onClick={() => onEdit(module)}>
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            Edit
          </Button>
        ) : null}
        {onDelete ? (
          <Button size="sm" variant="danger" onClick={() => onDelete(module)}>
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Delete
          </Button>
        ) : null}
      </div>
    </article>
  );
}
