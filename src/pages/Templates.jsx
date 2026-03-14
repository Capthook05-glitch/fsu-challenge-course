import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupabaseClient } from '../lib/supabase';
import { useProfile } from '../context/ProfileContext';
import { stripEmojis } from '../lib/utils';

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
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 bg-background-light dark:bg-background-dark min-h-screen font-display">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="space-y-1">
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">Session Blueprints</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl">Reusable session blueprints — save a session as a template to reuse its structure.</p>
        </div>
      </div>

      {loading ? (
        <p className="text-slate-400">Loading templates…</p>
      ) : templates.length === 0 ? (
        <div className="bg-white dark:bg-background-dark border border-slate-200 dark:border-primary/20 rounded-xl p-12 text-center">
          <p className="text-slate-500 mb-2 font-bold uppercase tracking-widest text-xs">No blueprints found</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map(tpl => {
            const blockCount = Array.isArray(tpl.blocks) ? tpl.blocks.length : 0;
            const totalMin = Array.isArray(tpl.blocks)
              ? tpl.blocks.reduce((s, b) => s + (b.duration_min || 0), 0) : 0;
            const isOwner = tpl.created_by === profile?.id;
            return (
              <div key={tpl.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 hover:border-primary/30 transition-all flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-navy-deep dark:text-white truncate">{stripEmojis(tpl.name)}</h3>
                    {tpl.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{tpl.description}</p>
                    )}
                  </div>
                </div>

                <div className="mt-auto pt-4 flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-widest border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">reorder</span>
                    <span>{blockCount} blocks</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">schedule</span>
                    <span>{totalMin}m</span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  {canPlan && (
                    <button onClick={() => createSessionFromTemplate(tpl)}
                      className="flex-1 bg-primary text-white py-2 rounded-lg text-xs font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/10">
                      Use Template
                    </button>
                  )}
                  {isOwner && (
                    <button onClick={() => deleteTemplate(tpl.id)}
                      className="px-3 py-2 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 transition-colors">
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
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
