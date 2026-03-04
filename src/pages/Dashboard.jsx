import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';
import { getSupabaseClient } from '../lib/supabase';

export function Dashboard() {
  const { profile } = useProfile();
  const [stats, setStats] = useState({ sessions: 0, games: 0 });
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    if (!profile) return;
    const supabase = getSupabaseClient();

    supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', profile.id === undefined ? '' : profile.id)
      .eq('is_archived', false)
      .then(({ count }) => setStats((s) => ({ ...s, sessions: count ?? 0 })));

    supabase
      .from('games')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
      .then(({ count }) => setStats((s) => ({ ...s, games: count ?? 0 })));

    supabase
      .from('sessions')
      .select('id, name, status, updated_at')
      .eq('owner_id', profile.id === undefined ? '' : profile.id)
      .eq('is_archived', false)
      .order('updated_at', { ascending: false })
      .limit(3)
      .then(({ data }) => setRecent(data ?? []));
  }, [profile]);

  const statusColor = {
    draft: 'text-slate-400',
    ready: 'text-fsu-gold',
    completed: 'text-green-400',
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-fsu-gold">
          Welcome back{profile?.name ? `, ${profile.name}` : ''}
        </h1>
        <p className="mt-1 text-slate-400 text-sm">What are you facilitating today?</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-5">
          <p className="text-xs uppercase text-slate-500 tracking-wide">Active Sessions</p>
          <p className="mt-2 text-3xl font-bold text-slate-100">{stats.sessions}</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-5">
          <p className="text-xs uppercase text-slate-500 tracking-wide">Games Available</p>
          <p className="mt-2 text-3xl font-bold text-slate-100">{stats.games}</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          to="/games"
          className="rounded-md bg-fsu-garnet px-5 py-2.5 font-medium hover:brightness-110 transition-all"
        >
          Browse Games
        </Link>
        <Link
          to="/sessions"
          className="rounded-md bg-slate-800 px-5 py-2.5 font-medium hover:bg-slate-700 transition-all"
        >
          New Session
        </Link>
      </div>

      {/* Recent sessions */}
      {recent.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-500">Recent Sessions</h2>
          <div className="space-y-2">
            {recent.map((s) => (
              <Link
                key={s.id}
                to={`/sessions/${s.id}`}
                className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/70 px-4 py-3 hover:border-fsu-gold/30 transition-colors"
              >
                <span className="text-slate-100">{s.name}</span>
                <span className={`text-xs capitalize ${statusColor[s.status] ?? 'text-slate-400'}`}>{s.status}</span>
              </Link>
            ))}
          </div>
          <Link to="/sessions" className="mt-3 block text-sm text-slate-500 hover:text-fsu-gold">
            View all sessions →
          </Link>
        </div>
      )}
    </div>
  );
}
