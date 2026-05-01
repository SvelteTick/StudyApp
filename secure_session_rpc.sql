-- ==========================================
-- SECURE SESSION COMPLETION RPC
-- ==========================================
-- Run this in the Supabase SQL Editor.
--
-- This moves ALL XP calculation, streak logic, 
-- level-ups, daily goal bonuses, and badge checks
-- to the server. The client can only say
-- "I completed X minutes" — it cannot dictate XP.

CREATE OR REPLACE FUNCTION complete_session(p_minutes INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_row RECORD;
  v_xp_earned INTEGER;
  v_bonus_xp INTEGER := 0;
  v_new_level INTEGER;
  v_new_current_xp INTEGER;
  v_new_total_xp INTEGER;
  v_next_level_xp INTEGER;
  v_new_streak INTEGER;
  v_new_sessions_today INTEGER;
  v_new_minutes_today INTEGER;
  v_last_active DATE;
  v_today DATE;
  v_yesterday DATE;
  v_is_new_day BOOLEAN;
  v_just_reached_goal BOOLEAN := false;
  v_unlocked_badges TEXT[];
  v_hour INTEGER;
  v_dow INTEGER;
BEGIN
  -- 1. Authenticate
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Validate input (prevent abuse)
  IF p_minutes < 1 OR p_minutes > 120 THEN
    RAISE EXCEPTION 'Invalid session length: must be 1-120 minutes';
  END IF;

  -- Only allow specific session durations (15, 25, 45 minutes)
  IF p_minutes NOT IN (15, 25, 45) THEN
    RAISE EXCEPTION 'Invalid session duration';
  END IF;

  -- 3. Fetch current progress (lock the row to prevent race conditions)
  SELECT * INTO v_row
  FROM public.user_progress
  WHERE id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User progress not found';
  END IF;

  -- 4. Calculate XP (server-controlled formula: 2 XP per minute)
  v_xp_earned := p_minutes * 2;

  -- 5. Streak & daily reset logic
  v_today := CURRENT_DATE;
  v_yesterday := v_today - INTERVAL '1 day';
  v_last_active := (v_row.last_active_date AT TIME ZONE 'UTC')::DATE;
  v_is_new_day := (v_today <> v_last_active);

  IF v_is_new_day THEN
    v_new_sessions_today := 1;
    v_new_minutes_today := p_minutes;
    IF v_last_active = v_yesterday THEN
      v_new_streak := v_row.streak_days + 1;
    ELSE
      v_new_streak := 1;
    END IF;
  ELSE
    v_new_sessions_today := v_row.sessions_done_today + 1;
    v_new_minutes_today := v_row.minutes_today + p_minutes;
    v_new_streak := GREATEST(v_row.streak_days, 1);
  END IF;

  -- 6. Level-up loop
  v_new_level := v_row.level;
  v_new_current_xp := v_row.current_xp + v_xp_earned;
  v_new_total_xp := v_row.total_xp_earned + v_xp_earned;
  v_next_level_xp := (v_new_level + 1) * 200;

  WHILE v_new_current_xp >= v_next_level_xp LOOP
    v_new_current_xp := v_new_current_xp - v_next_level_xp;
    v_new_level := v_new_level + 1;
    v_next_level_xp := (v_new_level + 1) * 200;
  END LOOP;

  -- 7. Daily goal bonus (100 XP when goal is exactly reached)
  IF v_new_sessions_today = v_row.daily_goal THEN
    v_just_reached_goal := true;
    v_bonus_xp := 100;
    v_new_total_xp := v_new_total_xp + v_bonus_xp;
    v_new_current_xp := v_new_current_xp + v_bonus_xp;

    -- Re-run level-up loop for bonus XP
    WHILE v_new_current_xp >= v_next_level_xp LOOP
      v_new_current_xp := v_new_current_xp - v_next_level_xp;
      v_new_level := v_new_level + 1;
      v_next_level_xp := (v_new_level + 1) * 200;
    END LOOP;
  END IF;

  -- 8. Badge checks
  v_unlocked_badges := COALESCE(v_row.unlocked_badges, '{}');
  v_hour := EXTRACT(HOUR FROM NOW());
  v_dow := EXTRACT(DOW FROM NOW()); -- 0 = Sunday, 6 = Saturday

  -- b1: First Session (always unlock on any completion)
  IF NOT ('b1' = ANY(v_unlocked_badges)) THEN
    v_unlocked_badges := array_append(v_unlocked_badges, 'b1');
  END IF;
  -- b2: On Fire (5-day streak)
  IF v_new_streak >= 5 AND NOT ('b2' = ANY(v_unlocked_badges)) THEN
    v_unlocked_badges := array_append(v_unlocked_badges, 'b2');
  END IF;
  -- b4: Night Owl (study after 10pm)
  IF v_hour >= 22 AND NOT ('b4' = ANY(v_unlocked_badges)) THEN
    v_unlocked_badges := array_append(v_unlocked_badges, 'b4');
  END IF;
  -- b6: Big Brain (Level 10)
  IF v_new_level >= 10 AND NOT ('b6' = ANY(v_unlocked_badges)) THEN
    v_unlocked_badges := array_append(v_unlocked_badges, 'b6');
  END IF;
  -- b7: Weekend Warrior (Saturday=6 or Sunday=0)
  IF v_dow IN (0, 6) AND NOT ('b7' = ANY(v_unlocked_badges)) THEN
    v_unlocked_badges := array_append(v_unlocked_badges, 'b7');
  END IF;
  -- b8: Super Star (5000 total XP)
  IF v_new_total_xp >= 5000 AND NOT ('b8' = ANY(v_unlocked_badges)) THEN
    v_unlocked_badges := array_append(v_unlocked_badges, 'b8');
  END IF;
  -- b9: Zen Master (45 min session)
  IF p_minutes >= 45 AND NOT ('b9' = ANY(v_unlocked_badges)) THEN
    v_unlocked_badges := array_append(v_unlocked_badges, 'b9');
  END IF;

  -- 9. Write updates
  UPDATE public.user_progress SET
    level = v_new_level,
    current_xp = v_new_current_xp,
    total_xp_earned = v_new_total_xp,
    streak_days = v_new_streak,
    last_active_date = NOW(),
    sessions_done_today = v_new_sessions_today,
    minutes_today = v_new_minutes_today,
    unlocked_badges = v_unlocked_badges
  WHERE id = v_user_id;

  -- 10. Insert XP history entries
  INSERT INTO public.xp_history (user_id, label, xp_amount)
  VALUES (v_user_id, 'Focus Session (' || p_minutes || ' min)', v_xp_earned);

  IF v_just_reached_goal THEN
    INSERT INTO public.xp_history (user_id, label, xp_amount)
    VALUES (v_user_id, 'Daily Goal Bonus', 100);
  END IF;

  -- 11. Return the result so the client can update its UI
  RETURN jsonb_build_object(
    'level', v_new_level,
    'current_xp', v_new_current_xp,
    'total_xp_earned', v_new_total_xp,
    'next_level_xp', v_next_level_xp,
    'streak_days', v_new_streak,
    'sessions_done_today', v_new_sessions_today,
    'minutes_today', v_new_minutes_today,
    'xp_earned', v_xp_earned,
    'bonus_xp', v_bonus_xp,
    'unlocked_badges', to_jsonb(v_unlocked_badges),
    'daily_goal', v_row.daily_goal
  );
END;
$$;
