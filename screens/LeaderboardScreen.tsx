import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Palette, Spacing, Radius } from '@/constants/theme';
import { useLeaderboard, type LeaderboardEntry } from '@/hooks/useLeaderboard';

// ─── Rank Medal ───────────────────────────────────────────────────────────────
function rankMedal(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}

// ─── Leaderboard Row ──────────────────────────────────────────────────────────
function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  const isTop3 = entry.rank <= 3;

  return (
    <View style={[styles.row, entry.isCurrentUser && styles.rowHighlight]}>
      {/* Rank */}
      <View style={styles.rankCell}>
        {isTop3 ? (
          <Text style={styles.rankMedal}>{rankMedal(entry.rank)}</Text>
        ) : (
          <Text style={[styles.rankText, entry.isCurrentUser && styles.rankTextHighlight]}>
            #{entry.rank}
          </Text>
        )}
      </View>

      {/* Avatar */}
      <View style={[styles.avatar, entry.isCurrentUser && styles.avatarHighlight]}>
        <Text style={styles.avatarText}>
          {entry.name.charAt(0).toUpperCase()}
        </Text>
      </View>

      {/* Info */}
      <View style={styles.infoCell}>
        <Text style={[styles.rowName, entry.isCurrentUser && styles.rowNameHighlight]} numberOfLines={1}>
          {entry.name} {entry.isCurrentUser ? '(You)' : ''}
        </Text>
        <View style={styles.rowMeta}>
          <Text style={styles.rowMetaText}>Lvl {entry.level}</Text>
          {entry.streakDays > 0 && (
            <Text style={styles.rowMetaText}>🔥 {entry.streakDays}d</Text>
          )}
        </View>
      </View>

      {/* XP */}
      <Text style={[styles.xpText, entry.isCurrentUser && styles.xpTextHighlight]}>
        {entry.totalXP.toLocaleString()} XP
      </Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
interface Props {
  currentUserId: string;
}

export default function LeaderboardScreen({ currentUserId }: Props) {
  const { leaderboard, loading, error, refresh } = useLeaderboard(currentUserId);
  const [refreshing, setRefreshing] = useState(false);

  const currentUserEntry = leaderboard.find((e) => e.isCurrentUser);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Palette.bg} />

      {/* Background */}
      <LinearGradient
        colors={[Palette.primaryDark + '66', Palette.bg]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.4 }}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Palette.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.titleSmall}>Global</Text>
          <Text style={styles.title}>Leaderboard 🏆</Text>
          <Text style={styles.subtitle}>Top learners ranked by XP earned</Text>
        </View>

        {/* Your rank banner (if not visible in top list) */}
        {currentUserEntry && currentUserEntry.rank > 10 && (
          <LinearGradient
            colors={[Palette.primaryDark, Palette.primary + '88']}
            style={styles.yourRankBanner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View>
              <Text style={styles.yourRankLabel}>Your Rank</Text>
              <Text style={styles.yourRankValue}>#{currentUserEntry.rank}</Text>
            </View>
            <View style={styles.yourRankRight}>
              <Text style={styles.yourRankXP}>{currentUserEntry.totalXP.toLocaleString()} XP</Text>
              <Text style={styles.yourRankLevel}>Level {currentUserEntry.level}</Text>
            </View>
          </LinearGradient>
        )}

        {/* List */}
        {loading && !refreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Palette.primary} />
            <Text style={styles.loadingText}>Loading rankings…</Text>
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorEmoji}>😕</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={refresh}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : leaderboard.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>🌱</Text>
            <Text style={styles.emptyTitle}>No data yet!</Text>
            <Text style={styles.emptySubtitle}>Complete a focus session to appear on the leaderboard.</Text>
          </View>
        ) : (
          <View style={styles.listCard}>
            {leaderboard.map((entry, idx) => (
              <View key={entry.id}>
                <LeaderboardRow entry={entry} />
                {idx < leaderboard.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
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

  // Header
  header: { gap: 2 },
  titleSmall: { fontSize: 14, color: Palette.textSecondary, fontWeight: '500', letterSpacing: 0.5 },
  title: { fontSize: 30, fontWeight: '900', color: Palette.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: Palette.textMuted, marginTop: 2 },

  // Your rank banner
  yourRankBanner: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  yourRankLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  yourRankValue: { fontSize: 28, fontWeight: '900', color: '#fff' },
  yourRankRight: { alignItems: 'flex-end' },
  yourRankXP: { fontSize: 16, fontWeight: '800', color: Palette.accentGlow },
  yourRankLevel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  // List
  listCard: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  rowHighlight: {
    backgroundColor: Palette.primary + '18',
  },
  divider: { height: 1, backgroundColor: Palette.border, marginLeft: Spacing.md },

  // Rank cell
  rankCell: { width: 36, alignItems: 'center' },
  rankMedal: { fontSize: 22 },
  rankText: { fontSize: 13, fontWeight: '700', color: Palette.textMuted },
  rankTextHighlight: { color: Palette.primary },

  // Avatar
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Palette.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Palette.border,
  },
  avatarHighlight: { borderColor: Palette.primary },
  avatarText: { fontSize: 16, fontWeight: '800', color: Palette.textPrimary },

  // Info
  infoCell: { flex: 1 },
  rowName: { fontSize: 14, fontWeight: '700', color: Palette.textPrimary },
  rowNameHighlight: { color: Palette.primary },
  rowMeta: { flexDirection: 'row', gap: Spacing.sm, marginTop: 2 },
  rowMetaText: { fontSize: 11, color: Palette.textMuted, fontWeight: '500' },

  // XP
  xpText: { fontSize: 13, fontWeight: '800', color: Palette.accent, textAlign: 'right' },
  xpTextHighlight: { color: Palette.primary },

  // States
  loadingBox: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.md },
  loadingText: { color: Palette.textMuted, fontSize: 14 },
  errorBox: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.md },
  errorEmoji: { fontSize: 40 },
  errorText: { color: Palette.danger, fontSize: 14, textAlign: 'center' },
  retryBtn: {
    backgroundColor: Palette.primary,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  emptyBox: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: Palette.textPrimary },
  emptySubtitle: { fontSize: 13, color: Palette.textMuted, textAlign: 'center' },
});
