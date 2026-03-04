import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getSupabaseClient } from '../lib/supabase';
import { GoalTag } from '../components/ui/GoalTag';

export function FacilitationMode() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sessionGames, setSessionGames] = useState([]);
  const [sessionName, setSessionName] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    Promise.all([
      supabase.from('sessions').select('name').eq('id', id).single(),
      supabase.from('session_games').select('id, position, facilitator_note, game:games(*)').eq('session_id', id).order('position'),
    ]).then(([{ data: s }, { data: sg }]) => {
      setSessionName(s?.name ?? '');
      setSessionGames(sg ?? []);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (!timerRunning) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      setTimerSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [timerRunning]);

  async function endSession() {
    const supabase = getSupabaseClient();
    await supabase.from('sessions').update({ status: 'completed' }).eq('id', id);
    navigate(`/sessions/${id}`);
  }

  function toggleTimer() {
    setTimerRunning((r) => !r);
  }

  function resetTimer() {
    setTimerRunning(false);
    setTimerSeconds(0);
  }

  function goTo(index) {
    resetTimer();
    setCurrentIndex(index);
  }

  function fmtTime(s) {
    const m = Math.floor(s / 60);
    const sec = String(s % 60).padStart(2, '0');
    return `${m}:${sec}`;
  }

  function timerColor(s, game) {
    if (s > game.time_max * 60) return '#ef4444'; // over
    if (s > game.time_min * 60) return '#f5a623'; // warning
    return '#CEB069'; // normal gold
  }

  function timerStatus(s, game) {
    if (s > game.time_max * 60) return '⚠ Over time';
    if (s > game.time_min * 60) return '⚡ In the zone';
    return `Target: ${game.time_min}–${game.time_max} min`;
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-fsu-navy text-fsu-muted">Loading…</div>;

  if (sessionGames.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-fsu-navy flex-col gap-4 text-fsu-muted">
        <p>No games in this session.</p>
        <Link to={`/sessions/${id}`} className="text-fsu-gold hover:underline">← Back to planner</Link>
      </div>
    );
  }

  if (currentIndex >= sessionGames.length) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-fsu-navy flex-col gap-6 px-6 text-center">
        <p className="text-5xl">🎉</p>
        <h1 className="text-3xl font-bold text-fsu-gold" style={{ fontFamily: 'Syne' }}>Session Complete!</h1>
        <p className="text-fsu-muted">All {sessionGames.length} games finished.</p>
        <button
          onClick={endSession}
          className="rounded-xl px-7 py-3 font-bold text-white hover:brightness-110 transition-all"
          style={{ background: 'linear-gradient(135deg, #782F40, #9e3a4d)', fontFamily: 'Syne' }}
        >
          Mark as Completed & Exit
        </button>
      </div>
    );
  }

  const sg = sessionGames[currentIndex];
  const game = sg.game;
  const tColor = timerColor(timerSeconds, game);

  return (
    <div className="min-h-screen bg-fsu-navy flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-fsu-border bg-fsu-bg2 px-6 py-3">
        <Link to={`/sessions/${id}`} className="text-sm text-fsu-muted hover:text-white transition-colors">← Exit</Link>
        <span className="text-sm text-fsu-muted">{sessionName}</span>
        <span className="text-sm text-fsu-faint">{currentIndex + 1} / {sessionGames.length}</span>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5 px-6 py-2 bg-fsu-bg2 border-b border-fsu-border">
        {sessionGames.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className="h-1.5 flex-1 rounded-full transition-all"
            style={{
              background: i < currentIndex ? '#3ecf8e' : i === currentIndex ? '#CEB069' : '#1e2d45',
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-6 py-8 max-w-2xl mx-auto w-full space-y-6">
        {/* Game header */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-fsu-faint mb-1">
            Game {currentIndex + 1} of {sessionGames.length}
          </p>
          <h1 className="text-3xl font-bold text-white leading-tight" style={{ fontFamily: 'Syne' }}>{game.name}</h1>
          <div className="flex flex-wrap gap-3 mt-2 text-sm text-fsu-muted">
            <span>👥 {game.min_group}–{game.max_group} people</span>
            <span>⏱ {game.time_min}–{game.time_max} min</span>
            <span>🏃 <span className="capitalize">{game.activity_level}</span></span>
            {game.setting?.map((s) => <span key={s}>📍 {s}</span>)}
          </div>
        </div>

        {/* Count-up Timer */}
        <div className="rounded-xl border border-fsu-border bg-fsu-bg2 p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-fsu-faint mb-3">Activity Timer</p>
          <div
            className="text-5xl font-bold mb-1 transition-colors"
            style={{ fontFamily: 'Syne', color: tColor, letterSpacing: '-0.02em' }}
          >
            {fmtTime(timerSeconds)}
          </div>
          <p className="text-xs mb-4" style={{ color: tColor }}>{timerStatus(timerSeconds, game)}</p>
          <div className="flex gap-2">
            <button
              onClick={toggleTimer}
              className="rounded-lg px-5 py-2 text-sm font-bold transition-all"
              style={timerRunning
                ? { background: '#162035', color: '#e8edf5', border: '1px solid #1e2d45' }
                : { background: '#782F40', color: '#fff', border: '1px solid #782F40' }
              }
            >
              {timerRunning ? '⏸ Pause' : '▶ Start'}
            </button>
            <button
              onClick={resetTimer}
              className="rounded-lg px-4 py-2 text-sm font-semibold transition-all"
              style={{ background: '#162035', color: '#7a90b0', border: '1px solid #1e2d45' }}
            >
              ↺ Reset
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="rounded-xl border border-fsu-border bg-fsu-bg2 p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-fsu-faint mb-3">Activity Description</p>
          <p className="leading-relaxed" style={{ color: '#e8edf5', fontSize: '15px', lineHeight: '1.65' }}>{game.description}</p>
        </div>

        {/* Goals */}
        {game.goals?.length > 0 && (
          <div className="rounded-xl border border-fsu-border bg-fsu-bg2 p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-fsu-faint mb-3">Goal Focus</p>
            <div className="flex flex-wrap gap-2">
              {game.goals.map((g) => <GoalTag key={g} goal={g} size="lg" />)}
            </div>
          </div>
        )}

        {/* Materials */}
        {game.materials && (
          <div className="rounded-xl border border-fsu-border bg-fsu-bg2 p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-fsu-faint mb-3">Materials Needed</p>
            <p style={{ color: '#e8edf5' }}>{game.materials}</p>
          </div>
        )}

        {/* Facilitation tips */}
        {game.facilitation && (
          <div className="rounded-xl border border-fsu-border bg-fsu-bg2 p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-fsu-faint mb-3">Facilitation & Debrief Notes</p>
            <p className="whitespace-pre-wrap leading-relaxed" style={{ color: '#e8edf5', fontSize: '15px', lineHeight: '1.65' }}>{game.facilitation}</p>
          </div>
        )}

        {/* Per-session facilitator note */}
        {sg.facilitator_note && (
          <div className="rounded-xl border p-5" style={{ borderColor: 'rgba(206,176,105,0.3)', background: 'rgba(206,176,105,0.05)', borderLeft: '3px solid #CEB069' }}>
            <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#CEB069' }}>Your Session Note</p>
            <p style={{ color: '#e8edf5' }}>{sg.facilitator_note}</p>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="border-t border-fsu-border bg-fsu-bg2 px-6 py-4 flex items-center justify-between gap-4">
        <button
          onClick={() => goTo(currentIndex - 1)}
          disabled={currentIndex === 0}
          className="rounded-xl px-6 py-2.5 font-semibold transition-all disabled:opacity-30"
          style={{ background: '#162035', color: '#e8edf5', border: '1px solid #1e2d45' }}
        >
          ← Prev
        </button>
        <button onClick={endSession} className="text-xs text-fsu-faint hover:text-fsu-muted transition-colors">
          End Session
        </button>
        <button
          onClick={() => goTo(currentIndex + 1)}
          className="rounded-xl px-6 py-2.5 font-bold text-white transition-all hover:brightness-110"
          style={{ background: 'linear-gradient(135deg, #782F40, #9e3a4d)', fontFamily: 'Syne' }}
        >
          {currentIndex === sessionGames.length - 1 ? 'Finish →' : 'Next →'}
        </button>
      </div>
    </div>
  );
}
