import { useState, useCallback } from 'react';

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
  { id: 'b1', emoji: '🏆', name: 'First Session', desc: 'Complete your first focus session', unlocked: true },
  { id: 'b2', emoji: '🔥', name: 'On Fire', desc: '5-day streak achieved', unlocked: true },
  { id: 'b3', emoji: '⚡', name: 'Speed Learner', desc: '10 sessions in one week', unlocked: true },
  { id: 'b4', emoji: '🌙', name: 'Night Owl', desc: 'Study after 10pm', unlocked: true },
  { id: 'b5', emoji: '🎯', name: 'Goal Crusher', desc: 'Hit daily goal 7 days in a row', unlocked: true },
  { id: 'b6', emoji: '🧠', name: 'Big Brain', desc: 'Reach Level 10', unlocked: true },
];

const DEFAULT_XP_HISTORY: XPEntry[] = [

];

export function createDefaultUserData(name: string, email: string): UserData {
  return {
    profile: {
      id: `user_${Date.now()}`,
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

export function useUserProgress(initialData: UserData) {
  const [userData, setUserData] = useState<UserData>(initialData);

  /** Call this when a focus session completes */
  const completeSession = useCallback((minutesSpent: number, xpEarned: number) => {
    setUserData((prev) => {
      const newEntry: XPEntry = {
        id: `x_${Date.now()}`,
        label: `Focus Session (${minutesSpent} min)`,
        xp: xpEarned,
        time: 'Just now',
        timestamp: Date.now(),
      };

      const updatedProgress = addXPToProgress(
        {
          ...prev.progress,
          sessionsDoneToday: prev.progress.sessionsDoneToday + 1,
          minutesToday: prev.progress.minutesToday + minutesSpent,
          xpHistory: [newEntry, ...prev.progress.xpHistory].slice(0, 6),
        },
        xpEarned
      );

      // Check daily goal badge
      const goalReached = updatedProgress.sessionsDoneToday >= updatedProgress.dailyGoal;
      let updatedBadges = updatedProgress.badges;
      if (goalReached) {
        updatedBadges = updatedBadges.map((b) =>
          b.id === 'b1' ? { ...b, unlocked: true } : b
        );
        // Bonus XP for hitting daily goal
        const withGoalBonus = addXPToProgress(updatedProgress, 100);
        const bonusEntry: XPEntry = {
          id: `x_bonus_${Date.now()}`,
          label: 'Daily Goal Bonus',
          xp: 100,
          time: 'Just now',
          timestamp: Date.now() + 1,
        };
        return {
          ...prev,
          progress: {
            ...withGoalBonus,
            badges: updatedBadges,
            xpHistory: [bonusEntry, ...withGoalBonus.xpHistory].slice(0, 6),
          },
        };
      }

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
  const updateProfile = useCallback((patch: Partial<UserProfile>) => {
    setUserData((prev) => ({
      ...prev,
      profile: { ...prev.profile, ...patch },
    }));
  }, []);

  /** Update daily goal */
  const setDailyGoal = useCallback((goal: number) => {
    setUserData((prev) => ({
      ...prev,
      progress: { ...prev.progress, dailyGoal: goal },
    }));
  }, []);

  /** Set preferred session type shown on the home button badge */
  const setPreferredSessionType = useCallback((type: string) => {
    setUserData((prev) => ({
      ...prev,
      progress: { ...prev.progress, preferredSessionType: type },
    }));
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
