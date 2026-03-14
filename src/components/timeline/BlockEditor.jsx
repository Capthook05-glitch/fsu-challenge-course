import { useState, useEffect } from 'react';
import { getSupabaseClient } from '../../lib/supabase';
import { DebriefPicker } from '../debrief/DebriefPicker';

const supabase = getSupabaseClient();

const BLOCK_TYPES = ['activity','debrief','break','transition','custom'];

export function BlockEditor({ block, allGames = [], onSave, onDelete, onClose }) {
  const [form, setForm] = useState({ ...block });
  const [gameSearch, setGameSearch] = useState('');
  const [debriefSet, setDebriefSet] = useState(null);

  useEffect(() => {
    // Parse existing debrief set from notes
    if (block.block_type === 'debrief' && block.notes) {
      try {
        const parsed = JSON.parse(block.notes);
        if (parsed?.title) setDebriefSet(parsed);
      } catch {}
    }
  }, [block.id]);

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  function handleDebriefSelect(qs) {
    setDebriefSet(qs);
    setForm(f => ({ ...f, notes: JSON.stringify({ id: qs.id, title: qs.title, questions: qs.questions, theory_tags: qs.theory_tags }) }));
  }

  const filteredGames = allGames.filter(g =>
    !gameSearch || g.name.toLowerCase().includes(gameSearch.toLowerCase())
  );

  async function handleSave() {
    const { error } = await supabase.from('timeline_blocks')
      .update({
        block_type:            form.block_type,
        game_id:               form.game_id || null,
        title:                 form.title   || null,
        duration_min:          parseInt(form.duration_min) || 30,
        start_time:            parseInt(form.start_time)   || 0,
        location:              form.location || null,
        notes:                 form.notes   || null,
        subgroup:              form.subgroup || null,
        assigned_facilitator:  form.assigned_facilitator || null,
      }).eq('id', block.id);
    if (!error) onSave();
  }

  async function handleDelete() {
    if (!confirm('Remove this block?')) return;
    await supabase.from('timeline_blocks').delete().eq('id', block.id);
    onDelete();
  }

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white border-l border-slate-200 shadow-xl flex flex-col z-50 font-display">
      {/* Header */}
      <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h2 className="text-xl font-bold tracking-tight text-navy flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">edit_note</span>
          Edit Block
        </h2>
        <button onClick={onClose} className="text-slate-400 hover:text-navy transition-colors">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
        {/* Block type */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-navy uppercase tracking-widest block">Block Type</label>
          <div className="flex flex-wrap gap-2">
            {BLOCK_TYPES.map(t => (
              <button key={t} onClick={() => set('block_type', t)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                  form.block_type === t ? 'bg-primary text-white border-primary shadow-md' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                }`}>{t}</button>
            ))}
          </div>
        </div>

        {/* Game picker (activity type) */}
        {form.block_type === 'activity' && (
          <div className="space-y-4">
            <label className="text-xs font-bold text-navy uppercase tracking-widest block">Activity</label>
            <input value={gameSearch} onChange={e => setGameSearch(e.target.value)}
              placeholder="Search activities..."
              className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm focus:ring-1 focus:ring-primary outline-none" />
            <div className="max-h-40 overflow-y-auto space-y-1 border border-slate-100 rounded-lg p-1">
              {filteredGames.slice(0,20).map(g => (
                <button key={g.id} onClick={() => { set('game_id', g.id); set('title', g.name); set('duration_min', g.time_min || 20); }}
                  className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                    form.game_id === g.id ? 'bg-primary/10 text-primary font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}>
                  {g.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Debrief picker */}
        {form.block_type === 'debrief' && (
          <DebriefPicker selected={debriefSet} onSelect={handleDebriefSelect} />
        )}

        {/* Title */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-navy uppercase tracking-widest">
            {form.block_type === 'activity' ? 'Title Override' : 'Title'}
          </label>
          <input value={form.title || ''} onChange={e => set('title', e.target.value)}
            placeholder={form.block_type === 'activity' ? 'Leave blank for activity name' : 'Block title...'}
            className="w-full bg-white border border-slate-200 rounded-lg py-3 px-4 text-navy focus:ring-2 focus:ring-primary outline-none" />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-navy uppercase tracking-widest">Duration</label>
            <input type="number" value={form.duration_min} onChange={e => set('duration_min', e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg py-3 px-4 text-navy focus:ring-2 focus:ring-primary outline-none" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-navy uppercase tracking-widest">Start Time</label>
            <input type="number" value={form.start_time} onChange={e => set('start_time', e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg py-3 px-4 text-navy focus:ring-2 focus:ring-primary outline-none" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-navy uppercase tracking-widest">Location</label>
          <input value={form.location || ''} onChange={e => set('location', e.target.value)}
            placeholder="e.g. Pavilion, Course..."
            className="w-full bg-white border border-slate-200 rounded-lg py-3 px-4 text-navy focus:ring-2 focus:ring-primary outline-none" />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-navy uppercase tracking-widest">Facilitator</label>
          <input value={form.assigned_facilitator || ''} onChange={e => set('assigned_facilitator', e.target.value)}
            placeholder="Assign to..."
            className="w-full bg-white border border-slate-200 rounded-lg py-3 px-4 text-navy focus:ring-2 focus:ring-primary outline-none" />
        </div>

        {form.block_type !== 'debrief' && (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-navy uppercase tracking-widest">Notes</label>
            <textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)}
              rows={4} placeholder="Framing, safety, tips..."
              className="w-full bg-white border border-slate-200 rounded-lg py-3 px-4 text-navy focus:ring-2 focus:ring-primary outline-none resize-none" />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3">
        <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors">
           <span className="material-symbols-outlined text-lg">delete</span>
           Delete
        </button>
        <button onClick={handleSave} className="px-8 py-2 text-sm font-bold text-white bg-primary hover:bg-primary/95 rounded-lg shadow-md transition-all">
           Save Changes
        </button>
      </div>
    </div>
  );
}
