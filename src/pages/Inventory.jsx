import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSupabaseClient } from '../lib/supabase';
import { useProfile } from '../context/ProfileContext';
import { Modal } from '../components/ui/Modal';

const supabase = getSupabaseClient();

const CONDITION_STYLES = {
  green:  'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  yellow: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  red:    'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
};

const BLANK_EQUIPMENT = { name: '', category: '', serial_number: '', brand: '', model: '', condition: 'green', status: 'in_service' };

export default function Inventory() {
  const { canPlan } = useProfile();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK_EQUIPMENT);
  const [filter, setFilter] = useState('all');

  async function load() {
    setLoading(true);
    let query = supabase.from('equipment').select('*').order('name');
    if (filter !== 'all') {
      query = query.eq('status', filter);
    }
    const { data } = await query;
    setItems(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [filter]);

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.serial_number?.toLowerCase().includes(search.toLowerCase())
  );

  async function save() {
    if (editing === 'new') {
      await supabase.from('equipment').insert(form);
    } else {
      await supabase.from('equipment').update(form).eq('id', editing);
    }
    setEditing(null);
    load();
  }

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 bg-background-light dark:bg-background-dark min-h-screen font-display">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="space-y-1">
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">Equipment Management</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl">Centralized inventory tracking and safety compliance for high-ropes gear.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/incidents" className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-navy-600 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all shadow-sm">
             <span className="material-symbols-outlined text-lg">report_problem</span>
             Safety Log
          </Link>
          {canPlan && (
             <button onClick={() => { setEditing('new'); setForm(BLANK_EQUIPMENT); }} className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-all shadow-md">
                <span className="material-symbols-outlined text-lg">add_circle</span>
                Add Gear
             </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatCard label="Total Items" value={items.length} icon="inventory_2" />
        <StatCard label="Requiring Attention" value={items.filter(i => i.condition !== 'green').length} icon="warning" />
        <StatCard label="Retired" value={items.filter(i => i.status === 'retired').length} icon="archive" />
      </div>

      <div className="mb-6 flex border-b border-slate-200 dark:border-primary/10">
        {['all', 'in_service', 'under_repair', 'retired'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-6 py-3 text-sm font-bold capitalize transition-colors ${filter === f ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-slate-700'}`}>
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-background-dark border border-slate-200 dark:border-primary/20 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-primary/5 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest border-b border-slate-200 dark:border-primary/10">
                <th className="px-6 py-4">Equipment Item</th>
                <th className="px-6 py-4">Serial Number</th>
                <th className="px-6 py-4">Condition</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-primary/5">
              {filtered.map(i => (
                <tr key={i.id} className="hover:bg-slate-50/50 dark:hover:bg-primary/5 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-50">{i.name}</span>
                      <span className="text-xs text-slate-400">{i.brand} {i.model}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm font-medium text-slate-600 dark:text-slate-400">{i.serial_number}</td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${CONDITION_STYLES[i.condition]}`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 bg-current`}></span>
                      {i.condition}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                     <span className="text-xs font-bold uppercase text-slate-500">{i.status.replace('_', ' ')}</span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button onClick={() => { setEditing(i.id); setForm(i); }} className="text-primary hover:text-primary/80 transition-colors">
                      <span className="material-symbols-outlined text-xl">edit</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing === 'new' ? 'Add Equipment' : 'Edit Equipment'} wide>
           <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-widest">Name</label>
                    <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border border-slate-200 rounded-lg py-2 px-3 outline-none" />
                 </div>
                 <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-widest">Serial Number</label>
                    <input value={form.serial_number} onChange={e => setForm({...form, serial_number: e.target.value})} className="w-full border border-slate-200 rounded-lg py-2 px-3 outline-none" />
                 </div>
                 <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-widest">Condition</label>
                    <select value={form.condition} onChange={e => setForm({...form, condition: e.target.value})} className="w-full border border-slate-200 rounded-lg py-2 px-3 outline-none">
                       <option value="green">Green (Good)</option>
                       <option value="yellow">Yellow (Watch)</option>
                       <option value="red">Red (Critical)</option>
                    </select>
                 </div>
                 <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-widest">Status</label>
                    <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full border border-slate-200 rounded-lg py-2 px-3 outline-none">
                       <option value="in_service">In Service</option>
                       <option value="under_repair">Under Repair</option>
                       <option value="retired">Retired</option>
                    </select>
                 </div>
              </div>
              <div className="flex justify-end gap-3">
                 <button onClick={() => setEditing(null)} className="px-6 py-2 font-bold text-slate-500">Cancel</button>
                 <button onClick={save} className="px-8 py-2 bg-primary text-white font-bold rounded-lg shadow-md">Save Changes</button>
              </div>
           </div>
        </Modal>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="bg-white dark:bg-background-dark border border-slate-200 dark:border-primary/20 p-6 rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        <span className="material-symbols-outlined text-primary/40">{icon}</span>
      </div>
      <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">{value}</p>
    </div>
  );
}
