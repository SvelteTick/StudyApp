-- This script will create 50 test users with dummy UUIDs in auth.users
-- and assign them XP to populate the leaderboard.
-- Run this in the Supabase SQL Editor!

-- Ensure the profiles table exists before inserting users.
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  constraint username_length check (char_length(username) >= 3)
);

DO $$
DECLARE
  new_id UUID;
  i INTEGER;
BEGIN
  FOR i IN 1..50 LOOP
    new_id := gen_random_uuid();
    
    -- Insert into auth.users (make sure it matches your schema structure)
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_user_meta_data, raw_app_meta_data, created_at, updated_at
    ) VALUES (
      new_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
      'test' || i || '@example.com', 'dummy_hash', now(),
      jsonb_build_object('full_name', 'test' || i), '{}', now(), now()
    ) ON CONFLICT (id) DO NOTHING;

    -- Update their XP so they show up on the leaderboard
    UPDATE public.user_progress
    SET total_xp_earned = (51 - i) * 100, level = 1 + ((51 - i) / 5)
    WHERE id = new_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
