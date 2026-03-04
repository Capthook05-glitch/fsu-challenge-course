import { useState } from 'react';
import { Badge } from '../ui/Badge';
import { GoalTag } from '../ui/GoalTag';

export function GameCard({ game, onViewDetail, onAdd, isInSession = false }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-fsu-border bg-fsu-bg2 p-4 flex flex-col gap-3 hover:border-fsu-border2 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white leading-tight" style={{ fontFamily: 'Syne', fontSize: '15px' }}>
            {game.name}
          </h3>
          <p className="text-xs text-fsu-muted mt-0.5">
            {game.min_group}–{game.max_group} people &nbsp;·&nbsp; {game.time_min}–{game.time_max} min &nbsp;·&nbsp; {game.activity_level}
          </p>
        </div>
        <Badge variant={game.activity_level} label={game.activity_level} />
      </div>

      {/* Goal + setting tags */}
      <div className="flex flex-wrap gap-1">
        {game.goals?.map((g) => <GoalTag key={g} goal={g} />)}
        {game.setting?.map((s) => (
          <span key={s} className="rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wide"
            style={{ background: 'rgba(122,144,176,0.15)', color: '#7a90b0', border: '1px solid rgba(122,144,176,0.2)' }}>
            📍 {s}
          </span>
        ))}
      </div>

      {/* Description */}
      <p className="text-sm" style={{ color: '#9aabbc', lineHeight: '1.55' }}>{game.description}</p>

      {/* Inline expand toggle */}
      <button
        onClick={() => setExpanded((e) => !e)}
        style={{ color: '#4a9eff', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}
      >
        {expanded ? '▲ Less detail' : '▼ Facilitation tips & materials'}
      </button>

      {/* Expanded facilitation detail */}
      {expanded && (
        <div className="border-t border-fsu-border pt-3 space-y-2">
          {game.facilitation && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#3a4f6a' }}>Facilitation Notes</p>
              <p className="text-xs" style={{ color: '#b8ccd8', lineHeight: '1.5' }}>{game.facilitation}</p>
            </div>
          )}
          {game.materials && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#3a4f6a' }}>Materials Needed</p>
              <p className="text-xs" style={{ color: '#b8ccd8' }}>{game.materials}</p>
            </div>
          )}
          {game.min_age && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#3a4f6a' }}>Age Range</p>
              <p className="text-xs" style={{ color: '#b8ccd8' }}>{game.min_age}–{game.max_age ?? '99'}</p>
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 mt-auto pt-1">
        {onViewDetail && (
          <button
            onClick={() => onViewDetail(game)}
            className="flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-all"
            style={{ background: '#162035', color: '#7a90b0', border: '1px solid #1e2d45' }}
          >
            ✏️ Details
          </button>
        )}
        {onAdd && (
          <button
            onClick={() => !isInSession && onAdd(game)}
            disabled={isInSession}
            className="flex-1 rounded-md px-3 py-1.5 text-xs font-bold transition-all"
            style={isInSession
              ? { background: 'rgba(62,207,142,0.15)', color: '#3ecf8e', border: '1px solid rgba(62,207,142,0.3)', cursor: 'default' }
              : { background: 'rgba(74,158,255,0.15)', color: '#4a9eff', border: '1px solid rgba(74,158,255,0.3)', cursor: 'pointer' }
            }
          >
            {isInSession ? '✓ In Session' : '+ Add to Session'}
          </button>
        )}
      </div>
    </div>
  );
}
