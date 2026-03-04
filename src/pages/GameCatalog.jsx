import { useEffect, useState, useMemo } from 'react';
import { useProfile } from '../context/ProfileContext';
import { getSupabaseClient } from '../lib/supabase';
import { GameCard } from '../components/games/GameCard';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';

const ALL_GOALS = ['communication', 'trust', 'problem-solving', 'teamwork', 'icebreaker', 'energizer', 'focus', 'fun'];

export function GameCatalog() {
  const { profile } = useProfile();
  const [games, setGames] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterGoals, setFilterGoals] = useState([]);
  const [filterGroupSize, setFilterGroupSize] = useState('');
  const [selectedGame, setSelectedGame] = useState(null);
  const [addTarget, setAddTarget] = useState(null); // game being added to session
  const [selectedSession, setSelectedSession] = useState('');
  const [addStatus, setAddStatus] = useState('');

  useEffect(() => {
    const supabase = getSupabaseClient();
    supabase.from('games').select('*').eq('is_active', true).order('name').then(({ data }) => {
      setGames(data ?? []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!profile) return;
    const supabase = getSupabaseClient();
    supabase
      .from('sessions')
      .select('id, name')
      .eq('owner_id', profile.id)
      .eq('is_archived', false)
      .order('updated_at', { ascending: false })
      .then(({ data }) => setSessions(data ?? []));
  }, [profile]);

  const filtered = useMemo(() => {
    return games.filter((g) => {
      if (search && !g.name.toLowerCase().includes(search.toLowerCase()) && !g.description.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterLevel && g.activity_level !== filterLevel) return false;
      if (filterGoals.length > 0 && !filterGoals.some((goal) => g.goals?.includes(goal))) return false;
      if (filterGroupSize && (g.min_group > Number(filterGroupSize) || g.max_group < Number(filterGroupSize))) return false;
      return true;
    });
  }, [games, search, filterLevel, filterGoals, filterGroupSize]);

  const toggleGoal = (goal) =>
    setFilterGoals((prev) => (prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]));

  const handleAddToSession = async () => {
    if (!selectedSession || !addTarget) return;
    setAddStatus('adding');
    const supabase = getSupabaseClient();
    const { data: existing } = await supabase
      .from('session_games')
      .select('position')
      .eq('session_id', selectedSession)
      .order('position', { ascending: false })
      .limit(1);
    const nextPos = (existing?.[0]?.position ?? 0) + 1;
    const { error } = await supabase.from('session_games').insert({
      session_id: selectedSession,
      game_id: addTarget.id,
      position: nextPos,
    });
    setAddStatus(error ? 'error' : 'done');
    if (!error) setTimeout(() => { setAddTarget(null); setSelectedSession(''); setAddStatus(''); }, 1200);
  };

  if (loading) return <p className="text-slate-400">Loading games…</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-fsu-gold">Game Catalog</h1>

      {/* Filters */}
      <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4 space-y-3">
        <input
          type="text"
          placeholder="Search games…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:ring-1 focus:ring-fsu-gold/50"
        />
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-slate-500">Activity:</span>
          {['', 'low', 'medium', 'high'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl)}
              className={`rounded-full px-3 py-0.5 text-xs transition-colors ${filterLevel === lvl ? 'bg-fsu-garnet text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
            >
              {lvl || 'All'}
            </button>
          ))}
          <input
            type="number"
            placeholder="Group size"
            min="1"
            max="100"
            value={filterGroupSize}
            onChange={(e) => setFilterGroupSize(e.target.value)}
            className="w-24 rounded-md bg-slate-800 px-2 py-0.5 text-xs text-slate-100 placeholder-slate-500 outline-none focus:ring-1 focus:ring-fsu-gold/50"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ALL_GOALS.map((goal) => (
            <button
              key={goal}
              onClick={() => toggleGoal(goal)}
              className={`rounded-full px-2.5 py-0.5 text-xs transition-colors ${filterGoals.includes(goal) ? 'bg-fsu-gold text-fsu-navy font-medium' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
            >
              {goal}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-500">{filtered.length} game{filtered.length !== 1 ? 's' : ''} found</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            onViewDetail={setSelectedGame}
            onAdd={sessions.length > 0 ? setAddTarget : undefined}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-slate-500 py-12">No games match your filters.</p>
      )}

      {/* Detail modal */}
      <Modal open={!!selectedGame} onClose={() => setSelectedGame(null)} title={selectedGame?.name} wide>
        {selectedGame && (
          <div className="space-y-4 text-sm">
            <p className="text-slate-300">{selectedGame.description}</p>
            <div className="grid grid-cols-2 gap-3">
              <InfoItem label="Group Size" value={`${selectedGame.min_group}–${selectedGame.max_group}`} />
              <InfoItem label="Time" value={`${selectedGame.time_min}–${selectedGame.time_max} min`} />
              <InfoItem label="Activity Level" value={<Badge variant={selectedGame.activity_level} label={selectedGame.activity_level} />} />
              {selectedGame.min_age && <InfoItem label="Age Range" value={`${selectedGame.min_age}–${selectedGame.max_age}`} />}
            </div>
            {selectedGame.goals?.length > 0 && (
              <div>
                <p className="text-xs uppercase text-slate-500 mb-1">Goals</p>
                <div className="flex flex-wrap gap-1">{selectedGame.goals.map((g) => <span key={g} className="rounded-full bg-slate-700 px-2 py-0.5 text-xs">{g}</span>)}</div>
              </div>
            )}
            {selectedGame.setting?.length > 0 && (
              <div>
                <p className="text-xs uppercase text-slate-500 mb-1">Setting</p>
                <div className="flex flex-wrap gap-1">{selectedGame.setting.map((s) => <span key={s} className="rounded-full bg-slate-700 px-2 py-0.5 text-xs capitalize">{s}</span>)}</div>
              </div>
            )}
            {selectedGame.materials && <InfoItem label="Materials" value={selectedGame.materials} />}
            {selectedGame.facilitation && (
              <div>
                <p className="text-xs uppercase text-slate-500 mb-1">Facilitation Tips</p>
                <p className="text-slate-300 whitespace-pre-wrap">{selectedGame.facilitation}</p>
              </div>
            )}
            {sessions.length > 0 && (
              <button
                onClick={() => { setAddTarget(selectedGame); setSelectedGame(null); }}
                className="mt-2 w-full rounded-md bg-fsu-garnet px-4 py-2 font-medium hover:brightness-110"
              >
                Add to Session
              </button>
            )}
          </div>
        )}
      </Modal>

      {/* Add to session modal */}
      <Modal open={!!addTarget} onClose={() => { setAddTarget(null); setSelectedSession(''); setAddStatus(''); }} title={`Add "${addTarget?.name}" to Session`}>
        <div className="space-y-4">
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="w-full rounded-md bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-1 focus:ring-fsu-gold/50"
          >
            <option value="">Select a session…</option>
            {sessions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {addStatus === 'done' && <p className="text-green-400 text-sm">Added successfully!</p>}
          {addStatus === 'error' && <p className="text-red-400 text-sm">Failed to add. Game may already be in this session.</p>}
          <button
            onClick={handleAddToSession}
            disabled={!selectedSession || addStatus === 'adding'}
            className="w-full rounded-md bg-fsu-garnet px-4 py-2 font-medium hover:brightness-110 disabled:opacity-50"
          >
            {addStatus === 'adding' ? 'Adding…' : 'Add to Session'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <div className="mt-0.5 text-slate-200">{value}</div>
    </div>
  );
}
