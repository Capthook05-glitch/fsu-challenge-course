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
    <div className="flex-1 lg:px-20 py-8 px-6 bg-background-light dark:bg-background-dark min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-2 uppercase italic">Intake & Assessment</h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl">Prepare for your team's transformational experience. Provide accurate group details for planning.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
               <div className="flex items-center justify-between mb-6 border-b border-accent-gold/30 pb-2">
                 <h3 className="text-xl font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">group</span>
                    Core Group Information
                 </h3>
                 <button onClick={openNew} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold">Add Group</button>
               </div>

               {loading && <p className="text-slate-400">Loading...</p>}

               <div className="space-y-4">
                  {groups.map(g => (
                    <div key={g.id} className="p-4 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-primary/30 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-navy-deep dark:text-white">{g.name}</p>
                          <p className="text-sm text-slate-500 line-clamp-1">{g.description}</p>
                        </div>
                        <div className="flex gap-2">
                           <button onClick={() => openEdit(g)} className="text-primary hover:underline text-xs font-bold uppercase">Edit</button>
                           <button onClick={() => del(g.id)} className="text-slate-400 hover:text-red-600 text-xs font-bold uppercase">Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
               </div>
            </section>
          </div>

          <aside className="space-y-6">
             <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm sticky top-8">
                <h4 className="font-bold text-lg mb-4 text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">Summary</h4>
                <div className="space-y-4">
                   <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Total Profiles:</span>
                      <span className="font-bold">{groups.length}</span>
                   </div>
                </div>
             </div>
          </aside>
        </div>
      </div>

      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing === 'new' ? 'New Group' : 'Edit Group'} wide>
          <div className="space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                   <label className="text-xs font-bold text-navy uppercase tracking-widest">Group Name</label>
                   <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                     className="w-full bg-white border border-slate-200 rounded-lg py-3 px-4 text-navy focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div className="flex flex-col gap-2">
                   <label className="text-xs font-bold text-navy uppercase tracking-widest">Description</label>
                   <input value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))}
                     className="w-full bg-white border border-slate-200 rounded-lg py-3 px-4 text-navy focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div className="flex flex-col gap-2">
                   <label className="text-xs font-bold text-navy uppercase tracking-widest">Min Size</label>
                   <input type="number" value={form.size_min} onChange={e => setForm(f => ({...f, size_min: e.target.value}))}
                     className="w-full bg-white border border-slate-200 rounded-lg py-3 px-4 text-navy focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div className="flex flex-col gap-2">
                   <label className="text-xs font-bold text-navy uppercase tracking-widest">Max Size</label>
                   <input type="number" value={form.size_max} onChange={e => setForm(f => ({...f, size_max: e.target.value}))}
                     className="w-full bg-white border border-slate-200 rounded-lg py-3 px-4 text-navy focus:ring-2 focus:ring-primary outline-none" />
                </div>
             </div>

             <div className="space-y-3">
                <label className="text-xs font-bold text-navy uppercase tracking-widest">Target Goals</label>
                <div className="flex flex-wrap gap-2">
                  {GOAL_KEYS.map(k => (
                    <button key={k} onClick={() => toggleGoal(k)}
                      className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                        form.goals.includes(k) ? 'bg-primary text-white border-primary' : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                      {GOAL_META[k].label}
                    </button>
                  ))}
                </div>
             </div>

             <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-navy uppercase tracking-widest">Constraints / Notes</label>
                <textarea value={form.constraints} onChange={e => setForm(f => ({...f, constraints: e.target.value}))}
                   rows={4} className="w-full bg-white border border-slate-200 rounded-lg py-3 px-4 text-navy focus:ring-2 focus:ring-primary outline-none resize-none" />
             </div>

             <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button onClick={() => setEditing(null)} className="px-6 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button onClick={save} className="px-8 py-2 font-bold text-white bg-primary rounded-lg shadow-md">Save Changes</button>
             </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
