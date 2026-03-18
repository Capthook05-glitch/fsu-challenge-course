import { useState } from 'react';
import { getSupabaseClient } from '../../lib/supabase';
import { stripEmojis } from '../../lib/utils';
import { GOAL_KEYS, GOAL_META } from '../../lib/goalMeta';

const supabase = getSupabaseClient();

export const BLANK_GAME = {
  name: '', description: '', goals: [], min_group: 4, max_group: 20,
  time_min: 10, time_max: 30, activity_level: 'medium', setting: ['outdoor'],
  facilitation: '', materials: '', is_active: true,
};

export function GameEditor({ game = BLANK_GAME, onClose, onSave }) {
  const [form, setForm] = useState(game);
  const isNew = !game.id;

  async function handleSave() {
    const payload = { ...form, name: stripEmojis(form.name) };
    let savedGame = null;
    if (isNew) {
      const { data } = await supabase.from('games').insert(payload).select().single();
      savedGame = data;
    } else {
      const { data } = await supabase.from('games').update(payload).eq('id', game.id).select().single();
      savedGame = data;
    }
    if (onSave) onSave(savedGame);
    onClose();
  }

  function toggleGoal(g) {
    setForm(f => ({ ...f, goals: f.goals.includes(g) ? f.goals.filter(x => x !== g) : [...f.goals, g] }));
  }

  return (
    <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
           <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                 <span className="material-symbols-outlined text-primary">edit_note</span>
                 {isNew ? 'Create New Game' : 'Edit Game'}
              </h2>
           </div>
           <button onClick={onClose} className="text-slate-400 hover:text-navy transition-colors">
              <span className="material-symbols-outlined">close</span>
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 font-display">
           <div className="space-y-6">
              <div className="flex flex-col gap-2">
                 <label className="text-xs font-bold text-navy dark:text-accent-gold uppercase tracking-widest">Game Name</label>
                 <input
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-3 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Enter game name..."
                 />
              </div>
              <div className="flex flex-col gap-2">
                 <label className="text-xs font-bold text-navy dark:text-accent-gold uppercase tracking-widest">Description</label>
                 <textarea
                    value={form.description}
                    onChange={e => setForm({...form, description: e.target.value})}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-3 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none resize-none"
                    rows="3"
                 />
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              <div className="col-span-full space-y-3">
                 <label className="text-xs font-bold text-navy dark:text-accent-gold uppercase tracking-widest">Target Goals</label>
                 <div className="flex flex-wrap gap-2">
                    {GOAL_KEYS.map(k => (
                       <button
                          key={k}
                          type="button"
                          onClick={() => toggleGoal(k)}
                          className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                             form.goals.includes(k)
                                ? 'bg-primary text-white border border-primary'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                          }`}
                       >
                          {GOAL_META[k].label}
                       </button>
                    ))}
                 </div>
              </div>

              <div className="space-y-4">
                 <label className="text-xs font-bold text-navy uppercase tracking-widest block">Group Size</label>
                 <div className="flex items-center gap-4">
                    <div className="flex-1">
                       <p className="text-[10px] text-slate-500 mb-1 font-bold">MIN</p>
                       <input
                          type="number"
                          value={form.min_group}
                          onChange={e => setForm({...form, min_group: parseInt(e.target.value)})}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-navy outline-none focus:ring-1 focus:ring-primary"
                          placeholder="4"
                       />
                    </div>
                    <div className="flex-1">
                       <p className="text-[10px] text-slate-500 mb-1 font-bold">MAX</p>
                       <input
                          type="number"
                          value={form.max_group}
                          onChange={e => setForm({...form, max_group: parseInt(e.target.value)})}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-navy outline-none focus:ring-1 focus:ring-primary"
                          placeholder="20"
                       />
                    </div>
                 </div>
              </div>

              <div className="space-y-4">
                 <label className="text-xs font-bold text-navy uppercase tracking-widest block">Duration (Mins)</label>
                 <div className="flex items-center gap-4">
                    <div className="flex-1">
                       <p className="text-[10px] text-slate-500 mb-1 font-bold">MIN</p>
                       <input
                          type="number"
                          value={form.time_min}
                          onChange={e => setForm({...form, time_min: parseInt(e.target.value)})}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-navy outline-none focus:ring-1 focus:ring-primary"
                          placeholder="10"
                       />
                    </div>
                    <div className="flex-1">
                       <p className="text-[10px] text-slate-500 mb-1 font-bold">MAX</p>
                       <input
                          type="number"
                          value={form.time_max}
                          onChange={e => setForm({...form, time_max: parseInt(e.target.value)})}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-navy outline-none focus:ring-1 focus:ring-primary"
                          placeholder="30"
                       />
                    </div>
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-xs font-bold text-navy uppercase tracking-widest block">Activity Level</label>
                 <select
                    value={form.activity_level}
                    onChange={e => setForm({...form, activity_level: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-lg p-3 text-navy outline-none appearance-none focus:ring-1 focus:ring-primary"
                 >
                    <option value="low">Low (Stationary)</option>
                    <option value="medium">Medium (Movement)</option>
                    <option value="high">High (Active Running)</option>
                 </select>
              </div>

              <div className="space-y-2">
                 <label className="text-xs font-bold text-navy uppercase tracking-widest block">Setting</label>
                 <div className="flex p-1 bg-slate-100 rounded-lg border border-slate-200">
                    {['indoor', 'outdoor', 'both'].map(s => (
                       <button
                          key={s}
                          type="button"
                          onClick={() => setForm({...form, setting: s === 'both' ? ['indoor','outdoor'] : [s]})}
                          className={`flex-1 py-2 text-sm font-semibold rounded transition-all ${
                             (s === 'both' && form.setting?.length === 2) || (form.setting?.length === 1 && form.setting[0] === s)
                                ? 'bg-white shadow-sm text-primary'
                                : 'text-slate-500 hover:text-navy'
                          }`}
                       >
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                       </button>
                    ))}
                 </div>
              </div>
           </div>
        </div>

        <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 flex items-center justify-end gap-3">
           <button onClick={onClose} className="px-6 py-2 text-sm font-bold text-slate-500 hover:text-navy hover:bg-slate-100 rounded-lg transition-all">Cancel</button>
           <button onClick={handleSave} disabled={!form.name} className="px-8 py-2 text-sm font-bold text-white bg-primary hover:bg-primary/95 rounded-lg shadow-md transition-all disabled:opacity-50">Save Game</button>
        </div>
      </div>
    </div>
  );
}
