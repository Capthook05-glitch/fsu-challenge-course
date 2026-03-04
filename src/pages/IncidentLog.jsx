import { useState, useEffect } from 'react';
import { getSupabaseClient } from '../lib/supabase';
import { useProfile } from '../context/ProfileContext';

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
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-syne font-bold text-2xl text-fsu-text">Incident & Near-Miss Log</h1>
          <p className="text-fsu-muted text-sm mt-1">Document safety incidents and near-misses for review and follow-up.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="bg-fsu-garnet hover:bg-fsu-garnet2 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
          + Report Incident
        </button>
      </div>

      {/* New Incident Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-fsu-surface rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-fsu-border flex items-center justify-between">
              <h2 className="font-syne font-bold text-fsu-text">Report an Incident</h2>
              <button onClick={() => setShowForm(false)} className="text-fsu-muted hover:text-fsu-text text-xl">×</button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-fsu-muted uppercase tracking-wide mb-1 block">Severity</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(SEVERITY).map(([key, s]) => (
                    <button key={key} onClick={() => set('severity', key)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors"
                      style={form.severity === key
                        ? { background: s.color, color: '#fff', borderColor: s.color }
                        : { background: s.bg, color: s.color, borderColor: s.color + '40' }
                      }>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-fsu-muted uppercase tracking-wide mb-1 block">Session (optional)</label>
                <select value={form.session_id} onChange={e => set('session_id', e.target.value)}
                  className="w-full border border-fsu-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-fsu-garnet text-fsu-text bg-fsu-surface">
                  <option value="">— None —</option>
                  {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-fsu-muted uppercase tracking-wide mb-1 block">What happened? *</label>
                <textarea value={form.what_happened} onChange={e => set('what_happened', e.target.value)}
                  rows={3} placeholder="Describe the incident or near-miss..."
                  className="w-full border border-fsu-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-fsu-garnet text-fsu-text resize-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-fsu-muted uppercase tracking-wide mb-1 block">Contributing factors</label>
                <textarea value={form.contributing_factors} onChange={e => set('contributing_factors', e.target.value)}
                  rows={2} placeholder="Environmental, group dynamics, equipment, etc."
                  className="w-full border border-fsu-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-fsu-garnet text-fsu-text resize-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-fsu-muted uppercase tracking-wide mb-1 block">Immediate action taken</label>
                <textarea value={form.immediate_action} onChange={e => set('immediate_action', e.target.value)}
                  rows={2} placeholder="What was done in the moment..."
                  className="w-full border border-fsu-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-fsu-garnet text-fsu-text resize-none" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.follow_up_needed} onChange={e => set('follow_up_needed', e.target.checked)}
                  className="rounded border-fsu-border" />
                <span className="text-sm text-fsu-text">Follow-up required</span>
              </label>
              {form.follow_up_needed && (
                <textarea value={form.follow_up_notes} onChange={e => set('follow_up_notes', e.target.value)}
                  rows={2} placeholder="Describe follow-up needed..."
                  className="w-full border border-fsu-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-fsu-garnet text-fsu-text resize-none" />
              )}
            </div>
            <div className="px-6 py-4 border-t border-fsu-border flex gap-3">
              <button onClick={handleSave} disabled={saving || !form.what_happened.trim()}
                className="flex-1 bg-fsu-garnet hover:bg-fsu-garnet2 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
                {saving ? 'Saving…' : 'Submit Report'}
              </button>
              <button onClick={() => setShowForm(false)}
                className="border border-fsu-border text-fsu-muted hover:text-fsu-text px-4 py-2.5 rounded-xl text-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-fsu-muted">Loading incidents…</p>
      ) : incidents.length === 0 ? (
        <div className="bg-fsu-soft border border-fsu-border rounded-xl p-10 text-center">
          <p className="text-fsu-muted text-sm">No incidents reported. Use this log to document safety events and near-misses.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map(inc => {
            const sev = SEVERITY[inc.severity] || SEVERITY.near_miss;
            const isOpen = expanded === inc.id;
            return (
              <div key={inc.id}
                className="bg-fsu-surface border border-fsu-border rounded-xl overflow-hidden">
                <button className="w-full text-left px-4 py-4 flex items-center gap-3"
                  onClick={() => setExpanded(isOpen ? null : inc.id)}>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                    style={{ background: sev.bg, color: sev.color }}>{sev.label}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-fsu-text truncate">{inc.what_happened}</p>
                    <p className="text-xs text-fsu-muted">
                      {inc.sessions?.name && <span>{inc.sessions.name} · </span>}
                      {new Date(inc.reported_at).toLocaleDateString()}
                      {inc.profiles?.name && <span> · {inc.profiles.name}</span>}
                    </p>
                  </div>
                  {inc.follow_up_needed && (
                    <span className="text-xs bg-orange-100 text-orange-600 border border-orange-200 px-2 py-0.5 rounded-full flex-shrink-0">
                      Follow-up
                    </span>
                  )}
                  <span className="text-fsu-faint text-sm">{isOpen ? '▲' : '▼'}</span>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 border-t border-fsu-border pt-3 space-y-3">
                    {inc.contributing_factors && (
                      <div>
                        <p className="text-xs font-semibold text-fsu-muted uppercase tracking-wide mb-1">Contributing Factors</p>
                        <p className="text-sm text-fsu-text">{inc.contributing_factors}</p>
                      </div>
                    )}
                    {inc.immediate_action && (
                      <div>
                        <p className="text-xs font-semibold text-fsu-muted uppercase tracking-wide mb-1">Immediate Action</p>
                        <p className="text-sm text-fsu-text">{inc.immediate_action}</p>
                      </div>
                    )}
                    {inc.follow_up_needed && inc.follow_up_notes && (
                      <div>
                        <p className="text-xs font-semibold text-fsu-muted uppercase tracking-wide mb-1">Follow-up Notes</p>
                        <p className="text-sm text-fsu-text">{inc.follow_up_notes}</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button onClick={() => toggleFollowUp(inc)}
                        className="text-xs border border-fsu-border text-fsu-muted hover:border-fsu-garnet hover:text-fsu-garnet px-3 py-1.5 rounded-lg transition-colors">
                        {inc.follow_up_needed ? 'Mark Resolved' : 'Flag Follow-up'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
