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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-navy uppercase tracking-widest">Question Sets</p>
        <button onClick={() => setCreating(c => !c)}
          className="text-xs font-bold text-primary hover:underline uppercase">
          {creating ? 'Cancel' : '+ Custom'}
        </button>
      </div>

      {creating && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4 shadow-inner">
          <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
            placeholder="Set title..."
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none" />
          <textarea value={newQuestions} onChange={e => setNewQuestions(e.target.value)}
            placeholder="One question per line..." rows={3}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none resize-none" />
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Theory Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(THEORY_STYLE).map(([k, v]) => (
                <button key={k} onClick={() => toggleTag(k)}
                  className={`text-[10px] font-bold px-2 py-1 rounded-full border transition-all ${
                    newTags.includes(k) ? 'bg-primary text-white border-primary' : 'bg-white text-slate-400 border-slate-200'
                  }`}>
                  {v.label}
                </button>
              ))}
            </div>
          </div>
          <button onClick={saveNew}
            className="w-full bg-primary text-white py-2 rounded-lg text-xs font-bold shadow-sm">
            Save Custom Set
          </button>
        </div>
      )}

      <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
        {sets.map(s => {
          const isSelected = selected?.id === s.id;
          return (
            <button key={s.id} onClick={() => onSelect(s)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-slate-100 bg-white hover:border-primary/30'
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
