import { useState, useEffect, useMemo } from 'react';
import { getSupabaseClient } from '../lib/supabase';
import { GameCard } from '../components/games/GameCard';
import { GoalTag } from '../components/ui/GoalTag';
import { GOAL_META, GOAL_KEYS } from '../lib/goalMeta';
import { Modal } from '../components/ui/Modal';

const supabase = getSupabaseClient();

export default function GameCatalog() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filterGoal, setFilterGoal]       = useState([]);
  const [filterSetting, setFilterSetting] = useState([]);
  const [filterLevel, setFilterLevel]     = useState([]);
  const [filterGroupSize, setFilterGroupSize] = useState('');
  const [filterMaxTime, setFilterMaxTime]     = useState('');
  const [filterPhysical, setFilterPhysical]   = useState('');
  const [filterPsych, setFilterPsych]         = useState('');
  const [detailGame, setDetailGame] = useState(null);

  useEffect(() => {
    supabase.from('games').select('*').eq('is_active', true).order('name')
      .then(({ data }) => { setGames(data || []); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    return games.filter(g => {
      if (search && !g.name.toLowerCase().includes(search.toLowerCase()) &&
          !g.description?.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterGoal.length && !filterGoal.some(f => g.goals?.includes(f))) return false;
      if (filterSetting.length && !filterSetting.some(s => g.setting?.includes(s))) return false;
      if (filterLevel.length && !filterLevel.includes(g.activity_level)) return false;
      if (filterGroupSize && g.max_group < parseInt(filterGroupSize)) return false;
      if (filterMaxTime && g.time_min > parseInt(filterMaxTime)) return false;
      if (filterPhysical && g.physical_intensity < parseInt(filterPhysical)) return false;
      if (filterPsych && g.psychological_intensity < parseInt(filterPsych)) return false;
      return true;
    });
  }, [games, search, filterGoal, filterSetting, filterLevel, filterGroupSize, filterMaxTime, filterPhysical, filterPsych]);

  function toggleArr(arr, setArr, val) {
    setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  }

  function clearAll() {
    setSearch(''); setFilterGoal([]); setFilterSetting([]); setFilterLevel([]);
    setFilterGroupSize(''); setFilterMaxTime(''); setFilterPhysical(''); setFilterPsych('');
  }

  const hasFilters = search || filterGoal.length || filterSetting.length || filterLevel.length ||
    filterGroupSize || filterMaxTime || filterPhysical || filterPsych;

  return (
    <div className="flex h-full min-h-screen">
      {/* Filter sidebar */}
      <aside className="hidden md:flex flex-col w-56 flex-shrink-0 bg-fsu-soft border-r border-fsu-border overflow-y-auto py-4 px-3 gap-5">
        <div className="flex items-center justify-between">
          <h2 className="font-syne font-bold text-fsu-text text-sm">Filters</h2>
          {hasFilters && (
            <button onClick={clearAll} className="text-xs text-fsu-garnet hover:underline">Clear all</button>
          )}
        </div>

        {/* Search */}
        <div>
          <p className="text-xs font-semibold text-fsu-muted uppercase tracking-wide mb-1.5">Search</p>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Activity name..."
            className="w-full text-sm border border-fsu-border bg-fsu-surface rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-fsu-garnet text-fsu-text placeholder:text-fsu-faint"
          />
        </div>

        {/* Goal */}
        <div>
          <p className="text-xs font-semibold text-fsu-muted uppercase tracking-wide mb-1.5">Focus / Goal</p>
          <div className="flex flex-col gap-1">
            {GOAL_KEYS.map(k => {
              const meta = GOAL_META[k];
              const active = filterGoal.includes(k);
              return (
                <button
                  key={k}
                  onClick={() => toggleArr(filterGoal, setFilterGoal, k)}
                  className="text-left text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors"
                  style={active ? { background: meta.bg, color: meta.color, borderColor: meta.color+'55' }
                    : { background: 'transparent', color: '#78716C', borderColor: '#E8E2D9' }}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Setting */}
        <div>
          <p className="text-xs font-semibold text-fsu-muted uppercase tracking-wide mb-1.5">Setting</p>
          <div className="flex flex-col gap-1">
            {['indoor','outdoor'].map(s => (
              <button key={s}
                onClick={() => toggleArr(filterSetting, setFilterSetting, s)}
                className={`text-left text-xs font-medium px-2.5 py-1.5 rounded-lg border capitalize transition-colors ${
                  filterSetting.includes(s)
                    ? 'bg-fsu-garnet text-white border-fsu-garnet'
                    : 'bg-transparent text-fsu-muted border-fsu-border hover:border-fsu-border2'
                }`}
              >{s}</button>
            ))}
          </div>
        </div>

        {/* Activity level */}
        <div>
          <p className="text-xs font-semibold text-fsu-muted uppercase tracking-wide mb-1.5">Activity Level</p>
          <div className="flex flex-col gap-1">
            {['low','medium','high'].map(l => (
              <button key={l}
                onClick={() => toggleArr(filterLevel, setFilterLevel, l)}
                className={`text-left text-xs font-medium px-2.5 py-1.5 rounded-lg border capitalize transition-colors ${
                  filterLevel.includes(l)
                    ? 'bg-fsu-garnet text-white border-fsu-garnet'
                    : 'bg-transparent text-fsu-muted border-fsu-border hover:border-fsu-border2'
                }`}
              >{l}</button>
            ))}
          </div>
        </div>

        {/* Physical intensity */}
        <div>
          <p className="text-xs font-semibold text-fsu-muted uppercase tracking-wide mb-1.5">Min Physical Intensity</p>
          <div className="flex gap-1">
            {[1,2,3,4,5].map(n => (
              <button key={n}
                onClick={() => setFilterPhysical(filterPhysical == n ? '' : String(n))}
                className={`w-7 h-7 text-xs rounded border font-semibold transition-colors ${
                  filterPhysical == n ? 'bg-orange-500 text-white border-orange-500' : 'bg-fsu-surface border-fsu-border text-fsu-muted'
                }`}
              >{n}</button>
            ))}
          </div>
        </div>

        {/* Psych intensity */}
        <div>
          <p className="text-xs font-semibold text-fsu-muted uppercase tracking-wide mb-1.5">Min Psych Intensity</p>
          <div className="flex gap-1">
            {[1,2,3,4,5].map(n => (
              <button key={n}
                onClick={() => setFilterPsych(filterPsych == n ? '' : String(n))}
                className={`w-7 h-7 text-xs rounded border font-semibold transition-colors ${
                  filterPsych == n ? 'bg-purple-500 text-white border-purple-500' : 'bg-fsu-surface border-fsu-border text-fsu-muted'
                }`}
              >{n}</button>
            ))}
          </div>
        </div>

        {/* Group size */}
        <div>
          <p className="text-xs font-semibold text-fsu-muted uppercase tracking-wide mb-1.5">Min Group Size</p>
          <input
            type="number" min="1" value={filterGroupSize}
            onChange={e => setFilterGroupSize(e.target.value)}
            placeholder="e.g. 15"
            className="w-full text-sm border border-fsu-border bg-fsu-surface rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-fsu-garnet text-fsu-text"
          />
        </div>

        {/* Max time */}
        <div>
          <p className="text-xs font-semibold text-fsu-muted uppercase tracking-wide mb-1.5">Max Time (min)</p>
          <input
            type="number" min="1" value={filterMaxTime}
            onChange={e => setFilterMaxTime(e.target.value)}
            placeholder="e.g. 20"
            className="w-full text-sm border border-fsu-border bg-fsu-surface rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-fsu-garnet text-fsu-text"
          />
        </div>
      </aside>

      {/* Game grid */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="flex items-center justify-between mb-5">
          <h1 className="font-syne font-bold text-2xl text-fsu-text">Activity Library</h1>
          <span className="text-sm text-fsu-muted">{filtered.length} of {games.length} activities</span>
        </div>

        {loading && <p className="text-fsu-muted text-sm">Loading...</p>}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 text-fsu-muted">
            <p className="text-lg font-medium mb-2">No activities match your filters</p>
            <button onClick={clearAll} className="text-fsu-garnet hover:underline text-sm">Clear all filters</button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(g => (
            <GameCard
              key={g.id}
              game={g}
              onViewDetail={setDetailGame}
            />
          ))}
        </div>
      </div>

      {/* Detail modal */}
      {detailGame && (
        <Modal onClose={() => setDetailGame(null)}>
          <div className="p-6 max-w-lg">
            <h2 className="font-syne font-bold text-xl text-fsu-text mb-1">{detailGame.name}</h2>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {detailGame.goals?.map(g => <GoalTag key={g} goal={g} size="lg" />)}
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-fsu-muted mb-4">
              <span>{detailGame.min_group}–{detailGame.max_group} people</span>
              <span>{detailGame.time_min}–{detailGame.time_max} min</span>
              <span className="capitalize">{detailGame.activity_level} activity</span>
            </div>
            {detailGame.description && <p className="text-sm text-fsu-muted mb-4 leading-relaxed">{detailGame.description}</p>}
            {detailGame.facilitation && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-fsu-text mb-1">Facilitation Notes</p>
                <p className="text-sm text-fsu-muted leading-relaxed">{detailGame.facilitation}</p>
              </div>
            )}
            {detailGame.materials && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-fsu-text mb-1">Materials</p>
                <p className="text-sm text-fsu-muted">{detailGame.materials}</p>
              </div>
            )}
            {detailGame.safety_notes && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs font-semibold text-red-700 mb-1">Safety Notes</p>
                <p className="text-sm text-red-600">{detailGame.safety_notes}</p>
              </div>
            )}
            {detailGame.learning_objectives?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-fsu-text mb-1">Learning Objectives</p>
                <ul className="list-disc list-inside text-sm text-fsu-muted space-y-1">
                  {detailGame.learning_objectives.map((o, i) => <li key={i}>{o}</li>)}
                </ul>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
