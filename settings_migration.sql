-- 1. Add missing preference columns to public.profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS opt_out_leaderboard BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS opt_out_friend_requests BOOLEAN DEFAULT false;

-- 2. Create a secure function to allow users to delete their own account.
-- This function runs with SECURITY DEFINER privileges to delete the auth user.
CREATE OR REPLACE FUNCTION delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Double check the user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete from auth.users (Cascades to public tables if foreign keys have ON DELETE CASCADE)
  -- Currently we added CASCADE to user_progress in fix_relationships.sql,
  -- but we manually delete from tables without cascade just to be extremely safe.
  DELETE FROM public.user_progress WHERE id = auth.uid();
  DELETE FROM public.xp_history WHERE user_id = auth.uid();
  DELETE FROM public.friendships WHERE sender_id = auth.uid() OR receiver_id = auth.uid();
  DELETE FROM public.profiles WHERE id = auth.uid();
  
  -- Finally delete from auth.users
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;
