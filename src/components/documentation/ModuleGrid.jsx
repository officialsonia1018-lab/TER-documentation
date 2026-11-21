import { SearchX } from 'lucide-react';
import ModuleCard from './ModuleCard.jsx';
import EmptyState from '../common/EmptyState.jsx';

// Responsive grid of module cards, with an empty state when there are no results.

export default function ModuleGrid({
  modules,
  onEdit,
  onDelete,
  emptyTitle = 'No modules found',
  emptyMessage = 'Try changing the search text or clearing the filters.',
  emptyAction,
}) {
  if (modules.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title={emptyTitle}
        message={emptyMessage}
        action={emptyAction}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {modules.map((module) => (
        <ModuleCard
          key={module.id}
          module={module}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
