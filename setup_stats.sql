-- ==========================================
-- STATS & PROGRESS TRACKING
-- ==========================================

-- Create user_progress table (safe to re-run)
create table if not exists user_progress (
  id uuid references public.profiles(id) on delete cascade not null primary key,
  level integer default 1 not null,
  current_xp integer default 0 not null,
  total_xp_earned integer default 0 not null,
  streak_days integer default 0 not null,
  last_active_date timestamp with time zone default now() not null,
  sessions_done_today integer default 0 not null,
  minutes_today integer default 0 not null,
  daily_goal integer default 3 not null,
  preferred_session_type text default '25 min' not null,
  unlocked_badges text[] default '{}'::text[] not null
);

alter table user_progress enable row level security;

-- Drop and recreate policies so re-running is safe
drop policy if exists "User progress is viewable by everyone for leaderboards." on user_progress;
drop policy if exists "Users can update their own progress." on user_progress;
drop policy if exists "Users can insert their own progress." on user_progress;

create policy "User progress is viewable by everyone for leaderboards."
  on user_progress for select using (true);

create policy "Users can update their own progress."
  on user_progress for update using (auth.uid() = id);

create policy "Users can insert their own progress."
  on user_progress for insert with check (auth.uid() = id);


-- ==========================================
-- XP HISTORY LOGS
-- ==========================================

create table if not exists xp_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  label text not null,
  xp_amount integer not null,
  created_at timestamp with time zone default now() not null
);

alter table xp_history enable row level security;

drop policy if exists "Users can view own xp history." on xp_history;
drop policy if exists "Users can insert own xp history." on xp_history;

create policy "Users can view own xp history."
  on xp_history for select using (auth.uid() = user_id);

create policy "Users can insert own xp history."
  on xp_history for insert with check (auth.uid() = user_id);


-- ==========================================
-- FRIENDS SYSTEM
-- ==========================================

create table if not exists friendships (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references auth.users not null,
  receiver_id uuid references auth.users not null,
  status text check (status in ('pending', 'accepted', 'rejected')) default 'pending' not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  unique (sender_id, receiver_id)
);

alter table friendships enable row level security;

drop policy if exists "Users can view their friendships." on friendships;
drop policy if exists "Users can insert a friend request." on friendships;
drop policy if exists "Receivers can update the friendship status." on friendships;
drop policy if exists "Users can delete their friendships." on friendships;

create policy "Users can view their friendships."
  on friendships for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can insert a friend request."
  on friendships for insert with check (auth.uid() = sender_id);

create policy "Receivers can update the friendship status."
  on friendships for update using (auth.uid() = receiver_id);

create policy "Users can delete their friendships."
  on friendships for delete using (auth.uid() = sender_id or auth.uid() = receiver_id);


-- ==========================================
-- TRIGGER: Auto-init progress on sign-up
-- ==========================================

create or replace function public.handle_new_user()
returns trigger
set search_path = ''
as $$
begin
  -- 1) Create Profile metadata row
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;

  -- 2) Create User Progress defaults
  insert into public.user_progress (id)
  values (new.id)
  on conflict (id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

-- Recreate trigger (drop first so re-running is safe)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
