-- Run this script in the Supabase SQL Editor to clean up the 50 test users.

DO $$
DECLARE
  test_user_id UUID;
BEGIN
  -- We delete users whose email follows the test pattern
  FOR test_user_id IN 
    SELECT id FROM auth.users WHERE email LIKE 'test%@example.com' 
  LOOP
    -- It's best to delete the auth.users record, and let Supabase (or your constraints) cascade
    -- If there's no cascade, you might need to delete from public tables first:
    DELETE FROM public.user_progress WHERE id = test_user_id;
    DELETE FROM public.profiles WHERE id = test_user_id;
    DELETE FROM public.xp_history WHERE user_id = test_user_id;
    
    DELETE FROM auth.users WHERE id = test_user_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
