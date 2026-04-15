import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  avatarUrl?: string;
  level: number;
  totalXP: number;
  streakDays: number;
  isCurrentUser: boolean;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useLeaderboard(currentUserId: string) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Join user_progress with profiles to get names + avatars
      const { data, error: fetchError } = await supabase
        .from('user_progress')
        .select(`
          id,
          level,
          total_xp_earned,
          streak_days,
          profiles (
            full_name,
            avatar_url
          )
        `)
        .order('total_xp_earned', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;

      const entries: LeaderboardEntry[] = (data || []).map((row: any, idx: number) => ({
        id: row.id,
        rank: idx + 1,
        name: row.profiles?.full_name || 'Anonymous',
        avatarUrl: row.profiles?.avatar_url,
        level: row.level,
        totalXP: row.total_xp_earned,
        streakDays: row.streak_days,
        isCurrentUser: row.id === currentUserId,
      }));

      setLeaderboard(entries);
    } catch (e: any) {
      setError(e.message || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (currentUserId) fetchLeaderboard();
  }, [currentUserId, fetchLeaderboard]);

  return { leaderboard, loading, error, refresh: fetchLeaderboard };
}
