import { Link } from 'react-router-dom';
import { HelpCircle, LifeBuoy } from 'lucide-react';
import Button from '../components/common/Button.jsx';
import { ROLES } from '../data/roles.js';

// Help page: how the portal works, roles, demo limitations and FAQ.

const FAQS = [
  {
    question: 'Is this the real TER reimbursement application?',
    answer:
      'No. This is a documentation, onboarding and training portal for the TER (Travel & Expense Reimbursement System). It explains how the real application works; it does not process claims or payments.',
  },
  {
    question: 'How do I log in?',
    answer:
      'Visitors do not log in at all - the dashboard and every documentation page open read only for anyone with the link. Only the administrator signs in, at /login, with the admin account configured on the portal server.',
  },
  {
    question: 'What happens when the page is refreshed?',
    answer:
      'Nothing is lost. The admin session is kept for the browser tab and all added, edited or deleted cards are stored on the portal server, so every visitor sees the same up-to-date documentation.',
  },
  {
    question: 'Is the "Open TER App" button a real link?',
    answer:
      'Yes. Every "Open TER App" button opens the official TER app listing on Google Play (com.portal.ter) in a new tab.',
  },
  {
    question: 'Why can I not add or edit documentation cards?',
    answer:
      'Card management is reserved for the administrator. Open /login and sign in with the admin account to unlock the sidebar plus the Add, Edit and Delete actions. Everyone else keeps full read access.',
  },
  {
    question: 'Can this become a real application later?',
    answer:
      'The portal already has a Node + SQLite server that shares one dataset with every visitor. It can be extended with a hosted database, user accounts per role and file storage as the documentation grows.',
  },
];

export default function Help() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Help &amp; how to use this portal</h1>
        <p className="mt-1 text-sm text-slate-500">
          Everything you need to navigate the TER documentation, understand the roles and know the
          demo limits.
        </p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <HelpCircle className="h-4 w-4 text-indigo-600" aria-hidden="true" />
          Using the portal
        </h2>
        <ol className="mt-3 space-y-2">
          {[
            'Open the portal - no login is needed to read the documentation.',
            'Use the dashboard search and the category / audience filters to find a module.',
            'Open a module card with View Details to read the full documentation.',
            'Follow the step-by-step process, business rules, example and status flow.',
            'Use the demo link to open the TER application (placeholder URL).',
            'Use Next / Previous at the bottom of a module to move through the documentation.',
          ].map((item) => (
            <li key={item} className="flex gap-2 text-sm text-slate-600">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Roles in TER</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ROLES.map((role) => (
            <div key={role.id} className="rounded-lg border border-slate-200 p-3">
              <p className="text-sm font-medium text-slate-800">{role.label}</p>
              <p className="mt-1 text-xs text-slate-500">{role.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <LifeBuoy className="h-4 w-4 text-indigo-600" aria-hidden="true" />
          Frequently asked questions
        </h2>
        <div className="mt-3 divide-y divide-slate-100">
          {FAQS.map((item) => (
            <details key={item.question} className="group py-3">
              <summary className="cursor-pointer list-none text-sm font-medium text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                {item.question}
              </summary>
              <p className="mt-2 text-sm text-slate-600">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-indigo-200 bg-indigo-50 p-5">
        <h2 className="text-sm font-semibold text-indigo-900">Still need help?</h2>
        <p className="mt-1 text-xs text-indigo-800">
          For access problems in the real TER application, contact TER / Accounts or your HR
          administrator. For documentation gaps, raise a request with the portal owner.
        </p>
        <Link to="/dashboard" className="mt-3 inline-block">
          <Button size="sm">Back to dashboard</Button>
        </Link>
      </section>
    </div>
  );
}
