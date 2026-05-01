-- Since you have some orphaned rows in user_progress that don't have a matching profile, 
-- we need to clean them up or fix them before we can add the constraint.

-- Step 1: Try to create a default profile for any user_progress row that is missing one,
-- AS LONG AS that user still exists in auth.users.
INSERT INTO public.profiles (id, full_name)
SELECT up.id, 'User ' || substr(up.id::text, 1, 6)
FROM public.user_progress up
JOIN auth.users au ON up.id = au.id
WHERE up.id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Step 2: If there are ANY user_progress rows left that STILL don't have a profile
-- (this usually means the auth.users account was deleted, making it a true orphan),
-- we need to delete them so the constraint can be applied.
DELETE FROM public.user_progress 
WHERE id NOT IN (SELECT id FROM public.profiles);

-- Step 3: Now we can safely apply the foreign key constraint
ALTER TABLE public.user_progress 
ADD CONSTRAINT fk_user_progress_profile 
FOREIGN KEY (id) REFERENCES public.profiles(id) 
ON DELETE CASCADE;
