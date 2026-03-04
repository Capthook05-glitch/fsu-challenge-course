import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getSupabaseClient } from '../lib/supabase';
import { GoalTag } from '../components/ui/GoalTag';

const supabase = getSupabaseClient();

function fmt(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

export default function FacilitationMode() {
  const { id } = useParams();
  const navigate = useNavigate();
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
      // Load game details
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
  const minSec = (game?.time_min || block?.duration_min || 10) * 60;
  const maxSec = (game?.time_max || block?.duration_min || 30) * 60;

  function timerStyle() {
    if (elapsed >= maxSec) return { color: '#dc2626' };
    if (elapsed >= minSec) return { color: '#d97706' };
    return { color: '#782F40' };
  }

  function timerStatus() {
    if (elapsed >= maxSec) return { label: 'Over time', bg: '#fee2e2', color: '#dc2626' };
    if (elapsed >= minSec) return { label: 'In the zone', bg: '#fef3c7', color: '#d97706' };
    return { label: running ? 'Running' : 'Ready', bg: '#F5F2EE', color: '#78716C' };
  }

  const status = timerStatus();

  return (
    <div className="min-h-screen bg-fsu-white flex flex-col">
      {/* Top bar */}
      <div className="bg-fsu-garnet text-white px-4 py-3 flex items-center justify-between no-print">
        <Link to={`/sessions/${id}`} className="text-white/70 hover:text-white text-sm">&larr; Back</Link>
        <span className="font-syne font-bold text-sm truncate max-w-xs">{session?.name}</span>
        <span className="text-white/50 text-sm">{idx+1}/{blocks.length}</span>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5 justify-center px-4 py-3 no-print">
        {blocks.map((_, i) => (
          <button
            key={i}
            onClick={() => { setIdx(i); resetTimer(); }}
            className="h-2 rounded-full transition-all"
            style={{ width: i === idx ? 24 : 8, background: i === idx ? '#782F40' : '#E8E2D9' }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 max-w-2xl mx-auto w-full">
        {block ? (
          <>
            {/* Activity title */}
            <h1 className="font-syne font-bold text-3xl md:text-4xl text-fsu-text text-center mb-2">{title}</h1>

            {/* Goals */}
            {game?.goals?.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center mb-4">
                {game.goals.map(g => <GoalTag key={g} goal={g} size="lg" />)}
              </div>
            )}

            {/* Meta */}
            <div className="flex gap-4 text-sm text-fsu-muted mb-8">
              {game && <span>{game.min_group}–{game.max_group} people</span>}
              {(game || block) && <span>{(game?.time_min || block?.duration_min)}–{(game?.time_max || block?.duration_min)} min</span>}
              {block?.location && <span>{block.location}</span>}
            </div>

            {/* Timer */}
            <div className="text-center mb-6">
              <div className="font-syne font-bold text-7xl mb-2 tabular-nums" style={timerStyle()}>
                {fmt(elapsed)}
              </div>
              <span className="text-sm font-semibold px-3 py-1 rounded-full" style={{ background: status.bg, color: status.color }}>
                {status.label}
              </span>
            </div>

            {/* Timer controls */}
            <div className="flex gap-3 mb-8 no-print">
              <button onClick={() => setRunning(r => !r)}
                className="bg-fsu-garnet hover:bg-fsu-garnet2 text-white px-6 py-2.5 rounded-xl font-semibold transition-colors">
                {running ? 'Pause' : 'Start'}
              </button>
              <button onClick={resetTimer}
                className="border border-fsu-border2 text-fsu-muted hover:text-fsu-text px-4 py-2.5 rounded-xl transition-colors">
                Reset
              </button>
            </div>

            {/* Notes */}
            {(block?.notes || game?.facilitation) && (
              <div className="w-full bg-fsu-soft border border-fsu-border rounded-xl p-4 mb-4 text-sm text-fsu-muted leading-relaxed">
                {block?.notes || game?.facilitation}
              </div>
            )}
          </>
        ) : (
          <p className="text-fsu-muted">No blocks in this session.</p>
        )}
      </div>

      {/* Bottom nav */}
      <div className="px-6 py-4 flex gap-3 justify-center no-print">
        <button onClick={prevBlock} disabled={idx === 0}
          className="border border-fsu-border2 text-fsu-text px-6 py-2.5 rounded-xl font-medium disabled:opacity-30 hover:border-fsu-garnet transition-colors">
          &larr; Previous
        </button>
        {idx < blocks.length - 1 ? (
          <button onClick={nextBlock}
            className="bg-fsu-garnet hover:bg-fsu-garnet2 text-white px-6 py-2.5 rounded-xl font-medium transition-colors">
            Next &rarr;
          </button>
        ) : (
          <Link to={`/sessions/${id}`}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors">
            Finish Session
          </Link>
        )}
      </div>
    </div>
  );
}
