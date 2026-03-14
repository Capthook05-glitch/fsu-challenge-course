import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupabaseClient } from '../lib/supabase';
import { useProfile } from '../context/ProfileContext';

const supabase = getSupabaseClient();

export default function AISessionBuilder() {
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [brief, setBrief] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  async function generate() {
    setLoading(true);
    // Simulation of AI generation logic
    setTimeout(async () => {
      const { data: gs } = await supabase.from('games').select('*').limit(4);
      setPreview({
        name: "AI Generated Session",
        blocks: gs.map((g, i) => ({
          title: g.name,
          duration: 30,
          time: `${9 + Math.floor(i/2)}:${(i%2)*30 === 0 ? '00' : '30'}`,
          game_id: g.id
        }))
      });
      setLoading(false);
      setStep(2);
    }, 1500);
  }

  async function save() {
    const { data: sess } = await supabase.from('sessions').insert({
      name: preview.name,
      owner_id: profile.id,
      notes: brief,
      status: 'draft'
    }).select().single();

    if (sess) {
      const blocks = preview.blocks.map((b, i) => ({
        session_id: sess.id,
        block_type: 'activity',
        game_id: b.game_id,
        title: b.title,
        duration_min: b.duration,
        position: i,
        start_time: i * 30
      }));
      await supabase.from('timeline_blocks').insert(blocks);
      navigate(`/sessions/${sess.id}`);
    }
  }

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-6 lg:px-20 py-8 bg-background-light dark:bg-background-dark min-h-screen font-display">
      <header className="mb-10">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-accent-gold font-bold text-xs uppercase tracking-[0.2em]">Toolkit Module</span>
          <div className="h-px flex-1 bg-accent-gold/30"></div>
        </div>
        <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4">AI Session Builder</h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl text-lg leading-relaxed">
          Transform your event brief into a structured challenge course agenda.
        </p>
      </header>

      {/* Stepper */}
      <div className="flex items-center mb-12 border-b border-primary/10">
        <div className="flex gap-12">
          <StepItem num={1} label="Event Brief" active={step === 1} done={step > 1} />
          <StepItem num={2} label="Refinement" active={step === 2} done={step > 2} />
          <StepItem num={3} label="Finalization" active={step === 3} done={step > 3} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-7">
           {step === 1 ? (
              <div className="space-y-6">
                <div className="bg-white dark:bg-primary/5 p-8 rounded-xl border border-primary/10 shadow-sm">
                   <label className="text-xs font-bold uppercase tracking-widest text-primary/60 mb-4 block">Input Session Brief</label>
                   <textarea
                      value={brief} onChange={e => setBrief(e.target.value)}
                      className="w-full h-96 bg-transparent border-none focus:ring-0 text-slate-700 dark:text-slate-200 text-lg leading-relaxed resize-none"
                      placeholder="Example: Corporate leadership team of 15 people. Goals: communication and trust-building. Time: 4 hours..."
                   />
                </div>
                <button onClick={generate} disabled={!brief.trim() || loading}
                   className="w-full bg-primary text-white font-bold py-4 rounded-lg uppercase tracking-widest hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2">
                   {loading ? 'Processing...' : <><span className="material-symbols-outlined">bolt</span> Generate Agenda</>}
                </button>
              </div>
           ) : (
              <div className="bg-white dark:bg-primary/5 p-8 rounded-xl border border-primary/10 shadow-sm">
                 <h3 className="font-bold text-lg mb-6">Review & Customize</h3>
                 <div className="space-y-4">
                    {preview.blocks.map((b, i) => (
                       <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                          <span className="text-xs font-bold text-slate-400">{b.time}</span>
                          <span className="flex-1 font-bold">{b.title}</span>
                          <span className="text-xs text-slate-500">{b.duration}m</span>
                       </div>
                    ))}
                 </div>
                 <div className="mt-10 flex gap-4">
                    <button onClick={() => setStep(1)} className="flex-1 py-3 border border-slate-200 rounded-lg font-bold">Back</button>
                    <button onClick={save} className="flex-1 py-3 bg-accent-gold text-primary rounded-lg font-black uppercase tracking-widest">Save to Planner</button>
                 </div>
              </div>
           )}
        </div>

        <aside className="lg:col-span-5 sticky top-32">
           <div className="bg-primary dark:bg-black rounded-xl p-8 shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                 <h3 className="text-white font-bold uppercase tracking-widest text-sm mb-8 pb-4 border-b border-white/10">Agenda Preview</h3>
                 {!preview ? (
                    <div className="py-20 text-center text-white/30 italic">No agenda generated yet.</div>
                 ) : (
                    <div className="space-y-6">
                       {preview.blocks.map((b, i) => (
                          <div key={i} className="flex gap-4">
                             <div className="flex flex-col items-center">
                                <div className="text-[10px] text-accent-gold font-black uppercase">{b.time}</div>
                                <div className="w-px h-full bg-accent-gold/30 my-2"></div>
                             </div>
                             <div>
                                <h4 className="text-white font-bold text-sm mb-1 uppercase tracking-wider">{b.title}</h4>
                                <p className="text-white/60 text-xs">Standard sequence block.</p>
                             </div>
                          </div>
                       ))}
                    </div>
                 )}
              </div>
           </div>
        </aside>
      </div>
    </div>
  );
}

function StepItem({ num, label, active, done }) {
  return (
    <div className={`pb-4 flex items-center gap-2 border-b-2 transition-colors ${active ? 'border-primary text-primary' : 'border-transparent text-slate-400'}`}>
      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${active || done ? 'bg-primary text-white' : 'border border-slate-300'}`}>
        {done ? '✓' : num}
      </span>
      <span className="text-sm font-bold uppercase tracking-widest">{label}</span>
    </div>
  );
}
