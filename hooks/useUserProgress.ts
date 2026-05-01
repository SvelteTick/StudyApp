import { useState, useCallback, useEffect } from 'react';

// ─── Data Types (Backend-Ready) ───────────────────────────────────────────────

export interface Badge {
  id: string;
  emoji: string;
  name: string;
  desc: string;
  unlocked: boolean;
}

export interface XPEntry {
  id: string;
  label: string;
  xp: number;
  time: string;
  timestamp: number; // unix ms – for backend sorting
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt: string; // ISO date string
  optOutLeaderboard: boolean;
  optOutFriendRequests: boolean;
}

export interface UserProgress {
  level: number;
  currentXP: number;
  nextLevelXP: number;
  totalXPEarned: number;
  streakDays: number;
  lastActiveDate: string; // ISO date string
  sessionsDoneToday: number;
  minutesToday: number;
  dailyGoal: number;
  preferredSessionType: string;
  badges: Badge[];
  xpHistory: XPEntry[];
}

/** Full user object sent to / received from the backend */
export interface UserData {
  profile: UserProfile;
  progress: UserProgress;
}

// ─── XP Calculation Helpers ───────────────────────────────────────────────────

function xpForLevel(level: number): number {
  // Simple quadratic curve: each level requires 200 * level XP
  return level * 200;
}

function addXPToProgress(progress: UserProgress, xpGained: number): UserProgress {
  let { currentXP, level, totalXPEarned } = progress;
  let newXP = currentXP + xpGained;
  let nextLevelXP = xpForLevel(level + 1);

  // Level-up loop
  while (newXP >= nextLevelXP) {
    newXP -= nextLevelXP;
    level += 1;
    nextLevelXP = xpForLevel(level + 1);
  }

  return {
    ...progress,
    currentXP: newXP,
    level,
    nextLevelXP: xpForLevel(level + 1),
    totalXPEarned: totalXPEarned + xpGained,
  };
}

// ─── Default Data ─────────────────────────────────────────────────────────────

const DEFAULT_BADGES: Badge[] = [
  { id: 'b1', emoji: '🏆', name: 'First Session', desc: 'Complete your first focus session', unlocked: false },
  { id: 'b2', emoji: '🔥', name: 'On Fire', desc: '5-day streak achieved', unlocked: false },
  { id: 'b3', emoji: '⚡', name: 'Speed Learner', desc: '10 sessions in one week', unlocked: false },
  { id: 'b4', emoji: '🌙', name: 'Night Owl', desc: 'Study after 10pm', unlocked: false },
  { id: 'b5', emoji: '🎯', name: 'Goal Crusher', desc: 'Hit daily goal 7 days in a row', unlocked: false },
  { id: 'b6', emoji: '🧠', name: 'Big Brain', desc: 'Reach Level 10', unlocked: false },
  { id: 'b7', emoji: '🚀', name: 'Weekend Warrior', desc: 'Study on a Saturday or Sunday', unlocked: false },
  { id: 'b8', emoji: '🌟', name: 'Super Star', desc: 'Earn 5,000 Total XP', unlocked: false },
  { id: 'b9', emoji: '🧘', name: 'Zen Master', desc: 'Complete a 45 min focus session', unlocked: false },
];

const DEFAULT_XP_HISTORY: XPEntry[] = [

];

export function createDefaultUserData(id: string, name: string, email: string): UserData {
  return {
    profile: {
      id,
      name,
      email,
      createdAt: new Date().toISOString(),
      optOutLeaderboard: false,
      optOutFriendRequests: false,
    },
    progress: {
      level: 1,
      currentXP: 0,
      nextLevelXP: xpForLevel(2),
      totalXPEarned: 0,
      streakDays: 0,
      lastActiveDate: new Date().toISOString(),
      sessionsDoneToday: 0,
      minutesToday: 0,
      dailyGoal: 3,
      preferredSessionType: '25 min',
      badges: DEFAULT_BADGES,
      xpHistory: DEFAULT_XP_HISTORY,
    },
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

import { supabase } from '../lib/supabase';

export function useUserProgress(initialData: UserData) {
  const [userData, setUserData] = useState<UserData>(initialData);

  // Load progress from Supabase on mount
  useEffect(() => {
    async function fetchProgress() {
      if (!initialData.profile.id) return;
      const { data: progressRow, error } = await supabase
        .from('user_progress')
        .select('*, profiles(*)')
        .eq('id', initialData.profile.id)
        .single();
      
      if (!progressRow && error?.code === 'PGRST116') {
        // PGRST116 means zero rows returned (missing account stats row)
        // This fixes older accounts that were created before the SQL trigger existed!
        await supabase.from('user_progress').insert({ id: initialData.profile.id });
      } else if (progressRow && !error) {
        setUserData(prev => {
          let updatedBadges = DEFAULT_BADGES.map(b => ({
            ...b,
            unlocked: b.unlocked || (progressRow.unlocked_badges || []).includes(b.id)
          }));

          const now = new Date();
          const lastActiveDateInDB = progressRow.last_active_date ? new Date(progressRow.last_active_date) : now;
          const isNewDay = now.toDateString() !== lastActiveDateInDB.toDateString();

          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          const isStreakBroken = isNewDay && lastActiveDateInDB.toDateString() !== yesterday.toDateString();

          const displayedSessionsToday = isNewDay ? 0 : progressRow.sessions_done_today;
          const displayedMinutesToday = isNewDay ? 0 : progressRow.minutes_today;
          const displayedStreak = isStreakBroken ? 0 : progressRow.streak_days;

          return {
            ...prev,
            profile: {
              ...prev.profile,
              optOutLeaderboard: progressRow.profiles?.opt_out_leaderboard ?? prev.profile.optOutLeaderboard,
              optOutFriendRequests: progressRow.profiles?.opt_out_friend_requests ?? prev.profile.optOutFriendRequests,
              name: progressRow.profiles?.full_name ?? prev.profile.name,
              avatarUrl: progressRow.profiles?.avatar_url ?? prev.profile.avatarUrl,
            },
            progress: {
              ...prev.progress,
              level: progressRow.level,
              currentXP: progressRow.current_xp,
              nextLevelXP: xpForLevel(progressRow.level + 1),
              totalXPEarned: progressRow.total_xp_earned,
              streakDays: displayedStreak,
              sessionsDoneToday: displayedSessionsToday,
              minutesToday: displayedMinutesToday,
              dailyGoal: progressRow.daily_goal,
              preferredSessionType: progressRow.preferred_session_type,
              badges: updatedBadges,
              lastActiveDate: progressRow.last_active_date || new Date().toISOString(),
            }
          };
        });
      }

      // Fetch recent XP history
      const { data: historyData } = await supabase
        .from('xp_history')
        .select('*')
        .eq('user_id', initialData.profile.id)
        .order('created_at', { ascending: false })
        .limit(6);

      if (historyData) {
        setUserData(prev => ({
          ...prev,
          progress: {
            ...prev.progress,
            xpHistory: historyData.map(h => ({
              id: h.id,
              label: h.label,
              xp: h.xp_amount,
              time: new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              timestamp: new Date(h.created_at).getTime(),
            }))
          }
        }));
      }
    }
    fetchProgress();
  }, [initialData.profile.id]);

  /** Call this when a focus session completes */
  const completeSession = useCallback(async (minutesSpent: number) => {
    // 1. Call the secure server-side RPC (server calculates XP, not the client)
    const { data: result, error: rpcError } = await supabase.rpc('complete_session', {
      p_minutes: minutesSpent,
    });

    if (rpcError) {
      console.error('Session RPC failed:', rpcError.message);
      return;
    }

    // 2. Update local state from the server's authoritative response
    setUserData((prev) => {
      const xpEarned = result.xp_earned as number;
      const bonusXp = result.bonus_xp as number;
      const serverBadgeIds: string[] = result.unlocked_badges || [];

      // Build XP history entries for the UI
      const newEntry: XPEntry = {
        id: `rpc_x_${Date.now()}`,
        label: `Focus Session (${minutesSpent} min)`,
        xp: xpEarned,
        time: 'Just now',
        timestamp: Date.now(),
      };

      let newHistory = [newEntry, ...prev.progress.xpHistory].slice(0, 6);

      if (bonusXp > 0) {
        const bonusEntry: XPEntry = {
          id: `rpc_bonus_${Date.now()}`,
          label: 'Daily Goal Bonus',
          xp: bonusXp,
          time: 'Just now',
          timestamp: Date.now() + 1,
        };
        newHistory = [bonusEntry, ...newHistory].slice(0, 6);
      }

      // Map badge IDs from server to our local badge objects
      const updatedBadges = prev.progress.badges.map(b => ({
        ...b,
        unlocked: b.unlocked || serverBadgeIds.includes(b.id),
      }));

      return {
        ...prev,
        progress: {
          ...prev.progress,
          level: result.level,
          currentXP: result.current_xp,
          nextLevelXP: result.next_level_xp,
          totalXPEarned: result.total_xp_earned,
          streakDays: result.streak_days,
          sessionsDoneToday: result.sessions_done_today,
          minutesToday: result.minutes_today,
          dailyGoal: result.daily_goal,
          lastActiveDate: new Date().toISOString(),
          xpHistory: newHistory,
          badges: updatedBadges,
        },
      };
    });
  }, []);

  /** Update user profile fields */
  const updateProfile = useCallback(async (patch: Partial<UserProfile>) => {
    setUserData((prev) => {
      // Background network sync
      const dbPayload: any = {};
      if (patch.name !== undefined) dbPayload.full_name = patch.name;
      if (patch.avatarUrl !== undefined) dbPayload.avatar_url = patch.avatarUrl;
      if (patch.optOutLeaderboard !== undefined) dbPayload.opt_out_leaderboard = patch.optOutLeaderboard;
      if (patch.optOutFriendRequests !== undefined) dbPayload.opt_out_friend_requests = patch.optOutFriendRequests;
      
      if (Object.keys(dbPayload).length > 0) {
        supabase.from('profiles').update(dbPayload).eq('id', prev.profile.id).then();
      }
      return { ...prev, profile: { ...prev.profile, ...patch } };
    });
  }, []);

  /** Update daily goal */
  const setDailyGoal = useCallback(async (goal: number) => {
    setUserData((prev) => {
      supabase.from('user_progress').update({ daily_goal: goal }).eq('id', prev.profile.id).then();
      return { ...prev, progress: { ...prev.progress, dailyGoal: goal } };
    });
  }, []);

  /** Set preferred session type shown on the home button badge */
  const setPreferredSessionType = useCallback(async (type: string) => {
    setUserData((prev) => {
      supabase.from('user_progress').update({ preferred_session_type: type }).eq('id', prev.profile.id).then();
      return { ...prev, progress: { ...prev.progress, preferredSessionType: type } };
    });
  }, []);

  return {
    userData,
    profile: userData.profile,
    progress: userData.progress,
    completeSession,
    updateProfile,
    setDailyGoal,
    setPreferredSessionType,
  };
}
