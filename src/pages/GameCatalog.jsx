import { useState, useEffect, useMemo } from 'react';
import { getSupabaseClient } from '../lib/supabase';
import { GameCard } from '../components/games/GameCard';
import { GOAL_META, GOAL_KEYS } from '../lib/goalMeta';
import { stripEmojis } from '../lib/utils';

const supabase = getSupabaseClient();

export default function GameCatalog() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filterGoal, setFilterGoal]       = useState([]);
  const [filterSetting, setFilterSetting] = useState(['outdoor']);
  const [filterMaxTime, setFilterMaxTime]     = useState(45);
  const [groupSize, setGroupSize] = useState(10);
  const [viewType, setViewType] = useState('grid'); // 'grid' or 'list'

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
      if (groupSize && (g.max_group < groupSize || g.min_group > groupSize)) return false;
      if (filterMaxTime && g.time_min > filterMaxTime) return false;
      return true;
    });
  }, [games, search, filterGoal, filterSetting, groupSize, filterMaxTime]);

  function toggleArr(arr, setArr, val) {
    setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  }

  function clearAll() {
    setSearch(''); setFilterGoal([]); setFilterSetting(['outdoor']);
    setFilterMaxTime(45); setGroupSize(10);
  }

  return (
    <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row gap-8 p-6 lg:p-12 bg-background-light">
      {/* Sidebar Filters */}
      <aside className="w-full lg:w-72 shrink-0 space-y-8 no-print">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-navy-deep dark:text-white">Filters</h2>
          <button
            onClick={clearAll}
            className="text-xs font-bold text-primary hover:text-primary/80 uppercase tracking-wider"
          >
            Reset All
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search activities..."
            className="w-full bg-white border-slate-200 rounded-lg pl-10 pr-4 py-3 text-sm focus:ring-primary focus:border-primary placeholder:text-slate-400"
          />
        </div>

        {/* Goal/Focus Tags */}
        <div className="space-y-4">
          <h3 className="text-[11px] font-black uppercase text-slate-500 tracking-widest">Goal / Focus</h3>
          <div className="flex flex-wrap gap-2">
            {GOAL_KEYS.map(k => {
              const meta = GOAL_META[k];
              const active = filterGoal.includes(k);
              return (
                <button
                  key={k}
                  onClick={() => toggleArr(filterGoal, setFilterGoal, k)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                    active
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-primary/30'
                  }`}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Setting */}
        <div className="space-y-4">
          <h3 className="text-[11px] font-black uppercase text-slate-500 tracking-widest">Setting</h3>
          <div className="grid grid-cols-2 gap-2">
            {['indoor', 'outdoor'].map(s => (
              <label key={s} className="flex items-center gap-2 p-3 rounded-lg bg-white border border-slate-200 cursor-pointer hover:border-primary/50 transition-colors">
                <input
                  type="checkbox"
                  checked={filterSetting.includes(s)}
                  onChange={() => toggleArr(filterSetting, setFilterSetting, s)}
                  className="rounded text-primary focus:ring-primary border-slate-300"
                />
                <span className="text-xs font-bold text-slate-600 capitalize">{s}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Group Size */}
        <div className="space-y-4">
          <h3 className="text-[11px] font-black uppercase text-slate-500 tracking-widest">Group Size</h3>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={groupSize}
              onChange={e => setGroupSize(parseInt(e.target.value) || 0)}
              className="w-20 bg-white border-slate-200 rounded-lg py-2 text-center font-bold text-sm focus:ring-primary focus:border-primary"
            />
            <span className="text-slate-400 text-sm font-medium">Participants</span>
          </div>
        </div>

        {/* Time Range */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-[11px] font-black uppercase text-slate-500 tracking-widest">Max Time</h3>
            <span className="text-xs font-bold text-primary">{filterMaxTime} mins</span>
          </div>
          <input
            type="range"
            min="5"
            max="120"
            value={filterMaxTime}
            onChange={e => setFilterMaxTime(parseInt(e.target.value))}
            className="w-full accent-primary h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </aside>

      {/* Main Content */}
      <section className="flex-1 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-navy-deep dark:text-white">Game Catalog</h2>
            <p className="text-slate-500 mt-1 font-medium">Found {filtered.length} activities matching your current filters.</p>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg no-print">
            <button
              onClick={() => setViewType('grid')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${viewType === 'grid' ? 'bg-white text-navy-deep shadow-sm' : 'text-slate-500 hover:text-navy-deep'}`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewType('list')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${viewType === 'list' ? 'bg-white text-navy-deep shadow-sm' : 'text-slate-500 hover:text-navy-deep'}`}
            >
              List
            </button>
          </div>
        </div>

        {loading && <p className="text-slate-400">Loading activities...</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* We can highlight the first filtered game as an "Expanded Card" if in grid view and it's highly relevant */}
          {filtered.map((g, i) => (
            <GameCard
              key={g.id}
              game={{...g, name: stripEmojis(g.name)}}
              isExpanded={viewType === 'grid' && i === 0 && search === '' && filterGoal.length === 0}
              onAdd={() => console.log('Add to plan', g)}
            />
          ))}

          {!loading && filtered.length === 0 && (
            <div className="col-span-full text-center py-20 text-slate-500 bg-slate-900/30 rounded-2xl border-2 border-dashed border-slate-800">
              <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
              <p className="text-lg font-medium">No activities matching your current filters.</p>
              <button onClick={clearAll} className="text-primary font-bold mt-2 hover:underline">Clear all filters</button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
