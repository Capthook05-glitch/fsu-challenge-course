import { GoalTag } from '../ui/GoalTag';

export function GameCard({ game, onViewDetail, onAdd, isInSession = false, isExpanded = false }) {
  if (isExpanded) {
    return (
      <div className="md:col-span-2 xl:col-span-3 bg-slate-900 border-2 border-primary/40 rounded-2xl overflow-hidden shadow-2xl shadow-primary/10 transition-all">
        <div className="flex flex-col lg:flex-row">
          <div className="lg:w-1/3 h-64 lg:h-auto relative bg-slate-800">
             {game.image_url ? (
                <img className="w-full h-full object-cover opacity-60" alt={game.name} src={game.image_url} />
             ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-700">
                   <span className="material-symbols-outlined text-6xl">image</span>
                </div>
             )}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-transparent to-transparent lg:hidden"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent lg:hidden"></div>
          </div>
          <div className="flex-1 p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {game.goals?.map(g => <GoalTag key={g} goal={g} />)}
                </div>
                <h3 className="text-3xl font-extrabold text-slate-100">{game.name}</h3>
              </div>
              <button
                onClick={() => onAdd && onAdd(game)}
                disabled={isInSession}
                className={`shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-transform active:scale-95 ${
                  isInSession
                    ? 'bg-primary text-white'
                    : 'bg-primary hover:scale-105 text-white'
                }`}
              >
                {isInSession ? (
                  <>
                    <span className="material-symbols-outlined filled-icon">check_circle</span>
                    In Plan
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">add_circle</span>
                    Add to Plan
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-4 border-y border-slate-800">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">groups</span>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase">Group Size</p>
                  <p className="text-sm font-bold">{game.min_group} - {game.max_group} players</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">schedule</span>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase">Time</p>
                  <p className="text-sm font-bold">{game.time_min} - {game.time_max} mins</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">fitness_center</span>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase">Intensity</p>
                  <p className="text-sm font-bold text-accent-gold capitalize">{game.activity_level}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">layers</span>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase">Materials</p>
                  <p className="text-sm font-bold">{game.materials || 'None'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-accent-gold flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">sticky_note_2</span>
                Facilitation Notes
              </h4>
              <div className="grid md:grid-cols-2 gap-8 text-sm leading-relaxed text-slate-400">
                <div className="space-y-3">
                  <p>{game.description}</p>
                </div>
                <div className="space-y-3">
                   {game.facilitation && <p>{game.facilitation}</p>}
                   {game.safety_notes && <p><strong className="text-slate-200">Safety:</strong> {game.safety_notes}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const intensityColors = {
    low: 'text-emerald-500',
    medium: 'text-accent-gold',
    high: 'text-orange-500'
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col hover:border-primary/50 transition-all group">
      <div className="flex flex-wrap gap-2 mb-4">
        {game.goals?.map(g => <GoalTag key={g} goal={g} size="sm" />)}
      </div>
      <h3 className="text-xl font-bold group-hover:text-primary transition-colors text-slate-100">{game.name}</h3>
      <p className="text-slate-400 text-sm mt-2 line-clamp-2">{game.description}</p>

      <div className="mt-6 flex items-center justify-between text-slate-400 text-xs py-3 border-t border-slate-800/50">
        <div className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">groups</span>
          <span>{game.min_group} - {game.max_group}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">schedule</span>
          <span>{game.time_min}m</span>
        </div>
        <span className={`font-bold uppercase tracking-widest text-[10px] ${intensityColors[game.activity_level] || 'text-slate-500'}`}>
          {game.activity_level} Intensity
        </span>
      </div>

      <button
        onClick={() => onAdd && onAdd(game)}
        disabled={isInSession}
        className={`mt-4 w-full py-2.5 rounded-lg border font-bold text-sm transition-all ${
          isInSession
            ? 'border-primary bg-primary text-white cursor-default'
            : 'border-primary text-primary hover:bg-primary hover:text-white'
        }`}
      >
        {isInSession ? '✓ In Plan' : 'Add to Plan'}
      </button>
    </div>
  );
}
