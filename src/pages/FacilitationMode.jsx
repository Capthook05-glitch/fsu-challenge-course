import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getSupabaseClient } from '../lib/supabase';

export function FacilitationMode() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sessionGames, setSessionGames] = useState([]);
  const [sessionName, setSessionName] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('');
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
    if (!timerRunning) return;
    intervalRef.current = setInterval(() => {
      setTimerSeconds((s) => {
        if (s <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [timerRunning]);

  async function endSession() {
    const supabase = getSupabaseClient();
    await supabase.from('sessions').update({ status: 'completed' }).eq('id', id);
    navigate(`/sessions/${id}`);
  }

  function startTimer() {
    const mins = Number(customMinutes);
    if (!mins || mins <= 0) return;
    setTimerSeconds(mins * 60);
    setTimerRunning(true);
  }

  function pauseTimer() { setTimerRunning(false); }
  function resumeTimer() { if (timerSeconds > 0) setTimerRunning(true); }
  function resetTimer() { setTimerRunning(false); setTimerSeconds(null); }

  function fmtTime(s) {
    const m = Math.floor(s / 60);
    const sec = String(s % 60).padStart(2, '0');
    return `${m}:${sec}`;
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-fsu-navy text-slate-400">Loading…</div>;

  if (sessionGames.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-fsu-navy flex-col gap-4 text-slate-400">
        <p>No games in this session.</p>
        <Link to={`/sessions/${id}`} className="text-fsu-gold hover:underline">← Back to planner</Link>
      </div>
    );
  }

  if (currentIndex >= sessionGames.length) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-fsu-navy flex-col gap-6 px-6 text-center">
        <h1 className="text-3xl font-bold text-fsu-gold">Session Complete!</h1>
        <p className="text-slate-400">All {sessionGames.length} games finished.</p>
        <button onClick={endSession} className="rounded-md bg-fsu-garnet px-6 py-3 font-medium hover:brightness-110">
          Mark as Completed & Exit
        </button>
      </div>
    );
  }

  const sg = sessionGames[currentIndex];
  const game = sg.game;

  return (
    <div className="min-h-screen bg-fsu-navy flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-3">
        <Link to={`/sessions/${id}`} className="text-sm text-slate-500 hover:text-slate-300">← Exit</Link>
        <span className="text-sm text-slate-400">{sessionName}</span>
        <span className="text-sm text-slate-500">
          {currentIndex + 1} / {sessionGames.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-800">
        <div
          className="h-full bg-fsu-garnet transition-all duration-500"
          style={{ width: `${((currentIndex + 1) / sessionGames.length) * 100}%` }}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-6 py-8 max-w-2xl mx-auto w-full space-y-6">
        {/* Game header */}
        <div>
          <p className="text-xs uppercase text-slate-500 tracking-wide mb-1">
            Game {currentIndex + 1} of {sessionGames.length}
          </p>
          <h1 className="text-3xl font-bold text-fsu-gold">{game.name}</h1>
          <p className="mt-1 text-sm text-slate-400 capitalize">{game.activity_level} activity · {game.time_min}–{game.time_max} min</p>
        </div>

        {/* Timer */}
        <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-5">
          {timerSeconds === null ? (
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max="120"
                placeholder="Minutes"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                className="w-28 rounded-md bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none"
              />
              <button onClick={startTimer} className="rounded-md bg-fsu-garnet px-4 py-2 text-sm font-medium hover:brightness-110">
                Start Timer
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <span className={`text-4xl font-mono font-bold ${timerSeconds <= 30 ? 'text-red-400' : 'text-slate-100'}`}>
                {fmtTime(timerSeconds)}
              </span>
              <div className="flex gap-2">
                {timerRunning ? (
                  <button onClick={pauseTimer} className="rounded-md bg-slate-700 px-3 py-1.5 text-sm hover:bg-slate-600">Pause</button>
                ) : (
                  <button onClick={resumeTimer} className="rounded-md bg-slate-700 px-3 py-1.5 text-sm hover:bg-slate-600">Resume</button>
                )}
                <button onClick={resetTimer} className="rounded-md bg-slate-800 px-3 py-1.5 text-sm hover:bg-slate-700">Reset</button>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <h2 className="text-xs uppercase text-slate-500 mb-2">Description</h2>
          <p className="text-slate-300">{game.description}</p>
        </div>

        {/* Goals */}
        {game.goals?.length > 0 && (
          <div>
            <h2 className="text-xs uppercase text-slate-500 mb-2">Goals</h2>
            <div className="flex flex-wrap gap-1.5">
              {game.goals.map((g) => <span key={g} className="rounded-full bg-slate-700 px-2.5 py-0.5 text-xs text-slate-300">{g}</span>)}
            </div>
          </div>
        )}

        {/* Materials */}
        {game.materials && (
          <div>
            <h2 className="text-xs uppercase text-slate-500 mb-2">Materials</h2>
            <p className="text-slate-300">{game.materials}</p>
          </div>
        )}

        {/* Facilitation tips */}
        {game.facilitation && (
          <div>
            <h2 className="text-xs uppercase text-slate-500 mb-2">Facilitation Tips</h2>
            <p className="text-slate-300 whitespace-pre-wrap">{game.facilitation}</p>
          </div>
        )}

        {/* Per-session facilitator note */}
        {sg.facilitator_note && (
          <div className="rounded-lg border border-fsu-gold/20 bg-fsu-gold/5 p-4">
            <h2 className="text-xs uppercase text-fsu-gold mb-1">Your Note</h2>
            <p className="text-slate-300 text-sm">{sg.facilitator_note}</p>
          </div>
        )}
      </div>

      {/* Bottom navigation */}
      <div className="border-t border-slate-800 bg-slate-950 px-6 py-4 flex items-center justify-between gap-4">
        <button
          onClick={() => { setCurrentIndex((i) => i - 1); resetTimer(); }}
          disabled={currentIndex === 0}
          className="rounded-md bg-slate-800 px-5 py-2.5 font-medium hover:bg-slate-700 disabled:opacity-30"
        >
          ← Prev
        </button>
        <button onClick={endSession} className="text-xs text-slate-600 hover:text-slate-400">End Session</button>
        <button
          onClick={() => { setCurrentIndex((i) => i + 1); resetTimer(); }}
          className="rounded-md bg-fsu-garnet px-5 py-2.5 font-medium hover:brightness-110"
        >
          {currentIndex === sessionGames.length - 1 ? 'Finish →' : 'Next →'}
        </button>
      </div>
    </div>
  );
}
