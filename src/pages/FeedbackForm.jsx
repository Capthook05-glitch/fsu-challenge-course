import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getSupabaseClient } from '../lib/supabase';

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
    <div className="min-h-screen bg-fsu-white">
      {/* Header */}
      <div className="bg-fsu-garnet text-white px-4 py-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 bg-fsu-gold rounded-lg flex items-center justify-center font-syne font-bold text-fsu-garnet text-xs">FSU</div>
            <span className="text-xs text-white/70">Participant Portal</span>
          </div>
          <h1 className="font-syne font-bold text-lg">{session?.name || 'Session'}</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-fsu-surface border-b border-fsu-border">
        <div className="max-w-lg mx-auto flex">
          {['program','feedback'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-medium capitalize transition-colors border-b-2 ${
                activeTab === tab ? 'border-fsu-garnet text-fsu-garnet' : 'border-transparent text-fsu-muted hover:text-fsu-text'
              }`}>
              {tab === 'program' ? 'Today\'s Program' : 'Leave Feedback'}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4">
        {/* Program view */}
        {activeTab === 'program' && (
          <div className="space-y-3 py-2">
            <p className="text-xs text-fsu-muted mb-3">Here's what's on the schedule for today.</p>
            {blocks.map(block => {
              const color = TYPE_COLORS[block.block_type] || '#78716C';
              const label = TYPE_LABELS[block.block_type] || 'Block';
              return (
                <div key={block.id} className="bg-fsu-surface border border-fsu-border rounded-xl overflow-hidden flex">
                  <div className="w-1 flex-shrink-0" style={{ background: color }} />
                  <div className="flex-1 px-4 py-3">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold" style={{ color }}>{label}</span>
                      <span className="text-xs text-fsu-faint">{fmtTime(block.start_time)} · {block.duration_min} min</span>
                    </div>
                    <p className="text-sm font-medium text-fsu-text">{block.title || label}</p>
                    {block.location && <p className="text-xs text-fsu-muted mt-0.5">{block.location}</p>}
                    {block.subgroup && <p className="text-xs text-fsu-faint">{block.subgroup}</p>}
                  </div>
                </div>
              );
            })}
            {blocks.length === 0 && (
              <p className="text-fsu-muted text-sm text-center py-8">No program blocks available.</p>
            )}
            <button onClick={() => setActiveTab('feedback')}
              className="w-full mt-4 bg-fsu-garnet hover:bg-fsu-garnet2 text-white py-3 rounded-xl font-semibold text-sm transition-colors">
              Leave Feedback
            </button>
          </div>
        )}

        {/* Feedback form */}
        {activeTab === 'feedback' && (
          <form onSubmit={submit} className="space-y-5 py-2">
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
              <label className="text-sm font-medium text-fsu-text block mb-1">My biggest takeaway</label>
              <textarea
                value={takeaway} onChange={e => setTakeaway(e.target.value)} rows={2}
                className="w-full border border-fsu-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-fsu-garnet text-fsu-text resize-none"
                placeholder="One thing I'm taking away from today..."
              />
            </div>

            <div>
              <label className="text-sm font-medium text-fsu-text block mb-1">My goal for next time</label>
              <textarea
                value={goalNext} onChange={e => setGoalNext(e.target.value)} rows={2}
                className="w-full border border-fsu-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-fsu-garnet text-fsu-text resize-none"
                placeholder="Something I want to work on or try next time..."
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
        )}
      </div>
    </div>
  );
}
