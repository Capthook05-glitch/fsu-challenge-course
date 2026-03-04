import { useState, useEffect } from 'react';
import { getSupabaseClient } from '../lib/supabase';
import { useProfile } from '../context/ProfileContext';
import { GoalTag } from '../components/ui/GoalTag';
import { GOAL_KEYS } from '../lib/goalMeta';
import { Modal } from '../components/ui/Modal';

const supabase = getSupabaseClient();

const BLANK = {
  name: '', description: '', goals: [], min_group: 5, max_group: 20,
  time_min: 10, time_max: 30, activity_level: 'medium', setting: [],
  facilitation: '', materials: '', tags: [], is_active: true,
  physical_intensity: '', psychological_intensity: '', safety_notes: '',
  learning_objectives: '',
};

const ROLE_OPTIONS = [
  { value: 'admin',                 label: 'Admin',                 desc: 'Full access' },
  { value: 'lead_facilitator',      label: 'Lead Facilitator',      desc: 'Plan & run sessions' },
  { value: 'assistant_facilitator', label: 'Assistant Facilitator', desc: 'View & facilitate only' },
];

const ROLE_BADGE = {
  admin:                 { bg: '#fee2e2', color: '#dc2626' },
  lead_facilitator:      { bg: '#dbeafe', color: '#2563eb' },
  assistant_facilitator: { bg: '#dcfce7', color: '#16a34a' },
};

// ─── Games Tab ────────────────────────────────────────────────
function GamesTab() {
  const [games, setGames]     = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState(BLANK);
  const [loading, setLoading] = useState(true);

  async function loadGames() {
    const { data } = await supabase.from('games').select('*').order('name');
    setGames(data || []);
    setLoading(false);
  }
  useEffect(() => { loadGames(); }, []);

  function openNew() { setEditing('new'); setForm(BLANK); }
  function openEdit(g) {
    setEditing(g.id);
    setForm({ ...g, learning_objectives: (g.learning_objectives || []).join(', '), setting: g.setting || [], goals: g.goals || [] });
  }

  async function saveGame() {
    const payload = {
      ...form,
      goals: Array.isArray(form.goals) ? form.goals : [],
      setting: Array.isArray(form.setting) ? form.setting : [],
      learning_objectives: form.learning_objectives
        ? form.learning_objectives.split(',').map(s => s.trim()).filter(Boolean)
        : [],
      physical_intensity: form.physical_intensity ? parseInt(form.physical_intensity) : null,
      psychological_intensity: form.psychological_intensity ? parseInt(form.psychological_intensity) : null,
    };
    if (editing === 'new') {
      await supabase.from('games').insert(payload);
    } else {
      await supabase.from('games').update(payload).eq('id', editing);
    }
    setEditing(null);
    loadGames();
  }

  async function deleteGame(id) {
    if (!confirm('Delete this activity?')) return;
    await supabase.from('games').delete().eq('id', id);
    loadGames();
  }

  function toggleGoal(g)    { setForm(f => ({ ...f, goals:   f.goals.includes(g)   ? f.goals.filter(x => x !== g)   : [...f.goals, g] })); }
  function toggleSetting(s) { setForm(f => ({ ...f, setting: f.setting.includes(s) ? f.setting.filter(x => x !== s) : [...f.setting, s] })); }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-fsu-muted">{games.length} activities</p>
        <button onClick={openNew}
          className="bg-fsu-garnet hover:bg-fsu-garnet2 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
          + Add Activity
        </button>
      </div>

      {loading && <p className="text-fsu-muted text-sm">Loading...</p>}

      <div className="space-y-2">
        {games.map(g => (
          <div key={g.id} className="flex items-center justify-between p-4 bg-fsu-surface border border-fsu-border rounded-xl hover:border-fsu-border2 transition-colors">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${g.is_active ? 'bg-green-500' : 'bg-fsu-faint'}`} />
              <div className="min-w-0">
                <p className="font-medium text-fsu-text text-sm truncate">{g.name}</p>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {g.goals?.slice(0,3).map(gl => <GoalTag key={gl} goal={gl} />)}
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0 ml-3">
              <button onClick={() => openEdit(g)} className="text-xs border border-fsu-border text-fsu-muted hover:text-fsu-garnet hover:border-fsu-garnet px-3 py-1.5 rounded-lg transition-colors">Edit</button>
              <button onClick={() => deleteGame(g.id)} className="text-xs border border-red-200 text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <Modal onClose={() => setEditing(null)}>
          <div className="p-6 max-w-xl w-full max-h-[80vh] overflow-y-auto">
            <h2 className="font-syne font-bold text-lg text-fsu-text mb-5">
              {editing === 'new' ? 'New Activity' : 'Edit Activity'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-fsu-muted uppercase mb-1 block">Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                  className="w-full border border-fsu-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-fsu-garnet text-fsu-text" />
              </div>
              <div>
                <label className="text-xs font-semibold text-fsu-muted uppercase mb-1 block">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))}
                  rows={3} className="w-full border border-fsu-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-fsu-garnet text-fsu-text resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-fsu-muted uppercase mb-1 block">Min Group</label>
                  <input type="number" value={form.min_group} onChange={e => setForm(f => ({...f, min_group: +e.target.value}))}
                    className="w-full border border-fsu-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-fsu-garnet text-fsu-text" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-fsu-muted uppercase mb-1 block">Max Group</label>
                  <input type="number" value={form.max_group} onChange={e => setForm(f => ({...f, max_group: +e.target.value}))}
                    className="w-full border border-fsu-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-fsu-garnet text-fsu-text" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-fsu-muted uppercase mb-1 block">Time Min (min)</label>
                  <input type="number" value={form.time_min} onChange={e => setForm(f => ({...f, time_min: +e.target.value}))}
                    className="w-full border border-fsu-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-fsu-garnet text-fsu-text" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-fsu-muted uppercase mb-1 block">Time Max (min)</label>
                  <input type="number" value={form.time_max} onChange={e => setForm(f => ({...f, time_max: +e.target.value}))}
                    className="w-full border border-fsu-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-fsu-garnet text-fsu-text" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-fsu-muted uppercase mb-1 block">Activity Level</label>
                <select value={form.activity_level} onChange={e => setForm(f => ({...f, activity_level: e.target.value}))}
                  className="w-full border border-fsu-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-fsu-garnet text-fsu-text bg-fsu-surface">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-fsu-muted uppercase mb-1 block">Physical Intensity (1-5)</label>
                  <select value={form.physical_intensity} onChange={e => setForm(f => ({...f, physical_intensity: e.target.value}))}
                    className="w-full border border-fsu-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-fsu-garnet text-fsu-text bg-fsu-surface">
                    <option value="">—</option>
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-fsu-muted uppercase mb-1 block">Psych Intensity (1-5)</label>
                  <select value={form.psychological_intensity} onChange={e => setForm(f => ({...f, psychological_intensity: e.target.value}))}
                    className="w-full border border-fsu-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-fsu-garnet text-fsu-text bg-fsu-surface">
                    <option value="">—</option>
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-fsu-muted uppercase mb-1.5 block">Setting</label>
                <div className="flex gap-2">
                  {['indoor','outdoor'].map(s => (
                    <button key={s} type="button" onClick={() => toggleSetting(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border capitalize transition-colors ${
                        form.setting.includes(s) ? 'bg-fsu-garnet text-white border-fsu-garnet' : 'border-fsu-border text-fsu-muted'
                      }`}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-fsu-muted uppercase mb-1.5 block">Goals</label>
                <div className="flex flex-wrap gap-1.5">
                  {GOAL_KEYS.map(k => (
                    <button key={k} type="button" onClick={() => toggleGoal(k)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors capitalize ${
                        form.goals.includes(k) ? 'bg-fsu-garnet text-white border-fsu-garnet' : 'border-fsu-border text-fsu-muted'
                      }`}>{k}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-fsu-muted uppercase mb-1 block">Facilitation Notes</label>
                <textarea value={form.facilitation} onChange={e => setForm(f => ({...f, facilitation: e.target.value}))}
                  rows={3} className="w-full border border-fsu-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-fsu-garnet text-fsu-text resize-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-fsu-muted uppercase mb-1 block">Materials</label>
                <input value={form.materials} onChange={e => setForm(f => ({...f, materials: e.target.value}))}
                  className="w-full border border-fsu-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-fsu-garnet text-fsu-text" />
              </div>
              <div>
                <label className="text-xs font-semibold text-fsu-muted uppercase mb-1 block">Safety Notes</label>
                <textarea value={form.safety_notes} onChange={e => setForm(f => ({...f, safety_notes: e.target.value}))}
                  rows={2} className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400 text-red-700 resize-none"
                  placeholder="Safety considerations..." />
              </div>
              <div>
                <label className="text-xs font-semibold text-fsu-muted uppercase mb-1 block">Learning Objectives (comma-separated)</label>
                <input value={form.learning_objectives} onChange={e => setForm(f => ({...f, learning_objectives: e.target.value}))}
                  placeholder="e.g. Trust, Communication, Problem-solving"
                  className="w-full border border-fsu-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-fsu-garnet text-fsu-text" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" checked={form.is_active}
                  onChange={e => setForm(f => ({...f, is_active: e.target.checked}))} />
                <label htmlFor="isActive" className="text-sm text-fsu-text">Active (visible in library)</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={saveGame}
                  className="flex-1 bg-fsu-garnet hover:bg-fsu-garnet2 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors">
                  Save Activity
                </button>
                <button onClick={() => setEditing(null)}
                  className="border border-fsu-border2 text-fsu-muted px-4 py-2.5 rounded-xl text-sm transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

// ─── Users Tab ────────────────────────────────────────────────
function UsersTab({ currentUserId }) {
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  async function loadUsers() {
    const { data } = await supabase.from('profiles').select('*').order('name');
    setUsers(data || []);
    setLoading(false);
  }
  useEffect(() => { loadUsers(); }, []);

  async function changeRole(userId, newRole) {
    setSaving(userId);
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    setSaving(null);
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-fsu-muted">{users.length} users</p>
      </div>

      {loading && <p className="text-fsu-muted text-sm">Loading...</p>}

      {/* Role legend */}
      <div className="flex flex-wrap gap-2 mb-4">
        {ROLE_OPTIONS.map(r => {
          const style = ROLE_BADGE[r.value];
          return (
            <span key={r.value} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border"
              style={{ background: style.bg, color: style.color, borderColor: style.color + '44' }}>
              <span className="font-semibold">{r.label}</span>
              <span className="opacity-70">— {r.desc}</span>
            </span>
          );
        })}
      </div>

      <div className="space-y-2">
        {users.map(u => {
          const badge = ROLE_BADGE[u.role] || ROLE_BADGE.lead_facilitator;
          const isMe = u.id === currentUserId;
          return (
            <div key={u.id} className="flex items-center justify-between p-4 bg-fsu-surface border border-fsu-border rounded-xl">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-fsu-text text-sm">{u.name || u.email}</p>
                  {isMe && <span className="text-xs text-fsu-faint">(you)</span>}
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: badge.bg, color: badge.color }}>
                    {ROLE_OPTIONS.find(r => r.value === u.role)?.label || u.role}
                  </span>
                </div>
                <p className="text-xs text-fsu-muted mt-0.5 truncate">{u.email}</p>
              </div>

              {!isMe && (
                <div className="flex-shrink-0 ml-3">
                  <select
                    value={u.role}
                    disabled={saving === u.id}
                    onChange={e => changeRole(u.id, e.target.value)}
                    className="border border-fsu-border rounded-lg px-2.5 py-1.5 text-xs bg-fsu-surface focus:outline-none focus:border-fsu-garnet text-fsu-text disabled:opacity-50"
                  >
                    {ROLE_OPTIONS.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─── Root ─────────────────────────────────────────────────────
export default function AdminPanel() {
  const { profile } = useProfile();
  const [tab, setTab] = useState('games');

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="font-syne font-bold text-2xl text-fsu-text mb-6">Admin Panel</h1>

      <div className="flex gap-1 mb-6 bg-fsu-soft rounded-xl p-1 w-fit">
        {['games', 'users'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              tab === t ? 'bg-fsu-surface text-fsu-garnet shadow-sm border border-fsu-border' : 'text-fsu-muted hover:text-fsu-text'
            }`}>{t}</button>
        ))}
      </div>

      {tab === 'games' && <GamesTab />}
      {tab === 'users' && <UsersTab currentUserId={profile?.id} />}
    </div>
  );
}
