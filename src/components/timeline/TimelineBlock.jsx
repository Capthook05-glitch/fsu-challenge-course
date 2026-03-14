import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GoalTag } from '../ui/GoalTag';

export function TimelineBlock({ block, game, onEdit, readOnly = false, index }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id, disabled: readOnly });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const title = game?.name || block.title || block.block_type || 'Block';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative flex flex-col md:flex-row md:items-center gap-4 bg-slate-800/30 border border-slate-700/50 p-4 rounded-xl hover:border-primary/50 transition-all"
    >
      <div className="flex items-center gap-3 shrink-0">
        {!readOnly && (
           <div {...attributes} {...listeners} className="cursor-grab text-slate-600 group-hover:text-slate-400 transition-colors">
              <span className="material-symbols-outlined">drag_indicator</span>
           </div>
        )}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-sm font-bold">
          {index + 1}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-white font-bold text-lg">{title}</h3>
          <span className="text-slate-500 text-xs font-medium bg-slate-800 px-2 py-0.5 rounded capitalize">
            {block.block_type}
          </span>
          <div className="flex gap-1 ml-auto md:ml-0">
             {game?.goals?.map(g => <GoalTag key={g} goal={g} size="sm" />)}
          </div>
        </div>

        <div className="flex items-center gap-4 text-slate-400 text-sm">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">schedule</span> {block.duration_min} min
          </span>
          {game && (
             <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">groups</span> {game.min_group}-{game.max_group} pax
             </span>
          )}
          {block.location && (
             <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">location_on</span> {block.location}
             </span>
          )}
        </div>

        {(block.notes || game?.description) && (
          <div className="mt-2 p-3 bg-background-dark/50 rounded-lg border-l-2 border-primary/50">
            <p className="text-slate-400 text-xs italic">
               {block.notes || game?.description}
            </p>
          </div>
        )}
      </div>

      {!readOnly && (
        <div className="flex md:flex-col items-center gap-2 shrink-0 self-end md:self-center">
          <button
            onClick={() => onEdit(block)}
            className="p-2 text-slate-500 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">edit</span>
          </button>
        </div>
      )}
    </div>
  );
}
