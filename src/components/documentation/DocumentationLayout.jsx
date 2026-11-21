// Three-column documentation layout:
// left table of contents (desktop), main content, right aside (Important Rules etc.).

export default function DocumentationLayout({ tocItems = [], aside, children }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)_280px]">
      <nav aria-label="Table of contents" className="hidden lg:block">
        <div className="sticky top-24 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
            On this page
          </p>
          <ul className="mt-3 space-y-1 text-sm">
            {tocItems.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="block rounded px-2 py-1 text-slate-600 transition-colors hover:bg-slate-50 hover:text-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="min-w-0">{children}</div>

      {aside ? (
        <aside aria-label="Additional information">
          <div className="space-y-4 lg:sticky lg:top-24">{aside}</div>
        </aside>
      ) : null}
    </div>
  );
}
