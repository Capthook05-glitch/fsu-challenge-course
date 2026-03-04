import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getSupabaseClient } from '../lib/supabase';
import { Modal } from '../components/ui/Modal';
import { GameCard } from '../components/games/GameCard';
import { GoalTag } from '../components/ui/GoalTag';
import { GOAL_META } from '../lib/goalMeta';

export function SessionPlanner() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [sessionGames, setSessionGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [pickerGames, setPickerGames] = useState([]);
  const [pickerSearch, setPickerSearch] = useState('');
  const [copyMsg, setCopyMsg] = useState('');
  const [saveStatus, setSaveStatus] = useState('');

  const load = useCallback(async () => {
    const supabase = getSupabaseClient();
    const [{ data: s, error: sErr }, { data: sg }] = await Promise.all([
      supabase.from('sessions').select('*').eq('id', id).single(),
      supabase.from('session_games').select('id, position, facilitator_note, game:games(*)').eq('session_id', id).order('position'),
    ]);
    if (sErr) { setError('Session not found.'); setLoading(false); return; }
    setSession(s);
    setSessionGames(sg ?? []);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Session summary calculations
  const summary = useMemo(() => {
    if (!sessionGames.length) return null;
    const sumMin = sessionGames.reduce((acc, sg) => acc + (sg.game?.time_min ?? 0), 0);
    const sumMax = sessionGames.reduce((acc, sg) => acc + (sg.game?.time_max ?? 0), 0);
    const allGoals = [...new Set(sessionGames.flatMap((sg) => sg.game?.goals ?? []))];
    const hasEnergizer = allGoals.includes('energizer');
    const hasDebrief = allGoals.includes('trust') || allGoals.includes('problem-solving');
    const arcOk = hasEnergizer || hasDebrief;
    return { sumMin, sumMax, allGoals, arcOk };
  }, [sessionGames]);

  async function saveField(field, value) {
    setSaveStatus('saving');
    const supabase = getSupabaseClient();
    await supabase.from('sessions').update({ [field]: value }).eq('id', id);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus(''), 1500);
  }

  async function changeStatus(status) {
    const supabase = getSupabaseClient();
    await supabase.from('sessions').update({ status }).eq('id', id);
    setSession((s) => ({ ...s, status }));
  }

  async function removeGame(sgId) {
    const supabase = getSupabaseClient();
    await supabase.from('session_games').delete().eq('id', sgId);
    const remaining = sessionGames.filter((sg) => sg.id !== sgId);
    await reorder(remaining);
  }

  async function reorder(newOrder) {
    const supabase = getSupabaseClient();
    const updated = newOrder.map((sg, i) => ({ ...sg, position: i + 1 }));
    setSessionGames(updated);
    await Promise.all(updated.map((sg) => supabase.from('session_games').update({ position: sg.position }).eq('id', sg.id)));
  }

  function moveUp(index) {
    if (index === 0) return;
    const next = [...sessionGames];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    reorder(next);
  }

  function moveDown(index) {
    if (index === sessionGames.length - 1) return;
    const next = [...sessionGames];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    reorder(next);
  }

  async function saveNote(sgId, note) {
    const supabase = getSupabaseClient();
    await supabase.from('session_games').update({ facilitator_note: note }).eq('id', sgId);
  }

  async function openPicker() {
    const supabase = getSupabaseClient();
    const existingIds = sessionGames.map((sg) => sg.game.id);
    const { data } = await supabase.from('games').select('*').eq('is_active', true).order('name');
    setPickerGames((data ?? []).filter((g) => !existingIds.includes(g.id)));
    setShowPicker(true);
  }

  async function addGame(game) {
    const supabase = getSupabaseClient();
    const nextPos = (sessionGames[sessionGames.length - 1]?.position ?? 0) + 1;
    const { data } = await supabase
      .from('session_games')
      .insert({ session_id: id, game_id: game.id, position: nextPos })
      .select('id, position, facilitator_note, game:games(*)')
      .single();
    if (data) {
      setSessionGames((prev) => [...prev, data]);
      setPickerGames((prev) => prev.filter((g) => g.id !== game.id));
    }
  }

  function exportText() {
    const today = new Date().toLocaleDateString();
    const totalMin = summary?.sumMin ?? 0;
    const totalMax = summary?.sumMax ?? 0;
    const allGoals = summary?.allGoals?.join(', ') ?? '';

    const lines = [
      '═══════════════════════════════════════════════════',
      '  FSU CHALLENGE COURSE — SESSION PLAN',
      '═══════════════════════════════════════════════════',
      `  ${session.name}`,
      `  Date: ${today}   Games: ${sessionGames.length}   Est. Time: ${totalMin}–${totalMax} min`,
      allGoals ? `  Goals: ${allGoals}` : '',
      session.notes ? `  Notes: ${session.notes}` : '',
      '═══════════════════════════════════════════════════',
      '',
      ...sessionGames.map((sg, i) => {
        const g = sg.game;
        return [
          `${i + 1}. ${g.name.toUpperCase()}`,
          `   ⏱  ${g.time_min}–${g.time_max} min   👥  ${g.min_group}–${g.max_group} people   🏃  ${g.activity_level} activity`,
          g.goals?.length ? `   🎯  ${g.goals.join(', ')}` : '',
          g.setting?.length ? `   📍  ${g.setting.join(', ')}` : '',
          '',
          '   DESCRIPTION',
          `   ${g.description}`,
          '',
          g.facilitation ? `   FACILITATION NOTES\n   ${g.facilitation}` : '',
          g.materials ? `   MATERIALS: ${g.materials}` : '',
          sg.facilitator_note ? `   YOUR NOTE: ${sg.facilitator_note}` : '',
          '',
          '───────────────────────────────────────────────────',
          '',
        ].filter(Boolean).join('\n');
      }),
    ].filter(Boolean).join('\n');

    const blob = new Blob([lines], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.name.replace(/\s+/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function copyFeedbackLink() {
    const url = `${window.location.origin}/feedback/${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopyMsg('Copied!');
      setTimeout(() => setCopyMsg(''), 2000);
    });
  }

  const filteredPicker = pickerGames.filter((g) =>
    !pickerSearch || g.name.toLowerCase().includes(pickerSearch.toLowerCase())
  );

  const btnCls = 'rounded-lg px-4 py-2 text-sm font-semibold transition-all';

  if (loading) return <p className="text-fsu-muted">Loading session…</p>;
  if (error) return <p className="text-red-400">{error}</p>;

  return (
    <div className="space-y-5">
      {/* Back link */}
      <Link to="/sessions" className="text-xs text-fsu-muted hover:text-fsu-gold transition-colors">← My Sessions</Link>

      {/* Session name + status */}
      <div className="rounded-xl border border-fsu-border bg-fsu-bg2 p-5 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <input
            defaultValue={session.name}
            onBlur={(e) => saveField('name', e.target.value)}
            className="flex-1 bg-transparent text-xl font-bold text-white outline-none border-b-2 border-transparent focus:border-fsu-gold/50 transition-colors"
            style={{ fontFamily: 'Syne' }}
          />
          <div className="flex items-center gap-2 flex-shrink-0">
            {saveStatus === 'saving' && <span className="text-xs text-fsu-muted">Saving…</span>}
            {saveStatus === 'saved' && <span className="text-xs" style={{ color: '#3ecf8e' }}>Saved</span>}
            <select
              value={session.status}
              onChange={(e) => changeStatus(e.target.value)}
              className="rounded-md px-2 py-1 text-xs outline-none"
              style={{ background: '#162035', border: '1px solid #1e2d45', color: '#e8edf5' }}
            >
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
        <textarea
          defaultValue={session.notes ?? ''}
          onBlur={(e) => saveField('notes', e.target.value)}
          rows={2}
          placeholder="Session notes…"
          className="w-full bg-transparent text-sm outline-none resize-none placeholder-fsu-faint border-b border-transparent focus:border-fsu-border2 transition-colors"
          style={{ color: '#7a90b0' }}
        />
      </div>

      {/* Session summary bar */}
      {summary && sessionGames.length > 0 && (
        <div className="flex flex-wrap gap-5 rounded-xl border border-fsu-border bg-fsu-bg2 px-5 py-4">
          <SummaryItem label="Games" value={sessionGames.length} />
          <SummaryItem label="Total Time" value={`${summary.sumMin}–${summary.sumMax} min`} />
          <div>
            <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#3a4f6a' }}>Goals</p>
            <div className="flex flex-wrap gap-1">
              {summary.allGoals.map((g) => {
                const meta = GOAL_META[g];
                return meta ? <span key={g} title={g} className="text-base">{meta.emoji}</span> : null;
              })}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#3a4f6a' }}>Session Arc</p>
            <span
              className="inline-block rounded-md px-2 py-0.5 text-xs font-bold"
              style={summary.arcOk
                ? { background: 'rgba(62,207,142,0.1)', color: '#3ecf8e', border: '1px solid rgba(62,207,142,0.2)' }
                : { background: 'rgba(245,166,35,0.1)', color: '#f5a623', border: '1px solid rgba(245,166,35,0.2)' }
              }
            >
              {summary.arcOk ? '✓ Balanced' : '⚠ Check Arc'}
            </span>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <Link
          to={`/sessions/${id}/facilitate`}
          className={`${btnCls} text-white hover:brightness-110`}
          style={{ background: 'linear-gradient(135deg, #782F40, #9e3a4d)' }}
        >
          ▶ Start Facilitation
        </Link>
        <button onClick={exportText} className={btnCls} style={{ background: '#162035', color: '#e8edf5', border: '1px solid #1e2d45' }}>
          📄 Export as Text
        </button>
        <button onClick={() => window.print()} className={btnCls} style={{ background: '#162035', color: '#e8edf5', border: '1px solid #1e2d45' }}>
          🖨 Print Plan
        </button>
        <button onClick={copyFeedbackLink} className={btnCls} style={{ background: '#162035', color: '#e8edf5', border: '1px solid #1e2d45' }}>
          {copyMsg || '🔗 Copy Feedback Link'}
        </button>
      </div>

      {/* Games list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wide" style={{ color: '#3a4f6a' }}>
            Games ({sessionGames.length})
          </h2>
          <button
            onClick={openPicker}
            className="rounded-md px-3 py-1.5 text-xs font-semibold transition-all"
            style={{ background: '#162035', color: '#7a90b0', border: '1px solid #1e2d45' }}
          >
            + Add Game
          </button>
        </div>

        {sessionGames.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-fsu-border p-10 text-center" style={{ color: '#3a4f6a' }}>
            <p className="mb-2">No games added yet.</p>
            <button onClick={openPicker} className="text-fsu-gold text-sm hover:underline">Add a game</button>
          </div>
        ) : (
          <div className="space-y-2">
            {sessionGames.map((sg, i) => (
              <GameRow
                key={sg.id}
                sg={sg}
                index={i}
                total={sessionGames.length}
                onMoveUp={() => moveUp(i)}
                onMoveDown={() => moveDown(i)}
                onRemove={() => removeGame(sg.id)}
                onSaveNote={(note) => saveNote(sg.id, note)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Game picker modal */}
      <Modal open={showPicker} onClose={() => setShowPicker(false)} title="Add Game to Session" wide>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Search games…"
            value={pickerSearch}
            onChange={(e) => setPickerSearch(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: '#162035', border: '1px solid #1e2d45', color: '#e8edf5' }}
          />
          <div className="grid gap-3 sm:grid-cols-2 max-h-[28rem] overflow-y-auto pr-1">
            {filteredPicker.map((game) => (
              <GameCard key={game.id} game={game} onAdd={addGame} />
            ))}
            {filteredPicker.length === 0 && (
              <p className="col-span-2 text-center py-8 text-fsu-muted">No games available.</p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#3a4f6a' }}>{label}</p>
      <p className="text-base font-bold text-fsu-gold">{value}</p>
    </div>
  );
}

function GameRow({ sg, index, total, onMoveUp, onMoveDown, onRemove, onSaveNote }) {
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState(sg.facilitator_note ?? '');

  return (
    <div className="rounded-xl border border-fsu-border bg-fsu-bg2 hover:border-fsu-border2 transition-colors">
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Number badge */}
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
          style={{ background: '#782F40', fontFamily: 'Syne' }}>
          {index + 1}
        </div>
        {/* Reorder arrows */}
        <div className="flex flex-col gap-0.5">
          <button onClick={onMoveUp} disabled={index === 0} className="text-fsu-faint hover:text-fsu-muted disabled:opacity-20 text-xs leading-none transition-colors">▲</button>
          <button onClick={onMoveDown} disabled={index === total - 1} className="text-fsu-faint hover:text-fsu-muted disabled:opacity-20 text-xs leading-none transition-colors">▼</button>
        </div>
        {/* Game info */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm truncate" style={{ fontFamily: 'Syne' }}>{sg.game.name}</p>
          <p className="text-xs text-fsu-muted">{sg.game.time_min}–{sg.game.time_max} min · <span className="capitalize">{sg.game.activity_level}</span></p>
        </div>
        {/* Goal tags (first 2) */}
        <div className="hidden sm:flex gap-1">
          {sg.game.goals?.slice(0, 2).map((g) => <GoalTag key={g} goal={g} />)}
        </div>
        {/* Expand toggle */}
        <button onClick={() => setExpanded((e) => !e)} className="text-fsu-faint hover:text-fsu-muted text-xs px-2 transition-colors">
          {expanded ? '▲' : '▼'}
        </button>
        {/* Remove */}
        <button onClick={onRemove} className="text-xs transition-colors" style={{ color: '#3a4f6a' }}
          onMouseEnter={(e) => e.target.style.color = '#ef4444'}
          onMouseLeave={(e) => e.target.style.color = '#3a4f6a'}
        >
          🗑
        </button>
      </div>

      {expanded && (
        <div className="border-t border-fsu-border px-4 py-3 space-y-3">
          <p className="text-xs" style={{ color: '#9aabbc' }}>{sg.game.description}</p>
          {sg.game.facilitation && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#3a4f6a' }}>Facilitation Notes</p>
              <p className="text-xs" style={{ color: '#b8ccd8' }}>{sg.game.facilitation}</p>
            </div>
          )}
          {sg.game.materials && (
            <p className="text-xs text-fsu-muted">Materials: {sg.game.materials}</p>
          )}
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => onSaveNote(note)}
            rows={2}
            placeholder="Facilitator note for this game…"
            className="w-full rounded-lg px-3 py-2 text-xs outline-none resize-none transition-colors"
            style={{ background: '#162035', border: '1px solid #1e2d45', color: '#b8ccd8' }}
          />
        </div>
      )}
    </div>
  );
}
