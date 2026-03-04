import { Badge } from '../ui/Badge';

export function GameCard({ game, onViewDetail, onAdd }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4 flex flex-col gap-3 hover:border-fsu-gold/40 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-slate-100 leading-tight">{game.name}</h3>
        <Badge variant={game.activity_level} label={game.activity_level} />
      </div>

      <p className="text-sm text-slate-400 line-clamp-2">{game.description}</p>

      <div className="flex flex-wrap gap-1">
        {game.goals?.slice(0, 3).map((g) => (
          <span key={g} className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300">{g}</span>
        ))}
      </div>

      <div className="flex items-center gap-4 text-xs text-slate-400 mt-auto">
        <span>👥 {game.min_group}–{game.max_group}</span>
        <span>⏱ {game.time_min}–{game.time_max} min</span>
      </div>

      <div className="flex gap-2 mt-1">
        <button
          onClick={() => onViewDetail?.(game)}
          className="flex-1 rounded-md bg-slate-800 px-3 py-1.5 text-sm hover:bg-slate-700"
        >
          Details
        </button>
        {onAdd && (
          <button
            onClick={() => onAdd(game)}
            className="flex-1 rounded-md bg-fsu-garnet px-3 py-1.5 text-sm font-medium hover:brightness-110"
          >
            + Session
          </button>
        )}
      </div>
    </div>
  );
}
