import ScreenshotPlaceholder from './ScreenshotPlaceholder.jsx';
import { apiUrl } from '../../services/api.js';

// One documentation section: title, paragraphs, bullet list and optional screenshot placeholder.

export default function DocumentationSection({ id, section }) {
  return (
    <section
      id={id}
      className="scroll-mt-24 border-b border-slate-200 py-6 first:pt-0 last:border-b-0"
    >
      <h3 className="text-lg font-semibold text-slate-900">{section.title}</h3>

      {section.paragraphs && section.paragraphs.length > 0 ? (
        <div className="mt-2 space-y-2">
          {section.paragraphs.map((paragraph, index) => (
            <p key={index} className="text-sm leading-relaxed text-slate-600">
              {paragraph}
            </p>
          ))}
        </div>
      ) : null}

      {section.bullets && section.bullets.length > 0 ? (
        <ul className="mt-3 space-y-1.5">
          {section.bullets.map((bullet, index) => (
            <li key={index} className="flex gap-2 text-sm text-slate-600">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" aria-hidden="true" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {section.image ? (
        <figure className="mt-4">
          <img
            src={apiUrl(section.image)}
            alt={section.title ? `${section.title} illustration` : 'Documentation illustration'}
            className="w-full rounded-lg border border-slate-200 object-cover"
            loading="lazy"
          />
        </figure>
      ) : null}

      {!section.image && section.imagePlaceholder ? (
        <div className="mt-4">
          <ScreenshotPlaceholder
            label={section.imagePlaceholder}
            alt={`Placeholder for the screenshot: ${section.title}`}
          />
        </div>
      ) : null}
    </section>
  );
}
