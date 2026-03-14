import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getSupabaseClient } from '../lib/supabase';
import { GoalTag } from '../components/ui/GoalTag';
import { useProfile } from '../context/ProfileContext';

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

  function resetTimer() { setElapsed(0); setRunning(false); }
  function nextBlock() { if (idx < blocks.length - 1) { setIdx(i => i+1); resetTimer(); } }
  function prevBlock() { if (idx > 0) { setIdx(i => i-1); resetTimer(); } }

  const block = blocks[idx];
  const game  = block?.game_id ? games[block.game_id] : null;
  const title = game?.name || block?.title || 'Break';

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-background-dark text-slate-100 font-display">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4 lg:px-20 bg-background-dark/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="text-primary">
            <span className="material-symbols-outlined text-3xl">school</span>
          </div>
          <div className="flex flex-col">
            <h2 className="text-lg font-bold leading-tight tracking-tight text-slate-100">FSU Facilitator Toolkit</h2>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">Facilitation Mode</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2">
            <div className="flex gap-1.5">
               {blocks.map((_, i) => (
                  <div key={i} className={`h-2 rounded-full transition-all ${i < idx ? 'bg-primary w-2' : i === idx ? 'bg-accent-gold w-8' : 'bg-white/20 w-2'}`}></div>
               ))}
            </div>
            <span className="ml-2 text-sm font-bold text-accent-gold uppercase tracking-tighter">Block {idx + 1} of {blocks.length}</span>
          </div>
          <div className="flex gap-3">
            <button onClick={prevBlock} disabled={idx === 0} className="flex items-center justify-center rounded-lg h-10 px-4 bg-white/5 hover:bg-white/10 text-white text-sm font-bold transition-colors disabled:opacity-30">
              <span className="material-symbols-outlined mr-2 text-lg">chevron_left</span>Prev
            </button>
            <button onClick={nextBlock} disabled={idx === blocks.length - 1} className="flex items-center justify-center rounded-lg h-10 px-4 bg-primary hover:bg-primary/90 text-white text-sm font-bold transition-colors disabled:opacity-30">
              Next<span className="material-symbols-outlined ml-2 text-lg">chevron_right</span>
            </button>
            <div className="w-px h-8 bg-white/10 mx-1"></div>
            <button onClick={() => navigate(`/sessions/${id}`)} className="flex items-center justify-center rounded-lg h-10 px-4 border border-white/20 hover:bg-white/5 text-slate-300 text-sm font-bold transition-colors">
              Exit
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-6 lg:px-20 py-10 max-w-[1400px] mx-auto w-full">
        {/* Title Section */}
        <div className="text-center mb-8">
          <p className="text-accent-gold font-bold uppercase tracking-[0.2em] text-xs mb-2">Current Activity</p>
          <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight mb-6">{title}</h1>
          <div className="flex flex-wrap justify-center gap-4">
            {game && (
              <>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                  <span className="material-symbols-outlined text-accent-gold text-lg">groups</span>
                  <span className="text-sm font-semibold text-slate-200">{game.min_group}-{game.max_group} People</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                  <span className="material-symbols-outlined text-accent-gold text-lg">schedule</span>
                  <span className="text-sm font-semibold text-slate-200">{game.time_min}-{game.time_max} mins</span>
                </div>
              </>
            )}
             <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                <span className="material-symbols-outlined text-accent-gold text-lg">bolt</span>
                <span className="text-sm font-semibold text-slate-200 capitalize">{block?.block_type}</span>
             </div>
             {block?.location && (
               <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                 <span className="material-symbols-outlined text-accent-gold text-lg">forest</span>
                 <span className="text-sm font-semibold text-slate-200">{block.location}</span>
               </div>
             )}
          </div>
        </div>

        {/* Timer Section */}
        <div className="w-full max-w-2xl bg-white/5 rounded-2xl p-8 border border-white/10 flex flex-col items-center mb-12">
          <div className="flex gap-4 mb-2">
            <div className="flex flex-col items-center">
              <span className="text-7xl md:text-9xl font-black text-accent-gold tabular-nums leading-none">{String(mins).padStart(2,'0')}</span>
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-2">Minutes</span>
            </div>
            <span className="text-7xl md:text-9xl font-black text-accent-gold/40 leading-none">:</span>
            <div className="flex flex-col items-center">
              <span className="text-7xl md:text-9xl font-black text-accent-gold tabular-nums leading-none">{String(secs).padStart(2,'0')}</span>
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-2">Seconds</span>
            </div>
          </div>
          <div className="flex gap-4 mt-6">
            <button onClick={resetTimer} className="flex items-center justify-center rounded-full h-12 w-12 bg-white/10 hover:bg-white/20 text-white transition-colors">
              <span className="material-symbols-outlined">restart_alt</span>
            </button>
            <button onClick={() => setRunning(!running)} className="flex items-center justify-center rounded-full h-14 px-8 bg-accent-gold hover:bg-accent-gold/90 text-background-dark font-black uppercase tracking-widest transition-transform active:scale-95">
              <span className="material-symbols-outlined mr-2">{running ? 'pause' : 'play_arrow'}</span> {running ? 'Pause' : 'Start'}
            </button>
          </div>
        </div>

        {/* Content Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          <div className="bg-white/5 rounded-xl border border-white/10 p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-primary">description</span>
              <h3 className="text-xl font-bold text-white">Activity Description</h3>
            </div>
            <div className="space-y-4 text-slate-300 leading-relaxed">
               <p>{game?.description || 'No description available.'}</p>
               {game?.learning_objectives?.length > 0 && (
                 <ul className="list-disc pl-5 space-y-2 text-slate-400">
                    {game.learning_objectives.map((o, i) => <li key={i}>{o}</li>)}
                 </ul>
               )}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-white/5 rounded-xl border border-white/10 p-8 flex-1">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-primary">campaign</span>
                <h3 className="text-xl font-bold text-white">Facilitation Notes</h3>
              </div>
              <div className="space-y-4 text-slate-300 leading-relaxed">
                 <p>{block?.notes || game?.facilitation || 'No specific notes for this block.'}</p>
                 {game?.safety_notes && (
                    <div className="pt-4 border-t border-white/10">
                       <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Safety Considerations</h4>
                       <p className="text-sm text-slate-400">{game.safety_notes}</p>
                    </div>
                 )}
              </div>
            </div>

            <div className="bg-primary/10 rounded-lg p-6 border-l-4 border-accent-gold shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-accent-gold text-sm">edit_note</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent-gold">Facilitator Reminder</span>
              </div>
              <p className="text-slate-100 font-medium">Keep an eye on group energy levels and adjust the pace if needed.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto px-6 py-4 bg-background-dark/80 backdrop-blur-md border-t border-white/5 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/20 rounded text-green-400 text-[10px] font-bold uppercase">
            <span className={`h-1.5 w-1.5 rounded-full bg-green-500 ${running ? 'animate-pulse' : ''}`}></span> Live Session
          </div>
          <span className="text-slate-500 text-xs font-medium italic">Assigned to: {profile?.name || profile?.email}</span>
        </div>
        <div className="flex items-center gap-6">
          <button className="text-slate-400 hover:text-white transition-colors">
            <span className="material-symbols-outlined">settings</span>
          </button>
          <div className="h-8 w-8 rounded-full bg-primary/40 border border-primary/60 flex items-center justify-center text-[10px] font-bold text-white">
            {profile?.name?.[0] || 'U'}
          </div>
        </div>
      </footer>
    </div>
  );
}
