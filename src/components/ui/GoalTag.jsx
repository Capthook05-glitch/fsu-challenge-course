import { GOAL_META } from '../../lib/goalMeta';

export function GoalTag({ goal, size = 'sm' }) {
  const meta = GOAL_META[goal];

  if (!meta) {
    return (
      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider border border-slate-200">
        {goal}
      </span>
    );
  }

  return (
    <span
      className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider border transition-all`}
      style={{ background: meta.bg, color: meta.color, borderColor: `${meta.color}33` }}
    >
      {meta.label}
    </span>
  );
}
