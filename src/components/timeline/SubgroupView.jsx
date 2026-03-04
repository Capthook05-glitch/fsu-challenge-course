import { GoalTag } from '../ui/GoalTag';

const BLOCK_COLORS = {
  activity:   '#782F40',
  debrief:    '#2563eb',
  break:      '#CEB069',
  transition: '#78716C',
  custom:     '#7c3aed',
};

const BLOCK_BG = {
  activity:   '#fff',
  debrief:    '#f8faff',
  break:      '#fffdf5',
  transition: '#fafaf8',
  custom:     '#fafafe',
};

const MIN_HEIGHT = 64;  // px per block minimum
const PX_PER_MIN = 2;   // pixels per minute

function fmtStartTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h < 12 ? 'AM' : 'PM';
  const display = h > 12 ? h - 12 : (h === 0 ? 12 : h);
  return `${display}:${String(m).padStart(2,'0')} ${period}`;
}

export function SubgroupView({ blocks, games, onEdit }) {
  // Get unique subgroups
  const subgroupSet = new Set();
  blocks.forEach(b => subgroupSet.add(b.subgroup || 'Full Group'));
  const subgroups = ['Full Group', ...Array.from(subgroupSet).filter(s => s !== 'Full Group').sort()];

  // Total duration for column height
  const totalMin = blocks.reduce((sum, b) => sum + b.duration_min, 0);

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-3 min-w-max pb-4">
        {subgroups.map(sg => {
          const sgBlocks = blocks
            .filter(b => (b.subgroup || 'Full Group') === sg)
            .sort((a, b) => a.start_time - b.start_time);

          return (
            <div key={sg} className="w-56 flex-shrink-0">
              {/* Column header */}
              <div className="bg-fsu-garnet text-white text-xs font-semibold px-3 py-2 rounded-t-xl text-center">
                {sg}
              </div>

              {/* Blocks */}
              <div className="border border-t-0 border-fsu-border rounded-b-xl overflow-hidden bg-fsu-soft">
                {sgBlocks.length === 0 && (
                  <p className="text-center text-xs text-fsu-faint py-8">No activities</p>
                )}
                {sgBlocks.map(block => {
                  const game = block.game_id ? games[block.game_id] : null;
                  const title = game?.name || block.title || block.block_type;
                  const color = BLOCK_COLORS[block.block_type] || '#782F40';
                  const bg    = BLOCK_BG[block.block_type]    || '#fff';
                  const height = Math.max(MIN_HEIGHT, block.duration_min * PX_PER_MIN);

                  return (
                    <div key={block.id}
                      onClick={() => onEdit(block)}
                      className="m-1.5 rounded-lg border cursor-pointer hover:shadow-sm transition-all overflow-hidden"
                      style={{ height, background: bg, borderColor: color + '44', borderLeftWidth: 3, borderLeftColor: color }}>
                      <div className="p-2 h-full flex flex-col">
                        <p className="text-xs text-fsu-muted">{fmtStartTime(block.start_time)}</p>
                        <p className="text-xs font-semibold text-fsu-text leading-snug mt-0.5 flex-1 line-clamp-2">{title}</p>
                        {game?.goals?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {game.goals.slice(0,2).map(g => <GoalTag key={g} goal={g} />)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
