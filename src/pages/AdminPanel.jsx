import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';
import { getSupabaseClient } from '../lib/supabase';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

const EMPTY_GAME = {
  name: '', description: '', goals: '', min_group: 2, max_group: 20,
  min_age: '', max_age: '', time_min: 5, time_max: 20, activity_level: 'medium',
  setting: [], facilitation: '', materials: '', tags: '', is_active: true,
};

export function AdminPanel() {
  const { profile, isAdmin, loading } = useProfile();
  const navigate = useNavigate();
  const [tab, setTab] = useState('games');
  const [games, setGames] = useState([]);
  const [allSessions, setAllSessions] = useState([]);
  const [gamesLoading, setGamesLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editGame, setEditGame] = useState(null);
  const [form, setForm] = useState(EMPTY_GAME);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    if (!loading && !isAdmin) navigate('/');
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    loadGames();
  }, [isAdmin]);

  useEffect(() => {
    if (tab === 'sessions' && allSessions.length === 0) loadAllSessions();
  }, [tab]);

  async function loadGames() {
    const supabase = getSupabaseClient();
    const { data } = await supabase.from('games').select('*').order('name');
    setGames(data ?? []);
    setGamesLoading(false);
  }

  async function loadAllSessions() {
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from('sessions')
      .select('id, name, status, created_at, profiles!owner_id(name, email)')
      .order('created_at', { ascending: false });
    setAllSessions(data ?? []);
  }

  function openNew() {
    setEditGame(null);
    setForm(EMPTY_GAME);
    setShowForm(true);
  }

  function openEdit(game) {
    setEditGame(game);
    setForm({
      ...game,
      goals: game.goals?.join(', ') ?? '',
      setting: game.setting ?? [],
      tags: game.tags?.join(', ') ?? '',
      min_age: game.min_age ?? '',
      max_age: game.max_age ?? '',
    });
    setShowForm(true);
  }

  async function saveGame(e) {
    e.preventDefault();
    setSaving(true);
    const supabase = getSupabaseClient();
    const payload = {
      ...form,
      goals: form.goals ? form.goals.split(',').map((s) => s.trim()).filter(Boolean) : [],
      tags: form.tags ? form.tags.split(',').map((s) => s.trim()).filter(Boolean) : [],
      min_age: form.min_age ? Number(form.min_age) : null,
      max_age: form.max_age ? Number(form.max_age) : null,
      min_group: Number(form.min_group),
      max_group: Number(form.max_group),
      time_min: Number(form.time_min),
      time_max: Number(form.time_max),
    };
    delete payload.id; delete payload.created_at; delete payload.updated_at; delete payload.created_by;

    if (editGame) {
      await supabase.from('games').update(payload).eq('id', editGame.id);
    } else {
      await supabase.from('games').insert({ ...payload, created_by: profile.id });
    }
    setSaving(false);
    setShowForm(false);
    loadGames();
  }

  async function toggleActive(game) {
    const supabase = getSupabaseClient();
    await supabase.from('games').update({ is_active: !game.is_active }).eq('id', game.id);
    loadGames();
  }

  async function deleteGame(id) {
    const supabase = getSupabaseClient();
    await supabase.from('games').delete().eq('id', id);
    setGames((prev) => prev.filter((g) => g.id !== id));
    setConfirmDelete(null);
  }

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleSetting = (s) => setForm((f) => ({
    ...f, setting: f.setting.includes(s) ? f.setting.filter((x) => x !== s) : [...f.setting, s],
  }));

  if (loading) return <p className="text-slate-400">Loading…</p>;
  if (!isAdmin) return null;

  const fmt = (ts) => new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-fsu-gold">Admin Panel</h1>

      <div className="flex gap-1 border-b border-slate-700">
        {['games', 'sessions'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm capitalize transition-colors ${tab === t ? 'border-b-2 border-fsu-gold text-fsu-gold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'games' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={openNew} className="rounded-md bg-fsu-garnet px-4 py-2 text-sm font-medium hover:brightness-110">
              + Add Game
            </button>
          </div>
          {gamesLoading ? <p className="text-slate-400">Loading…</p> : (
            <div className="overflow-x-auto rounded-xl border border-slate-700">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-700 bg-slate-900/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs uppercase text-slate-500">Name</th>
                    <th className="px-4 py-3 text-left text-xs uppercase text-slate-500">Level</th>
                    <th className="px-4 py-3 text-left text-xs uppercase text-slate-500">Status</th>
                    <th className="px-4 py-3 text-left text-xs uppercase text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {games.map((g) => (
                    <tr key={g.id} className="hover:bg-slate-900/30">
                      <td className="px-4 py-3 text-slate-100">{g.name}</td>
                      <td className="px-4 py-3"><Badge variant={g.activity_level} label={g.activity_level} /></td>
                      <td className="px-4 py-3">
                        <span className={g.is_active ? 'text-green-400 text-xs' : 'text-slate-500 text-xs'}>
                          {g.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-3">
                          <button onClick={() => openEdit(g)} className="text-xs text-slate-400 hover:text-slate-100">Edit</button>
                          <button onClick={() => toggleActive(g)} className="text-xs text-slate-400 hover:text-slate-100">
                            {g.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button onClick={() => setConfirmDelete(g)} className="text-xs text-red-700 hover:text-red-400">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'sessions' && (
        <div className="overflow-x-auto rounded-xl border border-slate-700">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-700 bg-slate-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs uppercase text-slate-500">Session</th>
                <th className="px-4 py-3 text-left text-xs uppercase text-slate-500">Facilitator</th>
                <th className="px-4 py-3 text-left text-xs uppercase text-slate-500">Status</th>
                <th className="px-4 py-3 text-left text-xs uppercase text-slate-500">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {allSessions.map((s) => (
                <tr key={s.id} className="hover:bg-slate-900/30">
                  <td className="px-4 py-3 text-slate-100">{s.name}</td>
                  <td className="px-4 py-3 text-slate-400">{s.profiles?.name || s.profiles?.email || '—'}</td>
                  <td className="px-4 py-3"><Badge variant={s.status} label={s.status} /></td>
                  <td className="px-4 py-3 text-slate-500">{fmt(s.created_at)}</td>
                </tr>
              ))}
              {allSessions.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">No sessions yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Game form modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editGame ? 'Edit Game' : 'Add Game'} wide>
        <form onSubmit={saveGame} className="space-y-4 text-sm">
          <Field label="Name *"><input required value={form.name} onChange={(e) => setField('name', e.target.value)} className={inputCls} /></Field>
          <Field label="Description *"><textarea required value={form.description} onChange={(e) => setField('description', e.target.value)} rows={3} className={`${inputCls} resize-none`} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Min Group"><input type="number" min="1" value={form.min_group} onChange={(e) => setField('min_group', e.target.value)} className={inputCls} /></Field>
            <Field label="Max Group"><input type="number" min="1" value={form.max_group} onChange={(e) => setField('max_group', e.target.value)} className={inputCls} /></Field>
            <Field label="Min Time (min)"><input type="number" min="1" value={form.time_min} onChange={(e) => setField('time_min', e.target.value)} className={inputCls} /></Field>
            <Field label="Max Time (min)"><input type="number" min="1" value={form.time_max} onChange={(e) => setField('time_max', e.target.value)} className={inputCls} /></Field>
            <Field label="Min Age"><input type="number" min="1" value={form.min_age} onChange={(e) => setField('min_age', e.target.value)} placeholder="optional" className={inputCls} /></Field>
            <Field label="Max Age"><input type="number" min="1" value={form.max_age} onChange={(e) => setField('max_age', e.target.value)} placeholder="optional" className={inputCls} /></Field>
          </div>
          <Field label="Activity Level">
            <select value={form.activity_level} onChange={(e) => setField('activity_level', e.target.value)} className={inputCls}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </Field>
          <Field label="Setting">
            <div className="flex gap-3">
              {['indoor', 'outdoor'].map((s) => (
                <label key={s} className="flex items-center gap-1.5 text-slate-300 capitalize cursor-pointer">
                  <input type="checkbox" checked={form.setting.includes(s)} onChange={() => toggleSetting(s)} className="accent-fsu-garnet" />
                  {s}
                </label>
              ))}
            </div>
          </Field>
          <Field label="Goals (comma-separated)"><input value={form.goals} onChange={(e) => setField('goals', e.target.value)} placeholder="communication, trust, teamwork" className={inputCls} /></Field>
          <Field label="Tags (comma-separated)"><input value={form.tags} onChange={(e) => setField('tags', e.target.value)} placeholder="icebreaker, energizer" className={inputCls} /></Field>
          <Field label="Materials"><input value={form.materials} onChange={(e) => setField('materials', e.target.value)} placeholder="e.g. None / 1 rope / blindfolds" className={inputCls} /></Field>
          <Field label="Facilitation Tips"><textarea value={form.facilitation} onChange={(e) => setField('facilitation', e.target.value)} rows={4} className={`${inputCls} resize-none`} /></Field>
          {editGame && (
            <Field label="Active">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setField('is_active', e.target.checked)} className="accent-fsu-garnet" />
                Visible in catalog
              </label>
            </Field>
          )}
          <button type="submit" disabled={saving} className="w-full rounded-md bg-fsu-garnet px-4 py-2 font-medium hover:brightness-110 disabled:opacity-50">
            {saving ? 'Saving…' : editGame ? 'Save Changes' : 'Add Game'}
          </button>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete Game">
        <div className="space-y-4">
          <p className="text-slate-300">Delete <strong>{confirmDelete?.name}</strong>? This cannot be undone.</p>
          <div className="flex gap-3">
            <button onClick={() => deleteGame(confirmDelete.id)} className="flex-1 rounded-md bg-red-800 py-2 text-sm font-medium hover:bg-red-700">Delete</button>
            <button onClick={() => setConfirmDelete(null)} className="flex-1 rounded-md bg-slate-700 py-2 text-sm hover:bg-slate-600">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

const inputCls = 'w-full rounded-md bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 outline-none focus:ring-1 focus:ring-fsu-gold/50';

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs uppercase text-slate-500 mb-1">{label}</label>
      {children}
    </div>
  );
}
