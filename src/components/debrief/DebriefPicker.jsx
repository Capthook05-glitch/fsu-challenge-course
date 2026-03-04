import { useState, useEffect } from 'react';
import { getSupabaseClient } from '../../lib/supabase';
import { useProfile } from '../../context/ProfileContext';

const supabase = getSupabaseClient();

const THEORY_STYLE = {
  kolb:                 { bg: '#dbeafe', color: '#2563eb', label: 'Kolb' },
  capitalization:       { bg: '#dcfce7', color: '#16a34a', label: 'Capitalization' },
  psychological_safety: { bg: '#ede9fe', color: '#7c3aed', label: 'Psych Safety' },
};

export function DebriefPicker({ selected, onSelect }) {
  const { profile } = useProfile();
  const [sets, setSets] = useState([]);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newQuestions, setNewQuestions] = useState('');
  const [newTags, setNewTags] = useState([]);

  useEffect(() => {
    supabase.from('debrief_question_sets')
      .select('*').order('title')
      .then(({ data }) => setSets(data || []));
  }, []);

  async function saveNew() {
    if (!newTitle.trim()) return;
    const questions = newQuestions.split('\n').map(q => q.trim()).filter(Boolean);
    if (!questions.length) return;
    const { data } = await supabase.from('debrief_question_sets').insert({
      title: newTitle.trim(),
      questions,
      theory_tags: newTags,
      created_by: profile?.id,
      is_public: false,
    }).select().single();
    if (data) {
      setSets(prev => [...prev, data]);
      setCreating(false);
      setNewTitle(''); setNewQuestions(''); setNewTags([]);
      onSelect(data);
    }
  }

  function toggleTag(tag) {
    setNewTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-fsu-muted uppercase tracking-wide">Question Sets</p>
        <button onClick={() => setCreating(c => !c)}
          className="text-xs text-fsu-garnet hover:underline font-medium">
          {creating ? 'Cancel' : '+ Custom Set'}
        </button>
      </div>

      {creating && (
        <div className="bg-fsu-soft border border-fsu-border rounded-xl p-3 space-y-2">
          <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
            placeholder="Set title..."
            className="w-full border border-fsu-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-fsu-garnet text-fsu-text bg-fsu-surface" />
          <textarea value={newQuestions} onChange={e => setNewQuestions(e.target.value)}
            placeholder="One question per line..." rows={4}
            className="w-full border border-fsu-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-fsu-garnet text-fsu-text bg-fsu-surface resize-none" />
          <div>
            <p className="text-xs text-fsu-muted mb-1">Theory tags</p>
            <div className="flex flex-wrap gap-1">
              {Object.entries(THEORY_STYLE).map(([k, v]) => (
                <button key={k} onClick={() => toggleTag(k)}
                  className="text-xs font-medium px-2 py-0.5 rounded-full border transition-colors"
                  style={newTags.includes(k)
                    ? { background: v.bg, color: v.color, borderColor: v.color + '55' }
                    : { background: 'transparent', color: '#78716C', borderColor: '#E8E2D9' }}>
                  {v.label}
                </button>
              ))}
            </div>
          </div>
          <button onClick={saveNew}
            className="bg-fsu-garnet hover:bg-fsu-garnet2 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors">
            Save Set
          </button>
        </div>
      )}

      <div className="space-y-2 max-h-72 overflow-y-auto">
        {sets.map(s => {
          const isSelected = selected?.id === s.id;
          return (
            <button key={s.id} onClick={() => onSelect(s)}
              className={`w-full text-left p-3 rounded-xl border transition-colors ${
                isSelected ? 'border-fsu-garnet bg-fsu-garnet/5' : 'border-fsu-border bg-fsu-surface hover:border-fsu-border2'
              }`}>
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-sm font-semibold text-fsu-text">{s.title}</p>
                {isSelected && <span className="text-xs text-fsu-garnet font-bold flex-shrink-0">Selected</span>}
              </div>
              {s.theory_tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {s.theory_tags.map(t => {
                    const ts = THEORY_STYLE[t];
                    return ts ? (
                      <span key={t} className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                        style={{ background: ts.bg, color: ts.color }}>{ts.label}</span>
                    ) : null;
                  })}
                </div>
              )}
              <ul className="space-y-0.5">
                {s.questions.slice(0,2).map((q, i) => (
                  <li key={i} className="text-xs text-fsu-muted truncate">• {q}</li>
                ))}
                {s.questions.length > 2 && (
                  <li className="text-xs text-fsu-faint">+{s.questions.length - 2} more</li>
                )}
              </ul>
            </button>
          );
        })}
      </div>
    </div>
  );
}
