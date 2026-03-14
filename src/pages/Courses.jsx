import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSupabaseClient } from '../lib/supabase';
import { useProfile } from '../context/ProfileContext';
import { GoalTag } from '../components/ui/GoalTag';
import { Modal } from '../components/ui/Modal';
import { GOAL_META, GOAL_KEYS } from '../lib/goalMeta';

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

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const [courseRes, sessRes] = await Promise.all([
      supabase.from('courses').select('*').order('created_at', { ascending: false }),
      supabase.from('sessions').select('id,name,status')
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

  async function addSessionToCourse(courseId, sessionId) {
    if (!sessionId) return;
    const current = courseData[courseId] || [];
    const { data } = await supabase.from('course_sessions').insert({
      course_id: courseId,
      session_id: sessionId,
      position: current.length
    }).select('id, position, notes, sessions(id, name, status)').single();
    if (data) setCourseData(prev => ({ ...prev, [courseId]: [...current, data] }));
  }

  async function removeSessionFromCourse(id, courseId) {
    await supabase.from('course_sessions').delete().eq('id', id);
    setCourseData(prev => ({ ...prev, [courseId]: prev[courseId].filter(x => x.id !== id) }));
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
    if (!confirm('Delete this course?')) return;
    await supabase.from('courses').delete().eq('id', id);
    setCourses(c => c.filter(x => x.id !== id));
    if (expanded === id) setExpanded(null);
  }

  function toggleGoal(key) {
    setForm(f => ({
      ...f,
      goals: f.goals.includes(key) ? f.goals.filter(g => g !== key) : [...f.goals, key],
    }));
  }

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 bg-background-light dark:bg-background-dark min-h-screen font-display">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="space-y-1">
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">Curriculum Management</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl">Organize sessions into multi-day courses and tracked learning progressions.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/templates" className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-navy-600 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all shadow-sm">
             <span className="material-symbols-outlined text-lg">description</span>
             Blueprints
          </Link>
           {canPlan && (
             <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-all shadow-md">
                <span className="material-symbols-outlined text-lg">add_circle</span>
                New Course
             </button>
           )}
        </div>
      </div>

      {showForm && (
        <Modal onClose={() => setShowForm(false)} title="New Course" wide>
          <div className="space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                   <label className="text-xs font-bold text-navy uppercase tracking-widest">Course Name</label>
                   <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                     className="w-full bg-white border border-slate-200 rounded-lg py-3 px-4 text-navy focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div className="flex flex-col gap-2">
                   <label className="text-xs font-bold text-navy uppercase tracking-widest">Description</label>
                   <input value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                     className="w-full bg-white border border-slate-200 rounded-lg py-3 px-4 text-navy focus:ring-2 focus:ring-primary outline-none" />
                </div>
             </div>

             <div className="space-y-3">
                <label className="text-xs font-bold text-navy uppercase tracking-widest">Target Goals</label>
                <div className="flex flex-wrap gap-2">
                  {GOAL_KEYS.map(k => (
                    <button key={k} onClick={() => toggleGoal(k)}
                      className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                        form.goals.includes(k) ? 'bg-primary text-white border-primary' : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                      {GOAL_META[k].label}
                    </button>
                  ))}
                </div>
             </div>

             <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_public} onChange={e => setForm(f => ({ ...f, is_public: e.target.checked }))} className="rounded text-primary focus:ring-primary" />
                <span className="text-sm font-bold text-slate-700">Make visible to all facilitators</span>
             </label>

             <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button onClick={() => setShowForm(false)} className="px-6 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button onClick={saveCourse} disabled={!form.name.trim()} className="px-8 py-2 font-bold text-white bg-primary rounded-lg shadow-md disabled:opacity-50">Create Course</button>
             </div>
          </div>
        </Modal>
      )}

      {loading ? (
        <p className="text-slate-400">Loading courses…</p>
      ) : courses.length === 0 ? (
        <div className="bg-white dark:bg-background-dark border border-slate-200 dark:border-primary/20 rounded-xl p-12 text-center">
          <p className="text-slate-500 mb-2 font-bold uppercase tracking-widest text-xs">No curriculum found</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-background-dark border border-slate-200 dark:border-primary/20 rounded-xl overflow-hidden shadow-sm">
           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-slate-50 dark:bg-primary/5 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest border-b border-slate-200 dark:border-primary/10">
                       <th className="px-6 py-4">Course Name</th>
                       <th className="px-6 py-4">Goals</th>
                       <th className="px-6 py-4">Status</th>
                       <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-primary/5">
                    {courses.map(course => {
                       const isOwner = course.created_by === profile?.id;
                       return (
                          <tr key={course.id} className="hover:bg-slate-50/50 dark:hover:bg-primary/5 transition-colors">
                             <td className="px-6 py-5">
                                <div className="flex flex-col">
                                   <span className="text-sm font-bold text-slate-900 dark:text-slate-50">{course.name}</span>
                                   <span className="text-xs text-slate-400 line-clamp-1">{course.description}</span>
                                </div>
                             </td>
                             <td className="px-6 py-5">
                                <div className="flex flex-wrap gap-1">
                                   {course.goals?.slice(0, 2).map(g => (
                                      <span key={g} className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                                         {g.replace(/-/g, ' ')}
                                      </span>
                                   ))}
                                </div>
                             </td>
                             <td className="px-6 py-5">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${course.is_public ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                                   <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${course.is_public ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                   {course.is_public ? 'Public' : 'Private'}
                                </span>
                             </td>
                             <td className="px-6 py-5 text-right">
                                <div className="flex justify-end gap-2">
                                   <button onClick={() => toggleExpand(course.id)} className="text-primary hover:text-primary/80 font-bold text-xs uppercase">View</button>
                                   {isOwner && <button onClick={() => deleteCourse(course.id)} className="text-slate-400 hover:text-red-600 font-bold text-xs uppercase">Delete</button>}
                                </div>
                             </td>
                          </tr>
                       );
                    })}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {expanded && (
        <div className="mt-8 p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg animate-in fade-in slide-in-from-bottom-4">
           <div className="flex justify-between items-center mb-6">
              <div>
                 <h3 className="text-xl font-bold text-navy-deep dark:text-white">Program Sequence</h3>
                 <p className="text-xs text-slate-500 font-medium">Build your program by adding existing sessions in order.</p>
              </div>
              <button onClick={() => setExpanded(null)} className="text-slate-400 hover:text-navy">
                 <span className="material-symbols-outlined">close</span>
              </button>
           </div>

           <div className="space-y-4">
              <div className="grid gap-2">
                 {(courseData[expanded] || []).map((cs, i) => (
                    <div key={cs.id} className="flex items-center gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 group">
                       <div className="size-6 flex items-center justify-center rounded bg-primary/10 text-primary text-[10px] font-black">{i + 1}</div>
                       <Link to={`/sessions/${cs.sessions?.id}`} className="flex-1 text-sm font-bold text-navy-deep dark:text-white hover:text-primary transition-colors">
                          {stripEmojis(cs.sessions?.name)}
                       </Link>
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{cs.sessions?.status}</span>
                       <button
                          onClick={() => removeSessionFromCourse(cs.id, expanded)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-600 transition-all"
                       >
                          <span className="material-symbols-outlined text-sm">delete</span>
                       </button>
                    </div>
                 ))}
                 {(!courseData[expanded] || courseData[expanded].length === 0) && (
                    <div className="py-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl">
                       <p className="text-sm text-slate-400 italic">No sessions added to this program yet.</p>
                    </div>
                 )}
              </div>

              {canPlan && (
                 <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-3">Add Session to Program</label>
                    <div className="flex gap-3">
                       <select
                          className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                          onChange={(e) => addSessionToCourse(expanded, e.target.value)}
                          defaultValue=""
                       >
                          <option value="" disabled>Select a session to add...</option>
                          {sessions.map(s => (
                             <option key={s.id} value={s.id}>{stripEmojis(s.name)}</option>
                          ))}
                       </select>
                    </div>
                 </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
}
