import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { ApiUser } from '../lib/api';
import { supabase, toApiUser } from '../lib/supabaseClient';
import { AuthShell, AuthError, inputClass, primaryButtonClass } from '../components/AuthForm';

export function SignupPage({ onAuthed }: { onAuthed: (u: ApiUser) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (authError) throw new Error(authError.message);
      if (data.session) {
        onAuthed(toApiUser(data.user!));
      } else {
        // Project has "Confirm email" turned on — no session until they click the link.
        setNeedsConfirmation(true);
        setBusy(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create account');
      setBusy(false);
    }
  };

  if (needsConfirmation) {
    return (
      <AuthShell>
        <h1 className="text-2xl font-medium tracking-tight text-ink">Check your email.</h1>
        <p className="mt-3 text-[14px] leading-relaxed text-ink-dim">
          We sent a confirmation link to <span className="text-ink">{email}</span>. Click it, then
          come back and log in.
        </p>
        <Link
          to="/login"
          className="mt-6 inline-block text-[13px] text-ink underline decoration-white/25 underline-offset-4 hover:decoration-accent"
        >
          Go to log in
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <h1 className="text-2xl font-medium tracking-tight text-ink">
        Make some room in your memory.
      </h1>
      <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
        <div>
          <label htmlFor="name" className="mb-1.5 block text-[13px] text-ink-dim">Name</label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="Your name"
          />
        </div>
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
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            placeholder="At least 8 characters"
          />
        </div>
        <AuthError message={error} />
        <button type="submit" disabled={busy} className={primaryButtonClass}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="mt-6 text-[13px] text-ink-dim">
        Already have an account?{' '}
        <Link to="/login" className="text-ink underline decoration-white/25 underline-offset-4 hover:decoration-accent">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
