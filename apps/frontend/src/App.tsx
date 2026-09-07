import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import type { ApiUser } from './lib/api';
import { supabase, toApiUser } from './lib/supabaseClient';
import { LandingPage } from './pages/Landing';
import { LoginPage } from './pages/Login';
import { SignupPage } from './pages/Signup';
import { AppPage } from './pages/AppPage';

export function App() {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [authState, setAuthState] = useState<'loading' | 'ready'>('loading');
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      setUser(session ? toApiUser(session.user) : null);
      setAuthState('ready');
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      setUser(session ? toApiUser(session.user) : null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  if (authState === 'loading') {
    return (
      <div className="grid h-full place-items-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-ink-dim border-t-transparent" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage user={user} />} />
      <Route
        path="/login"
        element={user ? <Navigate to="/app" replace /> : <LoginPage onAuthed={setUser} />}
      />
      <Route
        path="/signup"
        element={user ? <Navigate to="/app" replace /> : <SignupPage onAuthed={setUser} />}
      />
      <Route
        path="/app"
        element={
          user ? (
            <AppPage user={user} onSignOut={() => setUser(null)} onUserUpdate={setUser} />
          ) : (
            <Navigate to="/login" replace state={{ from: location.pathname }} />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
