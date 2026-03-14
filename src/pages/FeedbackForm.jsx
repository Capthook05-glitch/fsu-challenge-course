import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getSupabaseClient } from '../lib/supabase';
import { stripEmojis } from '../lib/utils';

const supabase = getSupabaseClient();

export default function FeedbackForm() {
  const { sessionId } = useParams();
  const [session, setSession]         = useState(null);
  const [blocks, setBlocks]           = useState([]);
  const [rating, setRating]           = useState(0);
  const [hovered, setHovered]         = useState(0);
  const [whatWorked, setWhatWorked]   = useState('');
  const [whatImprove, setWhatImprove] = useState('');
  const [takeaway, setTakeaway]       = useState('');
  const [goalNext, setGoalNext]       = useState('');
  const [groupSize, setGroupSize]     = useState('');
  const [submitted, setSubmitted]     = useState(false);
  const [error, setError]             = useState('');
  const [activeTab, setActiveTab]     = useState('program'); // 'program' | 'feedback'

  useEffect(() => {
    async function load() {
      const [{ data: sess }, { data: blks }] = await Promise.all([
        supabase.from('sessions').select('id,name,notes').eq('id', sessionId).single(),
        supabase.from('timeline_blocks')
          .select('id,block_type,title,start_time,duration_min,location,subgroup,game_id')
          .eq('session_id', sessionId)
          .order('position'),
      ]);
      setSession(sess);
      setBlocks(blks || []);
    }
    load();
  }, [sessionId]);

  function fmtTime(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const period = h < 12 ? 'AM' : 'PM';
    const display = h > 12 ? h - 12 : (h === 0 ? 12 : h);
    return `${display}:${String(m).padStart(2,'0')} ${period}`;
  }

  async function submit(e) {
    e.preventDefault();
    if (!rating) { setError('Please select a rating.'); return; }
    const { error: err } = await supabase.from('session_feedback').insert({
      session_id: sessionId,
      rating,
      what_worked: whatWorked,
      what_improve: whatImprove,
      group_size: groupSize ? parseInt(groupSize) : null,
      // Store extra fields in what_worked if no dedicated columns
    });
    if (err) { setError('Something went wrong. Please try again.'); return; }
    setSubmitted(true);
  }

  const TYPE_LABELS = { activity: 'Activity', debrief: 'Debrief', break: 'Break', transition: 'Transition', custom: 'Block' };
  const TYPE_COLORS = {
    activity: '#782F40', debrief: '#2563eb', break: '#d97706', transition: '#78716C', custom: '#7c3aed',
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-fsu-white flex items-center justify-center p-4">
        <div className="bg-fsu-surface border border-fsu-border rounded-2xl p-8 max-w-sm text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl text-green-600 font-bold">
            ✓
          </div>
          <h2 className="font-syne font-bold text-xl text-fsu-text mb-2">Thank you!</h2>
          <p className="text-fsu-muted text-sm">Your feedback helps us improve future programs.</p>
          {takeaway && (
            <div className="mt-4 bg-fsu-soft border border-fsu-border rounded-xl p-3 text-left">
              <p className="text-xs font-semibold text-fsu-muted uppercase mb-1">Your Takeaway</p>
              <p className="text-sm text-fsu-text">{takeaway}</p>
            </div>
          )}
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
                  <span className="text-xs font-bold text-primary uppercase">Date</span>
                  <span className="text-base font-semibold">{new Date().toLocaleDateString()}</span>
               </div>
            </div>

            <section className="mb-10">
               <h2 className="text-xl font-bold border-b border-primary/10 pb-4 mb-6">Quantitative Assessment</h2>
               <div className="space-y-4">
                  <RatingRow label="Group Engagement" sub="Ability to sustain participant focus" rating={rating} setRating={setRating} hovered={hovered} setHovered={setHovered} />
               </div>
            </section>

            <form onSubmit={submit} className="grid grid-cols-1 gap-8 mb-10">
               <div className="flex flex-col gap-3">
                  <label className="text-lg font-bold">Peer Feedback & Coaching Notes</label>
                  <textarea
                    value={whatWorked} onChange={e => setWhatWorked(e.target.value)}
                    className="w-full min-h-[160px] rounded-xl border border-primary/20 bg-white dark:bg-primary/5 p-4 focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="Provide constructive observations..."
                  />
               </div>
               <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                     <label className="text-lg font-bold">Incident Log</label>
                     <span className="text-xs font-semibold text-slate-400">LEAVE BLANK IF NONE</span>
                  </div>
                  <textarea
                    value={whatImprove} onChange={e => setWhatImprove(e.target.value)}
                    className="w-full min-h-[120px] rounded-xl border border-primary/20 bg-white dark:bg-primary/5 p-4 focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="Detail any technical issues or concerns..."
                  />
               </div>

               <div className="flex flex-col items-center border-t border-primary/10 pt-10">
                  <div className="flex items-center gap-2 mb-6 text-slate-500 text-sm italic">
                     <span className="material-symbols-outlined text-sm">info</span>
                     This review will be shared with the program director.
                  </div>
                  <button type="submit" className="bg-primary hover:bg-primary/90 text-white font-bold py-4 px-12 rounded-xl text-lg shadow-lg transition-all w-full md:w-auto">
                     Submit Review
                  </button>
                  {error && <p className="text-red-600 mt-4">{error}</p>}
               </div>
            </form>
         </div>
      </main>
    </div>
  );
}

function RatingRow({ label, sub, rating, setRating, hovered, setHovered }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white dark:bg-primary/10 rounded-lg border border-primary/5">
      <div className="flex items-center gap-4 mb-3 md:mb-0">
        <div className="text-primary flex items-center justify-center rounded-lg bg-primary/10 shrink-0 size-12">
          <span className="material-symbols-outlined">groups</span>
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
