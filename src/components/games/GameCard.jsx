import { GoalTag } from '../ui/GoalTag';

export function GameCard({ game, onViewDetail, onAdd, isInSession = false, isExpanded = false }) {
  if (isExpanded) {
    return (
      <div className="md:col-span-2 xl:col-span-3 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="flex flex-col lg:flex-row">
          <div className="lg:w-1/3 h-64 lg:h-auto relative bg-slate-100">
             {game.image_url ? (
                <img className="w-full h-full object-cover" alt={game.name} src={game.image_url} />
             ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                   <span className="material-symbols-outlined text-6xl">image</span>
                </div>
             )}
          </div>
          <div className="flex-1 p-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {game.goals?.map(g => <GoalTag key={g} goal={g} />)}
                </div>
                <h3 className="text-3xl font-extrabold text-navy-deep">{game.name}</h3>
              </div>
              <button
                onClick={() => onAdd && onAdd(game)}
                disabled={isInSession}
                className={`shrink-0 flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all shadow-lg shadow-primary/20 ${
                  isInSession
                    ? 'bg-primary text-white'
                    : 'bg-primary hover:bg-primary/90 text-white'
                }`}
              >
                {isInSession ? (
                  <>
                    <span className="material-symbols-outlined text-[20px] filled-icon">check_circle</span>
                    In Plan
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">add_circle</span>
                    Add to Plan
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-6 border-y border-slate-100">
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Group Size</p>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">groups</span>
                  <p className="text-sm font-bold text-navy-deep">{game.min_group} - {game.max_group} players</p>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Time</p>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">schedule</span>
                  <p className="text-sm font-bold text-navy-deep">{game.time_min} - {game.time_max} mins</p>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Intensity</p>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">bolt</span>
                  <p className="text-sm font-bold text-navy-deep capitalize">{game.activity_level}</p>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Materials</p>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">inventory_2</span>
                  <p className="text-sm font-bold text-navy-deep">{game.materials || 'None Required'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="font-extrabold text-navy-deep text-lg border-l-4 border-accent-gold pl-4 uppercase tracking-tighter">Facilitation Guide</h4>
              <div className="grid md:grid-cols-2 gap-8 text-sm leading-relaxed text-slate-600">
                <div className="space-y-4">
                  <p><strong className="text-navy-deep block mb-1">Description:</strong> {game.description}</p>
                </div>
                <div className="space-y-4">
                   {game.facilitation && <p><strong className="text-navy-deep block mb-1">Set-up/Flow:</strong> {game.facilitation}</p>}
                   {game.safety_notes && <p><strong className="text-navy-deep block mb-1">Safety:</strong> {game.safety_notes}</p>}
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
    <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col hover:border-primary/30 transition-all group hover:shadow-lg hover:shadow-slate-200/50">
      <div className="mb-4 flex flex-wrap gap-2">
        {game.goals?.map(g => <GoalTag key={g} goal={g} size="sm" />)}
      </div>
      <h3 className="text-xl font-bold text-navy-deep group-hover:text-primary transition-colors">{game.name}</h3>
      <p className="text-slate-500 text-sm mt-2 line-clamp-3 leading-relaxed">{game.description}</p>

      <div className="mt-auto pt-6 flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-widest py-3 border-t border-slate-100">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px]">groups</span>
          <span>{game.min_group} - {game.max_group}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px]">schedule</span>
          <span>{game.time_min}m</span>
        </div>
      </div>

      <button
        onClick={() => onAdd && onAdd(game)}
        disabled={isInSession}
        className={`mt-4 w-full py-2.5 rounded-lg border-2 font-bold text-sm transition-all ${
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
