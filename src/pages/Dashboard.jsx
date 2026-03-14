import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';
import { getSupabaseClient } from '../lib/supabase';
import { Badge } from '../components/ui/Badge';
import { stripEmojis } from '../lib/utils';

const supabase = getSupabaseClient();

export default function Dashboard() {
  const { profile, isAdmin } = useProfile();
  const [stats, setStats] = useState({ sessions: 0, games: 0, users: 0 });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const queries = [
        supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('is_archived', false),
        supabase.from('games').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('sessions').select('id,name,status,updated_at')
          .eq('is_archived', false)
          .order('updated_at', { ascending: false })
          .limit(5),
      ];
      const results = await Promise.all(queries);
      setStats({
        sessions: results[0].count || 0,
        games:    results[1].count || 0,
      });
      setRecent(results[2].data || []);
      setLoading(false);
    }
    load();
  }, []);

  if (!profile || loading) return <div className="p-8 text-slate-400">Loading dashboard...</div>;

  return (
    <div className="flex-1 overflow-y-auto p-12 bg-background-light dark:bg-background-dark font-display">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-slate-100 dark:border-slate-800 pb-8">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-navy-deep dark:text-white mb-2">Welcome back, {profile.name || profile.email}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wide">Tracking performance across the FSU Challenge Course program.</p>
        </div>
        <div className="flex gap-3">
           <Link to="/ai-builder" className="bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg hover:brightness-110 transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">bolt</span>
              AI Session Builder
           </Link>
           <Link to="/analytics" className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-6 py-3 rounded-xl font-bold text-sm shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">analytics</span>
              Analytics
           </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        <StatCard label="Total Games" value={stats.games} trend="+4%" />
        <StatCard label="Active Sessions" value={stats.sessions} trend="+12%" />
        <StatCard label="Facilitators" value="42" trend="+2" />
        <StatCard label="Satisfaction" value="4.9" highlight="CSAT" />
      </div>

      {/* Recent Sessions Table */}
      <div className="bg-white dark:bg-background-dark rounded border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm uppercase tracking-widest text-navy-deep dark:text-white">Recent Sessions</h3>
          <Link to="/sessions" className="text-[10px] text-primary font-bold uppercase tracking-widest border-b-2 border-primary/20 hover:border-primary transition-all">View All Sessions</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-[0.2em]">
              <tr>
                <th className="px-8 py-5 font-bold">Session Name</th>
                <th className="px-8 py-5 font-bold">Date</th>
                <th className="px-8 py-5 font-bold text-center">Status</th>
                <th className="px-8 py-5 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recent.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="font-bold text-navy-deep dark:text-white text-sm">{stripEmojis(s.name)}</div>
                  </td>
                  <td className="px-8 py-6 text-xs font-medium text-slate-600 dark:text-slate-400">{new Date(s.updated_at).toLocaleDateString()}</td>
                  <td className="px-8 py-6 text-center">
                    <Badge variant={s.status} />
                  </td>
                  <td className="px-8 py-6 text-right">
                    <Link to={`/sessions/${s.id}`} className="text-slate-300 hover:text-primary transition-colors">
                       <span className="material-symbols-outlined">more_horiz</span>
                    </Link>
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

function StatCard({ label, value, trend, highlight }) {
  return (
    <div className="bg-white dark:bg-background-dark p-8 rounded border border-slate-100 dark:border-slate-800 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{label}</span>
        {trend && <span className="text-[10px] font-bold text-emerald-600">{trend}</span>}
        {highlight && <span className="text-[10px] font-bold text-slate-400 uppercase">{highlight}</span>}
      </div>
      <p className="text-3xl font-bold text-navy-deep dark:text-white">{value}</p>
    </div>
  );
}
