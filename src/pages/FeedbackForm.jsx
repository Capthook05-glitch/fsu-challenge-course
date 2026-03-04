import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSupabaseClient } from '../lib/supabase';

const supabase = getSupabaseClient();

export default function FeedbackForm() {
  const { sessionId } = useParams();
  const [rating, setRating]           = useState(0);
  const [hovered, setHovered]         = useState(0);
  const [whatWorked, setWhatWorked]   = useState('');
  const [whatImprove, setWhatImprove] = useState('');
  const [groupSize, setGroupSize]     = useState('');
  const [submitted, setSubmitted]     = useState(false);
  const [error, setError]             = useState('');

  async function submit(e) {
    e.preventDefault();
    if (!rating) { setError('Please select a rating.'); return; }
    const { error: err } = await supabase.from('session_feedback').insert({
      session_id: sessionId,
      rating,
      what_worked: whatWorked,
      what_improve: whatImprove,
      group_size: groupSize ? parseInt(groupSize) : null,
    });
    if (err) { setError('Something went wrong. Please try again.'); return; }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-fsu-white flex items-center justify-center p-4">
        <div className="bg-fsu-surface border border-fsu-border rounded-2xl p-8 max-w-sm text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            ✓
          </div>
          <h2 className="font-syne font-bold text-xl text-fsu-text mb-2">Thank you!</h2>
          <p className="text-fsu-muted text-sm">Your feedback helps us improve future programs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fsu-white flex items-center justify-center p-4">
      <div className="bg-fsu-surface border border-fsu-border rounded-2xl p-6 max-w-md w-full">
        <div className="mb-6">
          <div className="w-10 h-10 bg-fsu-garnet rounded-xl flex items-center justify-center text-white font-syne font-bold text-sm mb-3">
            FSU
          </div>
          <h1 className="font-syne font-bold text-xl text-fsu-text mb-1">Session Feedback</h1>
          <p className="text-sm text-fsu-muted">Share your experience to help us improve.</p>
        </div>

        <form onSubmit={submit} className="space-y-5">
          {/* Star rating */}
          <div>
            <label className="text-sm font-semibold text-fsu-text block mb-2">How was the session? *</label>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(n => (
                <button
                  key={n} type="button"
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHovered(n)}
                  onMouseLeave={() => setHovered(0)}
                  className="text-3xl transition-transform hover:scale-110"
                  style={{ color: n <= (hovered || rating) ? '#CEB069' : '#E8E2D9' }}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-fsu-text block mb-1">What worked well?</label>
            <textarea
              value={whatWorked} onChange={e => setWhatWorked(e.target.value)} rows={3}
              className="w-full border border-fsu-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-fsu-garnet text-fsu-text resize-none"
              placeholder="Share what you enjoyed or found effective..."
            />
          </div>

          <div>
            <label className="text-sm font-medium text-fsu-text block mb-1">What could be improved?</label>
            <textarea
              value={whatImprove} onChange={e => setWhatImprove(e.target.value)} rows={3}
              className="w-full border border-fsu-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-fsu-garnet text-fsu-text resize-none"
              placeholder="What would make this better next time?"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-fsu-text block mb-1">Group size (optional)</label>
            <input
              type="number" value={groupSize} onChange={e => setGroupSize(e.target.value)} min="1"
              className="border border-fsu-border rounded-xl px-3 py-2 text-sm w-32 focus:outline-none focus:border-fsu-garnet text-fsu-text"
              placeholder="e.g. 24"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button type="submit"
            className="w-full bg-fsu-garnet hover:bg-fsu-garnet2 text-white py-3 rounded-xl font-semibold text-sm transition-colors">
            Submit Feedback
          </button>
        </form>
      </div>
    </div>
  );
}
