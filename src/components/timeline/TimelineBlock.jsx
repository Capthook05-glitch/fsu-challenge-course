import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GoalTag } from '../ui/GoalTag';

const BLOCK_COLORS = {
  activity:   { border: '#782F40', bg: '#ffffff' },
  debrief:    { border: '#2563eb', bg: '#f8faff' },
  break:      { border: '#CEB069', bg: '#fffdf5' },
  transition: { border: '#78716C', bg: '#fafaf8' },
  custom:     { border: '#7c3aed', bg: '#fafafe' },
};

const BLOCK_LABELS = {
  activity: 'Activity', debrief: 'Debrief', break: 'Break', transition: 'Transition', custom: 'Custom'
};

function fmtTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m > 0 ? m + 'm' : ''}`;
}

function fmtStartTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h < 12 ? 'AM' : 'PM';
  const display = h > 12 ? h - 12 : (h === 0 ? 12 : h);
  return `${display}:${String(m).padStart(2,'0')} ${period}`;
}

export function TimelineBlock({ block, game, onEdit, readOnly = false }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id, disabled: readOnly });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const colors = BLOCK_COLORS[block.block_type] || BLOCK_COLORS.activity;
  const title = game?.name || block.title || BLOCK_LABELS[block.block_type] || 'Block';

  return (
    <div ref={setNodeRef} style={style}
      className="flex items-stretch bg-fsu-surface border border-fsu-border rounded-xl overflow-hidden hover:border-fsu-border2 hover:shadow-sm transition-all">
      {/* Drag handle + type color bar */}
      <div
        {...(!readOnly ? { ...attributes, ...listeners } : {})}
        className={`w-1.5 flex-shrink-0 ${readOnly ? '' : 'cursor-grab active:cursor-grabbing'}`}
        style={{ background: colors.border }}
      />
      <div className="flex-shrink-0 w-2" style={{ background: colors.bg }} />

      {/* Content */}
      <div className="flex-1 px-3 py-3 flex items-center gap-4 min-w-0" style={{ background: colors.bg }}>
        {/* Time */}
        <div className="flex-shrink-0 text-center min-w-[52px]">
          <p className="text-xs font-bold text-fsu-text tabular-nums">{fmtStartTime(block.start_time)}</p>
          <p className="text-xs text-fsu-muted">{fmtTime(block.duration_min)}</p>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-fsu-border flex-shrink-0" />

        {/* Title + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-syne font-semibold text-fsu-text text-sm truncate">{title}</p>
            <span className="text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
              style={{ background: colors.border + '18', color: colors.border }}>
              {BLOCK_LABELS[block.block_type]}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-0.5">
            {block.location && <span className="text-xs text-fsu-muted">{block.location}</span>}
            {block.subgroup && (
              <span className="text-xs bg-fsu-soft border border-fsu-border px-1.5 py-0.5 rounded-full text-fsu-muted">
                {block.subgroup}
              </span>
            )}
            {block.assigned_facilitator && (
              <span className="text-xs bg-fsu-garnet/8 border border-fsu-garnet/20 text-fsu-garnet px-1.5 py-0.5 rounded-full">
                {block.assigned_facilitator}
              </span>
            )}
            {game?.goals?.slice(0,2).map(g => <GoalTag key={g} goal={g} />)}
          </div>
        </div>
      </div>

      {/* Edit button (hidden in read-only mode) */}
      {!readOnly && (
        <button
          onClick={() => onEdit(block)}
          className="flex-shrink-0 px-3 text-fsu-muted hover:text-fsu-garnet hover:bg-fsu-soft transition-colors"
          style={{ background: colors.bg }}
        >
          ✎
        </button>
      )}
    </div>
  );
}
