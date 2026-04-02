import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Palette, Spacing, Radius } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Mock Data ───────────────────────────────────────────────────────────────
const USER_DATA = {
  name: 'Ky',
  level: 3,
  currentXP: 350,
  nextLevelXP: 500,
  streakDays: 5,
  sessionsDoneToday: 2,
  minutesToday: 50,
  dailyGoal: 3,
  sessionType: '25 min',
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function XPProgressBar({ current, max }: { current: number; max: number }) {
  const progress = current / max;
  const animWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animWidth, {
      toValue: progress,
      tension: 40,
      friction: 8,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <View style={styles.xpBarTrack}>
      <Animated.View
        style={[
          styles.xpBarFill,
          {
            width: animWidth.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </View>
  );
}

function GoalProgressDots({
  done,
  total,
}: {
  done: number;
  total: number;
}) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i < done ? styles.dotFilled : styles.dotEmpty,
          ]}
        />
      ))}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function HomeScreen({
  onStartSession,
}: {
  onStartSession?: () => void;
}) {
  const buttonScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      tension: 200,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const xpPercent = Math.round(
    (USER_DATA.currentXP / USER_DATA.nextLevelXP) * 100
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Palette.bg} />

      {/* Header gradient */}
      <LinearGradient
        colors={[Palette.primaryDark, Palette.bg]}
        style={styles.headerGradient}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Greeting ── */}
        <View style={styles.greeting}>
          <Text style={styles.greetingLabel}>Good morning,</Text>
          <Text style={styles.greetingName}>{USER_DATA.name} 👋</Text>
        </View>

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* 1. START FOCUS SESSION BUTTON                                      */}
        {/* ────────────────────────────────────────────────────────────────── */}
        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity
            activeOpacity={1}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={onStartSession}
            accessibilityRole="button"
            accessibilityLabel="Start Focus Session"
          >
            <LinearGradient
              colors={[Palette.primary, '#A855F7', Palette.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.startButton}
            >
              <Text style={styles.startButtonEmoji}>🎯</Text>
              <Text style={styles.startButtonLabel}>Start Focus Session</Text>
              <View style={styles.sessionBadge}>
                <Text style={styles.sessionBadgeText}>
                  {USER_DATA.sessionType}
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* 2. XP + LEVEL CARD                                                 */}
        {/* ────────────────────────────────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.xpHeader}>
            <View>
              <Text style={styles.cardLabel}>Experience Points</Text>
              <Text style={styles.xpValue}>
                {USER_DATA.currentXP}{' '}
                <Text style={styles.xpMax}>/ {USER_DATA.nextLevelXP} XP</Text>
              </Text>
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeLabel}>LVL</Text>
              <Text style={styles.levelBadgeValue}>{USER_DATA.level}</Text>
            </View>
          </View>
          <XPProgressBar
            current={USER_DATA.currentXP}
            max={USER_DATA.nextLevelXP}
          />
          <Text style={styles.xpHint}>
            {USER_DATA.nextLevelXP - USER_DATA.currentXP} XP to Level{' '}
            {USER_DATA.level + 1} ✨
          </Text>
        </View>

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* STREAK + TODAY ROW                                                 */}
        {/* ────────────────────────────────────────────────────────────────── */}
        <View style={styles.row}>
          {/* 3. STREAK COUNTER */}
          <LinearGradient
            colors={['#1E1520', '#2A1A1A']}
            style={[styles.card, styles.halfCard]}
          >
            <Text style={styles.cardLabel}>Current Streak</Text>
            <View style={styles.streakRow}>
              <Text style={styles.fireIcon}>🔥</Text>
              <Text style={styles.streakNumber}>{USER_DATA.streakDays}</Text>
            </View>
            <Text style={styles.streakSub}>day streak</Text>
            <Text style={styles.streakMessage}>Keep it up! 💪</Text>
          </LinearGradient>

          {/* 4. TODAY'S PROGRESS */}
          <View style={[styles.card, styles.halfCard]}>
            <Text style={styles.cardLabel}>Today</Text>
            <Text style={styles.todaySessionsNum}>
              {USER_DATA.sessionsDoneToday}
            </Text>
            <Text style={styles.todaySub}>sessions</Text>
            <View style={styles.todayMinutesRow}>
              <Text style={styles.todayMinutesIcon}>⏱</Text>
              <Text style={styles.todayMinutes}>
                {USER_DATA.minutesToday} min
              </Text>
            </View>
          </View>
        </View>

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* 5. DAILY GOAL CARD                                                 */}
        {/* ────────────────────────────────────────────────────────────────── */}
        <LinearGradient
          colors={['#0D2018', '#0F2820']}
          style={styles.card}
        >
          <View style={styles.goalHeader}>
            <View>
              <Text style={styles.cardLabel}>Daily Goal</Text>
              <Text style={styles.goalTitle}>
                Complete {USER_DATA.dailyGoal} sessions today
              </Text>
            </View>
            <View style={styles.goalCountBadge}>
              <Text style={styles.goalCountText}>
                {USER_DATA.sessionsDoneToday}/{USER_DATA.dailyGoal}
              </Text>
            </View>
          </View>

          <GoalProgressDots
            done={USER_DATA.sessionsDoneToday}
            total={USER_DATA.dailyGoal}
          />

          <View style={styles.goalFooter}>
            <Text style={styles.goalBonusText}>
              🎁 Bonus XP on completion!
            </Text>
            {USER_DATA.sessionsDoneToday >= USER_DATA.dailyGoal ? (
              <Text style={styles.goalCompleted}>✅ Goal Reached!</Text>
            ) : (
              <Text style={styles.goalRemaining}>
                {USER_DATA.dailyGoal - USER_DATA.sessionsDoneToday} session
                {USER_DATA.dailyGoal - USER_DATA.sessionsDoneToday !== 1
                  ? 's'
                  : ''}{' '}
                left
              </Text>
            )}
          </View>
        </LinearGradient>

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

  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 320,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingTop: 64,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },

  // ── Greeting ──
  greeting: {
    marginBottom: Spacing.xs,
  },
  greetingLabel: {
    fontSize: 14,
    color: Palette.textSecondary,
    letterSpacing: 0.5,
  },
  greetingName: {
    fontSize: 28,
    fontWeight: '700',
    color: Palette.textPrimary,
    letterSpacing: -0.5,
  },

  // ── Start Button ──
  startButton: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    shadowColor: Palette.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 16,
    minHeight: 160,
  },
  startButtonEmoji: {
    fontSize: 40,
  },
  startButtonLabel: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  sessionBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  sessionBadgeText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
    letterSpacing: 0.5,
  },

  // ── Card ──
  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Palette.border,
    gap: Spacing.sm,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Palette.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },

  // ── XP Card ──
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  xpValue: {
    fontSize: 28,
    fontWeight: '800',
    color: Palette.textPrimary,
    marginTop: 2,
  },
  xpMax: {
    fontSize: 18,
    fontWeight: '500',
    color: Palette.textSecondary,
  },
  levelBadge: {
    backgroundColor: Palette.primaryDark,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.primary,
    minWidth: 60,
  },
  levelBadgeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Palette.primary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  levelBadgeValue: {
    fontSize: 22,
    fontWeight: '900',
    color: Palette.accentGlow,
    lineHeight: 26,
  },
  xpBarTrack: {
    height: 8,
    backgroundColor: Palette.surfaceAlt,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    borderRadius: Radius.full,
    backgroundColor: Palette.primary,
    shadowColor: Palette.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  xpHint: {
    fontSize: 12,
    color: Palette.textSecondary,
    textAlign: 'right',
  },

  // ── Row layout ──
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfCard: {
    flex: 1,
  },

  // ── Streak Card ──
  streakRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.xs,
    marginTop: 2,
  },
  fireIcon: {
    fontSize: 28,
  },
  streakNumber: {
    fontSize: 38,
    fontWeight: '900',
    color: Palette.fire,
    lineHeight: 44,
  },
  streakSub: {
    fontSize: 12,
    color: Palette.textSecondary,
    marginTop: -4,
  },
  streakMessage: {
    fontSize: 12,
    color: Palette.fireGlow,
    fontWeight: '600',
    marginTop: 4,
  },

  // ── Today Card ──
  todaySessionsNum: {
    fontSize: 38,
    fontWeight: '900',
    color: Palette.success,
    lineHeight: 44,
    marginTop: 2,
  },
  todaySub: {
    fontSize: 12,
    color: Palette.textSecondary,
    marginTop: -4,
  },
  todayMinutesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  todayMinutesIcon: {
    fontSize: 14,
  },
  todayMinutes: {
    fontSize: 13,
    color: Palette.textPrimary,
    fontWeight: '600',
  },

  // ── Daily Goal Card ──
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  goalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.textPrimary,
    marginTop: 4,
    maxWidth: SCREEN_WIDTH * 0.55,
  },
  goalCountBadge: {
    backgroundColor: Palette.success + '22',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Palette.success + '55',
  },
  goalCountText: {
    fontSize: 18,
    fontWeight: '800',
    color: Palette.success,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
  },
  dotFilled: {
    backgroundColor: Palette.success,
    shadowColor: Palette.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    elevation: 6,
  },
  dotEmpty: {
    backgroundColor: Palette.surfaceAlt,
    borderWidth: 2,
    borderColor: Palette.border,
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalBonusText: {
    fontSize: 12,
    color: Palette.accent,
    fontWeight: '600',
  },
  goalRemaining: {
    fontSize: 12,
    color: Palette.textSecondary,
  },
  goalCompleted: {
    fontSize: 12,
    color: Palette.success,
    fontWeight: '700',
  },
});
