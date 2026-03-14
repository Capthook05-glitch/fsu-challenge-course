import { NavLink, Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';
import { getSupabaseClient } from '../lib/supabase';
import { useState } from 'react';

const supabase = getSupabaseClient();

const ROLE_LABEL = {
  admin:                 'Admin',
  lead_facilitator:      'Lead Facilitator',
  assistant_facilitator: 'Assistant Facilitator',
};

const NAV_ITEMS = [
  { to: '/games',          label: 'Catalog',          roles: ['admin','lead_facilitator','assistant_facilitator'] },
  { to: '/sessions',       label: 'Planner',          roles: ['admin','lead_facilitator'] },
  { to: '/knowledge-base', label: 'Knowledge Base',   roles: ['admin','lead_facilitator','assistant_facilitator'] },
  { to: '/courses',        label: 'Curriculum',       roles: ['admin','lead_facilitator'] },
  { to: '/inventory',      label: 'Inventory',        roles: ['admin','lead_facilitator'] },
  { to: '/incidents',      label: 'Safety',           roles: ['admin','lead_facilitator'] },
  { to: '/',               label: 'Dashboard',        roles: ['admin','lead_facilitator','assistant_facilitator'] },
];

export default function AppShell() {
  const { profile, isAdmin, canPlan } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate('/');
  }

  const role = profile?.role;
  const visibleNav = NAV_ITEMS.filter(item => item.roles.includes(role));

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md px-6 lg:px-12 py-4 no-print">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <span className="material-symbols-outlined text-primary text-3xl">forest</span>
            <div className="flex flex-col leading-tight">
              <h1 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white uppercase leading-none">FSU Challenge Course</h1>
              <span className="text-[10px] font-bold text-accent-gold tracking-widest uppercase mt-0.5">Facilitator Toolkit</span>
            </div>
          </Link>

          {/* Main Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            {visibleNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `px-5 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-primary/5 text-primary border border-primary/10 font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-navy-deep dark:hover:text-white font-medium'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            {isAdmin && (
               <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `px-5 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-primary/5 text-primary border border-primary/10 font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-navy-deep dark:hover:text-white font-medium'
                  }`
                }
              >
                Admin
              </NavLink>
            )}
          </nav>

          {/* Action Area */}
          <div className="flex items-center gap-4">
            {canPlan && (
              <div className="relative group">
                <button
                  onClick={() => navigate('/sessions')}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-all shadow-md shadow-primary/10"
                >
                  <span className="material-symbols-outlined text-[20px]">assignment</span>
                  <span className="hidden sm:inline">Session Plan</span>
                </button>
              </div>
            )}

            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden focus:outline-none"
              >
                {profile?.avatar_url ? (
                   <img className="w-full h-full object-cover" alt="User avatar" src={profile.avatar_url} />
                ) : (
                  <span className="material-symbols-outlined text-slate-400">account_circle</span>
                )}
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-background-dark border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-primary/10 mb-2">
                    <p className="text-sm font-bold truncate">{profile?.name || profile?.email}</p>
                    <p className="text-xs text-slate-400">{ROLE_LABEL[role]}</p>
                  </div>
                  <Link to={`/profiles/${profile?.id}`} className="block px-4 py-2 text-sm text-slate-600 hover:bg-primary/5">My Profile</Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 text-sm text-slate-400 hover:text-slate-100 hover:bg-primary/10 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1440px] mx-auto min-h-[calc(100vh-80px)]">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-background-dark py-16 px-6 lg:px-12 text-slate-500 no-print">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-slate-300 dark:text-slate-700 text-2xl">forest</span>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">FSU Challenge Course Toolkit © 2024</p>
          </div>
          <div className="flex gap-10 text-[10px] font-black uppercase tracking-widest">
            <a className="hover:text-primary transition-colors" href="#">Privacy Policy</a>
            <a className="hover:text-primary transition-colors" href="#">Terms of Service</a>
            <a className="hover:text-primary transition-colors" href="#">Contact Administration</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
