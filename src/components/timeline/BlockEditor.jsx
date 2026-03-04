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
    <div className="fixed right-0 top-0 h-full w-96 bg-fsu-surface border-l border-fsu-border shadow-xl flex flex-col z-50">
      {/* Header */}
      <div className="px-5 py-4 border-b border-fsu-border flex items-center justify-between">
        <h2 className="font-syne font-bold text-fsu-text">Edit Block</h2>
        <button onClick={onClose} className="text-fsu-muted hover:text-fsu-text text-xl leading-none">×</button>
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Block type */}
        <div>
          <label className="text-xs font-semibold text-fsu-muted uppercase tracking-wide mb-1.5 block">Block Type</label>
          <div className="flex flex-wrap gap-1.5">
            {BLOCK_TYPES.map(t => (
              <button key={t} onClick={() => set('block_type', t)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border capitalize transition-colors ${
                  form.block_type === t ? 'bg-fsu-garnet text-white border-fsu-garnet' : 'border-fsu-border text-fsu-muted hover:border-fsu-border2'
                }`}>{t}</button>
            ))}
          </div>
        </div>

        {/* Game picker (activity type) */}
        {form.block_type === 'activity' && (
          <div>
            <label className="text-xs font-semibold text-fsu-muted uppercase tracking-wide mb-1.5 block">Activity</label>
            <input value={gameSearch} onChange={e => setGameSearch(e.target.value)}
              placeholder="Search activities..."
              className="w-full border border-fsu-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-fsu-garnet text-fsu-text mb-2" />
            <div className="max-h-40 overflow-y-auto space-y-1 border border-fsu-border rounded-lg">
              {filteredGames.slice(0,20).map(g => (
                <button key={g.id} onClick={() => { set('game_id', g.id); set('title', g.name); set('duration_min', g.time_min || 20); }}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                    form.game_id === g.id ? 'bg-fsu-garnet/10 text-fsu-garnet font-medium' : 'text-fsu-text hover:bg-fsu-soft'
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

        {/* Title (non-activity or override) */}
        <div>
          <label className="text-xs font-semibold text-fsu-muted uppercase tracking-wide mb-1 block">
            {form.block_type === 'activity' ? 'Title Override' : 'Title'}
          </label>
          <input value={form.title || ''} onChange={e => set('title', e.target.value)}
            placeholder={form.block_type === 'activity' ? 'Leave blank to use activity name' : 'Block title...'}
            className="w-full border border-fsu-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-fsu-garnet text-fsu-text" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-fsu-muted uppercase tracking-wide mb-1 block">Duration (min)</label>
            <input type="number" value={form.duration_min} onChange={e => set('duration_min', e.target.value)}
              className="w-full border border-fsu-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-fsu-garnet text-fsu-text" />
          </div>
          <div>
            <label className="text-xs font-semibold text-fsu-muted uppercase tracking-wide mb-1 block">Start (min from 0)</label>
            <input type="number" value={form.start_time} onChange={e => set('start_time', e.target.value)}
              className="w-full border border-fsu-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-fsu-garnet text-fsu-text" />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-fsu-muted uppercase tracking-wide mb-1 block">Location</label>
          <input value={form.location || ''} onChange={e => set('location', e.target.value)}
            placeholder="e.g. Low Ropes Area, Pavilion..."
            className="w-full border border-fsu-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-fsu-garnet text-fsu-text" />
        </div>

        <div>
          <label className="text-xs font-semibold text-fsu-muted uppercase tracking-wide mb-1 block">Subgroup</label>
          <input value={form.subgroup || ''} onChange={e => set('subgroup', e.target.value)}
            placeholder="e.g. Group A, Full Group..."
            className="w-full border border-fsu-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-fsu-garnet text-fsu-text" />
        </div>

        <div>
          <label className="text-xs font-semibold text-fsu-muted uppercase tracking-wide mb-1 block">Assigned Facilitator</label>
          <input value={form.assigned_facilitator || ''} onChange={e => set('assigned_facilitator', e.target.value)}
            placeholder="e.g. Alex, Team B Lead..."
            className="w-full border border-fsu-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-fsu-garnet text-fsu-text" />
        </div>

        {form.block_type !== 'debrief' && (
          <div>
            <label className="text-xs font-semibold text-fsu-muted uppercase tracking-wide mb-1 block">Facilitator Notes</label>
            <textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)}
              rows={4} placeholder="Notes for this block..."
              className="w-full border border-fsu-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-fsu-garnet text-fsu-text resize-none" />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-fsu-border flex gap-2">
        <button onClick={handleSave}
          className="flex-1 bg-fsu-garnet hover:bg-fsu-garnet2 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors">
          Save Block
        </button>
        <button onClick={handleDelete}
          className="border border-red-200 text-red-500 hover:bg-red-50 px-3 py-2.5 rounded-xl text-sm transition-colors">
          Delete
        </button>
      </div>
    </div>
  );
}
