import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';
import { getSupabaseClient } from '../lib/supabase';

const supabase = getSupabaseClient();

const NAV = [
  { to: '/',        label: 'Dashboard',  icon: '⊞' },
  { to: '/games',   label: 'Activities', icon: '◈' },
  { to: '/sessions',label: 'Sessions',   icon: '▦' },
  { to: '/groups',  label: 'Groups',     icon: '◉' },
  { to: '/sites',   label: 'Sites',      icon: '◎' },
];

export default function AppShell() {
  const { profile } = useProfile();
  const navigate = useNavigate();

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate('/');
  }

  return (
    <div className="flex h-screen overflow-hidden bg-fsu-white">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 flex-shrink-0 bg-fsu-garnet text-white">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-fsu-garnet bg-fsu-gold text-sm">
              FSU
            </div>
            <div>
              <p className="font-syne font-bold text-sm text-white leading-tight">Challenge Course</p>
              <p className="text-xs text-white/60">Facilitator Toolkit</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-fsu-garnet3 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`
              }
            >
              <span className="text-base w-5 text-center">{icon}</span>
              {label}
            </NavLink>
          ))}
          {profile?.role === 'admin' && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-fsu-garnet3 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`
              }
            >
              <span className="text-base w-5 text-center">⚙</span>
              Admin
            </NavLink>
          )}
        </nav>

        {/* Profile footer */}
        <div className="px-4 py-3 border-t border-white/10">
          <p className="text-xs text-white/50 truncate mb-1">{profile?.email}</p>
          <button
            onClick={handleSignOut}
            className="text-xs text-white/60 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-20 bg-fsu-garnet px-4 py-3 flex items-center justify-between">
        <span className="font-syne font-bold text-white text-sm">FSU Challenge Course</span>
        <button onClick={handleSignOut} className="text-xs text-white/70">Sign out</button>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto md:pt-0 pt-12">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-fsu-garnet border-t border-white/10 flex z-20">
        {NAV.slice(0,4).map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 text-xs gap-0.5 transition-colors ${
                isActive ? 'text-fsu-gold' : 'text-white/60'
              }`
            }
          >
            <span className="text-base">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
