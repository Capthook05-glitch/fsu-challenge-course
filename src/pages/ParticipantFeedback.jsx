import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getSupabaseClient } from '../lib/supabase';
import { stripEmojis } from '../lib/utils';

const supabase = getSupabaseClient();

export default function ParticipantFeedback() {
  const { sessionId } = useParams();
  const [session, setSession]         = useState(null);
  const [rating, setRating]           = useState(0);
  const [leadership, setLeadership]   = useState(0);
  const [trust, setTrust]             = useState(0);
  const [communication, setComm]      = useState(0);
  const [teamwork, setTeamwork]       = useState(0);
  const [whatWorked, setWhatWorked]   = useState('');
  const [whatImprove, setWhatImprove] = useState('');
  const [submitted, setSubmitted]     = useState(false);

  useEffect(() => {
    supabase.from('sessions').select('id, name').eq('id', sessionId).single()
      .then(({ data }) => setSession(data));
  }, [sessionId]);

  async function submit(e) {
    e.preventDefault();
    await supabase.from('session_feedback').insert({
      session_id: sessionId,
      rating,
      leadership_rating: leadership,
      trust_rating: trust,
      communication_rating: communication,
      teamwork_rating: teamwork,
      what_worked: whatWorked,
      what_improve: whatImprove,
    });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background-light">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-sm text-center shadow-lg">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl text-green-600 font-bold">✓</div>
          <h2 className="font-bold text-xl mb-2">Thank You!</h2>
          <p className="text-slate-500 text-sm">Your feedback helps us improve the Challenge Course experience.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light font-display text-slate-900 p-6">
      <div className="max-w-2xl mx-auto">
        <header className="text-center mb-12">
           <h2 className="text-primary font-black uppercase italic text-2xl mb-2">FSU Challenge Course</h2>
           <h1 className="text-4xl font-extrabold tracking-tight">Participant Feedback</h1>
           <p className="text-slate-500 mt-2">Reflect on your experience with {stripEmojis(session?.name)}</p>
        </header>

        <form onSubmit={submit} className="space-y-10 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
           <div>
              <label className="block text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Overall Experience</label>
              <StarRating value={rating} onChange={setRating} />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <CompetencyRating label="Leadership" value={leadership} onChange={setLeadership} />
              <CompetencyRating label="Trust" value={trust} onChange={setTrust} />
              <CompetencyRating label="Communication" value={communication} onChange={setComm} />
              <CompetencyRating label="Teamwork" value={teamwork} onChange={setTeamwork} />
           </div>

           <div className="space-y-6">
              <div className="flex flex-col gap-2">
                 <label className="text-sm font-bold uppercase tracking-widest text-slate-400">What worked well today?</label>
                 <textarea value={whatWorked} onChange={e => setWhatWorked(e.target.value)} rows={3} className="w-full rounded-xl border border-slate-200 p-4 focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div className="flex flex-col gap-2">
                 <label className="text-sm font-bold uppercase tracking-widest text-slate-400">What could be improved?</label>
                 <textarea value={whatImprove} onChange={e => setWhatImprove(e.target.value)} rows={3} className="w-full rounded-xl border border-slate-200 p-4 focus:ring-2 focus:ring-primary outline-none" />
              </div>
           </div>

           <button type="submit" className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg hover:brightness-110 transition-all">
              Submit Feedback
           </button>
        </form>
      </div>
    </div>
  );
}

function StarRating({ value, onChange }) {
  return (
    <div className="flex gap-2">
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button" onClick={() => onChange(n)} className="focus:outline-none">
          <span className={`material-symbols-outlined text-4xl ${n <= value ? 'text-primary' : 'text-slate-200'}`} style={{ fontVariationSettings: n <= value ? "'FILL' 1" : "'FILL' 0" }}>star</span>
        </button>
      ))}
    </div>
  );
}

function CompetencyRating({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">{label}</label>
      <div className="flex gap-1">
        {[1,2,3,4,5].map(n => (
          <button key={n} type="button" onClick={() => onChange(n)} className={`w-8 h-8 rounded-lg border font-bold text-xs transition-all ${n <= value ? 'bg-primary text-white border-primary' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
