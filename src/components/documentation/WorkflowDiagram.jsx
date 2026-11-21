import { ChevronRight } from 'lucide-react';

// Horizontal, scrollable workflow diagram: steps joined by chevron arrows.

export default function WorkflowDiagram({ steps }) {
  if (!steps || steps.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto pb-2">
      <ol className="flex items-center gap-2">
        {steps.map((step, index) => (
          <li key={index} className="flex shrink-0 items-center gap-2">
            <span className="rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700">
              {step}
            </span>
            {index < steps.length - 1 ? (
              <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
