import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { getSupabaseClient } from '../lib/supabase';
import { useProfile } from '../context/ProfileContext';
import { TimelineBlock } from '../components/timeline/TimelineBlock';
import { BlockEditor } from '../components/timeline/BlockEditor';
import { GoalTag } from '../components/ui/GoalTag';

const supabase = getSupabaseClient();

function recalcStartTimes(blocks) {
  let t = 0;
  return blocks.map(b => { const u = { ...b, start_time: t }; t += b.duration_min; return u; });
}

export default function TimelinePlanner() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile, isAdmin } = useProfile();

  const [session, setSession]     = useState(null);
  const [blocks, setBlocks]       = useState([]);
  const [games, setGames]         = useState({});
  const [editBlock, setEditBlock] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [allGames, setAllGames]   = useState([]);
  const [showAddGame, setShowAddGame] = useState(false);
  const [gameSearch, setGameSearch]   = useState('');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

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
      const [{ data: sess }, , { data: gs }] = await Promise.all([
        supabase.from('sessions').select('*').eq('id', id).single(),
        loadBlocks(),
        supabase.from('games').select('*').eq('is_active', true).order('name'),
      ]);
      if (sess) { setSession(sess); }
      setAllGames(gs || []);
      setLoading(false);
    }
    load();
  }, [id]);

  const summary = useMemo(() => {
    const totalMin = blocks.reduce((s, b) => s + b.duration_min, 0);
    const allGoals = new Set();
    Object.values(games).forEach(g => g.goals?.forEach(gl => allGoals.add(gl)));
    return { totalMin, allGoals: [...allGoals] };
  }, [blocks, games]);

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

  if (loading) return <div className="p-10 text-slate-400">Loading planner...</div>;

  return (
    <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-4 md:px-10 py-8">
      {/* Summary Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="flex flex-col gap-1 rounded-xl p-5 border border-primary/20 bg-primary/5">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Blocks</p>
          <div className="flex items-baseline gap-2">
            <p className="text-white text-2xl font-bold">{blocks.length}</p>
          </div>
        </div>
        <div className="flex flex-col gap-1 rounded-xl p-5 border border-primary/20 bg-primary/5">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Est. Duration</p>
          <div className="flex items-baseline gap-2">
            <p className="text-white text-2xl font-bold">{summary.totalMin} min</p>
            <span className="text-slate-500 text-xs">Buffer inc.</span>
          </div>
        </div>
        <div className="flex flex-col gap-1 rounded-xl p-5 border border-primary/20 bg-primary/5">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Focus Goals</p>
          <div className="flex items-center gap-2">
             {summary.allGoals.slice(0,3).map(g => <GoalTag key={g} goal={g} size="sm" />)}
             {summary.allGoals.length === 0 && <span className="text-slate-600">None set</span>}
          </div>
        </div>
        <div className="flex flex-col gap-1 rounded-xl p-5 border border-primary/20 bg-primary/5">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Status</p>
          <div className="flex items-center gap-2">
            <span className={`flex h-2 w-2 rounded-full ${session.status === 'ready' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            <p className={`text-lg font-bold capitalize ${session.status === 'ready' ? 'text-emerald-400' : 'text-amber-400'}`}>
               {session.status}
            </p>
          </div>
        </div>
      </div>

      {/* Sequence Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-white text-xl font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">reorder</span>
          Planned Sequence
        </h2>
        {canEdit && (
          <button
            onClick={() => setShowAddGame(true)}
            className="text-accent-gold text-sm font-semibold flex items-center gap-1 hover:underline"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            Add Activity
          </button>
        )}
      </div>

      {/* Vertical List of Blocks */}
      <div className="flex flex-col gap-4 mb-12">
        {blocks.length === 0 ? (
           <div className="text-center py-20 bg-slate-800/20 rounded-2xl border-2 border-dashed border-slate-700">
              <p className="text-slate-500">No blocks added yet.</p>
           </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
              {blocks.map((block, i) => (
                <TimelineBlock
                  key={block.id}
                  block={block}
                  index={i}
                  game={games[block.game_id]}
                  onEdit={setEditBlock}
                  readOnly={!canEdit}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-slate-800 pt-8 pb-12">
        <div className="flex gap-4 order-2 sm:order-1">
          <button onClick={() => window.print()} className="flex items-center gap-2 text-accent-gold hover:text-accent-gold/80 font-semibold text-sm transition-colors border border-accent-gold/30 px-4 py-2 rounded-lg">
            <span className="material-symbols-outlined text-lg">download</span>
            Export PDF
          </button>
          {/* <button className="flex items-center gap-2 text-slate-400 hover:text-white font-semibold text-sm transition-colors border border-slate-700 px-4 py-2 rounded-lg">
            <span className="material-symbols-outlined text-lg">share</span>
            Share
          </button> */}
        </div>
        <button
          onClick={() => navigate(`/sessions/${id}/facilitate`)}
          className="w-full sm:w-auto flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-primary/20 transition-all transform hover:-translate-y-0.5 order-1 sm:order-2"
        >
          <span className="material-symbols-outlined">play_circle</span>
          START FACILITATION MODE
        </button>
      </div>

      {/* Block Editor Modal */}
      {editBlock && canEdit && (
        <BlockEditor
          block={editBlock}
          allGames={allGames}
          onSave={() => { setEditBlock(null); loadBlocks(); }}
          onDelete={() => { setEditBlock(null); loadBlocks(); }}
          onClose={() => setEditBlock(null)}
        />
      )}

      {/* Add Block Overlay */}
      {showAddGame && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-slate-900 border border-primary/20 rounded-xl w-full max-w-lg shadow-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-xl font-bold text-white">Add Block</h3>
                 <button onClick={() => setShowAddGame(false)} className="text-slate-400 hover:text-white">
                    <span className="material-symbols-outlined">close</span>
                 </button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-6">
                 {['activity','debrief','break','custom'].map(t => (
                    <button key={t} onClick={() => { if(t!=='activity') addBlock(t); else { /* logic for choosing game */ } }}
                       className="p-4 rounded-lg bg-slate-800 border border-slate-700 hover:border-primary text-slate-300 font-bold capitalize transition-colors">
                       {t}
                    </button>
                 ))}
              </div>
              {/* Simple Game Picker within this modal for now */}
              <input value={gameSearch} onChange={e => setGameSearch(e.target.value)}
                placeholder="Search games..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white mb-4" />
              <div className="max-h-60 overflow-y-auto space-y-2">
                 {allGames.filter(g => !gameSearch || g.name.toLowerCase().includes(gameSearch.toLowerCase())).slice(0, 10).map(g => (
                    <button key={g.id} onClick={() => addBlock('activity', g.id, g)}
                       className="w-full text-left p-3 rounded-lg bg-slate-800/50 hover:bg-primary/10 border border-slate-700 text-sm text-slate-200">
                       {g.name}
                    </button>
                 ))}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
