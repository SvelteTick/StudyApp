-- Run this in your Supabase SQL Editor.
-- This ensures that the Row Level Security (RLS) policies allow searching for profiles.
-- If the table was dropped and recreated previously, the SELECT policy might have been lost, 
-- which causes all search queries to silently return zero results!

-- 1. Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop the policy if it somehow got corrupted
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;

-- 3. Re-create the policy so that any logged-in user (or even guests) can search for profiles
CREATE POLICY "Public profiles are viewable by everyone." 
  ON public.profiles
  FOR SELECT 
  USING (true);

-- 4. Reload the API schema cache just in case
NOTIFY pgrst, 'reload schema';
