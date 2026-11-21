import { Search } from 'lucide-react';

// Search input with a visible label and clear semantics.

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search modules...',
  label = 'Search modules',
  id = 'module-search',
}) {
  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
        aria-hidden="true"
      />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 bg-white py-2 pr-3 pl-9 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
      />
    </div>
  );
}
