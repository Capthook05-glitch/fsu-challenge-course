import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getSupabaseClient } from '../lib/supabase';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { GameCard } from '../components/games/GameCard';

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
    const { data } = await supabase.from('session_games').insert({ session_id: id, game_id: game.id, position: nextPos }).select('id, position, facilitator_note, game:games(*)').single();
    if (data) {
      setSessionGames((prev) => [...prev, data]);
      setPickerGames((prev) => prev.filter((g) => g.id !== game.id));
    }
  }

  function exportText() {
    const lines = [
      `Session: ${session.name}`,
      session.notes ? `Notes: ${session.notes}` : '',
      '',
      ...sessionGames.map((sg, i) =>
        [`${i + 1}. ${sg.game.name} (${sg.game.time_min}–${sg.game.time_max} min)`,
         `   ${sg.game.description}`,
         sg.game.materials ? `   Materials: ${sg.game.materials}` : '',
         sg.facilitator_note ? `   Note: ${sg.facilitator_note}` : '',
         ''
        ].filter(Boolean).join('\n')
      ),
    ].filter((l) => l !== undefined).join('\n');

    const blob = new Blob([lines], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${session.name}.txt`; a.click();
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

  if (loading) return <p className="text-slate-400">Loading session…</p>;
  if (error) return <p className="text-red-400">{error}</p>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/sessions" className="text-slate-500 hover:text-slate-300 text-sm">← Sessions</Link>
      </div>

      {/* Session meta */}
      <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-5 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <input
            defaultValue={session.name}
            onBlur={(e) => saveField('name', e.target.value)}
            className="flex-1 bg-transparent text-xl font-semibold text-slate-100 outline-none border-b border-transparent focus:border-fsu-gold/50"
          />
          <div className="flex items-center gap-2 flex-shrink-0">
            {saveStatus === 'saving' && <span className="text-xs text-slate-500">Saving…</span>}
            {saveStatus === 'saved' && <span className="text-xs text-green-500">Saved</span>}
            <select
              value={session.status}
              onChange={(e) => changeStatus(e.target.value)}
              className="rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-200 outline-none"
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
          className="w-full bg-transparent text-sm text-slate-400 outline-none resize-none placeholder-slate-600 border-b border-transparent focus:border-slate-700"
        />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Link
          to={`/sessions/${id}/facilitate`}
          className="rounded-md bg-fsu-garnet px-4 py-2 text-sm font-medium hover:brightness-110"
        >
          ▶ Start Facilitation
        </Link>
        <button onClick={exportText} className="rounded-md bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700">
          Export .txt
        </button>
        <button onClick={copyFeedbackLink} className="rounded-md bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700">
          {copyMsg || 'Copy Feedback Link'}
        </button>
      </div>

      {/* Games list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500">
            Games ({sessionGames.length})
          </h2>
          <button onClick={openPicker} className="rounded-md bg-slate-800 px-3 py-1.5 text-xs hover:bg-slate-700">
            + Add Game
          </button>
        </div>

        {sessionGames.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-slate-500">
            No games added yet.{' '}
            <button onClick={openPicker} className="text-fsu-gold hover:underline">Add a game</button>
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
      <Modal open={showPicker} onClose={() => setShowPicker(false)} title="Add Game" wide>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Search…"
            value={pickerSearch}
            onChange={(e) => setPickerSearch(e.target.value)}
            className="w-full rounded-md bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:ring-1 focus:ring-fsu-gold/50"
          />
          <div className="grid gap-3 sm:grid-cols-2 max-h-96 overflow-y-auto pr-1">
            {filteredPicker.map((game) => (
              <GameCard key={game.id} game={game} onAdd={addGame} />
            ))}
            {filteredPicker.length === 0 && <p className="col-span-2 text-center text-slate-500 py-8">No games available.</p>}
          </div>
        </div>
      </Modal>
    </div>
  );
}

function GameRow({ sg, index, total, onMoveUp, onMoveDown, onRemove, onSaveNote }) {
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState(sg.facilitator_note ?? '');

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/70">
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="text-slate-600 text-xs w-5 text-center">{index + 1}</span>
        <div className="flex flex-col gap-0.5">
          <button onClick={onMoveUp} disabled={index === 0} className="text-slate-600 hover:text-slate-300 disabled:opacity-20 text-xs leading-none">▲</button>
          <button onClick={onMoveDown} disabled={index === total - 1} className="text-slate-600 hover:text-slate-300 disabled:opacity-20 text-xs leading-none">▼</button>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-slate-100 font-medium truncate">{sg.game.name}</p>
          <p className="text-xs text-slate-500">{sg.game.time_min}–{sg.game.time_max} min · <span className="capitalize">{sg.game.activity_level}</span></p>
        </div>
        <button onClick={() => setExpanded((e) => !e)} className="text-slate-500 hover:text-slate-300 text-xs px-2">{expanded ? '▲' : '▼'}</button>
        <button onClick={onRemove} className="text-red-800 hover:text-red-400 text-xs">Remove</button>
      </div>
      {expanded && (
        <div className="border-t border-slate-800 px-4 py-3 space-y-2">
          <p className="text-xs text-slate-400">{sg.game.description}</p>
          {sg.game.materials && <p className="text-xs text-slate-500">Materials: {sg.game.materials}</p>}
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => onSaveNote(note)}
            rows={2}
            placeholder="Facilitator note for this game…"
            className="w-full rounded bg-slate-800 px-2 py-1.5 text-xs text-slate-300 placeholder-slate-600 outline-none resize-none"
          />
        </div>
      )}
    </div>
  );
}
