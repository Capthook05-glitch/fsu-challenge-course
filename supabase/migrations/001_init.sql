-- FSU Challenge Course Toolkit baseline schema

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text,
  role text not null default 'facilitator' check (role in ('admin', 'facilitator')),
  created_at timestamptz not null default now()
);

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  goals text[] not null default '{}',
  min_group int not null,
  max_group int not null,
  min_age int,
  max_age int,
  time_min int not null,
  time_max int not null,
  activity_level text not null check (activity_level in ('low', 'medium', 'high')),
  setting text[] not null default '{}',
  facilitation text,
  materials text,
  tags text[] not null default '{}',
  is_active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  notes text,
  status text not null default 'draft' check (status in ('draft', 'ready', 'completed', 'archived')),
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.session_games (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  game_id uuid not null references public.games(id),
  position int not null,
  facilitator_note text,
  created_at timestamptz not null default now(),
  unique (session_id, position)
);

create table if not exists public.session_feedback (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  what_worked text,
  what_improve text,
  group_size int,
  submitted_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_games_updated_at on public.games;
create trigger set_games_updated_at
before update on public.games
for each row execute function public.set_updated_at();

drop trigger if exists set_sessions_updated_at on public.sessions;
create trigger set_sessions_updated_at
before update on public.sessions
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'facilitator')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.games enable row level security;
alter table public.sessions enable row level security;
alter table public.session_games enable row level security;
alter table public.session_feedback enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Anyone authenticated can view active games" on public.games;
drop policy if exists "Only admins can insert games" on public.games;
drop policy if exists "Only admins can update games" on public.games;
drop policy if exists "Only admins can delete games" on public.games;
drop policy if exists "Users can read own sessions" on public.sessions;
drop policy if exists "Users can create own sessions" on public.sessions;
drop policy if exists "Users can update own sessions" on public.sessions;
drop policy if exists "Users can delete own sessions" on public.sessions;
drop policy if exists "Read session games for authorized sessions" on public.session_games;
drop policy if exists "Write session games for authorized sessions" on public.session_games;
drop policy if exists "Public can insert feedback" on public.session_feedback;
drop policy if exists "Only owner/admin can read feedback" on public.session_feedback;

-- profiles policies
create policy "Users can read own profile" on public.profiles
for select using (auth.uid() = id or public.is_admin());

create policy "Users can update own profile" on public.profiles
for update using (auth.uid() = id or public.is_admin())
with check (auth.uid() = id or public.is_admin());

-- games policies
create policy "Anyone authenticated can view active games" on public.games
for select using ((is_active = true and auth.uid() is not null) or public.is_admin());

create policy "Only admins can insert games" on public.games
for insert with check (public.is_admin());

create policy "Only admins can update games" on public.games
for update using (public.is_admin())
with check (public.is_admin());

create policy "Only admins can delete games" on public.games
for delete using (public.is_admin());

-- sessions policies
create policy "Users can read own sessions" on public.sessions
for select using (owner_id = auth.uid() or public.is_admin());

create policy "Users can create own sessions" on public.sessions
for insert with check (owner_id = auth.uid() or public.is_admin());

create policy "Users can update own sessions" on public.sessions
for update using (owner_id = auth.uid() or public.is_admin())
with check (owner_id = auth.uid() or public.is_admin());

create policy "Users can delete own sessions" on public.sessions
for delete using (owner_id = auth.uid() or public.is_admin());

-- session games policies
create policy "Read session games for authorized sessions" on public.session_games
for select using (
  exists (
    select 1 from public.sessions s
    where s.id = session_id
      and (s.owner_id = auth.uid() or public.is_admin())
  )
);

create policy "Write session games for authorized sessions" on public.session_games
for all using (
  exists (
    select 1 from public.sessions s
    where s.id = session_id
      and (s.owner_id = auth.uid() or public.is_admin())
  )
)
with check (
  exists (
    select 1 from public.sessions s
    where s.id = session_id
      and (s.owner_id = auth.uid() or public.is_admin())
  )
);

-- feedback policies
create policy "Public can insert feedback" on public.session_feedback
for insert with check (true);

create policy "Only owner/admin can read feedback" on public.session_feedback
for select using (
  exists (
    select 1 from public.sessions s
    where s.id = session_id
      and (s.owner_id = auth.uid() or public.is_admin())
  )
);

insert into public.games (
  name, description, goals, min_group, max_group, min_age, max_age,
  time_min, time_max, activity_level, setting, facilitation, materials, tags, is_active
)
values
('Helium Stick', 'Group balances a dowel while lowering it together.', '{communication,problem-solving,trust}', 8, 20, 12, 99, 10, 20, 'low', '{indoor,outdoor}', 'Challenge the group to keep fingers touching and move slowly.', 'thin dowel rod', '{communication,trust}', true),
('Human Knot', 'Participants untangle while holding hands.', '{communication,problem-solving,community-building}', 6, 16, 10, 99, 10, 25, 'medium', '{indoor,outdoor}', 'Encourage verbal planning and shared leadership.', 'none', '{icebreaker}', true),
('TP Shuffle', 'Team crosses a beam/log swapping positions without stepping off.', '{communication,trust,problem-solving,leadership}', 8, 20, 12, 99, 15, 30, 'medium', '{outdoor}', 'Spot physically and enforce safety boundaries.', 'log or beam', '{balance,teamwork}', true),
('Zip Zap Zop', 'Fast paced name-and-energy passing game.', '{energizer,communication,community-building}', 8, 40, 8, 99, 5, 10, 'low', '{indoor,outdoor}', 'Keep rhythm and invite big energy.', 'none', '{energizer}', true),
('Blind Square', 'Blindfolded team forms a square with rope.', '{communication,leadership,trust}', 8, 18, 12, 99, 15, 25, 'low', '{indoor,outdoor}', 'Focus on role clarity and listening.', 'rope, blindfolds', '{trust}', true),
('Minefield', 'Partners verbally guide blindfolded teammate through obstacles.', '{trust,communication}', 6, 30, 10, 99, 15, 30, 'low', '{indoor,outdoor}', 'Use progressive challenge and clear safety stops.', 'blindfolds, obstacles', '{trust}', true),
('All Aboard', 'Group fits onto limited space together.', '{problem-solving,trust,community-building}', 8, 20, 10, 99, 10, 20, 'medium', '{indoor,outdoor}', 'Run multiple rounds with shrinking platform.', 'tarp', '{teamwork}', true),
('Warp Speed', 'Group lowers total passing time of an object.', '{problem-solving,communication,energizer}', 8, 40, 8, 99, 10, 20, 'low', '{indoor,outdoor}', 'Track attempts and highlight strategy shifts.', 'small ball', '{energizer}', true),
('Two Truths and a Lie', 'Icebreaker to learn about each participant.', '{community-building,communication}', 4, 25, 8, 99, 10, 20, 'low', '{indoor,outdoor}', 'Use as opener and debrief assumptions.', 'none', '{icebreaker}', true),
('Spider Web', 'Team passes members through rope web openings.', '{problem-solving,trust,communication,leadership}', 8, 20, 12, 99, 20, 45, 'high', '{outdoor}', 'Enforce one-use openings and spotting roles.', 'rope web', '{challenge}', true)
on conflict do nothing;
