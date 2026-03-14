import { useState, useEffect } from 'react';
import { getSupabaseClient } from '../../lib/supabase';
import { useProfile } from '../../context/ProfileContext';

const supabase = getSupabaseClient();

export function BlockComments({ blockId, sessionId }) {
  const { profile } = useProfile();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  async function load() {
    const { data } = await supabase.from('block_comments')
      .select('*, profiles(name)')
      .eq('block_id', blockId)
      .order('created_at', { ascending: true });
    setComments(data || []);
  }

  useEffect(() => { load(); }, [blockId]);

  async function post() {
    if (!newComment.trim()) return;
    await supabase.from('block_comments').insert({
      block_id: blockId,
      session_id: sessionId,
      author_id: profile.id,
      body: newComment
    });
    setNewComment('');
    load();
  }

  return (
    <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Discussion</p>
      <div className="space-y-3">
        {comments.map(c => (
          <div key={c.id} className="text-sm">
            <span className="font-bold text-navy-deep">{c.profiles?.name}: </span>
            <span className="text-slate-600">{c.body}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-primary outline-none"
        />
        <button onClick={post} className="text-primary material-symbols-outlined">send</button>
      </div>
    </div>
  );
}
