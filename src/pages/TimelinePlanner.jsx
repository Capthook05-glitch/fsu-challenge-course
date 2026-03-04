import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { getSupabaseClient } from '../lib/supabase';
import { useProfile } from '../context/ProfileContext';
import { GoalTag } from '../components/ui/GoalTag';
import { TimelineBlock } from '../components/timeline/TimelineBlock';
import { SubgroupView } from '../components/timeline/SubgroupView';
import { BlockEditor } from '../components/timeline/BlockEditor';

const supabase = getSupabaseClient();

function recalcStartTimes(blocks) {
  let t = 0;
  return blocks.map(b => { const u = { ...b, start_time: t }; t += b.duration_min; return u; });
}

// ─── Share / Co-facilitator modal ────────────────────────────
function ShareModal({ sessionId, onClose }) {
  const [members, setMembers]     = useState([]);
  const [search, setSearch]       = useState('');
  const [results, setResults]     = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    supabase.from('session_members')
      .select('id, role, profiles(id, name, email)')
      .eq('session_id', sessionId)
      .then(({ data }) => setMembers(data || []));
  }, [sessionId]);

  async function searchUsers(q) {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    const { data } = await supabase.from('profiles')
      .select('id, name, email, role')
      .ilike('email', `%${q}%`)
      .limit(8);
    setResults(data || []);
    setSearching(false);
  }

  async function addMember(profile, memberRole = 'assistant') {
    const existing = members.find(m => m.profiles?.id === profile.id);
    if (existing) return;
    const { data } = await supabase.from('session_members')
      .insert({ session_id: sessionId, profile_id: profile.id, role: memberRole })
      .select('id, role, profiles(id, name, email)')
      .single();
    if (data) setMembers(prev => [...prev, data]);
    setSearch(''); setResults([]);
  }

  async function removeMember(memberId) {
    await supabase.from('session_members').delete().eq('id', memberId);
    setMembers(prev => prev.filter(m => m.id !== memberId));
  }

  const ROLE_LABELS = { assistant: 'Assistant', co_lead: 'Co-Lead' };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
      <div className="bg-fsu-surface border border-fsu-border rounded-2xl w-full max-w-md shadow-xl">
        <div className="px-5 py-4 border-b border-fsu-border flex items-center justify-between">
          <h2 className="font-syne font-bold text-fsu-text">Manage Co-Facilitators</h2>
          <button onClick={onClose} className="text-fsu-muted hover:text-fsu-text text-xl">×</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Search */}
          <div>
            <label className="text-xs font-semibold text-fsu-muted uppercase mb-1.5 block">Add by email</label>
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); searchUsers(e.target.value); }}
              placeholder="Search facilitators by email..."
              className="w-full border border-fsu-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-fsu-garnet text-fsu-text"
            />
            {results.length > 0 && (
              <div className="border border-fsu-border rounded-lg mt-1 overflow-hidden">
                {results.map(p => (
                  <div key={p.id} className="flex items-center justify-between px-3 py-2 hover:bg-fsu-soft">
                    <div>
                      <p className="text-sm font-medium text-fsu-text">{p.name || p.email}</p>
                      <p className="text-xs text-fsu-muted">{p.email}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => addMember(p, 'assistant')}
                        className="text-xs bg-fsu-garnet text-white px-2.5 py-1 rounded-lg">
                        + Assistant
                      </button>
                      <button onClick={() => addMember(p, 'co_lead')}
                        className="text-xs border border-fsu-garnet text-fsu-garnet px-2.5 py-1 rounded-lg">
                        + Co-Lead
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Current members */}
          <div>
            <p className="text-xs font-semibold text-fsu-muted uppercase mb-2">Current Members</p>
            {members.length === 0 && (
              <p className="text-sm text-fsu-faint text-center py-4">No co-facilitators added yet.</p>
            )}
            <div className="space-y-2">
              {members.map(m => (
                <div key={m.id} className="flex items-center justify-between p-3 bg-fsu-soft border border-fsu-border rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-fsu-text">{m.profiles?.name || m.profiles?.email}</p>
                    <p className="text-xs text-fsu-muted">{m.profiles?.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-fsu-garnet/10 text-fsu-garnet border border-fsu-garnet/20 px-2 py-0.5 rounded-full font-medium">
                      {ROLE_LABELS[m.role] || m.role}
                    </span>
                    <button onClick={() => removeMember(m.id)}
                      className="text-xs text-red-500 hover:text-red-700">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────
export default function TimelinePlanner() {
  const { id } = useParams();
  const { profile, isAdmin, canPlan } = useProfile();

  const [session, setSession]     = useState(null);
  const [blocks, setBlocks]       = useState([]);
  const [games, setGames]         = useState({});
  const [editBlock, setEditBlock] = useState(null);
  const [view, setView]           = useState('timeline');
  const [savingName, setSavingName] = useState(false);
  const [nameVal, setNameVal]     = useState('');
  const [notesVal, setNotesVal]   = useState('');
  const [status, setStatus]       = useState('draft');
  const [allGames, setAllGames]   = useState([]);
  const [showAddGame, setShowAddGame] = useState(false);
  const [gameSearch, setGameSearch]   = useState('');
  const [showShare, setShowShare] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Can this user edit this specific session?
  const canEdit = isAdmin || session?.owner_id === profile?.id;

  async function loadBlocks() {
    const { data } = await supabase.from('timeline_blocks')
      .select('*').eq('session_id', id).order('position');
    const blks = data || [];
    setBlocks(blks);
    const gids = [...new Set(blks.filter(b => b.game_id).map(b => b.game_id))];
    if (gids.length) {
      const { data: gs } = await supabase.from('games').select('*').in('id', gids);
      const gmap = {};
      (gs || []).forEach(g => { gmap[g.id] = g; });
      setGames(gmap);
    }
  }

  useEffect(() => {
    async function load() {
      const { data: sess } = await supabase.from('sessions').select('*').eq('id', id).single();
      if (sess) { setSession(sess); setNameVal(sess.name); setNotesVal(sess.notes || ''); setStatus(sess.status); }
      await loadBlocks();
      const { data: gs } = await supabase.from('games').select('*').eq('is_active', true).order('name');
      setAllGames(gs || []);
    }
    load();
  }, [id]);

  async function handleDragEnd(event) {
    if (!canEdit) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = blocks.findIndex(b => b.id === active.id);
    const newIdx = blocks.findIndex(b => b.id === over.id);
    const reordered = arrayMove(blocks, oldIdx, newIdx);
    const recalced  = recalcStartTimes(reordered);
    setBlocks(recalced);
    await Promise.all(recalced.map((b, i) =>
      supabase.from('timeline_blocks').update({ position: i, start_time: b.start_time }).eq('id', b.id)
    ));
  }

  async function addBlock(type, gameId = null, gameData = null) {
    if (!canEdit) return;
    const last = blocks[blocks.length - 1];
    const start_time  = last ? last.start_time + last.duration_min : 0;
    const duration_min = gameData?.time_min || 20;
    const { data } = await supabase.from('timeline_blocks').insert({
      session_id: id, block_type: type, game_id: gameId || null,
      title: gameData?.name || null, start_time, duration_min, position: blocks.length,
    }).select().single();
    if (data) {
      setBlocks(prev => [...prev, data]);
      if (gameId && gameData) setGames(prev => ({ ...prev, [gameId]: gameData }));
    }
    setShowAddGame(false); setGameSearch('');
  }

  async function saveMeta() {
    if (!canEdit) return;
    await supabase.from('sessions').update({ name: nameVal, notes: notesVal, status }).eq('id', id);
    setSession(s => ({ ...s, name: nameVal, notes: notesVal, status }));
    setSavingName(false);
  }

  const summary = useMemo(() => {
    const totalMin = blocks.reduce((s, b) => s + b.duration_min, 0);
    const allGoals = new Set();
    Object.values(games).forEach(g => g.goals?.forEach(gl => allGoals.add(gl)));
    const hasArc = [...allGoals].some(g => ['energizer','trust','problem-solving'].includes(g));
    return { totalMin, allGoals: [...allGoals], arcOk: hasArc };
  }, [blocks, games]);

  function copyFeedbackLink() {
    const url = `${window.location.origin}/feedback/${id}`;
    navigator.clipboard.writeText(url).then(() => alert('Feedback link copied!'));
  }

  function printParticipant() {
    document.body.classList.add('hide-facilitator-fields');
    window.print();
    setTimeout(() => document.body.classList.remove('hide-facilitator-fields'), 500);
  }

  const filteredAllGames = allGames.filter(g =>
    !gameSearch || g.name.toLowerCase().includes(gameSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full min-h-screen bg-fsu-white">
      {/* Top bar */}
      <div className="bg-fsu-surface border-b border-fsu-border px-5 py-3 flex items-center gap-3 flex-wrap no-print">
        <Link to="/sessions" className="text-fsu-muted hover:text-fsu-garnet text-sm flex-shrink-0">&larr; Sessions</Link>

        {/* Session name */}
        {canEdit && savingName ? (
          <div className="flex items-center gap-2 flex-1">
            <input value={nameVal} onChange={e => setNameVal(e.target.value)} autoFocus
              className="border border-fsu-garnet rounded-lg px-2.5 py-1 text-sm font-semibold text-fsu-text focus:outline-none flex-1 max-w-xs" />
            <button onClick={saveMeta} className="bg-fsu-garnet text-white px-3 py-1 rounded-lg text-xs font-semibold">Save</button>
            <button onClick={() => setSavingName(false)} className="text-fsu-muted text-xs">Cancel</button>
          </div>
        ) : (
          <button
            onClick={() => canEdit && setSavingName(true)}
            className={`flex-1 text-left ${canEdit ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <span className={`font-syne font-bold text-fsu-text text-lg ${canEdit ? 'hover:text-fsu-garnet transition-colors' : ''}`}>
              {session?.name || 'Session'}
            </span>
          </button>
        )}

        {/* Read-only banner */}
        {!canEdit && (
          <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full font-medium flex-shrink-0">
            View only
          </span>
        )}

        {/* Status (edit only) */}
        {canEdit && (
          <select value={status} onChange={e => { setStatus(e.target.value); }}
            onBlur={saveMeta}
            className="border border-fsu-border rounded-lg px-2.5 py-1 text-xs text-fsu-text bg-fsu-surface focus:outline-none focus:border-fsu-garnet capitalize flex-shrink-0">
            {['draft','ready','completed'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 flex-shrink-0 flex-wrap">
          {canEdit && (
            <>
              <button onClick={printParticipant}
                className="text-xs border border-fsu-border text-fsu-muted hover:border-fsu-garnet hover:text-fsu-garnet px-3 py-1.5 rounded-lg transition-colors">
                Participant Export
              </button>
              <button onClick={() => window.print()}
                className="text-xs border border-fsu-border text-fsu-muted hover:border-fsu-garnet hover:text-fsu-garnet px-3 py-1.5 rounded-lg transition-colors">
                Facilitator Guide
              </button>
              <button onClick={() => setShowShare(true)}
                className="text-xs border border-fsu-border text-fsu-muted hover:border-fsu-garnet hover:text-fsu-garnet px-3 py-1.5 rounded-lg transition-colors">
                Share
              </button>
            </>
          )}
          <Link to={`/sessions/${id}/facilitate`}
            className="bg-fsu-garnet hover:bg-fsu-garnet2 text-white text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors">
            Facilitate
          </Link>
        </div>
      </div>

      {/* Summary bar */}
      <div className="bg-fsu-soft border-b border-fsu-border px-5 py-3 flex flex-wrap gap-6 items-center no-print">
        <div className="text-center">
          <p className="text-xs text-fsu-muted">Blocks</p>
          <p className="font-syne font-bold text-fsu-garnet text-lg">{blocks.length}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-fsu-muted">Total Time</p>
          <p className="font-syne font-bold text-fsu-text text-lg">{summary.totalMin} min</p>
        </div>
        {summary.allGoals.length > 0 && (
          <div>
            <p className="text-xs text-fsu-muted mb-1">Goals</p>
            <div className="flex flex-wrap gap-1">
              {summary.allGoals.map(g => <GoalTag key={g} goal={g} />)}
            </div>
          </div>
        )}
        <div>
          <p className="text-xs text-fsu-muted mb-1">Arc</p>
          {summary.arcOk
            ? <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">Balanced</span>
            : <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">Check Arc</span>
          }
        </div>
        <button onClick={copyFeedbackLink} className="ml-auto text-xs text-fsu-muted hover:text-fsu-garnet transition-colors">
          Copy Feedback Link
        </button>
      </div>

      {/* View toggle + add toolbar (edit only) */}
      <div className="px-5 py-3 flex items-center gap-4 no-print">
        <div className="flex gap-1 bg-fsu-soft rounded-xl p-1">
          {['timeline','subgroup'].map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                view === v ? 'bg-fsu-surface text-fsu-garnet shadow-sm border border-fsu-border' : 'text-fsu-muted hover:text-fsu-text'
              }`}>{v} View</button>
          ))}
        </div>

        {canEdit && (
          <div className="flex gap-1.5 ml-auto">
            {['activity','debrief','break','custom'].map(t => (
              <button key={t}
                onClick={() => t === 'activity' ? setShowAddGame(true) : addBlock(t)}
                className="text-xs border border-fsu-border text-fsu-muted hover:border-fsu-garnet hover:text-fsu-garnet px-2.5 py-1.5 rounded-lg capitalize transition-colors">
                + {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Game picker (edit only) */}
      {showAddGame && canEdit && (
        <div className="mx-5 mb-3 bg-fsu-surface border border-fsu-border rounded-xl p-3 no-print">
          <input value={gameSearch} onChange={e => setGameSearch(e.target.value)}
            placeholder="Search activities to add..."
            className="w-full border border-fsu-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-fsu-garnet text-fsu-text mb-2" />
          <div className="max-h-40 overflow-y-auto space-y-1">
            {filteredAllGames.slice(0,15).map(g => (
              <button key={g.id} onClick={() => addBlock('activity', g.id, g)}
                className="w-full text-left px-3 py-2 text-sm text-fsu-text hover:bg-fsu-soft rounded-lg transition-colors flex items-center justify-between">
                <span>{g.name}</span>
                <span className="text-xs text-fsu-muted">{g.time_min}–{g.time_max} min</span>
              </button>
            ))}
          </div>
          <button onClick={() => setShowAddGame(false)} className="text-xs text-fsu-muted hover:text-fsu-text mt-2">Cancel</button>
        </div>
      )}

      {/* Notes (edit only) */}
      {canEdit && (
        <div className="px-5 pb-3 no-print">
          <textarea value={notesVal} onChange={e => setNotesVal(e.target.value)} onBlur={saveMeta}
            placeholder="Session notes..." rows={2}
            className="w-full border border-fsu-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-fsu-garnet text-fsu-text resize-none bg-fsu-surface" />
        </div>
      )}

      {/* Blocks */}
      <div className="flex-1 overflow-y-auto px-5 pb-8">
        {blocks.length === 0 && (
          <div className="text-center py-16 text-fsu-muted">
            <p className="text-lg font-medium mb-2">No blocks yet</p>
            {canEdit
              ? <p className="text-sm">Use the buttons above to add activities, debriefs, and breaks.</p>
              : <p className="text-sm">This session has no blocks added yet.</p>
            }
          </div>
        )}

        {view === 'timeline' && blocks.length > 0 && (
          canEdit ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {blocks.map(block => (
                    <TimelineBlock
                      key={block.id}
                      block={block}
                      game={block.game_id ? games[block.game_id] : null}
                      onEdit={setEditBlock}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            /* Read-only list — no drag, no edit button */
            <div className="space-y-2">
              {blocks.map(block => (
                <TimelineBlock
                  key={block.id}
                  block={block}
                  game={block.game_id ? games[block.game_id] : null}
                  onEdit={() => {}} /* no-op for read-only */
                  readOnly
                />
              ))}
            </div>
          )
        )}

        {view === 'subgroup' && blocks.length > 0 && (
          <SubgroupView blocks={blocks} games={games} onEdit={canEdit ? setEditBlock : () => {}} />
        )}
      </div>

      {/* Block editor (edit only) */}
      {editBlock && canEdit && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40 no-print" onClick={() => setEditBlock(null)} />
          <BlockEditor
            block={editBlock}
            onSave={() => { setEditBlock(null); loadBlocks(); }}
            onDelete={() => { setEditBlock(null); loadBlocks(); }}
            onClose={() => setEditBlock(null)}
          />
        </>
      )}

      {/* Share modal */}
      {showShare && <ShareModal sessionId={id} onClose={() => setShowShare(false)} />}
    </div>
  );
}
