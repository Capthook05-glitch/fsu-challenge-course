import { GOAL_META } from '../../lib/goalMeta';

export function GoalTag({ goal, size = 'sm' }) {
  const meta = GOAL_META[goal];
  const padding = size === 'lg' ? '4px 10px' : '2px 8px';
  const fontSize = size === 'lg' ? '13px' : '11px';

  if (!meta) {
    return (
      <span style={{
        display: 'inline-block',
        padding,
        fontSize,
        fontWeight: 500,
        borderRadius: '9999px',
        background: '#F5F2EE',
        color: '#78716C',
        border: '1px solid #E8E2D9',
        whiteSpace: 'nowrap',
      }}>
        {goal}
      </span>
    );
  }

  return (
    <span style={{
      display: 'inline-block',
      padding,
      fontSize,
      fontWeight: 600,
      borderRadius: '9999px',
      background: meta.bg,
      color: meta.color,
      border: `1px solid ${meta.color}44`,
      whiteSpace: 'nowrap',
      letterSpacing: '0.01em',
    }}>
      {meta.label}
    </span>
  );
}
