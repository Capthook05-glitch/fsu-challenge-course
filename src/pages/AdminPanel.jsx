import { useState, useEffect } from 'react';
import { getSupabaseClient } from '../lib/supabase';
import { useProfile } from '../context/ProfileContext';
import { GoalTag } from '../components/ui/GoalTag';
import { GOAL_KEYS, GOAL_META } from '../lib/goalMeta';
import { stripEmojis } from '../lib/utils';
import { GameEditor, BLANK_GAME } from '../components/admin/GameEditor';

const supabase = getSupabaseClient();

export default function AdminPanel() {
  const { profile } = useProfile();
  const [games, setGames] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('games');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [loading, setLoading] = useState(true);

  async function loadGames() {
    const { data } = await supabase.from('games').select('*').order('name');
    setGames(data || []);
  }

  async function loadUsers() {
    const { data } = await supabase.from('profiles').select('*').order('username');
    setUsers(data || []);
  }

  useEffect(() => {
    Promise.all([loadGames(), loadUsers()]).then(() => setLoading(false));
  }, []);

  async function toggleRole(userId, currentRole) {
    const roleCycle = { 'facilitator': 'planner', 'planner': 'admin', 'admin': 'facilitator' };
    const nextRole = roleCycle[currentRole] || 'facilitator';
    await supabase.from('profiles').update({ role: nextRole }).eq('id', userId);
    loadUsers();
  }

  function openNew() { setEditing('new'); setForm(BLANK_GAME); }
  function openEdit(g) { setEditing(g.id); setForm(g); }

  function toggleGoal(g) {
    setForm(f => ({ ...f, goals: f.goals.includes(g) ? f.goals.filter(x => x !== g) : [...f.goals, g] }));
  }

  return (
    <div className="flex h-screen overflow-hidden font-display">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col no-print">
        <div className="p-8 flex items-center gap-3">
          <div className="h-10 w-10 bg-primary rounded flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-2xl">account_tree</span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight leading-none text-navy-deep uppercase">FSU Toolkit</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Facilitator Admin</p>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-1 mt-4">
           <button onClick={() => setActiveTab('games')} className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-semibold transition-colors ${activeTab === 'games' ? 'text-primary bg-primary/5 border-l-4 border-primary' : 'text-slate-600 hover:bg-slate-50 hover:text-primary border-l-4 border-transparent'}`}>
              <span className="material-symbols-outlined text-xl">sports_esports</span>
              Game Management
           </button>
           <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-semibold transition-colors ${activeTab === 'users' ? 'text-primary bg-primary/5 border-l-4 border-primary' : 'text-slate-600 hover:bg-slate-50 hover:text-primary border-l-4 border-transparent'}`}>
              <span className="material-symbols-outlined text-xl">group</span>
              Users
           </button>
           <button onClick={() => setActiveTab('sessions')} className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-semibold transition-colors ${activeTab === 'sessions' ? 'text-primary bg-primary/5 border-l-4 border-primary' : 'text-slate-600 hover:bg-slate-50 hover:text-primary border-l-4 border-transparent'}`}>
              <span className="material-symbols-outlined text-xl">history_edu</span>
              Sessions
           </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-background-light dark:bg-background-dark">
         <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md px-8 flex items-center justify-between z-10">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white capitalize">{activeTab} Management</h2>
            {activeTab === 'games' && (
               <button
                 onClick={openNew}
                 className="bg-primary text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
               >
                 + Add New Game
               </button>
            )}
         </header>

         <div className="flex-1 overflow-y-auto p-8">
            {activeTab === 'games' && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
               {games.map(g => (
                  <div key={g.id} className="bg-white dark:bg-slate-900/40 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col">
                     <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">{stripEmojis(g.name)}</h3>
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
            )}
            
            {activeTab === 'users' && (
               <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-widest text-slate-500 font-bold">
                       <th className="p-4">Name / Username</th>
                       <th className="p-4 hidden sm:table-cell">Email</th>
                       <th className="p-4">Role</th>
                       <th className="p-4 text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                     {users.map(u => (
                       <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                         <td className="p-4">
                           <div className="font-bold text-slate-900 dark:text-white">{u.full_name || u.username || 'Unknown'}</div>
                           {u.username && u.full_name && <div className="text-xs text-slate-400">@{u.username}</div>}
                         </td>
                         <td className="p-4 hidden sm:table-cell text-sm text-slate-600 dark:text-slate-400">{u.email}</td>
                         <td className="p-4">
                           <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border
                              ${u.role === 'admin' ? 'bg-primary/10 text-primary border-primary/20' : ''}
                              ${u.role === 'planner' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : ''}
                              ${u.role === 'facilitator' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : ''}`}>
                             {u.role}
                           </span>
                         </td>
                         <td className="p-4 text-right">
                            <button
                               onClick={() => toggleRole(u.id, u.role)}
                               disabled={u.id === profile?.id}
                               className={`px-3 py-1.5 text-xs font-bold rounded border transition-colors ${u.id === profile?.id ? 'text-slate-300 border-slate-200 cursor-not-allowed' : 'text-slate-500 border-slate-200 hover:border-primary hover:text-primary'}`}
                               title={u.id === profile?.id ? "Cannot change your own role" : `Cycle role: ${u.role} -> next`}
                            >
                               Cycle Role
                            </button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            )}
            
            {activeTab === 'sessions' && (
              <div className="text-center py-16 text-slate-400 font-semibold text-sm">
                Session insights coming soon.
              </div>
            )}
         </div>
      </main>

      {/* Edit/Add Modal Overlay */}
      {editing && (
        <GameEditor 
           game={form} 
           onClose={() => setEditing(null)} 
           onSave={() => { setEditing(null); loadGames(); }} 
        />
      )}
    </div>
  );
}
