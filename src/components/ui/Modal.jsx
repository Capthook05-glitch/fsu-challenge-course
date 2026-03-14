import { useEffect } from 'react';

export function Modal({ onClose, children, title, wide = false, open = true }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-slate-900 border border-primary/20 rounded-xl w-full ${wide ? 'max-w-4xl' : 'max-w-lg'} max-h-[90vh] flex flex-col shadow-2xl overflow-hidden`}>
        <div className="px-8 py-6 border-b border-primary/10 flex justify-between items-center bg-gradient-to-r from-primary/10 to-transparent">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-accent-gold">info</span>
              {title || 'Information'}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}
