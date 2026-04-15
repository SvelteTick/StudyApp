import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Palette, Spacing, Radius } from '@/constants/theme';
import { useFriends, type Friend, type FriendRequest } from '@/hooks/useFriends';

// ─── Friend Card ──────────────────────────────────────────────────────────────
function FriendCard({ friend, onRemove }: { friend: Friend; onRemove: () => void }) {
  return (
    <View style={styles.friendCard}>
      <View style={styles.friendAvatarWrap}>
        <Text style={styles.friendAvatarText}>{friend.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName} numberOfLines={1}>{friend.name}</Text>
        <View style={styles.friendMeta}>
          <Text style={styles.metaChip}>⚡ Lvl {friend.level}</Text>
          <Text style={styles.metaChip}>{friend.totalXP.toLocaleString()} XP</Text>
          {friend.streakDays > 0 && (
            <Text style={styles.metaChip}>🔥 {friend.streakDays}d</Text>
          )}
        </View>
      </View>
      <TouchableOpacity
        style={styles.removeBtn}
        onPress={() =>
          Alert.alert('Remove Friend', `Remove ${friend.name} from friends?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: onRemove },
          ])
        }
      >
        <Text style={styles.removeBtnText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Request Card ─────────────────────────────────────────────────────────────
function RequestCard({
  req,
  onAccept,
  onReject,
}: {
  req: FriendRequest;
  onAccept: () => void;
  onReject: () => void;
}) {
  return (
    <View style={styles.requestCard}>
      <View style={styles.friendAvatarWrap}>
        <Text style={styles.friendAvatarText}>{req.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName} numberOfLines={1}>{req.name}</Text>
        <Text style={styles.requestTag}>
          {req.direction === 'incoming' ? '📨 Incoming request' : '⏳ Request sent'}
        </Text>
      </View>
      {req.direction === 'incoming' && (
        <View style={styles.requestActions}>
          <TouchableOpacity style={styles.acceptBtn} onPress={onAccept}>
            <Text style={styles.acceptBtnText}>✓</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rejectBtn} onPress={onReject}>
            <Text style={styles.rejectBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Search Result Row ────────────────────────────────────────────────────────
function SearchResult({
  user,
  onAdd,
}: {
  user: { id: string; full_name: string };
  onAdd: () => void;
}) {
  return (
    <View style={styles.searchResultRow}>
      <View style={styles.friendAvatarWrapSm}>
        <Text style={styles.friendAvatarTextSm}>{user.full_name.charAt(0).toUpperCase()}</Text>
      </View>
      <Text style={styles.searchResultName} numberOfLines={1}>{user.full_name}</Text>
      <TouchableOpacity style={styles.addBtn} onPress={onAdd}>
        <Text style={styles.addBtnText}>+ Add</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
interface Props {
  currentUserId: string;
}

export default function FriendsScreen({ currentUserId }: Props) {
  const {
    friends,
    requests,
    loading,
    error,
    refresh,
    searchUser,
    sendRequest,
    acceptRequest,
    rejectRequest,
    removeFriend,
  } = useFriends(currentUserId);

  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; full_name: string }[]>([]);
  const [searching, setSearching] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (text.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const results = await searchUser(text);
    setSearchResults(results);
    setSearching(false);
  };

  const handleAdd = async (userId: string) => {
    try {
      await sendRequest(userId);
      setSearchResults([]);
      setQuery('');
      Alert.alert('Request Sent! 🎉', 'Friend request sent successfully.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const incomingRequests = requests.filter((r) => r.direction === 'incoming');
  const outgoingRequests = requests.filter((r) => r.direction === 'outgoing');

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Palette.bg} />

      <LinearGradient
        colors={[Palette.success + '33', Palette.bg]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.4 }}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Palette.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.titleSmall}>Study</Text>
          <Text style={styles.title}>Friends 👥</Text>
          <Text style={styles.subtitle}>{friends.length} friend{friends.length !== 1 ? 's' : ''} connected</Text>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name to add a friend…"
            placeholderTextColor={Palette.textMuted}
            value={query}
            onChangeText={handleSearch}
            autoCorrect={false}
          />
          {searching && <ActivityIndicator size="small" color={Palette.primary} style={{ marginLeft: 8 }} />}
        </View>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <View style={styles.card}>
            {searchResults.map((u, idx) => (
              <View key={u.id}>
                <SearchResult user={u} onAdd={() => handleAdd(u.id)} />
                {idx < searchResults.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        )}

        {loading && !refreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Palette.primary} />
          </View>
        ) : (
          <>
            {/* Incoming Requests */}
            {incomingRequests.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>📨 Friend Requests</Text>
                <View style={styles.card}>
                  {incomingRequests.map((req, idx) => (
                    <View key={req.friendshipId}>
                      <RequestCard
                        req={req}
                        onAccept={() => acceptRequest(req.friendshipId)}
                        onReject={() => rejectRequest(req.friendshipId)}
                      />
                      {idx < incomingRequests.length - 1 && <View style={styles.divider} />}
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Outgoing Requests */}
            {outgoingRequests.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>⏳ Pending</Text>
                <View style={styles.card}>
                  {outgoingRequests.map((req, idx) => (
                    <View key={req.friendshipId}>
                      <RequestCard req={req} onAccept={() => {}} onReject={() => {}} />
                      {idx < outgoingRequests.length - 1 && <View style={styles.divider} />}
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Friends List */}
            <Text style={styles.sectionTitle}>✅ My Friends</Text>
            {friends.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyEmoji}>🤝</Text>
                <Text style={styles.emptyTitle}>No friends yet</Text>
                <Text style={styles.emptySubtitle}>Search for a friend by name above to get started!</Text>
              </View>
            ) : (
              <View style={styles.card}>
                {friends.map((f, idx) => (
                  <View key={f.friendshipId}>
                    <FriendCard friend={f} onRemove={() => removeFriend(f.friendshipId)} />
                    {idx < friends.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.bg },
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: 64,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },

  header: { gap: 2 },
  titleSmall: { fontSize: 14, color: Palette.textSecondary, fontWeight: '500', letterSpacing: 0.5 },
  title: { fontSize: 30, fontWeight: '900', color: Palette.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: Palette.textMuted, marginTop: 2 },

  sectionTitle: { fontSize: 15, fontWeight: '800', color: Palette.textSecondary, letterSpacing: 0.3 },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Palette.border,
    paddingHorizontal: Spacing.md,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: Palette.textPrimary,
  },

  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    overflow: 'hidden',
  },
  divider: { height: 1, backgroundColor: Palette.border, marginLeft: Spacing.md },

  // Friend Card
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  friendAvatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendAvatarText: { fontSize: 18, fontWeight: '800', color: '#fff' },
  friendInfo: { flex: 1 },
  friendName: { fontSize: 15, fontWeight: '700', color: Palette.textPrimary },
  friendMeta: { flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  metaChip: { fontSize: 11, color: Palette.textSecondary, fontWeight: '600' },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Palette.danger + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: { color: Palette.danger, fontSize: 12, fontWeight: '800' },

  // Request Card
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  requestTag: { fontSize: 12, color: Palette.textMuted, marginTop: 2 },
  requestActions: { flexDirection: 'row', gap: 6 },
  acceptBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Palette.success + '33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtnText: { color: Palette.success, fontWeight: '800', fontSize: 14 },
  rejectBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Palette.danger + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtnText: { color: Palette.danger, fontWeight: '800', fontSize: 13 },

  // Search results
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  friendAvatarWrapSm: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Palette.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendAvatarTextSm: { fontSize: 14, fontWeight: '800', color: Palette.textPrimary },
  searchResultName: { flex: 1, fontSize: 14, fontWeight: '600', color: Palette.textPrimary },
  addBtn: {
    backgroundColor: Palette.primary,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // States
  loadingBox: { paddingVertical: Spacing.xxl, alignItems: 'center' },
  emptyBox: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: Palette.textPrimary },
  emptySubtitle: { fontSize: 13, color: Palette.textMuted, textAlign: 'center' },
});
