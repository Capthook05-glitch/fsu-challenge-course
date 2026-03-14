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
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 bg-background-light dark:bg-background-dark min-h-screen font-display">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="space-y-1">
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">Site Management</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl">Manage locations and available elements for each challenge course site.</p>
        </div>
        <div className="flex items-center gap-3">
           <button onClick={openNew} className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/20">
              <span className="material-symbols-outlined text-lg">add_circle</span>
              New Site
           </button>
        </div>
      </div>

      {loading ? (
        <p className="text-slate-400">Loading sites…</p>
      ) : sites.length === 0 ? (
        <div className="bg-white dark:bg-background-dark border border-slate-200 dark:border-primary/20 rounded-xl p-12 text-center">
          <p className="text-slate-500 mb-2 font-bold uppercase tracking-widest text-xs">No sites found</p>
          <button onClick={openNew} className="text-primary hover:underline font-bold">Add your first site</button>
        </div>
      ) : (
        <div className="bg-white dark:bg-background-dark border border-slate-200 dark:border-primary/20 rounded-xl overflow-hidden shadow-sm">
           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-slate-50 dark:bg-primary/5 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest border-b border-slate-200 dark:border-primary/10">
                       <th className="px-6 py-4">Site Name</th>
                       <th className="px-6 py-4">Elements</th>
                       <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-primary/5">
                    {sites.map(s => (
                       <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-primary/5 transition-colors">
                          <td className="px-6 py-5">
                             <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-900 dark:text-slate-50">{s.name}</span>
                                <span className="text-xs text-slate-400 line-clamp-1">{s.description}</span>
                             </div>
                          </td>
                          <td className="px-6 py-5">
                             <div className="flex flex-wrap gap-1">
                                {s.available_elements?.slice(0, 3).map(el => (
                                   <span key={el} className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                                      {el}
                                   </span>
                                ))}
                                {s.available_elements?.length > 3 && <span className="text-[10px] text-slate-400">+{s.available_elements.length - 3}</span>}
                             </div>
                          </td>
                          <td className="px-6 py-5 text-right">
                             <div className="flex justify-end gap-2">
                                <button onClick={() => openEdit(s)} className="text-primary hover:text-primary/80 font-bold text-xs uppercase">Edit</button>
                                <button onClick={() => del(s.id)} className="text-slate-400 hover:text-red-600 font-bold text-xs uppercase">Delete</button>
                             </div>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing === 'new' ? 'New Site Profile' : 'Edit Site Profile'} wide>
           <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-navy uppercase tracking-widest">Site Name</label>
                    <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                       className="w-full bg-white border border-slate-200 rounded-lg py-3 px-4 text-navy focus:ring-2 focus:ring-primary outline-none" />
                 </div>
                 <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-navy uppercase tracking-widest">Description</label>
                    <input value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                       className="w-full bg-white border border-slate-200 rounded-lg py-3 px-4 text-navy focus:ring-2 focus:ring-primary outline-none" />
                 </div>
              </div>

              <div className="space-y-3">
                 <label className="text-xs font-bold text-navy uppercase tracking-widest">Available Elements</label>
                 <div className="flex gap-2">
                    <input value={elementInput} onChange={e => setElementInput(e.target.value)} onKeyDown={addElement}
                       placeholder="Add element..." className="flex-1 bg-white border border-slate-200 rounded-lg py-2 px-4 text-navy focus:ring-1 focus:ring-primary outline-none" />
                    <button onClick={() => { if(elementInput.trim()) { setForm(f => ({...f, available_elements: [...f.available_elements, elementInput.trim()]})); setElementInput(''); } }} className="bg-primary/10 text-primary px-4 rounded-lg font-bold">Add</button>
                 </div>
                 <div className="flex flex-wrap gap-2 mt-3">
                    {form.available_elements.map(el => (
                       <div key={el} className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-700">
                          <span>{el}</span>
                          <span onClick={() => removeElement(el)} className="material-symbols-outlined text-sm cursor-pointer hover:text-red-600">close</span>
                       </div>
                    ))}
                 </div>
              </div>

              <div className="flex flex-col gap-2">
                 <label className="text-xs font-bold text-navy uppercase tracking-widest">Constraints / Notes</label>
                 <textarea value={form.constraints} onChange={e => setForm({...form, constraints: e.target.value})}
                    rows={4} className="w-full bg-white border border-slate-200 rounded-lg py-3 px-4 text-navy focus:ring-2 focus:ring-primary outline-none resize-none" />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                 <button onClick={() => setEditing(null)} className="px-6 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
                 <button onClick={save} className="px-8 py-2 font-bold text-white bg-primary rounded-lg shadow-md">Save Changes</button>
              </div>
           </div>
        </Modal>
      )}
    </div>
  );
}
