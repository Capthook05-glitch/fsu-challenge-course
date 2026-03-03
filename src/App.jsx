import { useEffect, useState } from 'react';
import { AuthForm } from './components/auth/AuthForm';
import { AppShell } from './pages/AppShell';
import { getSupabaseClient, missingSupabaseEnv } from './lib/supabase';

export default function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    if (missingSupabaseEnv) {
      return undefined;
    }

    const supabase = getSupabaseClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
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

  return (
    <div className="min-h-screen bg-fsu-navy p-4 sm:p-8">
      {session ? (
        <AppShell session={session} />
      ) : (
        <div className="mx-auto flex min-h-[85vh] max-w-5xl items-center justify-center">
          <AuthForm />
        </div>
      )}
    </div>
  );
}
import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext'; // Assuming you have an AuthContext for auth flow
import Home from './components/Home'; // Home component
import Login from './components/Login'; // Login component
import Dashboard from './components/Dashboard'; // Auth protected Dashboard component
import NotFound from './components/NotFound'; // 404 Not Found component

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Switch>
          <Route path='/' exact component={Home} />
          <Route path='/login' component={Login} />
          <Route path='/dashboard' component={Dashboard} />
          <Route component={NotFound} />
        </Switch>
      </Router>
    </AuthProvider>
  );
};

export default App;
