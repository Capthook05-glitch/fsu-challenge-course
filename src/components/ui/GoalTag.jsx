import { GOAL_META } from '../../lib/goalMeta';

export function GoalTag({ goal, size = 'sm' }) {
  const meta = GOAL_META[goal];
  const pad = size === 'lg' ? '5px 12px' : '2px 9px';
  const fs = size === 'lg' ? '13px' : '11px';

  if (meta) {
    return (
      <span
        style={{
          backgroundColor: meta.color + '22',
          color: meta.color,
          border: `1px solid ${meta.color}33`,
          borderRadius: '4px',
          padding: pad,
          fontSize: fs,
          fontWeight: 600,
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
          display: 'inline-block',
        }}
      >
        {meta.emoji} {goal}
      </span>
    );
  }

  return (
    <span
      style={{
        backgroundColor: 'rgba(100,116,139,0.2)',
        color: '#94a3b8',
        border: '1px solid rgba(100,116,139,0.2)',
        borderRadius: '4px',
        padding: pad,
        fontSize: fs,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.02em',
        display: 'inline-block',
      }}
    >
      {goal}
    </span>
  );
}
