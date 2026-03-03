import { useEffect, useState } from 'react';
import { AuthForm } from './components/auth/AuthForm';
import { AppShell } from './pages/AppShell';
import { supabase } from './lib/supabase';

export default function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

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
