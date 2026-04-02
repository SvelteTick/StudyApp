import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Palette, Spacing, Radius } from '@/constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Floating particle component ──────────────────────────────────────────────
function FloatingParticle({ delay, x, size }: { delay: number; x: number; size: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: 3000 + Math.random() * 2000,
          useNativeDriver: false,
        }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: `${x}%` as any,
        bottom: anim.interpolate({ inputRange: [0, 1], outputRange: [-20, SCREEN_HEIGHT * 0.7] }),
        opacity: anim.interpolate({ inputRange: [0, 0.1, 0.8, 1], outputRange: [0, 0.6, 0.4, 0] }),
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: Palette.primary,
      }}
    />
  );
}

// ─── Input field ──────────────────────────────────────────────────────────────
function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: 'email-address' | 'default';
  autoCapitalize?: 'none' | 'words';
}) {
  const [focused, setFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    setFocused(true);
    Animated.spring(borderAnim, { toValue: 1, tension: 120, friction: 8, useNativeDriver: false }).start();
  };
  const handleBlur = () => {
    setFocused(false);
    Animated.spring(borderAnim, { toValue: 0, tension: 120, friction: 8, useNativeDriver: false }).start();
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Palette.border, Palette.primary],
  });

  return (
    <View style={input.wrapper}>
      <Text style={input.label}>{label}</Text>
      <Animated.View style={[input.container, { borderColor }]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Palette.textMuted}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? 'none'}
          autoCorrect={false}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={input.field}
        />
      </Animated.View>
    </View>
  );
}

const input = StyleSheet.create({
  wrapper: { gap: 6 },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.textSecondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  container: {
    borderWidth: 1.5,
    borderRadius: Radius.md,
    backgroundColor: Palette.surface,
    overflow: 'hidden',
  },
  field: {
    height: 52,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
    color: Palette.textPrimary,
    fontWeight: '500',
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
interface Props {
  onLogin: (name: string, email: string, password: string) => Promise<void>;
  onSignup: (name: string, email: string, password: string) => Promise<void>;
}

export default function LoginScreen({ onLogin, onSignup }: Props) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Animation values
  const logoScale = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const formSlide = useRef(new Animated.Value(30)).current;
  const modeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(logoScale, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(contentFade, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(formSlide, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const switchMode = (next: 'login' | 'signup') => {
    setMode(next);
    setError('');
    Animated.spring(modeAnim, {
      toValue: next === 'signup' ? 1 : 0,
      tension: 120,
      friction: 8,
      useNativeDriver: false,
    }).start();
  };

  const handleSubmit = async () => {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (mode === 'signup' && !name.trim()) {
      setError('Please enter your name.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        await onLogin(email.split('@')[0], email, password);
      } else {
        await onSignup(name.trim(), email.trim(), password);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const tabIndicatorLeft = modeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['2%', '50%'],
  });

  const isLogin = mode === 'login';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Palette.bg} />

      {/* Background gradient */}
      <LinearGradient
        colors={[Palette.primaryDark, Palette.bg, Palette.bg]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.4, y: 0 }}
        end={{ x: 0.6, y: 0.55 }}
      />

      {/* Floating particles */}
      {[
        { delay: 0,    x: 10, size: 6  },
        { delay: 800,  x: 30, size: 4  },
        { delay: 400,  x: 55, size: 8  },
        { delay: 1200, x: 75, size: 5  },
        { delay: 200,  x: 90, size: 6  },
      ].map((p, i) => (
        <FloatingParticle key={i} {...p} />
      ))}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Logo + Hero ── */}
          <Animated.View style={[styles.hero, { transform: [{ scale: logoScale }] }]}>
            <LinearGradient
              colors={[Palette.primary, '#A855F7', Palette.primaryDark]}
              style={styles.logoCircle}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.logoEmoji}>🎯</Text>
            </LinearGradient>
            <Text style={styles.appName}>StudyQuest</Text>
            <Text style={styles.tagline}>Level up your learning journey</Text>
          </Animated.View>

          {/* ── Card ── */}
          <Animated.View
            style={[
              styles.card,
              {
                opacity: contentFade,
                transform: [{ translateY: formSlide }],
              },
            ]}
          >
            {/* Mode toggle tabs */}
            <View style={styles.tabBar}>
              <Animated.View style={[styles.tabIndicator, { left: tabIndicatorLeft }]} />
              <TouchableOpacity
                style={styles.tab}
                onPress={() => switchMode('login')}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.tab}
                onPress={() => switchMode('signup')}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>Create Account</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formBody}>
              {/* Name (signup only) */}
              {!isLogin && (
                <InputField
                  label="Your Name"
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Alex"
                  autoCapitalize="words"
                />
              )}

              <InputField
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
              />

              <InputField
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
              />

              {/* Error message */}
              {!!error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>⚠️ {error}</Text>
                </View>
              )}

              {/* Submit button */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.85}
                style={{ marginTop: Spacing.xs }}
              >
                <LinearGradient
                  colors={[Palette.primary, '#A855F7', Palette.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.submitBtn}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitBtnText}>
                      {isLogin ? 'Sign In  🚀' : 'Start Your Quest  ✨'}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Footer hint */}
              <Text style={styles.footerHint}>
                {isLogin
                  ? "Don't have an account? "
                  : 'Already have an account? '}
                <Text
                  style={styles.footerLink}
                  onPress={() => switchMode(isLogin ? 'signup' : 'login')}
                >
                  {isLogin ? 'Create one' : 'Sign in'}
                </Text>
              </Text>
            </View>
          </Animated.View>

          {/* XP teaser */}
          <Animated.View style={[styles.teaserRow, { opacity: contentFade }]}>
            {['🔥 Streaks', '⚡ XP & Levels', '🏆 Badges'].map((item) => (
              <View key={item} style={styles.teaserChip}>
                <Text style={styles.teaserChipText}>{item}</Text>
              </View>
            ))}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.bg,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xl,
    gap: Spacing.lg,
  },

  // Hero / Logo
  hero: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Palette.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 16,
    marginBottom: 4,
  },
  logoEmoji: { fontSize: 40 },
  appName: {
    fontSize: 34,
    fontWeight: '900',
    color: Palette.textPrimary,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 14,
    color: Palette.textSecondary,
    fontWeight: '500',
  },

  // Card
  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Palette.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },

  // Mode tabs
  tabBar: {
    flexDirection: 'row',
    padding: 6,
    backgroundColor: Palette.bg,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    top: 6,
    width: '48%',
    bottom: 6,
    backgroundColor: Palette.primaryDark,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.primary + '66',
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
    zIndex: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.textMuted,
  },
  tabTextActive: {
    color: Palette.textPrimary,
    fontWeight: '700',
  },

  // Form body
  formBody: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },

  // Error
  errorBox: {
    backgroundColor: Palette.danger + '22',
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Palette.danger + '55',
  },
  errorText: {
    fontSize: 13,
    color: Palette.danger,
    fontWeight: '500',
  },

  // Submit button
  submitBtn: {
    borderRadius: Radius.md,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Palette.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
  submitBtnText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  // Footer
  footerHint: {
    textAlign: 'center',
    fontSize: 13,
    color: Palette.textMuted,
  },
  footerLink: {
    color: Palette.primary,
    fontWeight: '700',
  },

  // XP Teaser chips
  teaserRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  teaserChip: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  teaserChipText: {
    fontSize: 12,
    color: Palette.textSecondary,
    fontWeight: '600',
  },
});
