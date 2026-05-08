import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL_1;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY_1;

export const supabase = createClient(supabaseUrl, supabaseKey);
