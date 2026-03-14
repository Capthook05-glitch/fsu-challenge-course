import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';
import { getSupabaseClient } from '../lib/supabase';
import { Badge } from '../components/ui/Badge';

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
    <div className="flex-1 overflow-y-auto p-8 bg-background-light dark:bg-background-dark font-display">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Welcome back, {profile.name || profile.email}</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Here is an overview of the FSU Challenge Course program.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard icon="sports_kabaddi" label="Total Games" value={stats.games} />
        <StatCard icon="event_available" label="Active Sessions" value={stats.sessions} />
      </div>

      <div className="flex flex-wrap gap-4 mb-12">
         <Link to="/games" className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform shadow-lg shadow-primary/20">
            Browse Catalog
         </Link>
         <Link to="/sessions" className="bg-white dark:bg-slate-900/40 text-primary border border-primary/20 px-6 py-3 rounded-xl font-bold hover:bg-primary/5 transition-colors">
            Manage Sessions
         </Link>
      </div>

      <div className="bg-white dark:bg-slate-900/40 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-lg">Recent Sessions</h3>
          <Link to="/sessions" className="text-sm text-primary font-bold hover:underline">View All</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Session Name</th>
                <th className="px-6 py-4 font-semibold">Last Updated</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {recent.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <Link to={`/sessions/${s.id}`} className="font-bold text-slate-900 dark:text-slate-100 hover:text-primary transition-colors">{s.name}</Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{new Date(s.updated_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant={s.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link to={`/sessions/${s.id}`} className="text-slate-400 hover:text-primary"><span className="material-symbols-outlined">arrow_forward</span></Link>
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

function StatCard({ icon, label, value }) {
  return (
    <div className="bg-white dark:bg-slate-900/40 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <span className="p-2 bg-primary/10 rounded-lg text-primary">
          <span className="material-symbols-outlined">{icon}</span>
        </span>
      </div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-white truncate">{value}</p>
    </div>
  );
}
