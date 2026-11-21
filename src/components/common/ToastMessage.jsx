import { CheckCircle2, Info, XCircle } from 'lucide-react';
import { useModules } from '../../context/ModuleContext.jsx';

// Toast notifications driven purely by React state (no browser storage, no external services).

export default function ToastMessage() {
  const { toast } = useModules();

  if (!toast) {
    return null;
  }

  const styles = {
    success: {
      icon: CheckCircle2,
      classes: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    },
    error: {
      icon: XCircle,
      classes: 'border-red-200 bg-red-50 text-red-800',
    },
    info: {
      icon: Info,
      classes: 'border-indigo-200 bg-indigo-50 text-indigo-800',
    },
  };

  const current = styles[toast.type] || styles.success;
  const Icon = current.icon;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed right-4 bottom-4 z-[60] max-w-sm"
    >
      <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ${current.classes}`}>
        <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <p className="text-sm font-medium">{toast.message}</p>
      </div>
    </div>
  );
}
