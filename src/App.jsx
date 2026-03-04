import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthForm } from './components/auth/AuthForm';
import { AppShell } from './pages/AppShell';
import { Dashboard } from './pages/Dashboard';
import { GameCatalog } from './pages/GameCatalog';
import { SessionList } from './pages/SessionList';
import { SessionPlanner } from './pages/SessionPlanner';
import { FacilitationMode } from './pages/FacilitationMode';
import { FeedbackForm } from './pages/FeedbackForm';
import { AdminPanel } from './pages/AdminPanel';
import { ProfileProvider } from './context/ProfileContext';
import { getSupabaseClient, missingSupabaseEnv } from './lib/supabase';

function AuthGate({ session }) {
  if (!session) {
    return (
      <div className="mx-auto flex min-h-[85vh] max-w-5xl items-center justify-center">
        <AuthForm />
      </div>
    );
  }
  return (
    <ProfileProvider session={session}>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="games" element={<GameCatalog />} />
          <Route path="sessions" element={<SessionList />} />
          <Route path="sessions/:id" element={<SessionPlanner />} />
          <Route path="admin" element={<AdminPanel />} />
        </Route>
        <Route path="/sessions/:id/facilitate" element={<FacilitationMode />} />
      </Routes>
    </ProfileProvider>
  );
}

export default function App() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    if (missingSupabaseEnv) return undefined;

    const supabase = getSupabaseClient();
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session ?? null));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (missingSupabaseEnv) {
    return (
      <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center p-6">
        <div className="w-full rounded-xl border border-yellow-500/30 bg-yellow-900/20 p-6 text-yellow-100">
          <h1 className="text-2xl font-semibold">Missing Supabase environment variables</h1>
          <p className="mt-2 text-sm">
            Copy <code>.env.example</code> to <code>.env</code>, then set <code>VITE_SUPABASE_URL</code> and{' '}
            <code>VITE_SUPABASE_ANON_KEY</code>.
          </p>
          <pre className="mt-4 overflow-x-auto rounded bg-black/40 p-3 text-xs">{`cp .env.example .env\nnpm run setup:check\nnpm run dev`}</pre>
        </div>
      </div>
    );
  }

  if (session === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-fsu-navy text-slate-400">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fsu-navy">
      <BrowserRouter>
        <Routes>
          <Route path="/feedback/:sessionId" element={<FeedbackForm />} />
          <Route path="/*" element={<AuthGate session={session} />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}
