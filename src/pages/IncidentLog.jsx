import { useState, useEffect } from 'react';
import { getSupabaseClient } from '../lib/supabase';
import { useProfile } from '../context/ProfileContext';
import { Modal } from '../components/ui/Modal';

const supabase = getSupabaseClient();

const SEVERITY = {
  near_miss: { label: 'Near Miss', bg: '#fef3c7', color: '#d97706' },
  minor:     { label: 'Minor',     bg: '#dbeafe', color: '#2563eb' },
  moderate:  { label: 'Moderate',  bg: '#fed7aa', color: '#ea580c' },
  major:     { label: 'Major',     bg: '#fee2e2', color: '#dc2626' },
};

const EMPTY = {
  session_id: '', block_id: '', severity: 'near_miss',
  what_happened: '', contributing_factors: '', immediate_action: '',
  follow_up_needed: false, follow_up_notes: '',
};

export default function IncidentLog() {
  const { profile, isAdmin } = useProfile();
  const [incidents, setIncidents] = useState([]);
  const [sessions, setSessions]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState(EMPTY);
  const [saving, setSaving]       = useState(false);
  const [expanded, setExpanded]   = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const [incRes, sessRes] = await Promise.all([
      supabase.from('incident_reports')
        .select('*, sessions(name), timeline_blocks(title), profiles(name)')
        .order('reported_at', { ascending: false }),
      isAdmin
        ? supabase.from('sessions').select('id,name').eq('is_archived', false).order('name')
        : supabase.from('sessions').select('id,name').eq('owner_id', profile.id).eq('is_archived', false).order('name'),
    ]);
    setIncidents(incRes.data || []);
    setSessions(sessRes.data || []);
    setLoading(false);
  }

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSave() {
    if (!form.what_happened.trim()) return;
    setSaving(true);
    await supabase.from('incident_reports').insert({
      ...form,
      session_id: form.session_id || null,
      block_id:   form.block_id   || null,
      reported_by: profile.id,
    });
    setSaving(false);
    setShowForm(false);
    setForm(EMPTY);
    load();
  }

  async function toggleFollowUp(incident) {
    await supabase.from('incident_reports')
      .update({ follow_up_needed: !incident.follow_up_needed }).eq('id', incident.id);
    setIncidents(prev => prev.map(i => i.id === incident.id ? { ...i, follow_up_needed: !i.follow_up_needed } : i));
  }

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 bg-background-light dark:bg-background-dark min-h-screen font-display">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="space-y-1">
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">Equipment Management</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl">Centralized tracking and safety compliance for course gear and incidents.</p>
        </div>
        <div className="flex items-center gap-3">
           <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/20">
              <span className="material-symbols-outlined text-lg">fact_check</span>
              Log Incident
           </button>
        </div>
      </div>

      {/* New Incident Modal */}
      {showForm && (
        <Modal onClose={() => setShowForm(false)} title="Log Safety Incident" wide>
          <div className="space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                   <label className="text-xs font-bold text-navy uppercase tracking-widest">Severity</label>
                   <div className="flex flex-wrap gap-2">
                      {Object.entries(SEVERITY).map(([key, s]) => (
                        <button key={key} onClick={() => set('severity', key)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${form.severity === key ? 'bg-primary text-white border-primary' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          {s.label}
                        </button>
                      ))}
                   </div>
                </div>
                <div className="flex flex-col gap-2">
                   <label className="text-xs font-bold text-navy uppercase tracking-widest">Session (optional)</label>
                   <select value={form.session_id} onChange={e => set('session_id', e.target.value)}
                     className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm focus:ring-1 focus:ring-primary outline-none">
                      <option value="">None</option>
                      {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                   </select>
                </div>
             </div>

             <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-navy uppercase tracking-widest">What happened? *</label>
                <textarea value={form.what_happened} onChange={e => set('what_happened', e.target.value)}
                   rows={4} className="w-full bg-white border border-slate-200 rounded-lg py-3 px-4 text-navy focus:ring-2 focus:ring-primary outline-none resize-none" />
             </div>

             <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.follow_up_needed} onChange={e => set('follow_up_needed', e.target.checked)} className="rounded text-primary focus:ring-primary" />
                <span className="text-sm font-bold text-slate-700">Follow-up required</span>
             </label>

             <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button onClick={() => setShowForm(false)} className="px-6 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button onClick={handleSave} disabled={saving || !form.what_happened.trim()} className="px-8 py-2 font-bold text-white bg-primary rounded-lg shadow-md disabled:opacity-50">Submit Report</button>
             </div>
          </div>
        </Modal>
      )}

      {loading ? (
        <p className="text-slate-400">Loading incidents…</p>
      ) : incidents.length === 0 ? (
        <div className="bg-white dark:bg-background-dark border border-slate-200 dark:border-primary/20 rounded-xl p-12 text-center shadow-sm">
          <p className="text-slate-500 mb-2 font-bold uppercase tracking-widest text-xs">No incidents reported</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-background-dark border border-slate-200 dark:border-primary/20 rounded-xl overflow-hidden shadow-sm">
           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-slate-50 dark:bg-primary/5 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest border-b border-slate-200 dark:border-primary/10">
                       <th className="px-6 py-4">Incident</th>
                       <th className="px-6 py-4">Severity</th>
                       <th className="px-6 py-4">Date</th>
                       <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-primary/5">
                    {incidents.map(inc => {
                       const sev = SEVERITY[inc.severity] || SEVERITY.near_miss;
                       return (
                          <tr key={inc.id} className="hover:bg-slate-50/50 dark:hover:bg-primary/5 transition-colors">
                             <td className="px-6 py-5">
                                <div className="flex flex-col">
                                   <span className="text-sm font-bold text-slate-900 dark:text-slate-50 line-clamp-1">{inc.what_happened}</span>
                                   <span className="text-xs text-slate-400">{inc.profiles?.name || 'Anonymous'}</span>
                                </div>
                             </td>
                             <td className="px-6 py-5">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide" style={{ background: sev.bg, color: sev.color }}>
                                   <span className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ background: sev.color }}></span>
                                   {sev.label}
                                </span>
                             </td>
                             <td className="px-6 py-5 text-sm text-slate-600 dark:text-slate-400">
                                {new Date(inc.reported_at).toLocaleDateString()}
                             </td>
                             <td className="px-6 py-5 text-right">
                                <button onClick={() => setExpanded(expanded === inc.id ? null : inc.id)} className="text-primary hover:underline font-bold text-xs uppercase">View</button>
                             </td>
                          </tr>
                       );
                    })}
                 </tbody>
              </table>
           </div>
        </div>
      )}
    </div>
  );
}
