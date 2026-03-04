import { useState, useEffect } from 'react';
import { getSupabaseClient } from '../lib/supabase';
import { useProfile } from '../context/ProfileContext';
import { GoalTag } from '../components/ui/GoalTag';
import { GOAL_KEYS, GOAL_META } from '../lib/goalMeta';
import { Modal } from '../components/ui/Modal';

const supabase = getSupabaseClient();
const BLANK = { name: '', description: '', goals: [], size_min: '', size_max: '', constraints: '' };

export default function GroupProfiles() {
  const { profile } = useProfile();
  const [groups, setGroups]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState(BLANK);

  async function load() {
    const { data } = await supabase.from('groups').select('*').order('name');
    setGroups(data || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openNew()  { setEditing('new'); setForm(BLANK); }
  function openEdit(g) { setEditing(g.id); setForm({ ...g, goals: g.goals || [] }); }

  function toggleGoal(g) {
    setForm(f => ({ ...f, goals: f.goals.includes(g) ? f.goals.filter(x => x !== g) : [...f.goals, g] }));
  }

  async function save() {
    const payload = { ...form, created_by: profile.id,
      size_min: form.size_min ? parseInt(form.size_min) : null,
      size_max: form.size_max ? parseInt(form.size_max) : null };
    if (editing === 'new') {
      await supabase.from('groups').insert(payload);
    } else {
      await supabase.from('groups').update(payload).eq('id', editing);
    }
    setEditing(null);
    load();
  }

  async function del(id) {
    if (!confirm('Delete this group profile?')) return;
    await supabase.from('groups').delete().eq('id', id);
    load();
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-syne font-bold text-2xl text-fsu-text">Group Profiles</h1>
          <p className="text-sm text-fsu-muted mt-0.5">Store group goals, size, and constraints for smarter planning</p>
        </div>
        <button onClick={openNew}
          className="bg-fsu-garnet hover:bg-fsu-garnet2 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
          + New Group
        </button>
      </div>

      {loading && <p className="text-fsu-muted text-sm">Loading...</p>}

      {!loading && groups.length === 0 && (
        <div className="text-center py-16 text-fsu-muted border-2 border-dashed border-fsu-border rounded-2xl">
          <p className="text-lg font-medium mb-2">No group profiles yet</p>
          <p className="text-sm mb-4">Create a profile to capture goals and constraints for each group you work with.</p>
          <button onClick={openNew} className="text-fsu-garnet hover:underline text-sm font-medium">Create first group</button>
        </div>
      )}

      <div className="space-y-3">
        {groups.map(g => (
          <div key={g.id} className="bg-fsu-surface border border-fsu-border rounded-xl p-4 hover:border-fsu-border2 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-fsu-text mb-1">{g.name}</p>
                {g.description && <p className="text-sm text-fsu-muted mb-2 line-clamp-1">{g.description}</p>}
                <div className="flex flex-wrap items-center gap-2">
                  {(g.size_min || g.size_max) && (
                    <span className="text-xs text-fsu-muted bg-fsu-soft border border-fsu-border px-2 py-0.5 rounded-full">
                      {g.size_min || '?'}–{g.size_max || '?'} people
                    </span>
                  )}
                  {g.goals?.map(gl => <GoalTag key={gl} goal={gl} />)}
                </div>
                {g.constraints && <p className="text-xs text-fsu-muted mt-1.5 italic">{g.constraints}</p>}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => openEdit(g)} className="text-xs border border-fsu-border text-fsu-muted hover:text-fsu-garnet hover:border-fsu-garnet px-3 py-1.5 rounded-lg transition-colors">Edit</button>
                <button onClick={() => del(g.id)} className="text-xs border border-red-200 text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <Modal onClose={() => setEditing(null)}>
          <div className="p-6 max-w-md w-full">
            <h2 className="font-syne font-bold text-lg text-fsu-text mb-5">
              {editing === 'new' ? 'New Group Profile' : 'Edit Group Profile'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-fsu-muted uppercase mb-1 block">Group Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                  placeholder="e.g. Marketing Department, Freshman Cohort..."
                  className="w-full border border-fsu-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-fsu-garnet text-fsu-text" />
              </div>
              <div>
                <label className="text-xs font-semibold text-fsu-muted uppercase mb-1 block">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))}
                  rows={2}
                  className="w-full border border-fsu-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-fsu-garnet text-fsu-text resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-fsu-muted uppercase mb-1 block">Min Size</label>
                  <input type="number" value={form.size_min} onChange={e => setForm(f => ({...f, size_min: e.target.value}))}
                    placeholder="e.g. 10"
                    className="w-full border border-fsu-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-fsu-garnet text-fsu-text" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-fsu-muted uppercase mb-1 block">Max Size</label>
                  <input type="number" value={form.size_max} onChange={e => setForm(f => ({...f, size_max: e.target.value}))}
                    placeholder="e.g. 30"
                    className="w-full border border-fsu-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-fsu-garnet text-fsu-text" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-fsu-muted uppercase mb-1.5 block">Program Goals</label>
                <div className="flex flex-wrap gap-1.5">
                  {GOAL_KEYS.map(k => {
                    const meta = GOAL_META[k];
                    const active = form.goals.includes(k);
                    return (
                      <button key={k} onClick={() => toggleGoal(k)}
                        className="px-2.5 py-1 rounded-full text-xs font-medium border transition-colors"
                        style={active ? { background: meta.bg, color: meta.color, borderColor: meta.color+'55' }
                          : { background: 'transparent', color: '#78716C', borderColor: '#E8E2D9' }}>
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-fsu-muted uppercase mb-1 block">Constraints / Notes</label>
                <textarea value={form.constraints} onChange={e => setForm(f => ({...f, constraints: e.target.value}))}
                  rows={3} placeholder="Physical limitations, time constraints, previous experience..."
                  className="w-full border border-fsu-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-fsu-garnet text-fsu-text resize-none" />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={save}
                  className="flex-1 bg-fsu-garnet hover:bg-fsu-garnet2 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors">
                  Save Group
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
    </div>
  );
}
