import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';
import { getSupabaseClient } from '../lib/supabase';
import { STATUS_STYLE } from '../lib/statusStyles';

const supabase = getSupabaseClient();

export default function SessionList() {
  const { profile, isAdmin, canPlan } = useProfile();
  const [ownSessions, setOwnSessions]     = useState([]);
  const [sharedSessions, setSharedSessions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName]   = useState('');

  async function load() {
    const [ownRes, memberRes] = await Promise.all([
      // Own sessions (admin sees all)
      isAdmin
        ? supabase.from('sessions').select('*').eq('is_archived', false).order('updated_at', { ascending: false })
        : supabase.from('sessions').select('*').eq('owner_id', profile.id).eq('is_archived', false).order('updated_at', { ascending: false }),

      // Sessions shared with this user (via session_members)
      supabase.from('session_members')
        .select('session_id, role, sessions(id, name, status, updated_at, owner_id)')
        .eq('profile_id', profile.id),
    ]);

    setOwnSessions(ownRes.data || []);

    // Flatten shared sessions, exclude ones already owned
    const ownIds = new Set((ownRes.data || []).map(s => s.id));
    const shared = (memberRes.data || [])
      .map(m => ({ ...m.sessions, memberRole: m.role }))
      .filter(s => s && !ownIds.has(s.id));
    setSharedSessions(shared);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function createSession() {
    const name = newName.trim() || 'New Session';
    const { data, error } = await supabase.from('sessions')
      .insert({ name, owner_id: profile.id, status: 'draft' }).select().single();
    if (!error && data) {
      setCreating(false);
      setNewName('');
      setOwnSessions(prev => [data, ...prev]);
    }
  }

  function SessionCard({ s, badge }) {
    const st = STATUS_STYLE[s.status] || STATUS_STYLE.draft;
    return (
      <Link to={`/sessions/${s.id}`}
        className="flex items-center justify-between p-4 bg-fsu-surface border border-fsu-border rounded-xl hover:border-fsu-garnet hover:shadow-sm transition-all">
        <div>
          <p className="font-medium text-fsu-text text-sm mb-0.5">{s.name}</p>
          <p className="text-xs text-fsu-muted">{new Date(s.updated_at).toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-2">
          {badge && (
            <span className="text-xs bg-fsu-soft border border-fsu-border text-fsu-muted px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
          <span className="text-xs font-semibold capitalize px-2.5 py-1 rounded-full"
            style={{ background: st.bg, color: st.color }}>
            {s.status}
          </span>
        </div>
      </Link>
    );
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-syne font-bold text-2xl text-fsu-text">
          {isAdmin ? 'All Sessions' : 'Sessions'}
        </h1>
        {canPlan && (
          <button
            onClick={() => setCreating(true)}
            className="bg-fsu-garnet hover:bg-fsu-garnet2 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
          >
            + New Session
          </button>
        )}
      </div>

      {creating && (
        <div className="bg-fsu-surface border border-fsu-garnet rounded-xl p-4 mb-4 flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-xs font-medium text-fsu-muted block mb-1">Session name</label>
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') createSession(); if (e.key === 'Escape') setCreating(false); }}
              placeholder="e.g. Spring Retreat Day 1"
              className="w-full border border-fsu-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-fsu-garnet text-fsu-text"
            />
          </div>
          <button onClick={createSession} className="bg-fsu-garnet text-white px-4 py-2 rounded-lg text-sm font-medium">Create</button>
          <button onClick={() => setCreating(false)} className="text-fsu-muted px-2 py-2 text-sm">Cancel</button>
        </div>
      )}

      {loading && <p className="text-fsu-muted text-sm">Loading...</p>}

      {/* Own / all sessions */}
      {!loading && (
        <>
          {ownSessions.length === 0 && sharedSessions.length === 0 && (
            <div className="text-center py-16 text-fsu-muted border-2 border-dashed border-fsu-border rounded-2xl">
              <p className="text-lg font-medium mb-2">No sessions yet</p>
              {canPlan && (
                <button onClick={() => setCreating(true)} className="text-fsu-garnet hover:underline text-sm font-medium">
                  Create your first session
                </button>
              )}
            </div>
          )}

          {ownSessions.length > 0 && (
            <div className="mb-6">
              {sharedSessions.length > 0 && (
                <h2 className="text-xs font-semibold text-fsu-muted uppercase tracking-wide mb-2">
                  {isAdmin ? 'All Sessions' : 'Your Sessions'}
                </h2>
              )}
              <div className="space-y-2">
                {ownSessions.map(s => <SessionCard key={s.id} s={s} />)}
              </div>
            </div>
          )}

          {sharedSessions.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-fsu-muted uppercase tracking-wide mb-2">Shared With You</h2>
              <div className="space-y-2">
                {sharedSessions.map(s => (
                  <SessionCard
                    key={s.id}
                    s={s}
                    badge={s.memberRole === 'co_lead' ? 'Co-Lead' : 'Assistant'}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
