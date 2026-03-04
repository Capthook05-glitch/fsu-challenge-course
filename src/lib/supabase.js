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
