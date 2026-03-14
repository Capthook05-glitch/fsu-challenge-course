import { useState } from 'react';
import { getSupabaseClient } from '../../lib/supabase';

export function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('signin');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    const supabase = getSupabaseClient();
    const action =
      mode === 'signin'
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password });

    const { error } = await action;
    if (error) {
      setMessage(error.message);
    } else {
      setMessage(mode === 'signin' ? 'Signed in successfully.' : 'Check your email to confirm sign up.');
    }

    setLoading(false);
  };

  return (
    <div className="w-full max-w-md rounded-xl border border-primary/20 bg-slate-900/50 p-8 shadow-2xl backdrop-blur-md">
      <div className="flex items-center gap-3 mb-6">
         <span className="text-3xl">🌲</span>
         <div>
            <h1 className="text-xl font-extrabold text-slate-100 uppercase leading-none">FSU Challenge</h1>
            <p className="text-xs font-semibold text-accent-gold tracking-widest uppercase mt-0.5">Facilitator Toolkit</p>
         </div>
      </div>

      <p className="text-sm text-slate-400 mb-8">Sign in to access your game library and session planner.</p>

      <form className="space-y-6" onSubmit={onSubmit}>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Email Address</label>
          <input
            className="w-full rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3 text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Password</label>
          <input
            className="w-full rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3 text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>

        <button
          className="w-full rounded-xl bg-primary py-4 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Processing...' : mode === 'signin' ? 'Sign In to Toolkit' : 'Create Account'}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col items-center gap-4">
        <button
          type="button"
          className="text-sm font-bold text-accent-gold hover:underline"
          onClick={() => setMode((current) => (current === 'signin' ? 'signup' : 'signin'))}
        >
          {mode === 'signin' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
        </button>
      </div>

      {message && (
        <div className={`mt-6 p-4 rounded-lg text-sm font-medium ${message.includes('successfully') || message.includes('confirm') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {message}
        </div>
      )}
    </div>
  );
}
