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

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-56 flex-shrink-0 flex-col border-r border-slate-800 bg-slate-950 md:flex">
        <div className="px-5 py-5">
          <span className="font-semibold text-fsu-gold text-sm leading-tight">FSU Challenge Course</span>
        </div>

        <nav className="flex-1 px-2 py-2 space-y-0.5">
          {navLinks.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-fsu-garnet/20 text-fsu-gold font-medium'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-fsu-garnet/20 text-fsu-gold font-medium'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                }`
              }
            >
              Admin
            </NavLink>
          )}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <p className="text-xs text-slate-400 truncate">{profile?.name || profile?.email}</p>
          <p className="text-xs text-slate-600 capitalize">{profile?.role}</p>
          <button
            onClick={signOut}
            className="mt-3 w-full rounded-md bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3 md:hidden">
        <span className="font-semibold text-fsu-gold text-sm">FSU Challenge Course</span>
        <button onClick={signOut} className="text-xs text-slate-400 hover:text-white">Sign out</button>
      </div>

      {/* Mobile nav row */}
      <div className="fixed bottom-0 inset-x-0 z-40 flex border-t border-slate-800 bg-slate-950 md:hidden">
        {navLinks.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 py-3 text-center text-xs transition-colors ${
                isActive ? 'text-fsu-gold' : 'text-slate-500 hover:text-slate-200'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex-1 py-3 text-center text-xs transition-colors ${
                isActive ? 'text-fsu-gold' : 'text-slate-500 hover:text-slate-200'
              }`
            }
          >
            Admin
          </NavLink>
        )}
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pt-14 pb-16 md:pt-0 md:pb-0">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
