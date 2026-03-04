import { useState } from 'react';
import { GoalTag } from '../ui/GoalTag';

export function GameCard({ game, onViewDetail, onAdd, isInSession = false }) {
  const [expanded, setExpanded] = useState(false);

  const activityColors = { low: '#16a34a', medium: '#d97706', high: '#dc2626' };
  const activityColor = activityColors[game.activity_level] || '#78716C';

  return (
    <div className="bg-fsu-surface border border-fsu-border rounded-xl overflow-hidden hover:border-fsu-border2 hover:shadow-md transition-all">
      {/* Card header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-syne font-bold text-fsu-text text-base leading-snug">{game.name}</h3>
          <span style={{ background: activityColor + '18', color: activityColor, border: `1px solid ${activityColor}33` }}
            className="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 capitalize">
            {game.activity_level}
          </span>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap gap-3 text-xs text-fsu-muted mb-3">
          <span>{game.min_group}–{game.max_group} people</span>
          <span>{game.time_min}–{game.time_max} min</span>
          {game.setting?.map(s => (
            <span key={s} className="capitalize bg-fsu-soft border border-fsu-border px-2 py-0.5 rounded-full text-fsu-muted">
              {s}
            </span>
          ))}
          {(game.physical_intensity || game.psychological_intensity) && (
            <>
              {game.physical_intensity && (
                <span className="bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full">
                  Phys {game.physical_intensity}/5
                </span>
              )}
              {game.psychological_intensity && (
                <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full">
                  Psych {game.psychological_intensity}/5
                </span>
              )}
            </>
          )}
        </div>

        {/* Description */}
        {game.description && (
          <p className="text-sm text-fsu-muted leading-relaxed mb-3 line-clamp-2">{game.description}</p>
        )}

        {/* Goal tags */}
        {game.goals?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {game.goals.map(g => <GoalTag key={g} goal={g} />)}
          </div>
        )}

        {/* Expand toggle */}
        {(game.facilitation || game.materials) && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="text-xs text-fsu-garnet hover:text-fsu-garnet2 font-medium transition-colors"
          >
            {expanded ? '▲ Hide tips' : '▼ Facilitation tips & materials'}
          </button>
        )}
      </div>

      {/* Expanded section */}
      {expanded && (game.facilitation || game.materials) && (
        <div className="border-t border-fsu-border bg-fsu-soft px-4 py-3 space-y-2">
          {game.facilitation && (
            <div>
              <p className="text-xs font-semibold text-fsu-text mb-1">Facilitation Notes</p>
              <p className="text-xs text-fsu-muted leading-relaxed">{game.facilitation}</p>
            </div>
          )}
          {game.materials && (
            <div>
              <p className="text-xs font-semibold text-fsu-text mb-1">Materials</p>
              <p className="text-xs text-fsu-muted">{game.materials}</p>
            </div>
          )}
          {game.safety_notes && (
            <div>
              <p className="text-xs font-semibold text-red-700 mb-1">Safety Notes</p>
              <p className="text-xs text-red-600 leading-relaxed">{game.safety_notes}</p>
            </div>
          )}
          {game.learning_objectives?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-fsu-text mb-1">Learning Objectives</p>
              <ul className="text-xs text-fsu-muted list-disc list-inside space-y-0.5">
                {game.learning_objectives.map((obj, i) => <li key={i}>{obj}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Action footer */}
      <div className="px-4 py-3 border-t border-fsu-border flex gap-2">
        {onViewDetail && (
          <button
            onClick={() => onViewDetail(game)}
            className="flex-1 text-sm border border-fsu-border2 text-fsu-muted hover:text-fsu-text hover:border-fsu-garnet rounded-lg py-1.5 transition-colors"
          >
            Details
          </button>
        )}
        {onAdd && (
          <button
            onClick={() => !isInSession && onAdd(game)}
            className={`flex-1 text-sm rounded-lg py-1.5 font-medium transition-colors ${
              isInSession
                ? 'bg-green-100 text-green-700 border border-green-200 cursor-default'
                : 'bg-fsu-garnet hover:bg-fsu-garnet2 text-white'
            }`}
          >
            {isInSession ? '✓ In Session' : '+ Add'}
          </button>
        )}
      </div>
    </div>
  );
}
