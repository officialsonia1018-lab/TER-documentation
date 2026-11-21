// Numbered step list used for the step-by-step process.

export default function StepList({ steps }) {
  if (!steps || steps.length === 0) {
    return null;
  }

  return (
    <ol className="space-y-3">
      {steps.map((step, index) => (
        <li key={index} className="flex items-start gap-3">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white"
            aria-hidden="true"
          >
            {index + 1}
          </span>
          <span className="pt-0.5 text-sm text-slate-700">{step}</span>
        </li>
      ))}
    </ol>
  );
}
