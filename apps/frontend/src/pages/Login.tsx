import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { ApiUser } from '../lib/api';
import { supabase, toApiUser } from '../lib/supabaseClient';
import { AuthShell, AuthError, inputClass, primaryButtonClass } from '../components/AuthForm';

export function LoginPage({ onAuthed }: { onAuthed: (u: ApiUser) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw new Error(authError.message);
      onAuthed(toApiUser(data.user));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not log in');
      setBusy(false);
    }
  };

  return (
    <AuthShell>
      <h1 className="text-2xl font-medium tracking-tight text-ink">Welcome back.</h1>
      <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-[13px] text-ink-dim">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-[13px] text-ink-dim">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            placeholder="••••••••"
          />
        </div>
        <AuthError message={error} />
        <button type="submit" disabled={busy} className={primaryButtonClass}>
          {busy ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p className="mt-6 text-[13px] text-ink-dim">
        Don't have an account?{' '}
        <Link to="/signup" className="text-ink underline decoration-white/25 underline-offset-4 hover:decoration-accent">
          Sign up
        </Link>
      </p>
    </AuthShell>
  );
}
