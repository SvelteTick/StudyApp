import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Palette, Spacing, Radius } from '@/constants/theme';

// ─── Mock Rewards Data ────────────────────────────────────────────────────────
const BADGES = [
  { id: 'b1', emoji: '🏆', name: 'First Session', desc: 'Complete your first focus session', unlocked: true },
  { id: 'b2', emoji: '🔥', name: 'On Fire',        desc: '5-day streak achieved',             unlocked: true },
  { id: 'b3', emoji: '⚡', name: 'Speed Learner',  desc: '10 sessions in one week',           unlocked: false },
  { id: 'b4', emoji: '🌙', name: 'Night Owl',      desc: 'Study after 10pm',                  unlocked: false },
  { id: 'b5', emoji: '🎯', name: 'Goal Crusher',   desc: 'Hit daily goal 7 days in a row',    unlocked: false },
  { id: 'b6', emoji: '🧠', name: 'Big Brain',      desc: 'Reach Level 10',                    unlocked: false },
];

const RECENT_XP = [
  { id: 'x1', label: 'Focus Session (25 min)', xp: 50,  time: '2h ago' },
  { id: 'x2', label: 'Daily Goal Bonus',        xp: 100, time: '3h ago' },
  { id: 'x3', label: 'Focus Session (15 min)', xp: 30,  time: 'Yesterday' },
  { id: 'x4', label: '5-Day Streak Bonus',      xp: 75,  time: 'Yesterday' },
];

// ─── Animated Badge ───────────────────────────────────────────────────────────
function BadgeCard({ badge, delay }: { badge: (typeof BADGES)[0]; delay: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.badgeCard,
        !badge.unlocked && styles.badgeLocked,
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
      ]}
    >
      <LinearGradient
        colors={
          badge.unlocked
            ? [Palette.primaryDark, Palette.surfaceAlt]
            : [Palette.surface, Palette.surface]
        }
        style={styles.badgeInner}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={[styles.badgeEmoji, !badge.unlocked && styles.badgeEmojiLocked]}>
          {badge.unlocked ? badge.emoji : '🔒'}
        </Text>
        <Text style={[styles.badgeName, !badge.unlocked && styles.badgeTextLocked]}>
          {badge.name}
        </Text>
        <Text style={[styles.badgeDesc, !badge.unlocked && styles.badgeTextLocked]}>
          {badge.desc}
        </Text>
        {badge.unlocked && (
          <View style={styles.unlockedBadge}>
            <Text style={styles.unlockedBadgeText}>✓ Unlocked</Text>
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
}

// ─── XP History Row ───────────────────────────────────────────────────────────
function XPRow({ item }: { item: (typeof RECENT_XP)[0] }) {
  return (
    <View style={styles.xpRow}>
      <View style={styles.xpRowLeft}>
        <View style={styles.xpDot} />
        <View>
          <Text style={styles.xpRowLabel}>{item.label}</Text>
          <Text style={styles.xpRowTime}>{item.time}</Text>
        </View>
      </View>
      <Text style={styles.xpRowAmount}>+{item.xp} XP</Text>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function RewardScreen() {
  const totalXP = RECENT_XP.reduce((sum, r) => sum + r.xp, 0);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Palette.bg} />

      <LinearGradient
        colors={[Palette.accentDark + '55', Palette.bg]}
        style={styles.bgGradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.5 }}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.titleSmall}>Your</Text>
          <Text style={styles.title}>Rewards 🏆</Text>
          <Text style={styles.subtitle}>Every session earns you XP</Text>
        </View>

        {/* ── Total XP Banner ── */}
        <LinearGradient
          colors={[Palette.accent + 'CC', Palette.accentDark]}
          style={styles.xpBanner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View>
            <Text style={styles.xpBannerLabel}>Total XP Earned</Text>
            <Text style={styles.xpBannerValue}>350 XP</Text>
          </View>
          <View style={styles.xpBannerRight}>
            <Text style={styles.xpBannerEmoji}>⚡</Text>
            <Text style={styles.xpBannerLevel}>Level 3</Text>
          </View>
        </LinearGradient>

        {/* ── Badges Section ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏅 Badges</Text>
          <Text style={styles.sectionSub}>
            {BADGES.filter((b) => b.unlocked).length} / {BADGES.length} unlocked
          </Text>
        </View>

        <View style={styles.badgeGrid}>
          {BADGES.map((badge, idx) => (
            <BadgeCard key={badge.id} badge={badge} delay={idx * 80} />
          ))}
        </View>

        {/* ── XP History ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Recent XP</Text>
        </View>

        <View style={styles.card}>
          {RECENT_XP.map((item, idx) => (
            <React.Fragment key={item.id}>
              <XPRow item={item} />
              {idx < RECENT_XP.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        {/* Bottom spacer */}
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.bg,
  },
  bgGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: 64,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },

  // Header
  header: { gap: 2 },
  titleSmall: {
    fontSize: 14,
    color: Palette.textSecondary,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: Palette.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: Palette.textMuted,
    marginTop: 2,
  },

  // XP Banner
  xpBanner: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: Palette.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  xpBannerLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  xpBannerValue: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
    marginTop: 2,
  },
  xpBannerRight: {
    alignItems: 'center',
  },
  xpBannerEmoji: {
    fontSize: 36,
  },
  xpBannerLevel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '700',
  },

  // Section header
  section: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Palette.textPrimary,
  },
  sectionSub: {
    fontSize: 12,
    color: Palette.textMuted,
  },

  // Badge grid
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  badgeCard: {
    width: '47.5%',
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Palette.primary + '55',
  },
  badgeLocked: {
    borderColor: Palette.border,
  },
  badgeInner: {
    padding: Spacing.md,
    gap: 4,
    minHeight: 130,
  },
  badgeEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  badgeEmojiLocked: {
    opacity: 0.4,
  },
  badgeName: {
    fontSize: 13,
    fontWeight: '800',
    color: Palette.textPrimary,
  },
  badgeDesc: {
    fontSize: 11,
    color: Palette.textSecondary,
    lineHeight: 16,
  },
  badgeTextLocked: {
    color: Palette.textMuted,
  },
  unlockedBadge: {
    marginTop: 6,
    backgroundColor: Palette.success + '33',
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  unlockedBadgeText: {
    fontSize: 10,
    color: Palette.success,
    fontWeight: '700',
  },

  // Card
  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Palette.border,
  },

  // XP History rows
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  xpRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  xpDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Palette.accent,
    shadowColor: Palette.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  xpRowLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.textPrimary,
  },
  xpRowTime: {
    fontSize: 11,
    color: Palette.textMuted,
    marginTop: 2,
  },
  xpRowAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: Palette.accent,
  },
  divider: {
    height: 1,
    backgroundColor: Palette.border,
    marginLeft: 26,
  },
});
