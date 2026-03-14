export function Badge({ label, variant = 'draft' }) {
  const base = "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide";

  const statusStyles = {
    completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    ready: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    draft: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    admin: "bg-primary/20 text-primary border border-primary/30",
    low: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
    medium: "bg-orange-500/10 text-orange-400 border border-orange-500/30",
    high: "bg-red-500/10 text-red-400 border border-red-500/30",
  };

  return (
    <span className={`${base} ${statusStyles[variant] || statusStyles.draft}`}>
      {label ?? variant}
    </span>
  );
}
