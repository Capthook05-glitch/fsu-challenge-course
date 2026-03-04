import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSupabaseClient } from '../lib/supabase';
import { useProfile } from '../context/ProfileContext';
import { GoalTag } from '../components/ui/GoalTag';

const supabase = getSupabaseClient();

const EMPTY_COURSE = { name: '', description: '', goals: [], is_public: false };

export default function Courses() {
  const { profile, canPlan } = useProfile();
  const [courses, setCourses]       = useState([]);
  const [sessions, setSessions]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState(EMPTY_COURSE);
  const [expanded, setExpanded]     = useState(null);
  const [courseData, setCourseData] = useState({}); // id → { sessions }
  const [addingSession, setAddingSession] = useState(null); // courseId

  const GOAL_KEYS = ['community-building','communication','energizer','leadership','problem-solving','trust'];

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const [courseRes, sessRes] = await Promise.all([
      supabase.from('courses').select('*').order('created_at', { ascending: false }),
      supabase.from('sessions').select('id,name,status')
        .eq(canPlan && !profile?.role === 'admin' ? 'owner_id' : 'is_archived', canPlan ? profile.id : false)
        .eq('is_archived', false)
        .order('name'),
    ]);
    setCourses(courseRes.data || []);
    setSessions(sessRes.data || []);
    setLoading(false);
  }

  async function loadCourseDetail(courseId) {
    const { data } = await supabase.from('course_sessions')
      .select('id, position, notes, sessions(id, name, status)')
      .eq('course_id', courseId)
      .order('position');
    setCourseData(prev => ({ ...prev, [courseId]: data || [] }));
  }

  function toggleExpand(id) {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!courseData[id]) loadCourseDetail(id);
  }

  async function saveCourse() {
    if (!form.name.trim()) return;
    const { data } = await supabase.from('courses').insert({
      ...form,
      created_by: profile.id,
    }).select().single();
    if (data) setCourses(c => [data, ...c]);
    setShowForm(false);
    setForm(EMPTY_COURSE);
  }

  async function deleteCourse(id) {
    if (!confirm('Delete this course and all its session links?')) return;
    await supabase.from('courses').delete().eq('id', id);
    setCourses(c => c.filter(x => x.id !== id));
    if (expanded === id) setExpanded(null);
  }

  async function addSessionToCourse(courseId, sessionId) {
    const existing = courseData[courseId] || [];
    if (existing.find(cs => cs.sessions?.id === sessionId)) return;
    const pos = existing.length;
    await supabase.from('course_sessions').insert({ course_id: courseId, session_id: sessionId, position: pos });
    loadCourseDetail(courseId);
    setAddingSession(null);
  }

  async function removeSessionFromCourse(courseId, csId) {
    await supabase.from('course_sessions').delete().eq('id', csId);
    setCourseData(prev => ({
      ...prev,
      [courseId]: prev[courseId].filter(cs => cs.id !== csId),
    }));
  }

  function toggleGoal(key) {
    setForm(f => ({
      ...f,
      goals: f.goals.includes(key) ? f.goals.filter(g => g !== key) : [...f.goals, key],
    }));
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-syne font-bold text-2xl text-fsu-text">Training Curriculum</h1>
          <p className="text-fsu-muted text-sm mt-1">Organize sessions into multi-day courses and learning progressions.</p>
        </div>
        {canPlan && (
          <button onClick={() => setShowForm(true)}
            className="bg-fsu-garnet hover:bg-fsu-garnet2 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
            + New Course
          </button>
        )}
      </div>

      {/* New Course Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-fsu-surface rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-fsu-border flex items-center justify-between">
              <h2 className="font-syne font-bold text-fsu-text">New Course</h2>
              <button onClick={() => setShowForm(false)} className="text-fsu-muted hover:text-fsu-text text-xl">×</button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-fsu-muted uppercase tracking-wide mb-1 block">Course Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Leadership Retreat Series"
                  className="w-full border border-fsu-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-fsu-garnet text-fsu-text" />
              </div>
              <div>
                <label className="text-xs font-semibold text-fsu-muted uppercase tracking-wide mb-1 block">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3} placeholder="What is this curriculum designed to achieve?"
                  className="w-full border border-fsu-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-fsu-garnet text-fsu-text resize-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-fsu-muted uppercase tracking-wide mb-1.5 block">Goals</label>
                <div className="flex flex-wrap gap-1.5">
                  {GOAL_KEYS.map(k => (
                    <button key={k} onClick={() => toggleGoal(k)}
                      className={`px-2.5 py-1 rounded-lg text-xs capitalize border transition-colors ${
                        form.goals.includes(k) ? 'bg-fsu-garnet text-white border-fsu-garnet' : 'border-fsu-border text-fsu-muted hover:border-fsu-border2'
                      }`}>{k.replace('-', ' ')}</button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_public} onChange={e => setForm(f => ({ ...f, is_public: e.target.checked }))} />
                <span className="text-sm text-fsu-text">Make visible to all facilitators</span>
              </label>
            </div>
            <div className="px-6 py-4 border-t border-fsu-border flex gap-3">
              <button onClick={saveCourse} disabled={!form.name.trim()}
                className="flex-1 bg-fsu-garnet hover:bg-fsu-garnet2 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
                Create Course
              </button>
              <button onClick={() => setShowForm(false)}
                className="border border-fsu-border text-fsu-muted px-4 py-2.5 rounded-xl text-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-fsu-muted">Loading courses…</p>
      ) : courses.length === 0 ? (
        <div className="bg-fsu-soft border border-fsu-border rounded-xl p-10 text-center">
          <p className="text-fsu-muted text-sm mb-2">No courses yet.</p>
          <p className="text-fsu-faint text-xs">Create a course to organize sessions into a multi-day curriculum.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map(course => {
            const isOpen  = expanded === course.id;
            const cData   = courseData[course.id] || [];
            const isOwner = course.created_by === profile?.id;
            return (
              <div key={course.id} className="bg-fsu-surface border border-fsu-border rounded-xl overflow-hidden">
                <button className="w-full text-left px-5 py-4 flex items-center gap-3"
                  onClick={() => toggleExpand(course.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-syne font-semibold text-fsu-text">{course.name}</h3>
                      {course.is_public && (
                        <span className="text-xs bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">Public</span>
                      )}
                    </div>
                    {course.description && (
                      <p className="text-xs text-fsu-muted mt-0.5 truncate">{course.description}</p>
                    )}
                    {course.goals?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {course.goals.map(g => <GoalTag key={g} goal={g} />)}
                      </div>
                    )}
                  </div>
                  <span className="text-fsu-faint text-sm flex-shrink-0">{isOpen ? '▲' : '▼'}</span>
                </button>

                {isOpen && (
                  <div className="border-t border-fsu-border px-5 py-4">
                    <div className="space-y-2 mb-4">
                      {cData.length === 0 && (
                        <p className="text-xs text-fsu-muted">No sessions in this course yet.</p>
                      )}
                      {cData.map((cs, i) => (
                        <div key={cs.id} className="flex items-center gap-3 bg-fsu-soft border border-fsu-border rounded-lg px-3 py-2.5">
                          <span className="text-xs text-fsu-faint font-mono w-5">{i + 1}</span>
                          <Link to={`/sessions/${cs.sessions?.id}`}
                            className="flex-1 text-sm font-medium text-fsu-text hover:text-fsu-garnet transition-colors truncate">
                            {cs.sessions?.name || 'Unknown Session'}
                          </Link>
                          <span className="text-xs px-1.5 py-0.5 rounded-full capitalize"
                            style={{
                              background: { draft:'#fef3c7', ready:'#dcfce7', completed:'#dbeafe' }[cs.sessions?.status] || '#f5f2ee',
                              color:      { draft:'#d97706', ready:'#16a34a', completed:'#2563eb' }[cs.sessions?.status] || '#78716C',
                            }}>
                            {cs.sessions?.status}
                          </span>
                          {isOwner && (
                            <button onClick={() => removeSessionFromCourse(course.id, cs.id)}
                              className="text-fsu-faint hover:text-red-400 text-sm transition-colors">×</button>
                          )}
                        </div>
                      ))}
                    </div>

                    {isOwner && (
                      <div className="flex gap-2 flex-wrap">
                        {addingSession === course.id ? (
                          <>
                            <select defaultValue="" onChange={e => e.target.value && addSessionToCourse(course.id, e.target.value)}
                              className="border border-fsu-garnet rounded-lg px-2.5 py-1.5 text-sm focus:outline-none text-fsu-text bg-fsu-surface">
                              <option value="">Pick a session…</option>
                              {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            <button onClick={() => setAddingSession(null)}
                              className="text-xs text-fsu-muted hover:text-fsu-text">Cancel</button>
                          </>
                        ) : (
                          <button onClick={() => setAddingSession(course.id)}
                            className="text-xs border border-fsu-border text-fsu-muted hover:border-fsu-garnet hover:text-fsu-garnet px-3 py-1.5 rounded-lg transition-colors">
                            + Add Session
                          </button>
                        )}
                        <button onClick={() => deleteCourse(course.id)}
                          className="text-xs border border-red-200 text-red-400 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">
                          Delete Course
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
