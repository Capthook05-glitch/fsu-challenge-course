import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GoalTag } from '../ui/GoalTag';
import { BlockComments } from './BlockComments';

export function TimelineBlock({ block, game, onEdit, readOnly = false, index }) {
  const [showComments, setShowComments] = useState(false);
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
      className="group relative flex flex-col md:flex-row md:items-center gap-4 bg-white border border-slate-200 p-5 rounded-lg hover:border-primary/40 hover:shadow-md transition-all"
    >
      <div className="flex items-center gap-3 shrink-0">
        {!readOnly && (
           <div {...attributes} {...listeners} className="cursor-grab text-slate-300 group-hover:text-slate-500 transition-colors">
              <span className="material-symbols-outlined">drag_indicator</span>
           </div>
        )}
        <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-white text-sm font-bold">
          {index + 1}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-navy-900 font-extrabold text-lg">{title}</h3>
          <span className="text-navy-600 text-[11px] font-bold bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wider">
            {block.block_type}
          </span>
          <div className="flex gap-2 ml-auto md:ml-0">
             {game?.goals?.map(g => (
               <span key={g} className="text-primary text-[10px] font-extrabold px-2 py-0.5 rounded border border-primary/20 bg-primary/5 uppercase">
                 {g.replace(/-/g, ' ')}
               </span>
             ))}
          </div>
        </div>

        <div className="flex items-center gap-4 text-navy-600 text-sm font-medium">
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm opacity-60">schedule</span> {block.duration_min} min
          </span>
          {game && (
             <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm opacity-60">groups</span> {game.min_group}-{game.max_group} pax
             </span>
          )}
          {block.location && (
             <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm opacity-60">location_on</span> {block.location}
             </span>
          )}
          {block.assigned_facilitator && (
             <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm opacity-60">person</span> {block.assigned_facilitator}
             </span>
          )}
        </div>

        {(block.notes || game?.description) && (
          <div className="mt-3 p-3 bg-slate-50 rounded border-l-4 border-primary/40">
            <p className="text-navy-600 text-xs italic font-medium">
               Notes: {block.notes || game?.description}
            </p>
          </div>
        )}
      </div>

      <div className="flex md:flex-col items-center gap-1 shrink-0 self-end md:self-center">
        {!readOnly && (
          <button
            onClick={() => onEdit(block)}
            className="p-2 text-slate-400 hover:text-navy-900 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">edit</span>
          </button>
        )}
        <button
          onClick={() => setShowComments(!showComments)}
          className={`p-2 transition-colors ${showComments ? 'text-primary' : 'text-slate-300 hover:text-slate-500'}`}
        >
          <span className="material-symbols-outlined text-xl">comment</span>
        </button>
      </div>

      {showComments && (
        <div className="w-full md:pl-16">
           <BlockComments blockId={block.id} sessionId={block.session_id} />
        </div>
      )}
    </div>
  );
}
