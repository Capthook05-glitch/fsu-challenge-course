import { useState, useEffect } from 'react';
import { getSupabaseClient } from '../lib/supabase';
import { useProfile } from '../context/ProfileContext';
import { GoalTag } from '../components/ui/GoalTag';
import { GOAL_KEYS, GOAL_META } from '../lib/goalMeta';

const supabase = getSupabaseClient();

const BLANK = {
  name: '', description: '', goals: [], min_group: 4, max_group: 20,
  time_min: 10, time_max: 30, activity_level: 'medium', setting: ['outdoor'],
  facilitation: '', materials: '', is_active: true,
};

export default function AdminPanel() {
  const { profile } = useProfile();
  const [games, setGames] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [loading, setLoading] = useState(true);

  async function loadGames() {
    const { data } = await supabase.from('games').select('*').order('name');
    setGames(data || []);
    setLoading(false);
  }
  useEffect(() => { loadGames(); }, []);

  function openNew() { setEditing('new'); setForm(BLANK); }
  function openEdit(g) { setEditing(g.id); setForm(g); }

  async function saveGame() {
    if (editing === 'new') {
      await supabase.from('games').insert(form);
    } else {
      await supabase.from('games').update(form).eq('id', editing);
    }
    setEditing(null);
    loadGames();
  }

  function toggleGoal(g) {
    setForm(f => ({ ...f, goals: f.goals.includes(g) ? f.goals.filter(x => x !== g) : [...f.goals, g] }));
  }

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden font-display">
      {/* Sidebar - Simplified for Admin Panel context */}
      <aside className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col no-print">
        <div className="p-6 flex items-center gap-3">
          <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center text-accent-gold">
            <span className="material-symbols-outlined text-2xl">account_tree</span>
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight leading-none text-slate-900 dark:text-slate-100">FSU Toolkit</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Facilitator Admin</p>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
           <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-primary bg-primary/10 font-bold border-l-4 border-primary">
              <span className="material-symbols-outlined">sports_esports</span>
              <span>Game Management</span>
           </button>
           {/* Add more admin links here if needed */}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-background-light dark:bg-background-dark">
         <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md px-8 flex items-center justify-between z-10">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Game Management</h2>
            <button
              onClick={openNew}
              className="bg-primary text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-primary/90 transition-all"
            >
              + Add New Game
            </button>
         </header>

         <div className="flex-1 overflow-y-auto p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
               {games.map(g => (
                  <div key={g.id} className="bg-white dark:bg-slate-900/40 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col">
                     <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">{g.name}</h3>
                        <span className={`w-2 h-2 rounded-full ${g.is_active ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
                     </div>
                     <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">{g.description}</p>
                     <div className="flex flex-wrap gap-1 mb-6">
                        {g.goals?.slice(0, 3).map(gl => <GoalTag key={gl} goal={gl} size="sm" />)}
                     </div>
                     <div className="mt-auto flex gap-2">
                        <button onClick={() => openEdit(g)} className="flex-1 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">Edit</button>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </main>

      {/* Edit/Add Modal Overlay - Inline representation based on design syntax */}
      {editing && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
               <div className="flex flex-col gap-1">
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                     <span className="material-symbols-outlined text-primary">edit_note</span>
                     {editing === 'new' ? 'Add Game' : 'Edit Game'}
                  </h2>
               </div>
               <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-navy transition-colors">
                  <span className="material-symbols-outlined">close</span>
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
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
                     <label className="text-xs font-bold text-navy dark:text-accent-gold uppercase tracking-widest block">Group Size</label>
                     <div className="flex items-center gap-4">
                        <input
                           type="number"
                           value={form.min_group}
                           onChange={e => setForm({...form, min_group: parseInt(e.target.value)})}
                           className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white outline-none"
                           placeholder="Min"
                        />
                        <input
                           type="number"
                           value={form.max_group}
                           onChange={e => setForm({...form, max_group: parseInt(e.target.value)})}
                           className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white outline-none"
                           placeholder="Max"
                        />
                     </div>
                  </div>
               </div>
            </div>

            <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 flex items-center justify-end gap-3">
               <button onClick={() => setEditing(null)} className="px-6 py-2 text-sm font-bold text-slate-500 hover:text-navy hover:bg-slate-100 rounded-lg transition-all">Cancel</button>
               <button onClick={saveGame} className="px-8 py-2 text-sm font-bold text-white bg-primary hover:bg-primary/95 rounded-lg shadow-md transition-all">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
