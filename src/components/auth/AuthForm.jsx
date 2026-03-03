import { useState } from 'react';
import { supabase } from '../../lib/supabase';

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
    <div className="w-full max-w-md rounded-xl border border-fsu-gold/30 bg-white/5 p-6 shadow-2xl backdrop-blur">
      <h1 className="text-2xl font-semibold text-fsu-gold">FSU Facilitator Toolkit</h1>
      <p className="mt-2 text-sm text-slate-300">Sign in to access your game library and session planner.</p>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <label className="block text-sm">
          Email
          <input
            className="mt-1 w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className="block text-sm">
          Password
          <input
            className="mt-1 w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        <button
          className="w-full rounded-md bg-fsu-garnet px-3 py-2 font-medium transition hover:brightness-110 disabled:opacity-50"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Loading...' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      <button
        type="button"
        className="mt-3 text-sm text-fsu-gold hover:underline"
        onClick={() => setMode((current) => (current === 'signin' ? 'signup' : 'signin'))}
      >
        {mode === 'signin' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
      </button>

      {message && <p className="mt-3 text-sm text-slate-200">{message}</p>}
    </div>
  );
}
