import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupabaseClient } from '../lib/supabase';
import { useProfile } from '../context/ProfileContext';

const supabase = getSupabaseClient();

export default function Templates() {
  const { profile, canPlan } = useProfile();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('session_templates')
      .select('*')
      .order('created_at', { ascending: false });
    setTemplates(data || []);
    setLoading(false);
  }

  async function createSessionFromTemplate(tpl) {
    if (!canPlan) return;
    const { data: sess } = await supabase.from('sessions').insert({
      name: `${tpl.name} — Copy`,
      owner_id: profile.id,
      status: 'draft',
    }).select().single();
    if (!sess) return;
    const blocks = (tpl.blocks || []).map((b, i) => ({
      session_id: sess.id,
      block_type: b.block_type || 'activity',
      game_id:    b.game_id || null,
      title:      b.title || null,
      start_time: b.start_time || 0,
      duration_min: b.duration_min || 30,
      location:   b.location || null,
      notes:      b.notes || null,
      subgroup:   b.subgroup || null,
      position:   i,
    }));
    if (blocks.length) {
      await supabase.from('timeline_blocks').insert(blocks);
    }
    navigate(`/sessions/${sess.id}`);
  }

  async function deleteTemplate(id) {
    if (!confirm('Delete this template?')) return;
    await supabase.from('session_templates').delete().eq('id', id);
    setTemplates(ts => ts.filter(t => t.id !== id));
  }

  async function togglePublic(tpl) {
    await supabase.from('session_templates').update({ is_public: !tpl.is_public }).eq('id', tpl.id);
    setTemplates(ts => ts.map(t => t.id === tpl.id ? { ...t, is_public: !t.is_public } : t));
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-syne font-bold text-2xl text-fsu-text">Session Templates</h1>
          <p className="text-fsu-muted text-sm mt-1">Reusable session blueprints — save a session as a template to reuse its structure.</p>
        </div>
      </div>

      {loading ? (
        <p className="text-fsu-muted">Loading templates…</p>
      ) : templates.length === 0 ? (
        <div className="bg-fsu-soft border border-fsu-border rounded-xl p-10 text-center">
          <p className="text-fsu-muted text-sm mb-2">No templates yet.</p>
          <p className="text-fsu-faint text-xs">Open any session and click "Save as Template" to create one.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {templates.map(tpl => {
            const blockCount = Array.isArray(tpl.blocks) ? tpl.blocks.length : 0;
            const totalMin = Array.isArray(tpl.blocks)
              ? tpl.blocks.reduce((s, b) => s + (b.duration_min || 0), 0) : 0;
            const isOwner = tpl.created_by === profile?.id;
            return (
              <div key={tpl.id} className="bg-fsu-surface border border-fsu-border rounded-xl p-4 hover:border-fsu-border2 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-syne font-semibold text-fsu-text truncate">{tpl.name}</h3>
                    {tpl.description && (
                      <p className="text-xs text-fsu-muted mt-0.5 line-clamp-2">{tpl.description}</p>
                    )}
                  </div>
                  {tpl.is_public && (
                    <span className="text-xs bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full flex-shrink-0">Public</span>
                  )}
                </div>

                <div className="flex gap-4 text-xs text-fsu-muted mb-4">
                  <span>{blockCount} block{blockCount !== 1 ? 's' : ''}</span>
                  <span>{totalMin} min total</span>
                </div>

                {/* Block type preview */}
                {blockCount > 0 && (
                  <div className="flex gap-1 flex-wrap mb-4">
                    {Array.isArray(tpl.blocks) && tpl.blocks.slice(0, 8).map((b, i) => (
                      <span key={i} className="text-xs px-1.5 py-0.5 rounded capitalize"
                        style={{
                          background: { activity:'#fff0f0', debrief:'#eff6ff', break:'#fffbeb', transition:'#f5f2ee', custom:'#f5f3ff' }[b.block_type] || '#f5f2ee',
                          color:      { activity:'#782F40', debrief:'#2563eb', break:'#d97706', transition:'#78716C', custom:'#7c3aed' }[b.block_type] || '#78716C',
                        }}>
                        {b.title || b.block_type}
                      </span>
                    ))}
                    {blockCount > 8 && <span className="text-xs text-fsu-faint">+{blockCount - 8} more</span>}
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  {canPlan && (
                    <button onClick={() => createSessionFromTemplate(tpl)}
                      className="flex-1 bg-fsu-garnet hover:bg-fsu-garnet2 text-white py-2 rounded-lg text-xs font-semibold transition-colors">
                      Use Template
                    </button>
                  )}
                  {isOwner && (
                    <>
                      <button onClick={() => togglePublic(tpl)}
                        className="border border-fsu-border text-fsu-muted hover:border-fsu-garnet hover:text-fsu-garnet px-3 py-2 rounded-lg text-xs transition-colors">
                        {tpl.is_public ? 'Make Private' : 'Make Public'}
                      </button>
                      <button onClick={() => deleteTemplate(tpl.id)}
                        className="border border-red-200 text-red-400 hover:bg-red-50 px-3 py-2 rounded-lg text-xs transition-colors">
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
