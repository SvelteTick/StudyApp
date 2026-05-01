import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Friend {
  friendshipId: string;
  userId: string;
  name: string;
  avatarUrl?: string;
  level: number;
  totalXP: number;
  streakDays: number;
  status: 'accepted';
}

export interface FriendRequest {
  friendshipId: string;
  userId: string;
  name: string;
  avatarUrl?: string;
  direction: 'incoming' | 'outgoing';
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useFriends(currentUserId: string) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFriends = useCallback(async () => {
    if (!currentUserId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('friendships')
        .select(`
          id,
          sender_id,
          receiver_id,
          status,
          sender:profiles!friendships_sender_id_fkey (full_name, avatar_url),
          receiver:profiles!friendships_receiver_id_fkey (full_name, avatar_url)
        `)
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);

      if (fetchError) throw fetchError;

      const accepted: Friend[] = [];
      const pending: FriendRequest[] = [];

      for (const row of (data || []) as any[]) {
        const isSender = row.sender_id === currentUserId;
        const otherId = isSender ? row.receiver_id : row.sender_id;
        const otherProfile = isSender ? row.receiver : row.sender;

        if (row.status === 'accepted') {
          // Fetch their progress stats
          const { data: prog } = await supabase
            .from('user_progress')
            .select('level, total_xp_earned, streak_days')
            .eq('id', otherId)
            .single();

          accepted.push({
            friendshipId: row.id,
            userId: otherId,
            name: otherProfile?.full_name || 'Anonymous',
            avatarUrl: otherProfile?.avatar_url,
            level: prog?.level ?? 1,
            totalXP: prog?.total_xp_earned ?? 0,
            streakDays: prog?.streak_days ?? 0,
            status: 'accepted',
          });
        } else if (row.status === 'pending') {
          pending.push({
            friendshipId: row.id,
            userId: otherId,
            name: otherProfile?.full_name || 'Anonymous',
            avatarUrl: otherProfile?.avatar_url,
            direction: isSender ? 'outgoing' : 'incoming',
          });
        }
      }

      setFriends(accepted);
      setRequests(pending);
    } catch (e: any) {
      setError(e.message || 'Failed to load friends');
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  // Search for a user by username to send a friend request
  const searchUser = useCallback(async (query: string) => {
    if (!query.trim()) return [];
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .ilike('full_name', `%${query}%`)
      .neq('id', currentUserId)
      .limit(10);
      
    if (error) {
      console.error('Error searching users:', error);
    }
    
    return (data || []) as { id: string; full_name: string; avatar_url?: string }[];
  }, [currentUserId]);

  const sendRequest = useCallback(async (receiverId: string) => {
    const { error } = await supabase
      .from('friendships')
      .insert({ sender_id: currentUserId, receiver_id: receiverId });
    if (error) throw new Error(error.message);
    await fetchFriends();
  }, [currentUserId, fetchFriends]);

  const acceptRequest = useCallback(async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', friendshipId);
    if (error) throw new Error(error.message);
    await fetchFriends();
  }, [fetchFriends]);

  const rejectRequest = useCallback(async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', friendshipId);
    if (error) throw new Error(error.message);
    await fetchFriends();
  }, [fetchFriends]);

  const removeFriend = useCallback(async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);
    if (error) throw new Error(error.message);
    await fetchFriends();
  }, [fetchFriends]);

  return {
    friends,
    requests,
    loading,
    error,
    refresh: fetchFriends,
    searchUser,
    sendRequest,
    acceptRequest,
    rejectRequest,
    removeFriend,
  };
}
