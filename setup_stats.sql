-- ==========================================
-- STATS & PROGRESS TRACKING
-- ==========================================

-- Create user_progress table
create table user_progress (
  id uuid references auth.users not null primary key,
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

-- Turn on Row Level Security (RLS)
alter table user_progress enable row level security;

-- Leaderboard policy: Anyone logged in can view everyone else's progress
create policy "User progress is viewable by everyone for leaderboards."
  on user_progress for select using (true);

-- Users can only modify their own progress
create policy "Users can update their own progress."
  on user_progress for update using (auth.uid() = id);

create policy "Users can insert their own progress."
  on user_progress for insert with check (auth.uid() = id);


-- ==========================================
-- XP HISTORY LOGS
-- ==========================================

-- Table specifically for tracking events over time
create table xp_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  label text not null,
  xp_amount integer not null,
  created_at timestamp with time zone default now() not null
);

alter table xp_history enable row level security;

-- Users can only see and add their own XP history
create policy "Users can view own xp history."
  on xp_history for select using (auth.uid() = user_id);

create policy "Users can insert own xp history."
  on xp_history for insert with check (auth.uid() = user_id);


-- ==========================================
-- FRIENDS SYSTEM
-- ==========================================

create table friendships (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references auth.users not null,
  receiver_id uuid references auth.users not null,
  status text check (status in ('pending', 'accepted', 'rejected')) default 'pending' not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  unique (sender_id, receiver_id)
);

alter table friendships enable row level security;

-- Users can see friendships they are a part of
create policy "Users can view their friendships." 
  on friendships for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Users can initiate a request
create policy "Users can insert a friend request." 
  on friendships for insert with check (auth.uid() = sender_id);

-- The receiver can update the status (accept/reject)
create policy "Receivers can update the friendship status." 
  on friendships for update using (auth.uid() = receiver_id);

-- Either user can remove a friend
create policy "Users can delete their friendships." 
  on friendships for delete using (auth.uid() = sender_id or auth.uid() = receiver_id);


-- ==========================================
-- TRIGGERS
-- ==========================================

-- Auto-initialize Progress on Account Creation
-- We recreate the old handle_new_user function to insert into *both* profiles and user_progress.
create or replace function public.handle_new_user()
returns trigger
set search_path = ''
as $$
begin
  -- 1) Create Profile metadata
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  
  -- 2) Create User Progress defaults
  insert into public.user_progress (id)
  values (new.id);
  
  return new;
end;
$$ language plpgsql security definer;

-- If you already had an `on_auth_user_created` trigger, executing this `CREATE OR REPLACE FUNCTION` overwrote the logic
-- and it continues to use the same trigger. If you haven't run setup_database.sql yet, it creates the trigger below.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

