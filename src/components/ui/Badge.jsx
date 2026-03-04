const statusColors = {
  draft: 'bg-slate-700 text-slate-200',
  ready: 'bg-fsu-gold text-fsu-navy',
  completed: 'bg-green-800 text-green-100',
  archived: 'bg-slate-800 text-slate-400',
  admin: 'bg-fsu-garnet text-white',
  facilitator: 'bg-slate-700 text-slate-200',
  low: 'bg-green-900 text-green-200',
  medium: 'bg-yellow-900 text-yellow-200',
  high: 'bg-red-900 text-red-200',
};

export function Badge({ label, variant = 'draft' }) {
  const colors = statusColors[variant] ?? 'bg-slate-700 text-slate-200';
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors}`}>
      {label ?? variant}
    </span>
  );
}
