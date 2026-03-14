import { useState, useEffect, useMemo } from 'react';
import { getSupabaseClient } from '../lib/supabase';
import { useProfile } from '../context/ProfileContext';

const supabase = getSupabaseClient();

export default function Analytics() {
  const { profile, isAdmin } = useProfile();
  const [sessions, setSessions]   = useState([]);
  const [blocks, setBlocks]       = useState([]);
  const [games, setGames]         = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    async function load() {
      const [sessRes, blockRes, gameRes] = await Promise.all([
        supabase.from('sessions').select('*, profiles(name, email)').order('updated_at', { ascending: false }).limit(10),
        supabase.from('timeline_blocks').select('id,session_id,block_type,game_id,duration_min'),
        supabase.from('games').select('id,name,goals'),
      ]);
      setSessions(sessRes.data || []);
      setBlocks(blockRes.data || []);
      setGames(gameRes.data || []);
      setLoading(false);
    }
    load();
  }, []);

  const stats = useMemo(() => {
    const gameMap = Object.fromEntries(games.map(g => [g.id, g]));
    const activityCount = {};
    blocks.filter(b => b.game_id).forEach(b => {
      const name = gameMap[b.game_id]?.name || 'Unknown';
      activityCount[name] = (activityCount[name] || 0) + 1;
    });
    const mostUsed = Object.entries(activityCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return {
      totalGames: games.length,
      totalSessions: sessions.length,
      mostUsed,
      activeStaff: new Set(sessions.map(s => s.owner_id)).size
    };
  }, [sessions, blocks, games]);

  if (loading) return <div className="p-8 text-slate-400">Loading analytics...</div>;

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-background-light dark:bg-background-dark font-display">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Analytics Overview</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Tracking performance across the FSU Challenge Course program.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard icon="sports_kabaddi" label="Total Games" value={stats.totalGames} trend="+4%" />
        <StatCard icon="event_available" label="Total Sessions" value={stats.totalSessions} trend="+12%" />
        <StatCard icon="stars" label="Most Used Game" value={stats.mostUsed} highlight="Popular" />
        <StatCard icon="person_check" label="Active Facilitators" value={stats.activeStaff} trend="+2" />
      </div>

      <div className="bg-white dark:bg-slate-900/40 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-lg">Recent Sessions</h3>
          <button className="text-sm text-primary font-bold hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Group / Name</th>
                <th className="px-6 py-4 font-semibold">Facilitator</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {sessions.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 dark:text-slate-100">{s.name}</div>
                    <div className="text-xs text-slate-500">{s.notes?.substring(0, 30)}...</div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                     {s.profiles?.name || s.profiles?.email || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 text-sm">{new Date(s.updated_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                      s.status === 'completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      s.status === 'ready' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-slate-400 hover:text-primary"><span className="material-symbols-outlined">more_vert</span></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, trend, highlight }) {
  return (
    <div className="bg-white dark:bg-slate-900/40 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <span className="p-2 bg-primary/10 rounded-lg text-primary">
          <span className="material-symbols-outlined">{icon}</span>
        </span>
        {trend && <span className="text-xs font-bold text-emerald-500">{trend}</span>}
        {highlight && <span className="text-xs font-medium text-slate-400">{highlight}</span>}
      </div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-white truncate">{value}</p>
    </div>
  );
}
