import { useState, useEffect, useMemo } from 'react';
import { getSupabaseClient } from '../lib/supabase';
import { useProfile } from '../context/ProfileContext';
import { GOAL_META } from '../lib/goalMeta';

const supabase = getSupabaseClient();

function BarChart({ data, colorKey }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="space-y-2">
      {data.map(d => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="text-xs text-fsu-muted w-32 truncate flex-shrink-0">{d.label}</span>
          <div className="flex-1 bg-fsu-soft rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(d.value / max) * 100}%`, background: d.color || '#782F40' }}
            />
          </div>
          <span className="text-xs font-semibold text-fsu-text w-6 text-right">{d.value}</span>
        </div>
      ))}
    </div>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-fsu-surface border border-fsu-border rounded-xl p-4">
      <p className="text-xs text-fsu-muted mb-1">{label}</p>
      <p className="font-syne font-bold text-2xl text-fsu-garnet">{value}</p>
      {sub && <p className="text-xs text-fsu-faint mt-0.5">{sub}</p>}
    </div>
  );
}

export default function Analytics() {
  const { profile, isAdmin } = useProfile();
  const [sessions, setSessions]   = useState([]);
  const [blocks, setBlocks]       = useState([]);
  const [games, setGames]         = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    async function load() {
      const [sessRes, blockRes, gameRes] = await Promise.all([
        isAdmin
          ? supabase.from('sessions').select('id,status,created_at,owner_id')
          : supabase.from('sessions').select('id,status,created_at,owner_id').eq('owner_id', profile.id),
        supabase.from('timeline_blocks').select('id,session_id,block_type,game_id,duration_min'),
        supabase.from('games').select('id,name,goals,physical_intensity'),
      ]);
      setSessions(sessRes.data || []);
      setBlocks(blockRes.data || []);
      setGames(gameRes.data || []);
      setLoading(false);
    }
    load();
  }, [isAdmin, profile?.id]);

  const stats = useMemo(() => {
    const gameMap = Object.fromEntries(games.map(g => [g.id, g]));

    // Session status breakdown
    const byStatus = { draft: 0, ready: 0, completed: 0 };
    sessions.forEach(s => { byStatus[s.status] = (byStatus[s.status] || 0) + 1; });

    // Block type breakdown
    const byType = {};
    blocks.forEach(b => { byType[b.block_type] = (byType[b.block_type] || 0) + 1; });

    // Goal coverage across all sessions
    const goalCount = {};
    blocks.forEach(b => {
      if (b.game_id && gameMap[b.game_id]?.goals) {
        gameMap[b.game_id].goals.forEach(g => {
          goalCount[g] = (goalCount[g] || 0) + 1;
        });
      }
    });

    // Top activities by usage
    const activityCount = {};
    blocks.filter(b => b.game_id).forEach(b => {
      const name = gameMap[b.game_id]?.name || 'Unknown';
      activityCount[name] = (activityCount[name] || 0) + 1;
    });
    const topActivities = Object.entries(activityCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([label, value]) => ({ label, value }));

    // Total facilitated time
    const totalMin = blocks.reduce((s, b) => s + (b.duration_min || 0), 0);
    const completedSessions = sessions.filter(s => s.status === 'completed').length;

    // Goal chart data
    const goalData = Object.entries(goalCount)
      .sort((a, b) => b[1] - a[1])
      .map(([key, value]) => ({
        label: GOAL_META[key]?.label || key,
        value,
        color: GOAL_META[key]?.color || '#782F40',
      }));

    // Block type data
    const typeColors = { activity:'#782F40', debrief:'#2563eb', break:'#d97706', transition:'#78716C', custom:'#7c3aed' };
    const typeData = Object.entries(byType)
      .sort((a, b) => b[1] - a[1])
      .map(([key, value]) => ({ label: key, value, color: typeColors[key] || '#78716C' }));

    return { byStatus, topActivities, goalData, typeData, totalMin, completedSessions };
  }, [sessions, blocks, games]);

  if (loading) return <div className="p-6 text-fsu-muted">Loading analytics…</div>;

  const completionRate = sessions.length > 0
    ? Math.round((stats.completedSessions / sessions.length) * 100) : 0;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="font-syne font-bold text-2xl text-fsu-text mb-1">Analytics</h1>
      <p className="text-fsu-muted text-sm mb-6">
        {isAdmin ? 'Platform-wide statistics' : 'Your session statistics'}
      </p>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Sessions" value={sessions.length} />
        <StatCard label="Completed" value={stats.completedSessions} sub={`${completionRate}% completion rate`} />
        <StatCard label="Total Blocks" value={blocks.length} />
        <StatCard label="Total Facilitated" value={`${Math.round(stats.totalMin / 60)}h`} sub={`${stats.totalMin} min`} />
      </div>

      {/* Session status */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {[
          { key: 'draft',     label: 'Draft',     bg: '#fef3c7', color: '#d97706' },
          { key: 'ready',     label: 'Ready',     bg: '#dcfce7', color: '#16a34a' },
          { key: 'completed', label: 'Completed', bg: '#dbeafe', color: '#2563eb' },
        ].map(({ key, label, bg, color }) => (
          <div key={key} className="rounded-xl p-4 border"
            style={{ background: bg, borderColor: color + '40' }}>
            <p className="text-xs font-semibold mb-1" style={{ color }}>{label}</p>
            <p className="font-syne font-bold text-2xl" style={{ color }}>
              {stats.byStatus[key] || 0}
            </p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Goal coverage */}
        {stats.goalData.length > 0 && (
          <div className="bg-fsu-surface border border-fsu-border rounded-xl p-5">
            <h2 className="font-syne font-semibold text-fsu-text mb-4">Goal Coverage</h2>
            <BarChart data={stats.goalData} />
          </div>
        )}

        {/* Block types */}
        {stats.typeData.length > 0 && (
          <div className="bg-fsu-surface border border-fsu-border rounded-xl p-5">
            <h2 className="font-syne font-semibold text-fsu-text mb-4">Block Types</h2>
            <BarChart data={stats.typeData} />
          </div>
        )}

        {/* Top activities */}
        {stats.topActivities.length > 0 && (
          <div className="bg-fsu-surface border border-fsu-border rounded-xl p-5 md:col-span-2">
            <h2 className="font-syne font-semibold text-fsu-text mb-4">Most-Used Activities</h2>
            <BarChart data={stats.topActivities} />
          </div>
        )}

        {sessions.length === 0 && (
          <div className="md:col-span-2 bg-fsu-soft border border-fsu-border rounded-xl p-10 text-center">
            <p className="text-fsu-muted text-sm">No session data yet. Create a session to see analytics.</p>
          </div>
        )}
      </div>
    </div>
  );
}
