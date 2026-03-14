import { useState, useEffect, useMemo } from 'react';
import { getSupabaseClient } from '../lib/supabase';
import { useProfile } from '../context/ProfileContext';
import { stripEmojis } from '../lib/utils';

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
    <div className="flex-1 overflow-y-auto p-12 bg-background-light dark:bg-background-dark font-display">
      {/* Hero Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-primary/10 pb-8 mb-8">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-xs mb-2">
            <span className="material-symbols-outlined text-sm">auto_graph</span>
            Impact & Growth
          </div>
          <h1 className="text-slate-900 dark:text-slate-100 text-5xl font-black leading-tight tracking-tighter">Impact Analytics</h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg mt-2 font-medium">Comprehensive reporting and core competency performance for Florida State University organizational programs.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:brightness-110 transition-all shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
            Export PDF Report
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard label="Total Sessions" value={stats.totalSessions} trend="12%" />
        <KPICard label="Participants" value="3,850" trend="5%" />
        <KPICard label="Growth Score" value="+24%" trend="8%" />
        <KPICard label="Facilitator Avg" value="4.8" highlight="CSAT" />
      </div>

      {/* Visualization Grid Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-primary/5 shadow-sm flex flex-col gap-6">
           <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">Session Frequency by Department</h3>
           <div className="flex items-end justify-between h-64 gap-3 pt-4">
              {[60, 85, 35, 50, 100, 75].map((h, i) => (
                <div key={i} className="flex flex-col items-center flex-1 gap-3 h-full justify-end">
                   <div className="w-full bg-primary/20 dark:bg-primary/10 rounded-t-lg transition-all hover:bg-primary" style={{ height: `${h}%` }}></div>
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Dept {i+1}</span>
                </div>
              ))}
           </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-primary/5 shadow-sm flex flex-col gap-6 items-center justify-center">
           <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 self-start">Core Competency Growth</h3>
           <div className="relative flex items-center justify-center h-64 w-full">
              <span className="material-symbols-outlined text-primary/20 text-[120px]">radar</span>
              <div className="absolute top-0 text-[10px] font-black uppercase text-primary">Leadership</div>
              <div className="absolute bottom-0 text-[10px] font-black uppercase text-primary">Trust</div>
              <div className="absolute right-0 text-[10px] font-black uppercase text-primary">Communication</div>
              <div className="absolute left-0 text-[10px] font-black uppercase text-primary">Teamwork</div>
           </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-primary/5 shadow-sm">
         <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mb-6">Recent Impact Data</h3>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="pb-4 font-bold">Group</th>
                  <th className="pb-4 font-bold">Lead Facilitator</th>
                  <th className="pb-4 font-bold">Date</th>
                  <th className="pb-4 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {sessions.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 font-bold text-navy-deep dark:text-white text-sm">{stripEmojis(s.name)}</td>
                    <td className="py-4 text-xs font-semibold text-slate-700 dark:text-slate-300">{s.profiles?.name || 'Staff'}</td>
                    <td className="py-4 text-xs text-slate-500">{new Date(s.updated_at).toLocaleDateString()}</td>
                    <td className="py-4 capitalize text-xs font-bold text-primary">{s.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}

function KPICard({ label, value, trend, highlight }) {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-primary/5 shadow-sm">
      <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider">{label}</p>
      <div className="flex items-end justify-between mt-2">
        <span className="text-4xl font-black text-slate-900 dark:text-slate-100">{value}</span>
        {trend && (
           <span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">trending_up</span> {trend}
           </span>
        )}
        {highlight && <span className="text-slate-400 px-2 py-1 text-xs font-bold italic">{highlight}</span>}
      </div>
    </div>
  );
}
