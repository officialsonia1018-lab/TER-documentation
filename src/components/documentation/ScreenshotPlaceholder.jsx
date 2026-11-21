import { Image } from 'lucide-react';

// Dashed placeholder that stands in for a real screenshot in the final documentation.

export default function ScreenshotPlaceholder({ label, alt }) {
  return (
    <figure className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-4">
      <div className="flex items-center justify-center py-6 text-slate-400">
        <Image className="h-6 w-6" aria-hidden="true" />
      </div>
      <figcaption className="text-center text-xs text-slate-500">
        <span className="sr-only">{alt || 'Screenshot placeholder'}</span>
        {label || 'Screenshot placeholder'}
      </figcaption>
    </figure>
  );
}
