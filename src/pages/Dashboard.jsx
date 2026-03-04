import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';
import { getSupabaseClient } from '../lib/supabase';

const supabase = getSupabaseClient();

const STATUS_STYLE = {
  draft:     { bg: '#fef3c7', color: '#d97706' },
  ready:     { bg: '#dcfce7', color: '#16a34a' },
  completed: { bg: '#dbeafe', color: '#2563eb' },
};

// ─── Admin / Lead Facilitator view ───────────────────────────
function PlannerDashboard({ profile, isAdmin }) {
  const [stats, setStats] = useState({ sessions: 0, games: 0, users: 0 });
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    async function load() {
      const queries = [
        supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('is_archived', false),
        supabase.from('games').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('sessions').select('id,name,status,updated_at')
          .eq('is_archived', false)
          .order('updated_at', { ascending: false })
          .limit(4),
      ];
      if (isAdmin) {
        queries.push(supabase.from('profiles').select('*', { count: 'exact', head: true }));
      }
      const results = await Promise.all(queries);
      setStats({
        sessions: results[0].count || 0,
        games:    results[1].count || 0,
        users:    isAdmin ? (results[3]?.count || 0) : null,
      });
      setRecent(results[2].data || []);
    }
    load();
  }, [isAdmin]);

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-7">
        <h1 className="font-syne font-bold text-3xl text-fsu-text mb-1">
          Welcome back{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-fsu-muted">FSU Challenge Course Facilitator Toolkit</p>
      </div>

      {/* Stats */}
      <div className={`grid gap-4 mb-7 ${isAdmin ? 'grid-cols-3' : 'grid-cols-2'}`}>
        <div className="bg-fsu-surface border border-fsu-border rounded-xl p-5">
          <p className="text-xs text-fsu-muted font-medium uppercase tracking-wide mb-1">Active Sessions</p>
          <p className="font-syne font-bold text-4xl text-fsu-garnet">{stats.sessions}</p>
        </div>
        <div className="bg-fsu-surface border border-fsu-border rounded-xl p-5">
          <p className="text-xs text-fsu-muted font-medium uppercase tracking-wide mb-1">Activities</p>
          <p className="font-syne font-bold text-4xl text-fsu-garnet">{stats.games}</p>
        </div>
        {isAdmin && (
          <div className="bg-fsu-surface border border-fsu-border rounded-xl p-5">
            <p className="text-xs text-fsu-muted font-medium uppercase tracking-wide mb-1">Users</p>
            <p className="font-syne font-bold text-4xl text-fsu-garnet">{stats.users}</p>
          </div>
        )}
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
        {isAdmin && (
          <Link to="/admin"
            className="bg-fsu-surface border border-fsu-border2 hover:border-fsu-garnet text-fsu-text px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
            Manage Users
          </Link>
        )}
      </div>

      {/* Recent sessions */}
      {recent.length > 0 && (
        <div>
          <h2 className="font-syne font-semibold text-fsu-text text-base mb-3">Recent Sessions</h2>
          <div className="space-y-2">
            {recent.map(s => {
              const st = STATUS_STYLE[s.status] || STATUS_STYLE.draft;
              return (
                <Link key={s.id} to={`/sessions/${s.id}`}
                  className="flex items-center justify-between p-4 bg-fsu-surface border border-fsu-border rounded-xl hover:border-fsu-garnet hover:shadow-sm transition-all">
                  <span className="font-medium text-sm text-fsu-text">{s.name}</span>
                  <span className="text-xs font-semibold capitalize px-2.5 py-1 rounded-full"
                    style={{ background: st.bg, color: st.color }}>
                    {s.status}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Assistant Facilitator view ───────────────────────────────
function AssistantDashboard({ profile }) {
  const [assigned, setAssigned] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Get session IDs assigned to this user
      const { data: memberships } = await supabase
        .from('session_members')
        .select('session_id, role')
        .eq('profile_id', profile.id);

      if (!memberships?.length) { setLoading(false); return; }

      const sessionIds = memberships.map(m => m.session_id);
      const { data: sessions } = await supabase
        .from('sessions')
        .select('id, name, status, updated_at')
        .in('id', sessionIds)
        .eq('is_archived', false)
        .order('updated_at', { ascending: false });

      setAssigned(sessions || []);
      setLoading(false);
    }
    load();
  }, [profile.id]);

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-7">
        <h1 className="font-syne font-bold text-3xl text-fsu-text mb-1">
          Hello{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-fsu-muted">Your assigned sessions are listed below.</p>
      </div>

      {/* Role notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-6 flex items-start gap-3">
        <span className="text-blue-500 text-lg mt-0.5">i</span>
        <div>
          <p className="text-sm font-semibold text-blue-800">Assistant Facilitator</p>
          <p className="text-xs text-blue-600 mt-0.5">
            You can view session timelines and run facilitation mode. Contact your lead facilitator to be added to sessions.
          </p>
        </div>
      </div>

      <h2 className="font-syne font-semibold text-fsu-text text-base mb-3">Assigned Sessions</h2>

      {loading && <p className="text-fsu-muted text-sm">Loading...</p>}

      {!loading && assigned.length === 0 && (
        <div className="text-center py-16 text-fsu-muted border-2 border-dashed border-fsu-border rounded-2xl">
          <p className="text-lg font-medium mb-2">No sessions assigned yet</p>
          <p className="text-sm">Your lead facilitator will add you to sessions once they're planned.</p>
        </div>
      )}

      <div className="space-y-2">
        {assigned.map(s => {
          const st = STATUS_STYLE[s.status] || STATUS_STYLE.draft;
          return (
            <Link key={s.id} to={`/sessions/${s.id}`}
              className="flex items-center justify-between p-4 bg-fsu-surface border border-fsu-border rounded-xl hover:border-fsu-garnet hover:shadow-sm transition-all">
              <span className="font-medium text-sm text-fsu-text">{s.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-fsu-muted">View only</span>
                <span className="text-xs font-semibold capitalize px-2.5 py-1 rounded-full"
                  style={{ background: st.bg, color: st.color }}>
                  {s.status}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-6">
        <Link to="/games"
          className="bg-fsu-surface border border-fsu-border2 hover:border-fsu-garnet text-fsu-text px-5 py-2.5 rounded-xl text-sm font-medium transition-colors inline-block">
          Browse Activity Library
        </Link>
      </div>
    </div>
  );
}

// ─── Root component ───────────────────────────────────────────
export default function Dashboard() {
  const { profile, isAdmin, isAssistantFacilitator } = useProfile();

  if (!profile) return null;

  if (isAssistantFacilitator) {
    return <AssistantDashboard profile={profile} />;
  }

  return <PlannerDashboard profile={profile} isAdmin={isAdmin} />;
}
