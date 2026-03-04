import { useEffect, useState, useMemo } from 'react';
import { useProfile } from '../context/ProfileContext';
import { getSupabaseClient } from '../lib/supabase';
import { GameCard } from '../components/games/GameCard';
import { Modal } from '../components/ui/Modal';
import { GoalTag } from '../components/ui/GoalTag';
import { GOAL_META, GOAL_KEYS } from '../lib/goalMeta';

const ALL_SETTINGS = ['indoor', 'outdoor'];
const ALL_ACTIVITY = ['low', 'medium', 'high'];

export function GameCatalog() {
  const { profile } = useProfile();
  const [games, setGames] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterGoals, setFilterGoals] = useState([]);
  const [filterSetting, setFilterSetting] = useState([]);
  const [filterLevel, setFilterLevel] = useState('');
  const [filterGroupSize, setFilterGroupSize] = useState('');
  const [filterMaxTime, setFilterMaxTime] = useState('');
  const [selectedGame, setSelectedGame] = useState(null);
  const [addTarget, setAddTarget] = useState(null);
  const [selectedSession, setSelectedSession] = useState('');
  const [addStatus, setAddStatus] = useState('');
  const [sessionGameIds, setSessionGameIds] = useState(new Set());

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

  // When a session is selected for "add", load which games are already in it
  useEffect(() => {
    if (!selectedSession) { setSessionGameIds(new Set()); return; }
    const supabase = getSupabaseClient();
    supabase.from('session_games').select('game_id').eq('session_id', selectedSession)
      .then(({ data }) => setSessionGameIds(new Set((data ?? []).map((r) => r.game_id))));
  }, [selectedSession]);

  const filtered = useMemo(() => {
    return games.filter((g) => {
      if (search && !g.name.toLowerCase().includes(search.toLowerCase()) && !g.description.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterLevel && g.activity_level !== filterLevel) return false;
      if (filterGoals.length > 0 && !filterGoals.some((goal) => g.goals?.includes(goal))) return false;
      if (filterSetting.length > 0 && !filterSetting.some((s) => g.setting?.includes(s))) return false;
      if (filterGroupSize && (g.min_group > Number(filterGroupSize) || g.max_group < Number(filterGroupSize))) return false;
      if (filterMaxTime && g.time_min > Number(filterMaxTime)) return false;
      return true;
    });
  }, [games, search, filterLevel, filterGoals, filterSetting, filterGroupSize, filterMaxTime]);

  const toggleGoal = (g) => setFilterGoals((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);
  const toggleSetting = (s) => setFilterSetting((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  const clearFilters = () => { setSearch(''); setFilterGoals([]); setFilterSetting([]); setFilterLevel(''); setFilterGroupSize(''); setFilterMaxTime(''); };

  const handleAddToSession = async () => {
    if (!selectedSession || !addTarget) return;
    setAddStatus('adding');
    const supabase = getSupabaseClient();
    const { data: existing } = await supabase
      .from('session_games').select('position').eq('session_id', selectedSession)
      .order('position', { ascending: false }).limit(1);
    const nextPos = (existing?.[0]?.position ?? 0) + 1;
    const { error } = await supabase.from('session_games').insert({
      session_id: selectedSession, game_id: addTarget.id, position: nextPos,
    });
    if (!error) {
      setSessionGameIds((prev) => new Set([...prev, addTarget.id]));
      setAddStatus('done');
      setTimeout(() => { setAddTarget(null); setAddStatus(''); }, 1200);
    } else {
      setAddStatus('error');
    }
  };

  const inputCls = 'w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors focus:border-fsu-border2';
  const inputStyle = { background: '#162035', border: '1px solid #1e2d45', color: '#e8edf5', fontFamily: 'DM Sans' };

  if (loading) return <p className="text-fsu-muted p-6">Loading games…</p>;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] -mx-4 -my-8">
      {/* Filter sidebar */}
      <aside
        className="hidden md:flex w-56 flex-shrink-0 flex-col gap-5 border-r border-fsu-border p-4 overflow-y-auto"
        style={{ background: '#0f1729' }}
      >
        {/* Search */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#3a4f6a' }}>Search</p>
          <input
            type="text" placeholder="Search games…" value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={inputCls} style={inputStyle}
          />
        </div>

        {/* Goal filters */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#3a4f6a' }}>Focus / Goal</p>
          <div className="flex flex-col gap-1">
            {GOAL_KEYS.map((g) => {
              const meta = GOAL_META[g];
              const active = filterGoals.includes(g);
              return (
                <button
                  key={g}
                  onClick={() => toggleGoal(g)}
                  className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-left transition-all"
                  style={{
                    background: active ? meta.color + '22' : '#162035',
                    color: active ? meta.color : '#7a90b0',
                    border: `1px solid ${active ? meta.color + '44' : '#1e2d45'}`,
                  }}
                >
                  {meta.emoji} {g}
                </button>
              );
            })}
          </div>
        </div>

        {/* Setting */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#3a4f6a' }}>Setting</p>
          <div className="flex flex-wrap gap-1.5">
            {ALL_SETTINGS.map((s) => (
              <button
                key={s}
                onClick={() => toggleSetting(s)}
                className="rounded-md px-2.5 py-1 text-xs font-semibold capitalize transition-all"
                style={{
                  background: filterSetting.includes(s) ? 'rgba(206,176,105,0.15)' : '#162035',
                  color: filterSetting.includes(s) ? '#CEB069' : '#7a90b0',
                  border: `1px solid ${filterSetting.includes(s) ? 'rgba(206,176,105,0.35)' : '#1e2d45'}`,
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Activity Level */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#3a4f6a' }}>Activity Level</p>
          <div className="flex flex-wrap gap-1.5">
            {ALL_ACTIVITY.map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterLevel(filterLevel === lvl ? '' : lvl)}
                className="rounded-md px-2.5 py-1 text-xs font-semibold capitalize transition-all"
                style={{
                  background: filterLevel === lvl ? 'rgba(120,47,64,0.3)' : '#162035',
                  color: filterLevel === lvl ? '#e8c97a' : '#7a90b0',
                  border: `1px solid ${filterLevel === lvl ? 'rgba(120,47,64,0.5)' : '#1e2d45'}`,
                }}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Group size */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#3a4f6a' }}>Group Size</p>
          <input
            type="number" placeholder="How many people?" min="1" max="200"
            value={filterGroupSize} onChange={(e) => setFilterGroupSize(e.target.value)}
            className={inputCls} style={inputStyle}
          />
        </div>

        {/* Max time */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#3a4f6a' }}>Max Time (min)</p>
          <input
            type="number" placeholder="e.g. 20" min="1"
            value={filterMaxTime} onChange={(e) => setFilterMaxTime(e.target.value)}
            className={inputCls} style={inputStyle}
          />
        </div>

        {/* Clear all */}
        <button
          onClick={clearFilters}
          className="rounded-md py-2 text-xs font-semibold transition-all"
          style={{ background: '#162035', color: '#3a4f6a', border: '1px solid #1e2d45' }}
        >
          ✕ Clear All Filters
        </button>
      </aside>

      {/* Game grid area */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {/* Mobile search (sidebar hidden on mobile) */}
        <div className="mb-4 md:hidden">
          <input
            type="text" placeholder="Search games…" value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={inputCls} style={inputStyle}
          />
        </div>

        <div className="flex items-center justify-between mb-4">
          <p className="text-xs" style={{ color: '#7a90b0' }}>
            {filtered.length} of {games.length} games
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20" style={{ color: '#3a4f6a' }}>
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-bold text-fsu-muted mb-1">No games match your filters</p>
            <button onClick={clearFilters} className="text-sm text-fsu-gold hover:underline mt-2">Clear filters</button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                onViewDetail={setSelectedGame}
                onAdd={sessions.length > 0 ? setAddTarget : undefined}
                isInSession={sessionGameIds.has(game.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail modal */}
      <Modal open={!!selectedGame} onClose={() => setSelectedGame(null)} title={selectedGame?.name} wide>
        {selectedGame && (
          <div className="space-y-4 text-sm">
            <p style={{ color: '#9aabbc' }}>{selectedGame.description}</p>
            <div className="grid grid-cols-2 gap-3">
              <InfoItem label="Group Size" value={`${selectedGame.min_group}–${selectedGame.max_group}`} />
              <InfoItem label="Time" value={`${selectedGame.time_min}–${selectedGame.time_max} min`} />
              <InfoItem label="Activity Level" value={<span className="capitalize">{selectedGame.activity_level}</span>} />
              {selectedGame.min_age && <InfoItem label="Age Range" value={`${selectedGame.min_age}–${selectedGame.max_age}`} />}
            </div>
            {selectedGame.goals?.length > 0 && (
              <div>
                <p className="text-xs uppercase text-fsu-faint mb-2 font-bold tracking-wide">Goals</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedGame.goals.map((g) => <GoalTag key={g} goal={g} size="lg" />)}
                </div>
              </div>
            )}
            {selectedGame.setting?.length > 0 && (
              <div>
                <p className="text-xs uppercase text-fsu-faint mb-1 font-bold tracking-wide">Setting</p>
                <div className="flex flex-wrap gap-1">
                  {selectedGame.setting.map((s) => (
                    <span key={s} className="rounded px-2 py-0.5 text-xs font-semibold capitalize"
                      style={{ background: 'rgba(122,144,176,0.15)', color: '#7a90b0', border: '1px solid rgba(122,144,176,0.2)' }}>
                      📍 {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {selectedGame.materials && <InfoItem label="Materials" value={selectedGame.materials} />}
            {selectedGame.facilitation && (
              <div>
                <p className="text-xs uppercase text-fsu-faint mb-1 font-bold tracking-wide">Facilitation Tips</p>
                <p style={{ color: '#b8ccd8' }} className="whitespace-pre-wrap">{selectedGame.facilitation}</p>
              </div>
            )}
            {sessions.length > 0 && (
              <button
                onClick={() => { setAddTarget(selectedGame); setSelectedGame(null); }}
                className="mt-2 w-full rounded-lg py-2.5 font-bold text-sm transition-all hover:brightness-110"
                style={{ background: '#782F40', color: '#fff' }}
              >
                + Add to Session
              </button>
            )}
          </div>
        )}
      </Modal>

      {/* Add to session modal */}
      <Modal
        open={!!addTarget}
        onClose={() => { setAddTarget(null); setSelectedSession(''); setAddStatus(''); }}
        title={`Add "${addTarget?.name}" to Session`}
      >
        <div className="space-y-4">
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: '#162035', border: '1px solid #1e2d45', color: '#e8edf5' }}
          >
            <option value="">Select a session…</option>
            {sessions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {addStatus === 'done' && <p className="text-sm" style={{ color: '#3ecf8e' }}>Added successfully!</p>}
          {addStatus === 'error' && <p className="text-sm text-red-400">Game may already be in this session.</p>}
          <button
            onClick={handleAddToSession}
            disabled={!selectedSession || addStatus === 'adding'}
            className="w-full rounded-lg py-2.5 font-bold text-sm transition-all hover:brightness-110 disabled:opacity-50"
            style={{ background: '#782F40', color: '#fff' }}
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
      <p className="text-xs uppercase font-bold tracking-wide mb-0.5" style={{ color: '#3a4f6a' }}>{label}</p>
      <div style={{ color: '#e8edf5' }}>{value}</div>
    </div>
  );
}
