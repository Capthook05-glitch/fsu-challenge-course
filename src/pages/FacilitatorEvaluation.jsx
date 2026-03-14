import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getSupabaseClient } from '../lib/supabase';
import { stripEmojis } from '../lib/utils';
import { useProfile } from '../context/ProfileContext';

const supabase = getSupabaseClient();

export default function FacilitatorEvaluation() {
  const { id } = useParams(); // Session ID
  const { profile } = useProfile();
  const [session, setSession]       = useState(null);
  const [facilitators, setFacilitators] = useState([]);
  const [targetId, setTargetId]     = useState('');

  const [engagement, setEngagement] = useState(0);
  const [safety, setSafety]         = useState(0);
  const [goal, setGoal]             = useState(0);
  const [notes, setNotes]           = useState('');
  const [incidents, setIncidents]   = useState('');

  const [submitted, setSubmitted]   = useState(false);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    async function load() {
      const { data: sess } = await supabase.from('sessions').select('id, name, owner_id').eq('id', id).single();
      const { data: mems } = await supabase.from('session_members').select('profile_id, profiles(name, email)').eq('session_id', id);
      const { data: owner } = await supabase.from('profiles').select('id, name, email').eq('id', sess?.owner_id).single();

      setSession(sess);

      const allFacs = (mems || []).map(m => m.profiles);
      if (owner && !allFacs.find(f => f.id === owner.id)) allFacs.push(owner);
      setFacilitators(allFacs);
      setLoading(false);
    }
    load();
  }, [id]);

  async function submit(e) {
    e.preventDefault();
    if (!targetId || !engagement || !safety || !goal) return alert('Please complete all ratings.');

    await supabase.from('facilitator_evaluations').insert({
      session_id: id,
      facilitator_id: targetId,
      evaluator_id: profile.id,
      engagement_rating: engagement,
      safety_rating: safety,
      goal_rating: goal,
      coaching_notes: notes,
      incident_log: incidents
    });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-sm text-center shadow-lg">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl text-green-600 font-bold">✓</div>
          <h2 className="font-bold text-xl mb-2">Evaluation Submitted</h2>
          <p className="text-slate-500 text-sm">Thank you for providing professional feedback.</p>
          <button onClick={() => window.history.back()} className="mt-6 text-primary font-bold hover:underline">Return to Session</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100">
      <header className="flex items-center justify-between border-b border-primary/10 px-6 md:px-20 py-4 bg-white dark:bg-background-dark">
         <div className="flex items-center gap-4 text-primary">
            <span className="material-symbols-outlined text-3xl">landscape</span>
            <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold">FSU Challenge Course</h2>
         </div>
      </header>

      <main className="flex flex-1 justify-center py-8 px-4 md:px-0">
         <div className="max-w-[800px] flex-1 flex flex-col">
            <div className="flex flex-col gap-2 p-4 border-l-4 border-primary mb-8">
               <p className="text-primary text-sm font-bold uppercase tracking-widest">Administrative Portal</p>
               <h1 className="text-4xl font-extrabold tracking-tight">Facilitator Evaluation</h1>
               <p className="text-slate-600 dark:text-slate-400 text-lg font-normal">Lead Review & Performance Feedback Loop</p>
            </div>

            <div className="bg-white dark:bg-primary/5 rounded-xl p-6 mb-8 border border-primary/10 shadow-sm flex flex-wrap gap-8">
               <div className="flex flex-col">
                  <span className="text-xs font-bold text-primary uppercase">Session</span>
                  <span className="text-base font-semibold">{stripEmojis(session?.name) || 'Loading...'}</span>
               </div>
               <div className="flex flex-col border-l border-primary/10 pl-8">
                  <span className="text-xs font-bold text-primary uppercase">Staff Member</span>
                  <select value={targetId} onChange={e => setTargetId(e.target.value)} className="bg-transparent font-semibold focus:outline-none">
                     <option value="">Select Facilitator...</option>
                     {facilitators.map(f => <option key={f.id} value={f.id}>{f.name || f.email}</option>)}
                  </select>
               </div>
            </div>

            <section className="mb-10">
               <h2 className="text-xl font-bold border-b border-primary/10 pb-4 mb-6">Quantitative Assessment</h2>
               <div className="space-y-4">
                  <RatingRow label="Group Engagement" sub="Ability to sustain participant focus" rating={engagement} setRating={setEngagement} />
                  <RatingRow label="Safety Compliance" sub="Adherence to technical protocols" rating={safety} setRating={setSafety} />
                  <RatingRow label="Goal Achievement" sub="Meeting specific program objectives" rating={goal} setRating={setGoal} />
               </div>
            </section>

            <form onSubmit={submit} className="grid grid-cols-1 gap-8 mb-10">
               <div className="flex flex-col gap-3">
                  <label className="text-lg font-bold">Peer Feedback & Coaching Notes</label>
                  <textarea
                    value={notes} onChange={e => setNotes(e.target.value)}
                    className="w-full min-h-[160px] rounded-xl border border-primary/20 bg-white dark:bg-primary/5 p-4 focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="Provide constructive observations for staff growth..."
                  />
               </div>
               <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                     <label className="text-lg font-bold">Incident Log</label>
                     <span className="text-xs font-semibold text-slate-400">LEAVE BLANK IF NONE</span>
                  </div>
                  <textarea
                    value={incidents} onChange={e => setIncidents(e.target.value)}
                    className="w-full min-h-[120px] rounded-xl border border-primary/20 bg-white dark:bg-primary/5 p-4 focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="Detail any technical issues, minor injuries, or equipment concerns..."
                  />
               </div>

               <div className="flex flex-col items-center border-t border-primary/10 pt-10 pb-20">
                  <div className="flex items-center gap-2 mb-6 text-slate-500 text-sm italic">
                     <span className="material-symbols-outlined text-sm">info</span>
                     This review will be shared with the facilitator and program director.
                  </div>
                  <button type="submit" className="bg-primary hover:bg-primary/90 text-white font-bold py-4 px-12 rounded-xl text-lg shadow-lg transition-all w-full md:w-auto">
                     Submit Review
                  </button>
               </div>
            </form>
         </div>
      </main>
    </div>
  );
}

function RatingRow({ label, sub, rating, setRating }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white dark:bg-primary/10 rounded-lg border border-primary/5">
      <div className="flex items-center gap-4 mb-3 md:mb-0">
        <div className="text-primary flex items-center justify-center rounded-lg bg-primary/10 shrink-0 size-12">
          <span className="material-symbols-outlined">{label.includes('Safety') ? 'verified_user' : label.includes('Goal') ? 'flag' : 'groups'}</span>
        </div>
        <div>
          <p className="font-bold">{label}</p>
          <p className="text-slate-500 text-sm">{sub}</p>
        </div>
      </div>
      <div className="flex gap-1">
        {[1,2,3,4,5].map(n => (
           <button key={n} type="button" onClick={() => setRating(n)} onMouseEnter={() => setHovered(n)} onMouseLeave={() => setHovered(0)}>
              <span className={`material-symbols-outlined ${n <= (hovered || rating) ? 'text-primary' : 'text-slate-300'}`} style={{ fontVariationSettings: n <= (hovered || rating) ? "'FILL' 1" : "'FILL' 0" }}>star</span>
           </button>
        ))}
      </div>
    </div>
  );
}
