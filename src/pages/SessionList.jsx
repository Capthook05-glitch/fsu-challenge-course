import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';
import { getSupabaseClient } from '../lib/supabase';

const supabase = getSupabaseClient();

const STATUS_STYLE = {
  draft:     { bg: '#fef3c7', color: '#d97706' },
  ready:     { bg: '#dcfce7', color: '#16a34a' },
  completed: { bg: '#dbeafe', color: '#2563eb' },
  archived:  { bg: '#f5f2ee', color: '#78716C' },
};

export default function SessionList() {
  const { profile } = useProfile();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName]   = useState('');

  async function load() {
    const { data } = await supabase.from('sessions').select('*')
      .eq('is_archived', false).order('updated_at', { ascending: false });
    setSessions(data || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function createSession() {
    const name = newName.trim() || 'New Session';
    const { data, error } = await supabase.from('sessions')
      .insert({ name, owner_id: profile.id, status: 'draft' }).select().single();
    if (!error && data) {
      setCreating(false); setNewName('');
      setSessions(prev => [data, ...prev]);
    }
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-syne font-bold text-2xl text-fsu-text">Sessions</h1>
        <button
          onClick={() => setCreating(true)}
          className="bg-fsu-garnet hover:bg-fsu-garnet2 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
        >
          + New Session
        </button>
      </div>

      {creating && (
        <div className="bg-fsu-surface border border-fsu-garnet rounded-xl p-4 mb-4 flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-xs font-medium text-fsu-muted block mb-1">Session name</label>
            <input
              autoFocus
              value={newName} onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') createSession(); if (e.key === 'Escape') setCreating(false); }}
              placeholder="e.g. Spring Retreat Day 1"
              className="w-full border border-fsu-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-fsu-garnet text-fsu-text"
            />
          </div>
          <button onClick={createSession} className="bg-fsu-garnet text-white px-4 py-2 rounded-lg text-sm font-medium">Create</button>
          <button onClick={() => setCreating(false)} className="text-fsu-muted hover:text-fsu-text px-2 py-2 text-sm">Cancel</button>
        </div>
      )}

      {loading && <p className="text-fsu-muted text-sm">Loading...</p>}

      {!loading && sessions.length === 0 && (
        <div className="text-center py-16 text-fsu-muted">
          <p className="text-lg font-medium mb-2">No sessions yet</p>
          <p className="text-sm mb-4">Create your first session to get started.</p>
        </div>
      )}

      <div className="space-y-3">
        {sessions.map(s => {
          const st = STATUS_STYLE[s.status] || STATUS_STYLE.draft;
          return (
            <Link key={s.id} to={`/sessions/${s.id}`}
              className="flex items-center justify-between p-4 bg-fsu-surface border border-fsu-border rounded-xl hover:border-fsu-garnet hover:shadow-sm transition-all">
              <div>
                <p className="font-medium text-fsu-text mb-0.5">{s.name}</p>
                <p className="text-xs text-fsu-muted">{new Date(s.updated_at).toLocaleDateString()}</p>
              </div>
              <span className="text-xs font-semibold capitalize px-2.5 py-1 rounded-full"
                style={{ background: st.bg, color: st.color }}>
                {s.status}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
