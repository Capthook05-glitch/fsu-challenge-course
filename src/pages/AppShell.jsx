import { Outlet, NavLink } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';
import { getSupabaseClient } from '../lib/supabase';

const navLinks = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/games', label: 'Game Catalog' },
  { to: '/sessions', label: 'My Sessions' },
];

export function AppShell() {
  const { profile, isAdmin } = useProfile();

  const signOut = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
  };

  const navCls = ({ isActive }) =>
    `block rounded-md px-3 py-2 text-sm transition-colors ${
      isActive
        ? 'bg-fsu-garnet/20 text-fsu-gold font-semibold'
        : 'text-fsu-muted hover:bg-white/5 hover:text-white'
    }`;

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden w-56 flex-shrink-0 flex-col border-r border-fsu-border bg-fsu-bg2 md:flex">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-fsu-border">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #782F40, #CEB069)' }}
            >
              🌲
            </div>
            <div>
              <p className="font-bold text-sm text-white leading-tight" style={{ fontFamily: 'Syne' }}>
                FSU Challenge Course
              </p>
              <p className="text-xs text-fsu-muted">Facilitator Toolkit</p>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {navLinks.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} className={navCls}>
              {label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink to="/admin" className={navCls}>
              Admin
            </NavLink>
          )}
        </nav>

        {/* Profile footer */}
        <div className="border-t border-fsu-border p-4">
          <p className="text-xs text-fsu-muted truncate">{profile?.name || profile?.email}</p>
          <p className="text-xs text-fsu-faint capitalize">{profile?.role}</p>
          <button
            onClick={signOut}
            className="mt-3 w-full rounded-md border border-fsu-border bg-fsu-bg3 px-3 py-1.5 text-xs text-fsu-muted hover:text-white hover:border-fsu-border2 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-fsu-border bg-fsu-bg2 px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center text-sm"
            style={{ background: 'linear-gradient(135deg, #782F40, #CEB069)' }}
          >
            🌲
          </div>
          <span className="font-bold text-sm text-white" style={{ fontFamily: 'Syne' }}>FSU Challenge Course</span>
        </div>
        <button onClick={signOut} className="text-xs text-fsu-muted hover:text-white">Sign out</button>
      </div>

      {/* Mobile bottom nav */}
      <div className="fixed bottom-0 inset-x-0 z-40 flex border-t border-fsu-border bg-fsu-bg2 md:hidden">
        {navLinks.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 py-3 text-center text-xs transition-colors ${isActive ? 'text-fsu-gold' : 'text-fsu-faint hover:text-fsu-muted'}`
            }
          >
            {label}
          </NavLink>
        ))}
        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex-1 py-3 text-center text-xs transition-colors ${isActive ? 'text-fsu-gold' : 'text-fsu-faint hover:text-fsu-muted'}`
            }
          >
            Admin
          </NavLink>
        )}
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pt-14 pb-16 md:pt-0 md:pb-0">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
