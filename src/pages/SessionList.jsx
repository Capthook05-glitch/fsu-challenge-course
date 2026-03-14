import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';
import { getSupabaseClient } from '../lib/supabase';
import { STATUS_STYLE } from '../lib/statusStyles';
import { Toast } from '../components/ui/Toast';
import { stripEmojis } from '../lib/utils';

const supabase = getSupabaseClient();

export default function SessionList() {
  const { profile, isAdmin, canPlan } = useProfile();
  const navigate = useNavigate();
  const [ownSessions, setOwnSessions]     = useState([]);
  const [sharedSessions, setSharedSessions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName]   = useState('');
  const [toast, setToast]       = useState(null);

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
    if (error) {
      setToast({ type: 'error', message: 'Error creating session: ' + error.message });
    } else if (data) {
      setCreating(false);
      setNewName('');
      navigate(`/sessions/${data.id}`);
    }
  }

  function SessionCard({ s, badge }) {
    const st = STATUS_STYLE[s.status] || STATUS_STYLE.draft;
    return (
      <Link to={`/sessions/${s.id}`}
        className="flex items-center justify-between p-5 bg-white border border-slate-200 rounded-xl hover:border-primary/40 hover:shadow-md transition-all group">
        <div>
          <p className="font-extrabold text-navy-deep text-lg group-hover:text-primary transition-colors">{stripEmojis(s.name)}</p>
          <div className="flex items-center gap-4 text-slate-500 text-sm font-medium mt-1">
             <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm opacity-60">calendar_today</span>
                {new Date(s.updated_at).toLocaleDateString()}
             </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {badge && (
            <span className="text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-1 rounded">
              {badge}
            </span>
          )}
          <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded border"
            style={{ background: st.bg + '20', color: st.color, borderColor: st.color + '40' }}>
            {s.status}
          </span>
          <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">chevron_right</span>
        </div>
      </Link>
    );
  }

  return (
    <div className="p-8 lg:p-12 max-w-5xl mx-auto min-h-screen bg-background-light font-display">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="font-black text-4xl text-navy-deep tracking-tight">
            {isAdmin ? 'All Sessions' : 'My Sessions'}
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Manage and organize your Challenge Course session plans.</p>
        </div>
        {canPlan && (
          <button
            onClick={() => setCreating(true)}
            className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
          >
            <span className="material-symbols-outlined">add_circle</span>
            New Session
          </button>
        )}
      </div>

      {creating && (
        <div className="bg-white border-2 border-primary rounded-xl p-8 mb-8 shadow-xl animate-in fade-in slide-in-from-top-4">
          <div className="flex flex-col gap-4">
            <label className="text-xs font-black text-primary uppercase tracking-widest">Enter Session Name</label>
            <div className="flex gap-4">
              <input
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') createSession(); if (e.key === 'Escape') setCreating(false); }}
                placeholder="e.g. FSU Housing RAs Orientation"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-primary text-navy-deep font-bold"
              />
              <button onClick={createSession} className="bg-primary text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-sm shadow-md">Create</button>
              <button onClick={() => setCreating(false)} className="text-slate-400 px-4 py-4 font-bold hover:text-navy-deep">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {loading && <p className="text-slate-400 font-medium animate-pulse">Loading sessions...</p>}

      {!loading && (
        <div className="space-y-10">
          {ownSessions.length === 0 && sharedSessions.length === 0 && (
            <div className="text-center py-24 text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl bg-white/50">
              <span className="material-symbols-outlined text-6xl mb-4 opacity-20">inventory_2</span>
              <p className="text-xl font-bold mb-2">No sessions yet</p>
              {canPlan && (
                <button onClick={() => setCreating(true)} className="text-primary hover:underline font-extrabold">
                  Create your first session plan
                </button>
              )}
            </div>
          )}

          {ownSessions.length > 0 && (
            <div>
              <div className="flex items-center gap-4 mb-6">
                 <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                   {isAdmin ? 'Global Inventory' : 'Personal Sessions'}
                 </h2>
                 <div className="h-px bg-slate-200 flex-1"></div>
              </div>
              <div className="grid gap-4">
                {ownSessions.map(s => <SessionCard key={s.id} s={s} />)}
              </div>
            </div>
          )}

          {sharedSessions.length > 0 && (
            <div>
              <div className="flex items-center gap-4 mb-6">
                 <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Shared With You</h2>
                 <div className="h-px bg-slate-200 flex-1"></div>
              </div>
              <div className="grid gap-4">
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
        </div>
      )}
    </div>
  );
}
