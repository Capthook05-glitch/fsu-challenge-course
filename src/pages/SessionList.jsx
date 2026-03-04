import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';
import { getSupabaseClient } from '../lib/supabase';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

export function SessionList() {
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [creating, setCreating] = useState('');

  useEffect(() => {
    if (!profile) return;
    loadSessions();
  }, [profile]);

  async function loadSessions() {
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from('sessions')
      .select('id, name, status, updated_at')
      .eq('owner_id', profile.id)
      .eq('is_archived', false)
      .order('updated_at', { ascending: false });
    setSessions(data ?? []);
    setLoading(false);
  }

  async function createSession(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating('saving');
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('sessions')
      .insert({ name: newName.trim(), notes: newNotes.trim() || null, owner_id: profile.id, status: 'draft' })
      .select()
      .single();
    if (error) { setCreating('error'); return; }
    navigate(`/sessions/${data.id}`);
  }

  async function archiveSession(id) {
    const supabase = getSupabaseClient();
    await supabase.from('sessions').update({ is_archived: true }).eq('id', id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }

  const fmt = (ts) => new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  if (loading) return <p className="text-slate-400">Loading sessions…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-fsu-gold">My Sessions</h1>
        <button
          onClick={() => setShowNew(true)}
          className="rounded-md bg-fsu-garnet px-4 py-2 text-sm font-medium hover:brightness-110"
        >
          + New Session
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-12 text-center text-slate-500">
          <p>No sessions yet.</p>
          <button onClick={() => setShowNew(true)} className="mt-3 text-fsu-gold hover:underline text-sm">Create your first session</button>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-900/70 px-4 py-3 hover:border-fsu-gold/30 transition-colors">
              <Link to={`/sessions/${s.id}`} className="flex-1 min-w-0">
                <p className="text-slate-100 truncate">{s.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">Updated {fmt(s.updated_at)}</p>
              </Link>
              <Badge variant={s.status} label={s.status} />
              <button
                onClick={() => archiveSession(s.id)}
                className="text-xs text-slate-600 hover:text-slate-400 ml-2"
                title="Archive"
              >
                Archive
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={showNew} onClose={() => { setShowNew(false); setNewName(''); setNewNotes(''); setCreating(''); }} title="New Session">
        <form onSubmit={createSession} className="space-y-4">
          <div>
            <label className="block text-xs uppercase text-slate-500 mb-1">Session Name *</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              placeholder="e.g. Team Building Day"
              className="w-full rounded-md bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:ring-1 focus:ring-fsu-gold/50"
            />
          </div>
          <div>
            <label className="block text-xs uppercase text-slate-500 mb-1">Notes (optional)</label>
            <textarea
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              rows={3}
              placeholder="Group info, goals, context…"
              className="w-full rounded-md bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:ring-1 focus:ring-fsu-gold/50 resize-none"
            />
          </div>
          {creating === 'error' && <p className="text-red-400 text-sm">Failed to create session.</p>}
          <button
            type="submit"
            disabled={creating === 'saving'}
            className="w-full rounded-md bg-fsu-garnet px-4 py-2 font-medium hover:brightness-110 disabled:opacity-50"
          >
            {creating === 'saving' ? 'Creating…' : 'Create Session'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
