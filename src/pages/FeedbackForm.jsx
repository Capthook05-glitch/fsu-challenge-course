import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSupabaseClient } from '../lib/supabase';

function StarInput({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className={`text-3xl transition-colors ${(hovered || value) >= star ? 'text-fsu-gold' : 'text-slate-700'}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export function FeedbackForm() {
  const { sessionId } = useParams();
  const [rating, setRating] = useState(0);
  const [whatWorked, setWhatWorked] = useState('');
  const [whatImprove, setWhatImprove] = useState('');
  const [groupSize, setGroupSize] = useState('');
  const [status, setStatus] = useState('idle'); // idle | submitting | done | error

  async function handleSubmit(e) {
    e.preventDefault();
    if (!rating) return;
    setStatus('submitting');
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('session_feedback').insert({
      session_id: sessionId,
      rating,
      what_worked: whatWorked.trim() || null,
      what_improve: whatImprove.trim() || null,
      group_size: groupSize ? Number(groupSize) : null,
    });
    setStatus(error ? 'error' : 'done');
  }

  if (status === 'done') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-fsu-navy px-6">
        <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900/70 p-8 text-center space-y-3">
          <p className="text-4xl">🎉</p>
          <h1 className="text-xl font-semibold text-fsu-gold">Thank you!</h1>
          <p className="text-slate-400 text-sm">Your feedback has been submitted.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-fsu-navy px-6 py-12">
      <div className="w-full max-w-md space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-fsu-gold">Session Feedback</h1>
          <p className="mt-1 text-sm text-slate-400">Share your experience — it helps us improve.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs uppercase text-slate-500 mb-2">Overall Rating *</label>
            <StarInput value={rating} onChange={setRating} />
          </div>

          <div>
            <label className="block text-xs uppercase text-slate-500 mb-1">What worked well?</label>
            <textarea
              value={whatWorked}
              onChange={(e) => setWhatWorked(e.target.value)}
              rows={3}
              placeholder="Activities, facilitation, energy…"
              className="w-full rounded-md bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:ring-1 focus:ring-fsu-gold/50 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs uppercase text-slate-500 mb-1">What could be improved?</label>
            <textarea
              value={whatImprove}
              onChange={(e) => setWhatImprove(e.target.value)}
              rows={3}
              placeholder="Suggestions for next time…"
              className="w-full rounded-md bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:ring-1 focus:ring-fsu-gold/50 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs uppercase text-slate-500 mb-1">Group Size (optional)</label>
            <input
              type="number"
              min="1"
              max="500"
              value={groupSize}
              onChange={(e) => setGroupSize(e.target.value)}
              placeholder="How many participants?"
              className="w-full rounded-md bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:ring-1 focus:ring-fsu-gold/50"
            />
          </div>

          {status === 'error' && (
            <p className="text-red-400 text-sm">Something went wrong. Please try again.</p>
          )}

          <button
            type="submit"
            disabled={!rating || status === 'submitting'}
            className="w-full rounded-md bg-fsu-garnet px-4 py-2.5 font-medium hover:brightness-110 disabled:opacity-50"
          >
            {status === 'submitting' ? 'Submitting…' : 'Submit Feedback'}
          </button>
        </form>
      </div>
    </div>
  );
}
