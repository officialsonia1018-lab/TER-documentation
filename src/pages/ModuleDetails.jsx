import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronRight,
  ExternalLink,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useModules } from '../context/ModuleContext.jsx';
import { IconResolver } from '../components/common/IconResolver.jsx';
import Badge from '../components/common/Badge.jsx';
import RoleBadge from '../components/common/RoleBadge.jsx';
import Button from '../components/common/Button.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import { DEMO_LINK_LABEL, NO_URL_MESSAGE } from '../components/documentation/ModuleCard.jsx';
import DocumentationLayout from '../components/documentation/DocumentationLayout.jsx';
import DocumentationSection from '../components/documentation/DocumentationSection.jsx';
import StepList from '../components/documentation/StepList.jsx';
import WorkflowDiagram from '../components/documentation/WorkflowDiagram.jsx';
import ImportantRules from '../components/documentation/ImportantRules.jsx';
import RelatedModules from '../components/documentation/RelatedModules.jsx';

function slugifyHeading(value, fallback) {
  const slug = (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || fallback;
}

export default function ModuleDetails() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const { modules, deleteModule, showToast } = useModules();
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const index = modules.findIndex((module) => module.id === id);
  const module = index >= 0 ? modules[index] : null;

  if (!module) {
    return (
      <EmptyState
        icon={BookOpen}
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

  const previous = index > 0 ? modules[index - 1] : null;
  const next = index < modules.length - 1 ? modules[index + 1] : null;
  const related = (module.relatedModuleIds || [])
    .map((relatedId) => modules.find((item) => item.id === relatedId))
    .filter(Boolean);

  const sections = module.sections || [];
  const tocItems = [
    { id: 'summary', label: 'Summary' },
    { id: 'purpose', label: 'Purpose' },
    ...sections.map((section, sectionIndex) => ({
      id: `section-${slugifyHeading(section.title, String(sectionIndex))}`,
      label: section.title,
    })),
    ...(module.steps?.length ? [{ id: 'steps', label: 'Step-by-step process' }] : []),
    ...(module.rules?.length ? [{ id: 'rules', label: 'Business rules' }] : []),
    ...(module.example ? [{ id: 'example', label: 'Example' }] : []),
    ...(module.workflow?.length ? [{ id: 'workflow', label: 'Status flow' }] : []),
  ];

  const aside = (
    <>
      <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
        <p className="text-xs font-semibold text-indigo-900">Open the TER application</p>
        {module.liveUrl ? (
          <>
            <a
              href={module.liveUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              Open TER App
            </a>
            <p className="mt-2 text-[11px] leading-relaxed text-indigo-800">
              This opens the official TER app listing on Google Play in a new tab.
            </p>
          </>
        ) : (
          <p className="mt-2 text-[11px] leading-relaxed text-indigo-800">{NO_URL_MESSAGE}</p>
        )}
      </div>

      <ImportantRules rules={module.rules} />
    </>
  );

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
            <Link to="/dashboard" className="hover:text-indigo-600 hover:underline">
              Modules
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight className="h-3 w-3" />
          </li>
          <li aria-current="page" className="font-medium text-slate-700">
            {module.title}
          </li>
        </ol>
      </nav>

      <header className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <IconResolver name={module.icon} className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold text-slate-900">{module.title}</h1>
            <p className="mt-1 text-sm text-slate-500">{module.shortDescription}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge color="indigo">{module.category}</Badge>
              <Badge color={module.status === 'Important' ? 'amber' : 'slate'}>{module.status}</Badge>
              {module.audience.map((audienceKey) => (
                <RoleBadge key={audienceKey} roleKey={audienceKey} />
              ))}
            </div>
          </div>

          {isAdmin ? (
            <div className="flex shrink-0 items-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => navigate(`/edit-module/${module.id}`)}>
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                Edit
              </Button>
              <Button size="sm" variant="danger" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                Delete
              </Button>
            </div>
          ) : null}
        </div>
      </header>

      <DocumentationLayout tocItems={tocItems} aside={aside}>
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <section id="summary" className="scroll-mt-24 border-b border-slate-200 pb-6">
            <h2 className="text-lg font-semibold text-slate-900">Summary</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{module.summary}</p>
          </section>

          <section id="purpose" className="scroll-mt-24 border-b border-slate-200 py-6">
            <h2 className="text-lg font-semibold text-slate-900">Purpose</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{module.purpose}</p>

            <h3 className="mt-5 text-sm font-semibold text-slate-900">Who uses this module</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {module.audience.map((audienceKey) => (
                <RoleBadge key={audienceKey} roleKey={audienceKey} />
              ))}
            </div>
          </section>

          {sections.map((section, sectionIndex) => (
            <DocumentationSection
              key={`${section.title}-${sectionIndex}`}
              id={`section-${slugifyHeading(section.title, String(sectionIndex))}`}
              section={section}
            />
          ))}

          {module.steps?.length ? (
            <section id="steps" className="scroll-mt-24 border-t border-slate-200 py-6">
              <h2 className="text-lg font-semibold text-slate-900">Step-by-step process</h2>
              <div className="mt-3">
                <StepList steps={module.steps} />
              </div>
            </section>
          ) : null}

          {module.rules?.length ? (
            <section id="rules" className="scroll-mt-24 border-t border-slate-200 py-6">
              <h2 className="text-lg font-semibold text-slate-900">Business rules</h2>
              <ul className="mt-3 space-y-1.5">
                {module.rules.map((rule, ruleIndex) => (
                  <li key={ruleIndex} className="flex gap-2 text-sm text-slate-600">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" aria-hidden="true" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {module.example ? (
            <section id="example" className="scroll-mt-24 border-t border-slate-200 py-6">
              <h2 className="text-lg font-semibold text-slate-900">Example</h2>
              <p className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                {module.example}
              </p>
            </section>
          ) : null}

          {module.workflow?.length ? (
            <section id="workflow" className="scroll-mt-24 border-t border-slate-200 pt-6">
              <h2 className="text-lg font-semibold text-slate-900">Status flow</h2>
              <div className="mt-3">
                <WorkflowDiagram steps={module.workflow} />
              </div>
            </section>
          ) : null}
        </article>
      </DocumentationLayout>

      <RelatedModules modules={related} />

      <nav aria-label="Module navigation" className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        {previous ? (
          <Link
            to={`/module/${previous.id}`}
            className="flex flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-indigo-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <ArrowLeft className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block text-xs text-slate-400">Previous</span>
              <span className="block truncate text-sm font-medium text-slate-800">{previous.title}</span>
            </span>
          </Link>
        ) : (
          <span className="hidden flex-1 sm:block" />
        )}

        {next ? (
          <Link
            to={`/module/${next.id}`}
            className="flex flex-1 items-center justify-end gap-3 rounded-xl border border-slate-200 bg-white p-4 text-right transition-colors hover:border-indigo-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <span className="min-w-0">
              <span className="block text-xs text-slate-400">Next</span>
              <span className="block truncate text-sm font-medium text-slate-800">{next.title}</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
          </Link>
        ) : null}
      </nav>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete documentation card"
        message={`Delete "${module.title}"? It will be removed for every visitor using this portal.`}
        confirmLabel="Delete card"
        onConfirm={() => {
          deleteModule(module.id);
          showToast(`"${module.title}" deleted`, 'success');
          setConfirmDelete(false);
          navigate('/dashboard');
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
