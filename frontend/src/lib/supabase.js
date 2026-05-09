import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabaseUrl1 = import.meta.env.VITE_SUPABASE_URL_1;
const supabaseAnonKey1 = import.meta.env.VITE_SUPABASE_ANON_KEY_1;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase multiplayer credentials missing in .env file');
}

if (!supabaseUrl1 || !supabaseAnonKey1) {
  console.warn('Supabase singleplayer/leaderboard credentials missing in .env file');
}

// Multiplayer (Custom Room)
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// Singleplayer / Leaderboard
export const supabase1 = createClient(supabaseUrl1 || '', supabaseAnonKey1 || '');
