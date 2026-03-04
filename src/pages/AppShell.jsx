import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';
import { getSupabaseClient } from '../lib/supabase';

const supabase = getSupabaseClient();

const ROLE_LABEL = {
  admin:                 'Admin',
  lead_facilitator:      'Lead Facilitator',
  assistant_facilitator: 'Assistant Facilitator',
};

const NAV_ITEMS = [
  { to: '/',          label: 'Dashboard',  icon: '⊞', roles: ['admin','lead_facilitator','assistant_facilitator'] },
  { to: '/games',     label: 'Activities', icon: '◈', roles: ['admin','lead_facilitator','assistant_facilitator'] },
  { to: '/sessions',  label: 'Sessions',   icon: '▦', roles: ['admin','lead_facilitator'] },
  { to: '/templates', label: 'Templates',  icon: '⬡', roles: ['admin','lead_facilitator'] },
  { to: '/courses',   label: 'Curriculum', icon: '◧', roles: ['admin','lead_facilitator'] },
  { to: '/groups',    label: 'Groups',     icon: '◉', roles: ['admin','lead_facilitator'] },
  { to: '/sites',     label: 'Sites',      icon: '◎', roles: ['admin','lead_facilitator'] },
  { to: '/analytics', label: 'Analytics',  icon: '▲', roles: ['admin','lead_facilitator'] },
  { to: '/incidents', label: 'Incidents',  icon: '!', roles: ['admin','lead_facilitator'] },
];

export default function AppShell() {
  const { profile, isAdmin } = useProfile();
  const navigate = useNavigate();

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate('/');
  }

  const role = profile?.role;
  const visibleNav = NAV_ITEMS.filter(item => item.roles.includes(role));

  return (
    <div className="flex h-screen overflow-hidden bg-fsu-white">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 flex-shrink-0 bg-fsu-garnet text-white">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-fsu-garnet bg-fsu-gold text-sm flex-shrink-0">
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
          {visibleNav.map(({ to, label, icon }) => (
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

          {isAdmin && (
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
          <p className="text-xs text-white/80 font-medium truncate mb-0.5">
            {profile?.name || profile?.email}
          </p>
          {role && (
            <span className="text-xs bg-white/15 text-white/80 px-2 py-0.5 rounded-full inline-block mb-1.5">
              {ROLE_LABEL[role] || role}
            </span>
          )}
          <br />
          <button
            onClick={handleSignOut}
            className="text-xs text-white/50 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-20 bg-fsu-garnet px-4 py-3 flex items-center justify-between">
        <span className="font-syne font-bold text-white text-sm">FSU Challenge Course</span>
        <div className="flex items-center gap-3">
          {role && (
            <span className="text-xs text-white/60 bg-white/10 px-2 py-0.5 rounded-full">
              {ROLE_LABEL[role]}
            </span>
          )}
          <button onClick={handleSignOut} className="text-xs text-white/70">Sign out</button>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto md:pt-0 pt-12 pb-16 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-fsu-garnet border-t border-white/10 flex z-20">
        {visibleNav.slice(0, 4).map(({ to, label, icon }) => (
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
