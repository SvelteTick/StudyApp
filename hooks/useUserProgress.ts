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
        .select('*')
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
          return {
            ...prev,
            progress: {
              ...prev.progress,
              level: progressRow.level,
              currentXP: progressRow.current_xp,
              nextLevelXP: xpForLevel(progressRow.level + 1),
              totalXPEarned: progressRow.total_xp_earned,
              streakDays: progressRow.streak_days,
              sessionsDoneToday: progressRow.sessions_done_today,
              minutesToday: progressRow.minutes_today,
              dailyGoal: progressRow.daily_goal,
              preferredSessionType: progressRow.preferred_session_type,
              badges: updatedBadges,
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
  const completeSession = useCallback(async (minutesSpent: number, xpEarned: number) => {
    setUserData((prev) => {
      const newEntry: XPEntry = {
        id: `local_x_${Date.now()}`, // Temporary local ID
        label: `Focus Session (${minutesSpent} min)`,
        xp: xpEarned,
        time: 'Just now',
        timestamp: Date.now(),
      };

      // --- Streak Calculation Logic ---
      const now = new Date();
      const lastActive = new Date(prev.progress.lastActiveDate);
      const todayString = now.toDateString();
      const lastActiveString = lastActive.toDateString();
      
      let newStreak = prev.progress.streakDays;
      let newSessionsDoneToday = prev.progress.sessionsDoneToday + 1;
      let newMinutesToday = prev.progress.minutesToday + minutesSpent;

      if (todayString !== lastActiveString) {
        // It's a new day! Reset daily stats.
        newSessionsDoneToday = 1;
        newMinutesToday = minutesSpent;

        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        
        if (lastActiveString === yesterday.toDateString()) {
          newStreak += 1;
        } else {
          newStreak = 1;
        }
      } else if (newStreak === 0) {
        newStreak = 1; // If it's 0 currently, starting a session makes it 1
      }

      let updatedProgress = addXPToProgress(
        {
          ...prev.progress,
          streakDays: newStreak,
          lastActiveDate: now.toISOString(),
          sessionsDoneToday: newSessionsDoneToday,
          minutesToday: newMinutesToday,
          xpHistory: [newEntry, ...prev.progress.xpHistory].slice(0, 6),
        },
        xpEarned
      );

      // ─── Daily Goal Bonus ───
      // Only reward the 100 XP exactly when they hit the goal for the day
      const justReachedGoal = updatedProgress.sessionsDoneToday === updatedProgress.dailyGoal;
      if (justReachedGoal) {
        updatedProgress = addXPToProgress(updatedProgress, 100);
        const bonusEntry: XPEntry = {
          id: `local_bonus_${Date.now()}`,
          label: 'Daily Goal Bonus',
          xp: 100,
          time: 'Just now',
          timestamp: Date.now() + 1,
        };
        updatedProgress.xpHistory = [bonusEntry, ...updatedProgress.xpHistory].slice(0, 6);
      }

      // ─── Badge Checks ───
      let updatedBadges = [...updatedProgress.badges];
      let newlyUnlockedIds: string[] = [];

      const checkUnlock = (id: string, condition: boolean) => {
        const idx = updatedBadges.findIndex((b) => b.id === id);
        if (idx !== -1 && !updatedBadges[idx].unlocked && condition) {
          updatedBadges[idx] = { ...updatedBadges[idx], unlocked: true };
          newlyUnlockedIds.push(id);
        }
      };

      checkUnlock('b1', true); // First Session
      checkUnlock('b2', newStreak >= 5); // 5-day streak
      checkUnlock('b4', now.getHours() >= 22); // Night Owl (>= 10pm)
      checkUnlock('b6', updatedProgress.level >= 10); // Big Brain (Level 10)
      checkUnlock('b7', now.getDay() === 0 || now.getDay() === 6); // Weekend Warrior (Saturday or Sunday)
      checkUnlock('b8', updatedProgress.totalXPEarned >= 5000); // Super Star
      checkUnlock('b9', minutesSpent >= 45); // Zen Master

      let unlockedIds = updatedBadges.filter(b => b.unlocked).map(b => b.id);

      // FIRE & FORGET Network Sync
      (async () => {
        // Upload histories
        const promises = [
          supabase.from('xp_history').insert({ user_id: prev.profile.id, label: `Focus Session (${minutesSpent} min)`, xp_amount: xpEarned })
        ];
        if (justReachedGoal) {
          promises.push(supabase.from('xp_history').insert({ user_id: prev.profile.id, label: 'Daily Goal Bonus', xp_amount: 100 }));
        }
        await Promise.all(promises);

        // Update progress profile
        await supabase.from('user_progress').update({
          level: updatedProgress.level,
          current_xp: updatedProgress.currentXP,
          total_xp_earned: updatedProgress.totalXPEarned,
          streak_days: newStreak,
          last_active_date: updatedProgress.lastActiveDate,
          sessions_done_today: updatedProgress.sessionsDoneToday,
          minutes_today: updatedProgress.minutesToday,
          unlocked_badges: unlockedIds,
        }).eq('id', prev.profile.id);
      })();

      return {
        ...prev,
        progress: {
          ...updatedProgress,
          badges: updatedBadges,
        },
      };
    });
  }, []);

  /** Update user profile fields */
  const updateProfile = useCallback(async (patch: Partial<UserProfile>) => {
    setUserData((prev) => {
      // Background network sync
      if (patch.name || patch.avatarUrl) {
        supabase.from('profiles').update({
          full_name: patch.name || prev.profile.name,
          avatar_url: patch.avatarUrl || prev.profile.avatarUrl
        }).eq('id', prev.profile.id).then();
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
