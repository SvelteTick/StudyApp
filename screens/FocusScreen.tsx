import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Palette, Spacing, Radius } from '@/constants/theme';

const { width: SW } = Dimensions.get('window');
const CIRCLE_SIZE = SW * 0.72;
const SESSION_OPTIONS = [
  { label: '15 min', seconds: 15 * 60 },
  { label: '25 min', seconds: 25 * 60 },
  { label: '45 min', seconds: 45 * 60 },
];

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${pad(m)}:${pad(s)}`;
}

// Circular progress ring (SVG-free, using border trick)
function ProgressRing({
  progress,
  children,
}: {
  progress: number; // 0 → 1
  children: React.ReactNode;
}) {
  // Simple animated border approach
  const ringAnim = useRef(new Animated.Value(progress)).current;

  useEffect(() => {
    Animated.timing(ringAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <View style={ring.outer}>
      {/* Track ring */}
      <View style={ring.track} />
      {/* Filled ring via gradient overlay */}
      <LinearGradient
        colors={[Palette.primary, '#A855F7', Palette.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          ring.fill,
          // Clip the visible arc using opacity based on progress
          { opacity: Math.max(progress, 0.15) },
        ]}
      />
      {/* Inner white circle to create ring effect */}
      <View style={ring.inner}>{children}</View>
    </View>
  );
}

const ring = StyleSheet.create({
  outer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 8,
    borderColor: Palette.surfaceAlt,
  },
  fill: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 8,
    borderColor: 'transparent',
    // React Native doesn't support border gradients natively,
    // so we use a glow shadow effect instead
    shadowColor: Palette.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 16,
  },
  inner: {
    width: CIRCLE_SIZE - 32,
    height: CIRCLE_SIZE - 32,
    borderRadius: (CIRCLE_SIZE - 32) / 2,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function FocusScreen({
  onSessionComplete,
}: {
  onSessionComplete?: (xpEarned: number) => void;
}) {
  const [selectedIdx, setSelectedIdx] = useState(1); // default 25 min
  const [timeLeft, setTimeLeft] = useState(SESSION_OPTIONS[1].seconds);
  const [totalTime, setTotalTime] = useState(SESSION_OPTIONS[1].seconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation when running
  useEffect(() => {
    if (isRunning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.04,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      Animated.spring(pulseAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  }, [isRunning]);

  // Countdown ticker
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(intervalRef.current!);
            setIsRunning(false);
            setIsComplete(true);
            onSessionComplete?.(50);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const selectSession = useCallback(
    (idx: number) => {
      if (isRunning) return;
      setSelectedIdx(idx);
      setTimeLeft(SESSION_OPTIONS[idx].seconds);
      setTotalTime(SESSION_OPTIONS[idx].seconds);
      setIsComplete(false);
    },
    [isRunning]
  );

  const handleStartPause = () => {
    if (isComplete) {
      // Reset
      setTimeLeft(SESSION_OPTIONS[selectedIdx].seconds);
      setTotalTime(SESSION_OPTIONS[selectedIdx].seconds);
      setIsComplete(false);
      return;
    }
    setIsRunning((r) => !r);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsComplete(false);
    setTimeLeft(SESSION_OPTIONS[selectedIdx].seconds);
  };

  const progress = 1 - timeLeft / totalTime;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Palette.bg} />

      <LinearGradient
        colors={[Palette.primaryDark + 'AA', Palette.bg]}
        style={styles.bgGradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.6 }}
      />

      <View style={styles.container}>
        {/* Title */}
        <Text style={styles.title}>Focus Mode</Text>
        <Text style={styles.subtitle}>
          {isComplete
            ? '🎉 Session complete!'
            : isRunning
              ? '🔒 Stay focused...'
              : 'Choose your session'}
        </Text>

        {/* Session Type Selector */}
        <View style={styles.selectorRow}>
          {SESSION_OPTIONS.map((opt, idx) => (
            <TouchableOpacity
              key={opt.label}
              onPress={() => selectSession(idx)}
              style={[
                styles.selectorChip,
                idx === selectedIdx && styles.selectorChipActive,
              ]}
              disabled={isRunning}
              accessibilityRole="button"
              accessibilityLabel={`Select ${opt.label} session`}
            >
              <Text
                style={[
                  styles.selectorChipText,
                  idx === selectedIdx && styles.selectorChipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Timer Ring */}
        <Animated.View
          style={[
            styles.ringWrapper,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <ProgressRing progress={progress}>
            <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
            <Text style={styles.timerLabel}>
              {isComplete ? 'Done! ✅' : isRunning ? 'remaining' : 'ready'}
            </Text>
          </ProgressRing>
        </Animated.View>

        {/* XP Reward label */}
        <View style={styles.xpRewardBadge}>
          <Text style={styles.xpRewardText}>
            +{SESSION_OPTIONS[selectedIdx].seconds / 60 * 2} XP on completion ⚡
          </Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          {/* Reset */}
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={handleReset}
            accessibilityRole="button"
            accessibilityLabel="Reset timer"
          >
            <Text style={styles.secondaryBtnText}>↺</Text>
          </TouchableOpacity>

          {/* Start / Pause */}
          <TouchableOpacity
            onPress={handleStartPause}
            accessibilityRole="button"
            accessibilityLabel={
              isComplete ? 'Start new session' : isRunning ? 'Pause' : 'Start'
            }
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={
                isComplete
                  ? [Palette.success, Palette.successDark]
                  : isRunning
                    ? [Palette.accent, Palette.accentDark]
                    : [Palette.primary, Palette.primaryMid]
              }
              style={styles.mainBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.mainBtnText}>
                {isComplete ? 'New Session' : isRunning ? 'Pause' : 'Start'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Spacer for symmetry */}
          <View style={styles.secondaryBtn} />
        </View>
      </View>
    </View>
  );
}

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
    height: 400,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Palette.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Palette.textSecondary,
    fontWeight: '500',
    marginTop: -Spacing.sm,
  },

  // Session selector
  selectorRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Palette.surface,
    borderRadius: Radius.full,
    padding: 4,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  selectorChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
  },
  selectorChipActive: {
    backgroundColor: Palette.primary,
    shadowColor: Palette.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  selectorChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  selectorChipTextActive: {
    color: '#FFFFFF',
  },

  // Timer ring
  ringWrapper: {
    shadowColor: Palette.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
  },
  timerText: {
    fontSize: 52,
    fontWeight: '900',
    color: Palette.textPrimary,
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  timerLabel: {
    fontSize: 13,
    color: Palette.textSecondary,
    fontWeight: '500',
    marginTop: 4,
  },

  // XP badge
  xpRewardBadge: {
    backgroundColor: Palette.accent + '22',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Palette.accent + '55',
  },
  xpRewardText: {
    fontSize: 13,
    color: Palette.accent,
    fontWeight: '700',
  },

  // Controls
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  mainBtn: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.xl + 8,
    paddingVertical: Spacing.md,
    shadowColor: Palette.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  mainBtnText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Palette.border,
  },
  secondaryBtnText: {
    fontSize: 22,
    color: Palette.textSecondary,
  },
});
