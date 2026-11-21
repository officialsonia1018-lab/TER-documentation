import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Lock, Mail, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';import { useModules } from '../context/ModuleContext.jsx';
import Button from '../components/common/Button.jsx';

// Admin login page (reachable only at /login).
// Visitors never need this: the dashboard and all documentation are public.

export default function Login() {
  const { isAdmin, login } = useAuth();
  const { showToast } = useModules();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError('Please enter the admin email and password.');
      return;
    }

    setSubmitting(true);
    const result = await login({ email, password });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setError('');
    showToast('Signed in as Administrator', 'success');
    navigate('/dashboard', { replace: true });
  };

  const inputClass =
    'w-full rounded-lg border border-slate-300 bg-white py-2 pr-3 pl-9 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none';
  const labelClass = 'text-xs font-medium text-slate-600';

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-900 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600">
            <BookOpen className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">TER Documentation Portal</h1>
            <p className="text-xs text-navy-200">Travel &amp; Expense Reimbursement System</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-xl">
          <h2 className="text-base font-semibold text-slate-900">Admin sign in</h2>
          <p className="mt-1 text-sm text-slate-500">
            Only the administrator needs to sign in. Everyone else can read the documentation
            directly without logging in.
          </p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
            {error ? (
              <p
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {error}
              </p>
            ) : null}

            <div className="flex flex-col gap-1">
              <label htmlFor="login-email" className={labelClass}>
                Email
              </label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@ternityforworder"
                  className={inputClass}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="login-password" className={labelClass}>
                Password
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter admin password"
                  className={inputClass}
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting ? 'Signing in...' : 'Login as admin'}
            </Button>
          </form>

          <div className="mt-5 flex items-start gap-2 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" aria-hidden="true" />
            <div className="text-xs text-indigo-800">
              <p className="font-medium">Admin access</p>
              <p className="mt-1">
                Admin sign-in details are managed on the portal server. Ask the portal administrator
                if you need access. Visitors do not need an account to read the documentation.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-navy-200 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Continue to the documentation without logging in
          </Link>
        </div>
      </div>
    </div>
  );
}
