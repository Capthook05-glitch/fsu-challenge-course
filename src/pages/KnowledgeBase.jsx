import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSupabaseClient } from '../lib/supabase';
import { GOAL_KEYS, GOAL_META } from '../lib/goalMeta';
import { GameCard } from '../components/games/GameCard';

const supabase = getSupabaseClient();

export default function KnowledgeBase() {
  const [games, setGames] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  useEffect(() => {
    async function load() {
      const [{ data: gs }, { data: ts }] = await Promise.all([
        supabase.from('games').select('*').eq('is_active', true).order('name'),
        supabase.from('session_templates').select('*').eq('is_public', true).order('name'),
      ]);
      setGames(gs || []);
      setTemplates(ts || []);
      setLoading(false);
    }
    load();
  }, []);

  const filteredGames = tab === 'all' ? games : games.filter(g => g.goals?.includes(tab));

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-6 lg:px-20 py-12 bg-background-light dark:bg-background-dark min-h-screen font-display">
      <header className="mb-12 border-b border-slate-200 dark:border-primary/20 pb-8">
        <div className="max-w-3xl">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">Knowledge Base</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            A curated collection of team-building activity blocks and program templates designed for high-impact facilitation at FSU Challenge.
          </p>
        </div>
      </header>

      <div className="flex flex-col gap-10">
        <div className="flex items-center gap-6 overflow-x-auto pb-2 scrollbar-hide">
           <TabBtn label="All Resources" active={tab === 'all'} onClick={() => setTab('all')} />
           {GOAL_KEYS.map(k => (
              <TabBtn key={k} label={GOAL_META[k].label} active={tab === k} onClick={() => setTab(k)} />
           ))}
        </div>

        <section className="space-y-16">
           <div>
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-2xl font-bold flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">ac_unit</span>
                    Activities
                 </h3>
                 <Link to="/games" className="text-primary font-bold text-sm flex items-center gap-1 hover:underline">
                    View Catalog <span className="material-symbols-outlined text-sm">arrow_forward</span>
                 </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {filteredGames.slice(0, 6).map(g => (
                    <GameCard key={g.id} game={g} />
                 ))}
              </div>
           </div>

           {tab === 'all' && (
              <div>
                 <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-bold flex items-center gap-3">
                       <span className="material-symbols-outlined text-primary">hub</span>
                       Public Templates
                    </h3>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {templates.map(tpl => (
                       <Link to={`/templates`} key={tpl.id} className="group p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary/30 transition-all shadow-sm">
                          <h4 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">{tpl.name}</h4>
                          <p className="text-sm text-slate-500 line-clamp-2 mb-4">{tpl.description}</p>
                          <div className="flex items-center gap-4 text-xs text-slate-400 font-bold uppercase">
                             <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">reorder</span> {tpl.blocks?.length || 0} blocks</span>
                          </div>
                       </Link>
                    ))}
                 </div>
              </div>
           )}
        </section>

        <div className="mt-20 p-12 rounded-2xl bg-primary text-white text-center shadow-xl">
           <h2 className="text-3xl font-extrabold mb-4">Contribute to the Library</h2>
           <p className="max-w-2xl mx-auto mb-8 text-white/90 font-medium">
              Have a new activity block or variation that worked well? Share it with the facilitator community.
           </p>
           <Link to="/admin" className="inline-block px-8 py-3 bg-white text-primary rounded-lg font-black uppercase tracking-wider text-sm hover:bg-slate-50 transition-colors shadow-lg">
              Create Game
           </Link>
        </div>
      </div>
    </div>
  );
}

function TabBtn({ label, active, onClick }) {
   return (
      <button onClick={onClick} className={`whitespace-nowrap px-6 py-2 rounded-full font-bold text-sm transition-all ${active ? 'bg-primary text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-primary/10'}`}>
         {label}
      </button>
   );
}
