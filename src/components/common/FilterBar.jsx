import { RotateCcw } from 'lucide-react';
import { ROLES } from '../../data/roles.js';

// Category + audience filters used on the dashboard, with a reset action.

export default function FilterBar({
  categories,
  selectedCategory,
  onCategoryChange,
  selectedAudience,
  onAudienceChange,
  onReset,
}) {
  const hasFilters = Boolean(selectedCategory || selectedAudience);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="filter-category" className="text-xs font-medium text-slate-500">
          Category
        </label>
        <select
          id="filter-category"
          value={selectedCategory}
          onChange={(event) => onCategoryChange(event.target.value)}
          className="min-w-[180px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="filter-audience" className="text-xs font-medium text-slate-500">
          Audience / role
        </label>
        <select
          id="filter-audience"
          value={selectedAudience}
          onChange={(event) => onAudienceChange(event.target.value)}
          className="min-w-[180px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none"
        >
          <option value="">All roles</option>
          {ROLES.map((role) => (
            <option key={role.id} value={role.id}>
              {role.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={onReset}
        disabled={!hasFilters}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        Reset filters
      </button>
    </div>
  );
}
