import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSupabaseClient } from '../lib/supabase';
import { stripEmojis } from '../lib/utils';

const supabase = getSupabaseClient();

export default function SessionScript() {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [blocks, setBlocks]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: sess } = await supabase.from('sessions').select('*').eq('id', id).single();
      const { data: blks } = await supabase.from('timeline_blocks').select('*, game:games(*)').eq('session_id', id).order('position');
      setSession(sess);
      setBlocks(blks || []);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <div className="p-10 text-slate-400">Loading script...</div>;

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full flex flex-col lg:flex-row bg-white dark:bg-background-dark min-h-screen">
       {/* Sidebar Navigation: Document Structure */}
       <aside className="hidden lg:flex w-72 flex-col border-r border-slate-200 dark:border-slate-800 p-6 sticky top-[73px] h-[calc(100vh-73px)] no-print">
          <div className="mb-8">
             <span className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">Session Flow</span>
          </div>
          <nav className="flex flex-col gap-1">
             {blocks.map((b, i) => (
                <a key={b.id} href={`#block-${b.id}`} className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-all">
                   <span className="text-xs font-bold text-slate-300">0{i+1}</span>
                   <span className="truncate">{stripEmojis(b.title || b.game?.name || 'Block')}</span>
                </a>
             ))}
          </nav>
       </aside>

       {/* Main Content Area */}
       <main className="flex-1 min-w-0 bg-white dark:bg-background-dark/40 shadow-sm p-8 lg:p-16">
          <div className="mb-12 border-b border-slate-100 dark:border-slate-800 pb-8">
             <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                <Link to="/sessions" className="hover:text-primary">Sessions</Link>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="text-slate-600 dark:text-slate-300">Facilitator Script</span>
             </div>
             <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white leading-tight tracking-tight mb-4">
                {stripEmojis(session?.name)}
             </h1>
             <p className="text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-2xl">
                Comprehensive facilitator guidelines and safety protocols for this session.
             </p>
          </div>

          <div className="space-y-20">
             {blocks.map((b, i) => (
                <section key={b.id} id={`block-${b.id}`} className="scroll-mt-24">
                   <div className="flex items-center gap-4 mb-6">
                      <span className="text-4xl font-black text-primary/10">0{i+1}</span>
                      <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">{stripEmojis(b.title || b.game?.name || 'Activity')}</h2>
                   </div>

                   <div className="grid md:grid-cols-2 gap-10">
                      <div className="space-y-6">
                         <div>
                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Description</h3>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{b.game?.description || b.notes || 'No description provided.'}</p>
                         </div>
                         {b.game?.facilitation && (
                            <div>
                               <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Facilitation Notes</h3>
                               <p className="text-slate-600 dark:text-slate-300 italic border-l-2 border-primary/20 pl-4">{b.game.facilitation}</p>
                            </div>
                         )}
                      </div>
                      <div className="space-y-6">
                         <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                               <span className="material-symbols-outlined text-sm">gpp_maybe</span>
                               Safety Checklist
                            </h3>
                            <ul className="text-sm space-y-3 text-slate-600 dark:text-slate-400">
                               <li className="flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-accent-gold mt-1.5 shrink-0"></span>
                                  Check environment for hazards.
                               </li>
                               {b.game?.safety_notes && (
                                  <li className="flex items-start gap-2">
                                     <span className="w-1.5 h-1.5 rounded-full bg-accent-gold mt-1.5 shrink-0"></span>
                                     {b.game.safety_notes}
                                  </li>
                               )}
                            </ul>
                         </div>
                         {b.game?.materials && (
                            <div className="p-6 bg-primary/5 rounded-xl border border-primary/10">
                               <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Required Gear</h3>
                               <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{b.game.materials}</p>
                            </div>
                         )}
                      </div>
                   </div>
                </section>
             ))}
          </div>

          <footer className="mt-20 pt-12 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center no-print">
             <button onClick={() => window.print()} className="bg-primary text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:brightness-110 transition-all">Export as PDF</button>
             <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">FSU Challenge Course Toolkit © 2024</p>
          </footer>
       </main>
    </div>
  );
}
