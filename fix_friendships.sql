-- Run this in your Supabase SQL Editor.
-- This forces the API to understand the relationship between friendships and profiles.

-- 1. Drop existing constraints if they exist to avoid errors
ALTER TABLE public.friendships
DROP CONSTRAINT IF EXISTS friendships_sender_id_fkey,
DROP CONSTRAINT IF EXISTS friendships_receiver_id_fkey;

-- 2. Add explicit foreign keys to the profiles table
ALTER TABLE public.friendships
ADD CONSTRAINT friendships_sender_id_fkey
FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
ADD CONSTRAINT friendships_receiver_id_fkey
FOREIGN KEY (receiver_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 3. Force PostgREST (the API) to reload its schema cache
NOTIFY pgrst, 'reload schema';
