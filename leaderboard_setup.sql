-- Players table (for Leaderboard tracking)
create table if not exists public.players (
    id uuid default gen_random_uuid() primary key,
    username text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Leaderboard Scores table
create table if not exists public.leaderboard_scores (
    id uuid default gen_random_uuid() primary key,
    player_id uuid references public.players(id) on delete cascade not null,
    total_score numeric not null,
    knowledge_score numeric not null,
    persuasiveness_score numeric not null,
    legal_reasoning_score numeric not null,
    objection_handling_score numeric not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Basic RLS for new tables
alter table public.players enable row level security;
alter table public.leaderboard_scores enable row level security;

create policy "Allow all for players" on public.players for all using (true);
create policy "Allow all for leaderboard_scores" on public.leaderboard_scores for all using (true);
