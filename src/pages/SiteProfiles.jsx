import { useState, useEffect } from 'react';
import { getSupabaseClient } from '../lib/supabase';
import { useProfile } from '../context/ProfileContext';
import { Modal } from '../components/ui/Modal';

const supabase = getSupabaseClient();
const BLANK = { name: '', description: '', available_elements: [], constraints: '' };

export default function SiteProfiles() {
  const { profile } = useProfile();
  const [sites, setSites]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState(BLANK);
  const [elementInput, setElementInput] = useState('');

  async function load() {
    const { data } = await supabase.from('sites').select('*').order('name');
    setSites(data || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openNew()  { setEditing('new'); setForm(BLANK); setElementInput(''); }
  function openEdit(s) { setEditing(s.id); setForm({ ...s, available_elements: s.available_elements || [] }); setElementInput(''); }

  function addElement(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = elementInput.trim().replace(/,$/, '');
      if (val && !form.available_elements.includes(val)) {
        setForm(f => ({ ...f, available_elements: [...f.available_elements, val] }));
      }
      setElementInput('');
    }
  }

  function removeElement(el) {
    setForm(f => ({ ...f, available_elements: f.available_elements.filter(e => e !== el) }));
  }

  async function save() {
    // Add any pending element input
    let elements = [...form.available_elements];
    if (elementInput.trim()) elements.push(elementInput.trim());

    const payload = { ...form, available_elements: elements, created_by: profile.id };
    if (editing === 'new') {
      await supabase.from('sites').insert(payload);
    } else {
      await supabase.from('sites').update(payload).eq('id', editing);
    }
    setEditing(null);
    load();
  }

  async function del(id) {
    if (!confirm('Delete this site profile?')) return;
    await supabase.from('sites').delete().eq('id', id);
    load();
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-syne font-bold text-2xl text-fsu-text">Site Profiles</h1>
          <p className="text-sm text-fsu-muted mt-0.5">Manage locations and available elements for each site</p>
        </div>
        <button onClick={openNew}
          className="bg-fsu-garnet hover:bg-fsu-garnet2 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
          + New Site
        </button>
      </div>

      {loading && <p className="text-fsu-muted text-sm">Loading...</p>}

      {!loading && sites.length === 0 && (
        <div className="text-center py-16 text-fsu-muted border-2 border-dashed border-fsu-border rounded-2xl">
          <p className="text-lg font-medium mb-2">No site profiles yet</p>
          <p className="text-sm mb-4">Create a site profile to track available elements and location constraints.</p>
          <button onClick={openNew} className="text-fsu-garnet hover:underline text-sm font-medium">Create first site</button>
        </div>
      )}

      <div className="space-y-3">
        {sites.map(s => (
          <div key={s.id} className="bg-fsu-surface border border-fsu-border rounded-xl p-4 hover:border-fsu-border2 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-fsu-text mb-1">{s.name}</p>
                {s.description && <p className="text-sm text-fsu-muted mb-2 line-clamp-1">{s.description}</p>}
                {s.available_elements?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-1">
                    {s.available_elements.slice(0,6).map(el => (
                      <span key={el} className="text-xs bg-fsu-soft border border-fsu-border px-2 py-0.5 rounded-full text-fsu-muted">
                        {el}
                      </span>
                    ))}
                    {s.available_elements.length > 6 && (
                      <span className="text-xs text-fsu-faint">+{s.available_elements.length - 6} more</span>
                    )}
                  </div>
                )}
                {s.constraints && <p className="text-xs text-fsu-muted italic">{s.constraints}</p>}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => openEdit(s)} className="text-xs border border-fsu-border text-fsu-muted hover:text-fsu-garnet hover:border-fsu-garnet px-3 py-1.5 rounded-lg transition-colors">Edit</button>
                <button onClick={() => del(s.id)} className="text-xs border border-red-200 text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <Modal onClose={() => setEditing(null)}>
          <div className="p-6 max-w-md w-full">
            <h2 className="font-syne font-bold text-lg text-fsu-text mb-5">
              {editing === 'new' ? 'New Site Profile' : 'Edit Site Profile'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-fsu-muted uppercase mb-1 block">Site Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                  placeholder="e.g. Main Challenge Course, Pavilion Area..."
                  className="w-full border border-fsu-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-fsu-garnet text-fsu-text" />
              </div>
              <div>
                <label className="text-xs font-semibold text-fsu-muted uppercase mb-1 block">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))}
                  rows={2}
                  className="w-full border border-fsu-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-fsu-garnet text-fsu-text resize-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-fsu-muted uppercase mb-1 block">
                  Available Elements <span className="font-normal text-fsu-faint">(press Enter or comma to add)</span>
                </label>
                <div className="border border-fsu-border rounded-lg px-2.5 py-2 focus-within:border-fsu-garnet min-h-[70px]">
                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                    {form.available_elements.map(el => (
                      <span key={el} className="flex items-center gap-1 text-xs bg-fsu-garnet/10 text-fsu-garnet border border-fsu-garnet/20 px-2 py-0.5 rounded-full">
                        {el}
                        <button onClick={() => removeElement(el)} className="text-fsu-garnet2 hover:text-fsu-garnet3 text-xs leading-none">×</button>
                      </span>
                    ))}
                  </div>
                  <input
                    value={elementInput}
                    onChange={e => setElementInput(e.target.value)}
                    onKeyDown={addElement}
                    placeholder="e.g. Low V, Spider Web, Trust Fall..."
                    className="text-sm text-fsu-text focus:outline-none bg-transparent w-full"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-fsu-muted uppercase mb-1 block">Constraints / Notes</label>
                <textarea value={form.constraints} onChange={e => setForm(f => ({...f, constraints: e.target.value}))}
                  rows={3} placeholder="Weather limitations, capacity, access notes..."
                  className="w-full border border-fsu-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-fsu-garnet text-fsu-text resize-none" />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={save}
                  className="flex-1 bg-fsu-garnet hover:bg-fsu-garnet2 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors">
                  Save Site
                </button>
                <button onClick={() => setEditing(null)}
                  className="border border-fsu-border2 text-fsu-muted px-4 py-2.5 rounded-xl text-sm transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
