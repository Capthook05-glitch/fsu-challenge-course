import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { getSupabaseClient } from '../lib/supabase';
import { useProfile } from '../context/ProfileContext';
import { stripEmojis } from '../lib/utils';
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
  const [showShare, setShowShare]     = useState(false);
  const [members, setMembers]         = useState([]);
  const [shareEmail, setShareEmail]   = useState('');
  const [sites, setSites]             = useState([]);
  const [groups, setGroups]           = useState([]);
  const [showSettings, setShowSettings] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const canEdit = isAdmin || session?.owner_id === profile?.id;

  async function loadMembers() {
    const { data } = await supabase.from('session_members')
      .select('*, profiles(name, email)')
      .eq('session_id', id);
    setMembers(data || []);
  }

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
      const [{ data: sess }, , { data: gs }, { data: st }, { data: gr }] = await Promise.all([
        supabase.from('sessions').select('*').eq('id', id).single(),
        loadBlocks(),
        supabase.from('games').select('*').eq('is_active', true).order('name'),
        supabase.from('sites').select('*').order('name'),
        supabase.from('groups').select('*').order('name'),
        loadMembers(),
      ]);
      if (sess) { setSession(sess); }
      setAllGames(gs || []);
      setSites(st || []);
      setGroups(gr || []);
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

  async function handleShare() {
    const { data: prof } = await supabase.from('profiles').select('id').eq('email', shareEmail).single();
    if (prof) {
      await supabase.from('session_members').insert({ session_id: id, profile_id: prof.id, role: 'assistant' });
      setShareEmail('');
      loadMembers();
    }
  }

  async function generateAIDraft() {
    if (!canEdit) return;
    setLoading(true);
    // Mock AI logic: pick 3 games that match 'trust' and 'problem-solving'
    const { data: gs } = await supabase.from('games').select('*').limit(3);
    if (gs) {
       for (const [i, g] of gs.entries()) {
          await supabase.from('timeline_blocks').insert({
             session_id: id, block_type: 'activity', game_id: g.id,
             title: g.name, start_time: i * 30, duration_min: 30, position: i
          });
       }
    }
    loadBlocks();
    setLoading(false);
    alert('AI Draft Generated!');
  }

  async function updateSession(updates) {
    const { data, error } = await supabase.from('sessions').update(updates).eq('id', id).select().single();
    if (!error && data) setSession(data);
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

  if (loading) return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Loading Session Plan...</p>
      </div>
    </div>
  );

  if (!session) return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] p-12 text-center">
       <div className="size-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-slate-300 text-4xl">search_off</span>
       </div>
       <h2 className="text-3xl font-black text-navy-deep tracking-tight mb-2">Session Not Found</h2>
       <p className="text-slate-500 max-w-md mb-8">The session you are looking for might have been deleted or moved. Double check the URL and try again.</p>
       <Link to="/sessions" className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:brightness-110 transition-all shadow-lg shadow-primary/20">
          Back to Sessions
       </Link>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 md:px-10 py-10 bg-background-light min-h-screen font-display">
      {/* Header Section */}
      <div className="mb-8 border-b border-slate-200 pb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-[10px] mb-2">
             <span className="material-symbols-outlined text-sm">event_available</span>
             Session Detail
          </div>
          <h1 className="text-4xl font-black tracking-tight text-navy-deep">{stripEmojis(session?.name)}</h1>
          <p className="text-slate-500 mt-2 text-sm max-w-2xl">{session?.notes || 'No description provided.'}</p>
          <div className="mt-4 flex flex-wrap gap-4 text-xs font-bold uppercase tracking-wide text-slate-400">
             <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">location_on</span>
                {sites.find(s => s.id === session?.site_id)?.name || 'No Site Set'}
             </div>
             <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">group</span>
                {groups.find(g => g.id === session?.group_id)?.name || 'No Group Set'}
             </div>
          </div>
        </div>
        <div className="flex gap-3">
           <button onClick={() => setShowSettings(true)} className="px-5 py-2.5 rounded-lg border border-slate-200 bg-white text-navy-600 font-bold text-sm hover:bg-slate-50 transition-all">
              Settings
           </button>
           <button
             onClick={() => navigate(`/sessions/${id}/facilitate`)}
             className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
           >
             <span className="material-symbols-outlined text-[20px]">play_circle</span>
             Facilitate
           </button>
        </div>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="flex flex-col gap-1 rounded-lg p-5 border border-slate-200 bg-white shadow-sm">
          <p className="text-navy-600 text-xs font-bold uppercase tracking-widest">Total Activities</p>
          <div className="flex items-baseline gap-2">
            <p className="text-navy-900 text-2xl font-extrabold">{blocks.length} Items</p>
          </div>
        </div>
        <div className="flex flex-col gap-1 rounded-lg p-5 border border-slate-200 bg-white shadow-sm">
          <p className="text-navy-600 text-xs font-bold uppercase tracking-widest">Est. Duration</p>
          <div className="flex items-baseline gap-2">
            <p className="text-navy-900 text-2xl font-extrabold">{summary.totalMin} min</p>
            <span className="text-slate-400 text-xs">Buffer inc.</span>
          </div>
        </div>
        <div className="flex flex-col gap-1 rounded-lg p-5 border border-slate-200 bg-white shadow-sm">
          <p className="text-navy-600 text-xs font-bold uppercase tracking-widest">Focus Goals</p>
          <div className="flex items-center gap-3">
             {summary.allGoals.slice(0,3).map(g => (
               <span key={g} className="text-navy-900 font-bold flex items-center gap-1">
                 <span className="material-symbols-outlined text-lg text-primary">target</span>
               </span>
             ))}
             {summary.allGoals.length === 0 && <span className="text-slate-400 text-xs italic">No focus set</span>}
          </div>
        </div>
        <div className="flex flex-col gap-1 rounded-lg p-5 border border-slate-200 bg-white shadow-sm">
          <p className="text-navy-600 text-xs font-bold uppercase tracking-widest">Session Arc</p>
          <div className="flex items-center gap-2">
            <span className={`flex h-2.5 w-2.5 rounded-full ${session.status === 'ready' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            <p className={`text-lg font-extrabold capitalize ${session.status === 'ready' ? 'text-emerald-700' : 'text-amber-700'}`}>
               {session.status === 'ready' ? 'Healthy' : session.status}
            </p>
          </div>
        </div>
      </div>

      {/* Sequence Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-navy-900 text-xl font-extrabold flex items-center gap-2">
          <span className="material-symbols-outlined text-primary font-bold">reorder</span>
          Planned Sequence
        </h2>
        <div className="flex gap-4">
           {canEdit && (
             <Link
               to="/ai-builder"
               className="text-primary text-sm font-bold flex items-center gap-1 hover:underline"
             >
               <span className="material-symbols-outlined text-sm">auto_awesome</span>
               AI Builder
             </Link>
           )}
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
                  block={{...block, title: stripEmojis(block.title)}}
                  index={i}
                  game={games[block.game_id] ? {...games[block.game_id], name: stripEmojis(games[block.game_id].name)} : null}
                  onEdit={setEditBlock}
                  readOnly={!canEdit}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-slate-200 pt-8 pb-16">
        <div className="flex gap-4 order-2 sm:order-1">
          <Link to={`/sessions/${id}/script`} className="flex items-center gap-2 text-primary hover:bg-primary hover:text-white font-bold text-sm transition-all border border-primary px-5 py-2.5 rounded">
            <span className="material-symbols-outlined text-lg">description</span>
            View Script
          </Link>
          <button onClick={() => window.print()} className="flex items-center gap-2 text-primary hover:bg-primary hover:text-white font-bold text-sm transition-all border border-primary px-5 py-2.5 rounded">
            <span className="material-symbols-outlined text-lg">download</span>
            Export PDF
          </button>
          <button onClick={() => setShowShare(true)} className="flex items-center gap-2 text-navy-600 hover:text-navy-900 font-bold text-sm transition-colors border border-slate-300 px-5 py-2.5 rounded">
             <span className="material-symbols-outlined text-lg">share</span>
             Share
          </button>
        </div>
        <button
          onClick={() => navigate(`/sessions/${id}/facilitate`)}
          className="w-full sm:w-auto flex items-center justify-center gap-3 bg-primary hover:bg-[#5f2432] text-white font-extrabold px-10 py-4 rounded shadow-lg shadow-primary/20 transition-all transform hover:-translate-y-0.5 order-1 sm:order-2 tracking-wide uppercase text-sm"
        >
          <span className="material-symbols-outlined">play_circle</span>
          Start Facilitation Mode
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

      {/* Settings Modal */}
      {showSettings && (
        <Modal onClose={() => setShowSettings(false)} title="Session Settings">
           <div className="space-y-6">
              <div className="flex flex-col gap-2">
                 <label className="text-xs font-bold uppercase tracking-widest">Session Name</label>
                 <input
                    value={session?.name}
                    onChange={e => updateSession({ name: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
                 />
              </div>
              <div className="flex flex-col gap-2">
                 <label className="text-xs font-bold uppercase tracking-widest">Site / Location</label>
                 <select
                    value={session?.site_id || ''}
                    onChange={e => updateSession({ site_id: e.target.value || null })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none"
                 >
                    <option value="">Select Site...</option>
                    {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                 </select>
              </div>
              <div className="flex flex-col gap-2">
                 <label className="text-xs font-bold uppercase tracking-widest">Target Group</label>
                 <select
                    value={session?.group_id || ''}
                    onChange={e => updateSession({ group_id: e.target.value || null })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none"
                 >
                    <option value="">Select Group...</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                 </select>
              </div>
              <div className="flex flex-col gap-2">
                 <label className="text-xs font-bold uppercase tracking-widest">Description / Notes</label>
                 <textarea
                    value={session?.notes || ''}
                    onChange={e => updateSession({ notes: e.target.value })}
                    rows={4}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary resize-none"
                 />
              </div>
           </div>
        </Modal>
      )}

      {/* Share Modal */}
      {showShare && (
        <Modal onClose={() => setShowShare(false)} title="Share Session">
           <div className="space-y-6">
              <div>
                 <label className="text-xs font-bold uppercase tracking-widest block mb-2">Add Member by Email</label>
                 <div className="flex gap-2">
                    <input value={shareEmail} onChange={e => setShareEmail(e.target.value)} placeholder="colleague@fsu.edu" className="flex-1 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary" />
                    <button onClick={handleShare} className="bg-primary text-white px-4 rounded-lg font-bold">Invite</button>
                 </div>
              </div>
              <div className="space-y-2">
                 <p className="text-xs font-bold uppercase tracking-widest">Session Team</p>
                 {members.map(m => (
                    <div key={m.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                       <div className="min-w-0">
                          <p className="text-sm font-bold truncate">{m.profiles?.name}</p>
                          <p className="text-xs text-slate-500">{m.profiles?.email}</p>
                       </div>
                       <span className="text-[10px] font-black uppercase text-slate-400">{m.role}</span>
                    </div>
                 ))}
              </div>
           </div>
        </Modal>
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
