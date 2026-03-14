import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getSupabaseClient } from '../lib/supabase';
import { GoalTag } from '../components/ui/GoalTag';
import { useProfile } from '../context/ProfileContext';
import { stripEmojis } from '../lib/utils';

const supabase = getSupabaseClient();

export default function FacilitationMode() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [session, setSession] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [games, setGames] = useState({});
  const [idx, setIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    async function load() {
      const [{ data: sess }, { data: blks }] = await Promise.all([
        supabase.from('sessions').select('*').eq('id', id).single(),
        supabase.from('timeline_blocks').select('*').eq('session_id', id).order('position'),
      ]);
      setSession(sess);
      const bs = blks || [];
      setBlocks(bs);
      const gids = [...new Set(bs.filter(b => b.game_id).map(b => b.game_id))];
      if (gids.length) {
        const { data: gs } = await supabase.from('games').select('*').in('id', gids);
        const gmap = {};
        (gs || []).forEach(g => { gmap[g.id] = g; });
        setGames(gmap);
      }
    }
    load();
  }, [id]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  async function logAction() {
     await supabase.from('block_logs').insert({
        block_id: block.id,
        session_id: id,
        what_happened: `Facilitator logged action at ${new Date().toLocaleTimeString()}`,
        submitted_by: profile.id
     });
     alert('Progress logged!');
  }

  function goToEvaluation() {
     navigate(`/sessions/${id}/evaluate`);
  }

  function resetTimer() { setElapsed(0); setRunning(false); }
  function nextBlock() { if (idx < blocks.length - 1) { setIdx(i => i+1); resetTimer(); } }
  function prevBlock() { if (idx > 0) { setIdx(i => i-1); resetTimer(); } }

  const block = blocks[idx];
  const game  = block?.game_id ? games[block.game_id] : null;
  const title = stripEmojis(game?.name || block?.title || 'Break');

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-background-light text-navy-dark font-display">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-navy-dark/10 px-6 py-4 lg:px-20 bg-white sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="text-primary">
            <span className="material-symbols-outlined text-3xl">school</span>
          </div>
          <div className="flex flex-col">
            <h2 className="text-lg font-extrabold leading-tight tracking-tight text-navy-dark uppercase">FSU Facilitator Toolkit</h2>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Facilitation Mode</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-4">
            <div className="flex gap-2">
               {blocks.map((_, i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-all ${i < idx ? 'bg-primary w-1.5' : i === idx ? 'bg-accent-gold w-6' : 'bg-slate-200 w-1.5'}`}></div>
               ))}
            </div>
            <span className="text-xs font-bold text-accent-gold uppercase tracking-widest">Game {idx + 1} of {blocks.length}</span>
          </div>
          <div className="flex gap-3">
            <button onClick={prevBlock} disabled={idx === 0} className="flex items-center justify-center rounded-lg h-10 px-4 border border-slate-200 hover:bg-slate-50 text-navy-dark text-sm font-bold transition-colors disabled:opacity-30">
              <span className="material-symbols-outlined mr-2 text-lg">chevron_left</span>Prev
            </button>
            <button onClick={nextBlock} disabled={idx === blocks.length - 1} className="flex items-center justify-center rounded-lg h-10 px-4 bg-primary hover:bg-primary/90 text-white text-sm font-bold transition-colors disabled:opacity-30">
              Next<span className="material-symbols-outlined ml-2 text-lg">chevron_right</span>
            </button>
            <div className="w-px h-8 bg-slate-200 mx-1"></div>
            <button onClick={() => navigate(`/sessions/${id}`)} className="flex items-center justify-center rounded-lg h-10 px-4 border border-slate-200 hover:bg-slate-50 text-slate-500 text-sm font-bold transition-colors">
              Exit
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-6 lg:px-20 py-12 max-w-[1200px] mx-auto w-full">
        {/* Title Section */}
        <div className="text-center mb-12">
          <p className="text-primary font-bold uppercase tracking-[0.25em] text-[10px] mb-4">Current Activity</p>
          <h1 className="text-5xl md:text-7xl font-black text-navy-dark tracking-tighter mb-8 italic">{title}</h1>
          <div className="flex flex-wrap justify-center gap-3">
            {game && (
              <>
                <div className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-lg border border-slate-200 shadow-sm">
                  <span className="material-symbols-outlined text-accent-gold text-lg">groups</span>
                  <span className="text-xs font-bold text-navy-dark uppercase tracking-wide">{game.min_group}-{game.max_group} People</span>
                </div>
                <div className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-lg border border-slate-200 shadow-sm">
                  <span className="material-symbols-outlined text-accent-gold text-lg">schedule</span>
                  <span className="text-xs font-bold text-navy-dark uppercase tracking-wide">{game.time_min}-{game.time_max} mins</span>
                </div>
              </>
            )}
             <div className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-lg border border-slate-200 shadow-sm">
                <span className="material-symbols-outlined text-accent-gold text-lg">bolt</span>
                <span className="text-xs font-bold text-navy-dark uppercase tracking-wide capitalize">{block?.block_type}</span>
             </div>
             {block?.location && (
               <div className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-lg border border-slate-200 shadow-sm">
                 <span className="material-symbols-outlined text-accent-gold text-lg">forest</span>
                 <span className="text-xs font-bold text-navy-dark uppercase tracking-wide">{block.location}</span>
               </div>
             )}
          </div>
        </div>

        {/* Timer Section */}
        <div className="w-full max-w-2xl bg-white rounded-xl p-10 border border-slate-200 shadow-xl shadow-navy-dark/5 flex flex-col items-center mb-16">
          <div className="flex gap-6 mb-4">
            <div className="flex flex-col items-center">
              <span className="text-8xl md:text-9xl font-black text-navy-dark tabular-nums tracking-tighter leading-none">{String(mins).padStart(2,'0')}</span>
              <span className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-extrabold mt-4">Minutes</span>
            </div>
            <span className="text-8xl md:text-9xl font-light text-slate-200 leading-none">:</span>
            <div className="flex flex-col items-center">
              <span className="text-8xl md:text-9xl font-black text-navy-dark tabular-nums tracking-tighter leading-none">{String(secs).padStart(2,'0')}</span>
              <span className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-extrabold mt-4">Seconds</span>
            </div>
          </div>
          <div className="flex gap-4 mt-8">
            <button onClick={resetTimer} className="flex items-center justify-center rounded-full h-12 w-12 border border-slate-200 hover:bg-slate-50 text-navy-dark transition-colors">
              <span className="material-symbols-outlined">restart_alt</span>
            </button>
            <button onClick={() => setRunning(!running)} className="flex items-center justify-center rounded-lg h-14 px-10 bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest transition-transform active:scale-95 shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined mr-2">{running ? 'pause' : 'play_arrow'}</span> {running ? 'Pause' : 'Start'}
            </button>
          </div>
        </div>

        {/* Content Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full">
          <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
              <span className="material-symbols-outlined text-primary">description</span>
              <h3 className="text-xl font-extrabold text-navy-dark uppercase tracking-tight">Activity Description</h3>
            </div>
            <div className="space-y-6 text-slate-600 leading-relaxed">
               <p className="text-lg">{game?.description || 'No description available.'}</p>
               {game?.learning_objectives?.length > 0 && (
                 <ul className="space-y-4">
                    {game.learning_objectives.map((o, i) => (
                      <li key={i} className="flex items-start gap-3">
                         <span className="h-1.5 w-1.5 rounded-full bg-accent-gold mt-2 shrink-0"></span>
                         <span>{o}</span>
                      </li>
                    ))}
                 </ul>
               )}
            </div>
          </div>

          <div className="flex flex-col gap-8">
            <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm flex-1">
              <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
                <span className="material-symbols-outlined text-primary">campaign</span>
                <h3 className="text-xl font-extrabold text-navy-dark uppercase tracking-tight">Facilitation Notes</h3>
              </div>
              <div className="space-y-6 text-slate-600 leading-relaxed">
                 <p className="text-lg font-medium text-navy-dark italic leading-relaxed border-l-2 border-primary/20 pl-6">{block?.notes || game?.facilitation || 'No specific notes for this block.'}</p>
                 {game?.safety_notes && (
                    <div className="pt-6">
                       <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-5">Safety Considerations</h4>
                       <p className="text-sm font-medium text-slate-600">{game.safety_notes}</p>
                    </div>
                 )}
              </div>
            </div>

            <div className="bg-primary/5 rounded-lg p-8 border-l-4 border-accent-gold border-r border-y border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-accent-gold text-sm">edit_note</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Facilitator's Strategic Note</span>
              </div>
              <p className="text-navy-dark font-medium leading-relaxed">Keep an eye on group energy levels and adjust the pace if needed.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto px-6 py-5 bg-white border-t border-slate-200 flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-6">
          <button onClick={logAction} className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded text-[10px] font-bold uppercase hover:bg-primary/20 transition-colors">
             <span className="material-symbols-outlined text-xs">edit_note</span>
             Log Progress
          </button>
          <button onClick={goToEvaluation} className="flex items-center gap-2 px-3 py-1.5 bg-accent-gold/10 text-primary border border-accent-gold/20 rounded text-[10px] font-bold uppercase hover:bg-accent-gold/20 transition-colors">
             <span className="material-symbols-outlined text-xs">verified</span>
             Evaluate Staff
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-600 text-[10px] font-bold uppercase tracking-wider">
            <span className={`h-1.5 w-1.5 rounded-full bg-green-600 ${running ? 'animate-pulse' : ''}`}></span> Live Session
          </div>
          <span className="text-slate-400 text-xs font-bold uppercase tracking-tighter">Assigned to: {profile?.name || profile?.email}</span>
        </div>
        <div className="flex items-center gap-6">
          <button className="text-slate-400 hover:text-navy-dark transition-colors">
            <span className="material-symbols-outlined text-xl">settings</span>
          </button>
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-[11px] font-black text-white shadow-md">
            {(profile?.name?.[0] || profile?.email?.[0] || 'U').toUpperCase()}
          </div>
        </div>
      </footer>
    </div>
  );
}
