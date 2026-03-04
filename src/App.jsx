import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthForm } from './components/auth/AuthForm';
import { RequireRole } from './components/auth/RequireRole';
import AppShell from './pages/AppShell';
import Dashboard from './pages/Dashboard';
import GameCatalog from './pages/GameCatalog';
import SessionList from './pages/SessionList';
import TimelinePlanner from './pages/TimelinePlanner';
import FacilitationMode from './pages/FacilitationMode';
import FeedbackForm from './pages/FeedbackForm';
import AdminPanel from './pages/AdminPanel';
import GroupProfiles from './pages/GroupProfiles';
import SiteProfiles from './pages/SiteProfiles';
import Templates from './pages/Templates';
import Analytics from './pages/Analytics';
import IncidentLog from './pages/IncidentLog';
import Courses from './pages/Courses';
import { ProfileProvider } from './context/ProfileContext';
import { getSupabaseClient, missingSupabaseEnv } from './lib/supabase';

const PLANNERS  = ['admin', 'lead_facilitator'];
const ALL_ROLES = ['admin', 'lead_facilitator', 'assistant_facilitator'];

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
          {/* All authenticated roles */}
          <Route index element={<Dashboard />} />
          <Route path="games" element={<GameCatalog />} />

          {/* Session detail — all roles can view; read-only enforced inside component */}
          <Route path="sessions/:id" element={<TimelinePlanner />} />

          {/* Planners only (admin + lead_facilitator) */}
          <Route path="sessions" element={
            <RequireRole roles={PLANNERS}><SessionList /></RequireRole>
          } />
          <Route path="templates" element={
            <RequireRole roles={PLANNERS}><Templates /></RequireRole>
          } />
          <Route path="courses" element={
            <RequireRole roles={PLANNERS}><Courses /></RequireRole>
          } />
          <Route path="groups" element={
            <RequireRole roles={PLANNERS}><GroupProfiles /></RequireRole>
          } />
          <Route path="sites" element={
            <RequireRole roles={PLANNERS}><SiteProfiles /></RequireRole>
          } />
          <Route path="analytics" element={
            <RequireRole roles={PLANNERS}><Analytics /></RequireRole>
          } />
          <Route path="incidents" element={
            <RequireRole roles={PLANNERS}><IncidentLog /></RequireRole>
          } />

          {/* Admin only */}
          <Route path="admin" element={
            <RequireRole roles={['admin']}><AdminPanel /></RequireRole>
          } />
        </Route>

        {/* Outside shell */}
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => setSession(s ?? null));
    return () => subscription.unsubscribe();
  }, []);

  if (missingSupabaseEnv) {
    return (
      <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center p-6">
        <div className="w-full rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          <h1 className="text-2xl font-semibold">Missing Supabase environment variables</h1>
          <p className="mt-2 text-sm">
            Copy <code>.env.example</code> to <code>.env</code>, then set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>.
          </p>
        </div>
      </div>
    );
  }

  if (session === undefined) {
    return <div className="flex min-h-screen items-center justify-center bg-fsu-white text-fsu-muted">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-fsu-white">
      <BrowserRouter>
        <Routes>
          <Route path="/feedback/:sessionId" element={<FeedbackForm />} />
          <Route path="/*" element={<AuthGate session={session} />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}
