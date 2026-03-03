import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const missingSupabaseEnv = !supabaseUrl || !supabaseAnonKey;

let supabaseClient = null;
if (!missingSupabaseEnv) {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
}

export function getSupabaseClient() {
  return supabaseClient;
}
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Copy .env.example to .env and set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
