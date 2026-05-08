-- Courtrooms table
create table if not exists public.court_rooms (
    id uuid default gen_random_uuid() primary key,
    room_id text unique not null,
    password text not null,
    title text not null,
    description text not null,
    creator_id uuid not null,
    status text default 'waiting' check (status in ('waiting', 'briefing', 'active', 'finished')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Players table
create table if not exists public.court_players (
    id uuid default gen_random_uuid() primary key,
    room_id text references public.court_rooms(room_id) on delete cascade,
    user_id uuid not null,
    name text not null,
    role text not null check (role in ('prosecutor', 'defendant')),
    is_ready boolean default false,
    joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(room_id, role)
);

-- Case Transcript table
create table if not exists public.court_case (
    id uuid default gen_random_uuid() primary key,
    room_id text references public.court_rooms(room_id) on delete cascade,
    user_id uuid not null,
    name text not null,
    role text not null,
    statement text not null,
    type text default 'lawyer' check (type in ('lawyer', 'judge', 'system')),
    timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Realtime for these tables
alter publication supabase_realtime add table court_rooms;
alter publication supabase_realtime add table court_players;
alter publication supabase_realtime add table court_case;

-- Basic RLS (Disable for prototyping, Enable for production)
alter table public.court_rooms enable row level security;
alter table public.court_players enable row level security;
alter table public.court_case enable row level security;

create policy "Allow all for rooms" on public.court_rooms for all using (true);
create policy "Allow all for players" on public.court_players for all using (true);
create policy "Allow all for case" on public.court_case for all using (true);
