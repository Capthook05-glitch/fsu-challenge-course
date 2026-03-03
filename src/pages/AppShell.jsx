import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function AppShell({ session }) {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('name, role, email')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        setError('Could not load profile. Run SQL migration first.');
        return;
      }

      setProfile(data);
    };

    loadProfile();
  }, [session.user.id]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <main className="mx-auto max-w-4xl p-6">
      <nav className="mb-8 flex items-center justify-between rounded-xl border border-fsu-gold/30 bg-white/5 p-4">
        <h1 className="text-xl font-semibold text-fsu-gold">FSU Challenge Course Toolkit</h1>
        <button className="rounded-md bg-slate-800 px-3 py-2 text-sm" onClick={signOut}>
          Sign out
        </button>
      </nav>

      <section className="rounded-xl border border-slate-700 bg-slate-900/70 p-6">
        <h2 className="text-2xl font-semibold">You are connected 🎉</h2>
        <p className="mt-2 text-slate-300">This starter build confirms React + Supabase auth + profile loading.</p>

        <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          <InfoRow label="User ID" value={session.user.id} />
          <InfoRow label="Email" value={profile?.email ?? session.user.email} />
          <InfoRow label="Name" value={profile?.name ?? 'Not set'} />
          <InfoRow label="Role" value={profile?.role ?? 'Unknown'} />
        </div>

        {error && <p className="mt-4 rounded bg-red-950/60 p-3 text-sm text-red-300">{error}</p>}
      </section>
    </main>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="rounded-md border border-slate-700 bg-slate-800/60 p-3">
      <p className="text-xs uppercase text-slate-400">{label}</p>
      <p className="mt-1 break-all text-slate-100">{value}</p>
    </div>
  );
}
