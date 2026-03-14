import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getSupabaseClient } from '../lib/supabase';

const supabase = getSupabaseClient();

export default function FacilitatorProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', id).single();
      const { data: sess } = await supabase.from('sessions').select('id, name, updated_at').eq('owner_id', id).limit(4);
      setProfile(prof);
      setSessions(sess || []);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <div className="p-10 text-slate-400">Loading profile...</div>;
  if (!profile) return <div className="p-10 text-slate-400">Profile not found.</div>;

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 bg-background-light dark:bg-background-dark min-h-screen font-display">
       <section className="relative overflow-hidden rounded-3xl bg-primary/5 dark:bg-primary/10 p-8 md:p-16 mb-12">
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
             <div className="w-64 h-64 md:w-80 md:h-80 relative">
                <div className="absolute inset-0 bg-accent-gold rounded-full translate-x-3 translate-y-3 opacity-20"></div>
                <div className="w-full h-full bg-slate-200 dark:bg-slate-800 rounded-full border-4 border-white dark:border-background-dark shadow-2xl flex items-center justify-center overflow-hidden">
                   {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                   ) : (
                      <span className="material-symbols-outlined text-[120px] text-slate-400">person</span>
                   )}
                </div>
             </div>
             <div className="text-center md:text-left flex-1">
                <span className="inline-block px-4 py-1.5 rounded-full bg-accent-gold/20 text-primary text-xs font-bold uppercase tracking-widest mb-4 border border-accent-gold/30">
                   {profile.role.replace('_', ' ')}
                </span>
                <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">{profile.name || profile.email}</h1>
                <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl font-medium leading-relaxed">
                   {profile.bio || "Experiential education professional at Florida State University."}
                </p>
                <div className="mt-8 flex flex-wrap justify-center md:justify-start gap-4">
                   <button className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-lg font-bold text-sm tracking-wide shadow-lg transition-all">Book Session</button>
                   <button className="border-2 border-primary/30 hover:border-primary text-primary px-8 py-3 rounded-lg font-bold text-sm tracking-wide transition-all">View Portfolio</button>
                </div>
             </div>
          </div>
       </section>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <StatBox icon="history_edu" label="Experience" value={`${profile.experience_years || 0} Years`} />
          <StatBox icon="groups_2" label="Total Sessions" value="580+" />
          <StatBox icon="psychology" label="Specialties" value={`${profile.specialties?.length || 0} Areas`} />
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
             <section>
                <div className="flex items-center gap-3 mb-6">
                   <div className="h-8 w-1 bg-primary"></div>
                   <h2 className="text-2xl font-bold tracking-tight">Facilitation Philosophy</h2>
                </div>
                <p className="text-lg leading-relaxed text-slate-600 dark:text-slate-400">
                   My approach is rooted in the belief that true growth occurs just outside of one's comfort zone. I prioritize creating a 'brave space' where participants feel empowered to take calculated risks and support their peers through shared vulnerability.
                </p>
             </section>

             <section>
                <div className="flex items-center gap-3 mb-8">
                   <div className="h-8 w-1 bg-primary"></div>
                   <h2 className="text-2xl font-bold tracking-tight">Recent Sessions</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   {sessions.map(s => (
                      <div key={s.id} className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-primary/30 transition-all">
                         <h3 className="font-bold text-lg mb-1">{s.name}</h3>
                         <p className="text-xs text-slate-400">{new Date(s.updated_at).toLocaleDateString()}</p>
                      </div>
                   ))}
                </div>
             </section>
          </div>

          <aside className="space-y-8">
             <div className="bg-primary/5 dark:bg-primary/10 p-8 rounded-2xl border border-primary/10">
                <h3 className="font-bold text-xl mb-6">Expertise</h3>
                <div className="flex flex-wrap gap-2">
                   {(profile.specialties || []).map(s => (
                      <span key={s} className="px-3 py-1 bg-white dark:bg-background-dark text-primary border border-primary/20 rounded-lg text-sm font-medium">{s}</span>
                   ))}
                </div>

                <h3 className="font-bold text-xl mt-10 mb-6">Certifications</h3>
                <ul className="space-y-4">
                   {(profile.certifications || []).map(c => (
                      <li key={c} className="flex items-center gap-3 text-sm font-medium">
                         <span className="material-symbols-outlined text-accent-gold">verified</span> {c}
                      </li>
                   ))}
                </ul>
             </div>
          </aside>
       </div>
    </div>
  );
}

function StatBox({ icon, label, value }) {
   return (
      <div className="bg-white dark:bg-slate-900/50 p-8 rounded-2xl border border-primary/10 flex flex-col items-center text-center shadow-sm">
         <span className="material-symbols-outlined text-primary text-3xl mb-3">{icon}</span>
         <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold uppercase tracking-wider">{label}</p>
         <p className="text-4xl font-extrabold text-slate-900 dark:text-white mt-1">{value}</p>
      </div>
   );
}
