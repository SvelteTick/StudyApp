-- ==========================================
-- NOTIFICATIONS SYSTEM
-- ==========================================
-- Run this script in your Supabase SQL Editor to add the push_token column

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Notify API to reload cache
NOTIFY pgrst, 'reload schema';
