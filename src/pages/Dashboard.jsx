import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';
import { getSupabaseClient } from '../lib/supabase';

const supabase = getSupabaseClient();

export default function Dashboard() {
  const { profile } = useProfile();
  const [stats, setStats] = useState({ sessions: 0, games: 0 });
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    async function load() {
      const [{ count: sessCount }, { count: gameCount }, { data: recentSess }] = await Promise.all([
        supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('is_archived', false),
        supabase.from('games').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('sessions').select('id,name,status,updated_at').eq('is_archived', false)
          .order('updated_at', { ascending: false }).limit(3),
      ]);
      setStats({ sessions: sessCount || 0, games: gameCount || 0 });
      setRecent(recentSess || []);
    }
    load();
  }, []);

  const statusStyle = { draft: '#78716C', ready: '#16a34a', completed: '#2563eb', archived: '#A8A29E' };

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-7">
        <h1 className="font-syne font-bold text-3xl text-fsu-text mb-1">
          Welcome back{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-fsu-muted">FSU Challenge Course Facilitator Toolkit</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-7">
        <div className="bg-fsu-surface border border-fsu-border rounded-xl p-5">
          <p className="text-xs text-fsu-muted font-medium uppercase tracking-wide mb-1">Active Sessions</p>
          <p className="font-syne font-bold text-4xl text-fsu-garnet">{stats.sessions}</p>
        </div>
        <div className="bg-fsu-surface border border-fsu-border rounded-xl p-5">
          <p className="text-xs text-fsu-muted font-medium uppercase tracking-wide mb-1">Activities</p>
          <p className="font-syne font-bold text-4xl text-fsu-garnet">{stats.games}</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link to="/sessions"
          className="bg-fsu-garnet hover:bg-fsu-garnet2 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
          + New Session
        </Link>
        <Link to="/games"
          className="bg-fsu-surface border border-fsu-border2 hover:border-fsu-garnet text-fsu-text px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
          Browse Activities
        </Link>
      </div>

      {/* Recent sessions */}
      {recent.length > 0 && (
        <div>
          <h2 className="font-syne font-semibold text-fsu-text text-base mb-3">Recent Sessions</h2>
          <div className="space-y-2">
            {recent.map(s => (
              <Link key={s.id} to={`/sessions/${s.id}`}
                className="flex items-center justify-between p-4 bg-fsu-surface border border-fsu-border rounded-xl hover:border-fsu-garnet hover:shadow-sm transition-all">
                <span className="font-medium text-sm text-fsu-text">{s.name}</span>
                <span className="text-xs font-semibold capitalize px-2.5 py-1 rounded-full"
                  style={{ background: (statusStyle[s.status] || '#78716C') + '18', color: statusStyle[s.status] || '#78716C' }}>
                  {s.status}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
