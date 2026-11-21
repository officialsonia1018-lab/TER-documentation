import { AlertTriangle } from 'lucide-react';

// "Important Rules" card shown in the right column of the detail page.

export default function ImportantRules({ rules }) {
  if (!rules || rules.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-amber-900">Important rules</h3>
      </div>
      <ul className="mt-3 space-y-2">
        {rules.map((rule, index) => (
          <li key={index} className="flex gap-2 text-xs leading-relaxed text-amber-900">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-500" aria-hidden="true" />
            <span>{rule}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
