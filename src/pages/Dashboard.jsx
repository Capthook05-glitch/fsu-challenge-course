import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';
import { getSupabaseClient } from '../lib/supabase';

const statusColor = {
  draft:     { color: '#7a90b0' },
  ready:     { color: '#CEB069' },
  completed: { color: '#3ecf8e' },
};

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
      .eq('owner_id', profile.id)
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
      .eq('owner_id', profile.id)
      .eq('is_archived', false)
      .order('updated_at', { ascending: false })
      .limit(3)
      .then(({ data }) => setRecent(data ?? []));
  }, [profile]);

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-fsu-gold" style={{ fontFamily: 'Syne' }}>
          Welcome back{profile?.name ? `, ${profile.name}` : ''}
        </h1>
        <p className="mt-1 text-sm text-fsu-muted">What are you facilitating today?</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-fsu-border bg-fsu-bg2 p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-fsu-faint">Active Sessions</p>
          <p className="mt-2 text-4xl font-bold text-white" style={{ fontFamily: 'Syne' }}>{stats.sessions}</p>
        </div>
        <div className="rounded-xl border border-fsu-border bg-fsu-bg2 p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-fsu-faint">Games Available</p>
          <p className="mt-2 text-4xl font-bold text-white" style={{ fontFamily: 'Syne' }}>{stats.games}</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          to="/games"
          className="rounded-xl px-6 py-3 font-bold text-white hover:brightness-110 transition-all"
          style={{ background: 'linear-gradient(135deg, #782F40, #9e3a4d)', fontFamily: 'Syne' }}
        >
          🗂 Browse Catalog
        </Link>
        <Link
          to="/sessions"
          className="rounded-xl px-6 py-3 font-semibold transition-all"
          style={{ background: '#162035', color: '#e8edf5', border: '1px solid #1e2d45' }}
        >
          📋 New Session
        </Link>
      </div>

      {/* Recent sessions */}
      {recent.length > 0 && (
        <div>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-fsu-faint">Recent Sessions</h2>
          <div className="space-y-2">
            {recent.map((s) => (
              <Link
                key={s.id}
                to={`/sessions/${s.id}`}
                className="flex items-center justify-between rounded-xl border border-fsu-border bg-fsu-bg2 px-4 py-3 hover:border-fsu-border2 transition-colors"
              >
                <span className="text-white font-medium">{s.name}</span>
                <span className="text-xs capitalize" style={statusColor[s.status] ?? { color: '#7a90b0' }}>{s.status}</span>
              </Link>
            ))}
          </div>
          <Link to="/sessions" className="mt-3 block text-sm text-fsu-muted hover:text-fsu-gold transition-colors">
            View all sessions →
          </Link>
        </div>
      )}
    </div>
  );
}
