import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bakrnmamwxwxbdeteccc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJha3JubWFtd3h3eGJkZXRlY2NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNTM4NDAsImV4cCI6MjA5MzgyOTg0MH0.dio3ndm6VUq6o9Gjv6ThZqgew4eG5xoMLQwCUwodlAA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('leaderboard_scores')
    .select(`
      total_score,
      players ( username )
    `)
    .limit(1);
    
  if (error) console.error("Error:", error);
  else console.log("Success:", data);
}
run();
