import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  Dimensions,
  Modal,
  AppState,
  BackHandler,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Palette, Spacing, Radius } from '@/constants/theme';
import { useKeepAwake } from 'expo-keep-awake';
import { Audio } from 'expo-av';

const { width: SW } = Dimensions.get('window');
const CIRCLE_SIZE = SW * 0.72;
const SESSION_OPTIONS = [
  { label: '15 min', seconds: 15 * 2 },
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
  onRunningChange,
}: {
  onSessionComplete?: (minutesSpent: number, xpEarned: number) => void;
  onRunningChange?: (isRunning: boolean) => void;
}) {
  useKeepAwake();
  
  const [selectedIdx, setSelectedIdx] = useState(1); // default 25 min
  const [timeLeft, setTimeLeft] = useState(SESSION_OPTIONS[1].seconds);
  const [totalTime, setTotalTime] = useState(SESSION_OPTIONS[1].seconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showQuitWarning, setShowQuitWarning] = useState(false);
  const [showFocusBroken, setShowFocusBroken] = useState(false);

  const appState = useRef(AppState.currentState);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Audio setup
  useEffect(() => {
    let isMounted = true;
    async function loadAudio() {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
        });

        const savedMute = await AsyncStorage.getItem('@studyapp_is_muted');
        const initialMute = savedMute === 'true';
        if (isMounted && initialMute) setIsMuted(true);

        const { sound } = await Audio.Sound.createAsync(
          require('../assets/Music/Main track feep focus 1.mp3'),
          { shouldPlay: false, isLooping: true, isMuted: initialMute }
        );
        if (isMounted) {
          soundRef.current = sound;
          if (isRunning) sound.playAsync();
        } else {
          sound.unloadAsync();
        }
      } catch (e) {
        console.warn('Failed to load audio', e);
      }
    }
    loadAudio();

    return () => {
      isMounted = false;
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      AsyncStorage.setItem('@studyapp_is_muted', String(next)).catch(() => {});
      if (soundRef.current) {
        soundRef.current.setIsMutedAsync(next);
      }
      return next;
    });
  };

  // Play / Pause music based on state
  useEffect(() => {
    if (isRunning) {
      soundRef.current?.playAsync();
    } else {
      soundRef.current?.pauseAsync();
    }
  }, [isRunning]);

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
        setTimeLeft((t) => (t > 0 ? t - 1 : 0));
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  // Completion effect
  useEffect(() => {
    if (isRunning && timeLeft === 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsRunning(false);
      setIsComplete(true);
      const mins = Math.round(totalTime / 60);
      onSessionComplete?.(mins, mins * 2);
    }
  }, [timeLeft, isRunning, totalTime, onSessionComplete]);

  // ─── Deep Focus Enforcements ───

  // 1. Notify Parent of Running State (To Hide Tab Bar)
  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  // 2. Back Button Intercept (Android)
  useEffect(() => {
    const onBackPress = () => {
      if (isRunning) {
        setShowQuitWarning(true);
        return true; 
      }
      return false;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [isRunning]);

  // 3. AppState focus trap
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        isRunning &&
        appState.current.match(/active/) &&
        nextAppState.match(/inactive|background/)
      ) {
        setIsRunning(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
        setTimeLeft(SESSION_OPTIONS[selectedIdx].seconds);
        setIsComplete(false);
        setShowFocusBroken(true);
      }
      appState.current = nextAppState;
    });
    return () => subscription.remove();
  }, [isRunning, selectedIdx]);

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
    if (isRunning) {
      setShowQuitWarning(true);
      return;
    }
    setIsRunning(true);
  };

  const confirmQuit = () => {
    setShowQuitWarning(false);
    setIsRunning(false);
    setTimeLeft(SESSION_OPTIONS[selectedIdx].seconds);
    setIsComplete(false);
  };

  const cancelQuit = () => {
    setShowQuitWarning(false);
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
                {isComplete ? 'New Session' : isRunning ? 'Give Up 🏳️' : 'Start Focus'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Mute toggle */}
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={toggleMute}
            accessibilityRole="button"
            accessibilityLabel={isMuted ? "Unmute music" : "Mute music"}
          >
            <Text style={styles.secondaryBtnText}>{isMuted ? '🔇' : '🔊'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Quit Warning Modal ── */}
      <Modal visible={showQuitWarning} transparent animationType="fade">
        <View style={styles.modalOverlay}>
           <View style={styles.modalContent}>
             <Text style={styles.modalSadEmoji}>🥺</Text>
             <Text style={styles.modalTitle}>Give Up?</Text>
             <Text style={styles.modalBody}>
               Are you sure you want to stop? You will lose everything you've worked for this session!
             </Text>
             <View style={styles.modalBtns}>
               <TouchableOpacity style={[styles.modalBtn, styles.modalBtnPrimary]} onPress={cancelQuit}>
                 <Text style={styles.modalBtnPrimaryText}>Keep Going!</Text>
               </TouchableOpacity>
               <TouchableOpacity style={styles.modalBtn} onPress={confirmQuit}>
                 <Text style={styles.modalBtnDestructiveText}>Yes, Quit</Text>
               </TouchableOpacity>
             </View>
           </View>
        </View>
      </Modal>

      {/* ── Focus Broken Modal ── */}
      <Modal visible={showFocusBroken} transparent animationType="fade">
        <View style={styles.modalOverlay}>
           <View style={styles.modalContent}>
             <Text style={styles.modalSadEmoji}>💔</Text>
             <Text style={styles.modalTitle}>Focus Broken!</Text>
             <Text style={styles.modalBody}>
               You left the app while a timer was running. Your session has been destroyed. Stay focused next time!
             </Text>
             <TouchableOpacity style={[styles.modalBtn, styles.modalBtnPrimary]} onPress={() => setShowFocusBroken(false)}>
               <Text style={styles.modalBtnPrimaryText}>I understand</Text>
             </TouchableOpacity>
           </View>
        </View>
      </Modal>
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
  
  // ── Modals ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    backgroundColor: Palette.surface,
    padding: Spacing.xl,
    borderRadius: Radius.xl,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: Palette.border,
  },
  modalSadEmoji: {
    fontSize: 55,
    marginBottom: Spacing.sm,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Palette.textPrimary,
    marginBottom: Spacing.sm,
  },
  modalBody: {
    fontSize: 15,
    color: Palette.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  modalBtns: {
    width: '100%',
    gap: Spacing.sm,
  },
  modalBtn: {
    width: '100%',
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  modalBtnPrimary: {
    backgroundColor: Palette.primary,
  },
  modalBtnPrimaryText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 16,
  },
  modalBtnDestructiveText: {
    color: Palette.fire,
    fontWeight: '700',
    fontSize: 16,
  },
});
