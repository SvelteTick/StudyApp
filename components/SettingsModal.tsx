import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { IconSymbol } from './ui/icon-symbol';

// Using a slider package would be better, but we mock it for the placeholder
import { UserData } from '@/hooks/useUserProgress';
import { AVATARS } from '@/constants/avatars';
import UserAvatar from './UserAvatar';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  userData: UserData;
  onUpdateProfile: (patch: any) => Promise<void>;
  onUpdatePassword: (password: string) => Promise<void>;
  onLogout: () => Promise<void>;
  onDeleteAccount: () => Promise<void>;
}

export function SettingsModal({
  visible,
  onClose,
  userData,
  onUpdateProfile,
  onUpdatePassword,
  onLogout,
  onDeleteAccount,
}: SettingsModalProps) {
  // Local state for Profile
  const [name, setName] = useState(userData.profile.name || '');
  const [avatarId, setAvatarId] = useState(userData.profile.avatarUrl || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Local state for Preferences
  const [optOutLeaderboard, setOptOutLeaderboard] = useState(userData.profile.optOutLeaderboard || false);
  const [soundEffects, setSoundEffects] = useState(true); // Placeholder
  const [motivationalMessages, setMotivationalMessages] = useState(true); // Placeholder
  const [friendQuests, setFriendQuests] = useState(true); // Placeholder

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await onUpdateProfile({
        name,
        avatar_url: avatarId,
        optOutLeaderboard,
      });

      if (password.trim().length > 0) {
        await onUpdatePassword(password);
        setPassword('');
        Alert.alert('Success', 'Password updated successfully!');
      } else {
        Alert.alert('Success', 'Profile updated!');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLeaderboard = async (val: boolean) => {
    setOptOutLeaderboard(val);
    // Auto-save this preference so it feels responsive
    await onUpdateProfile({ optOutLeaderboard: val });
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you absolutely sure you want to permanently delete your account and all your progress? This cannot be undone!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await onDeleteAccount();
              // UI will automatically log out if successful
            } catch (e: any) {
              setLoading(false);
              Alert.alert('Error', e.message || 'Could not delete account.');
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.root} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <LinearGradient
          colors={[Palette.primaryDark, Palette.bg]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 0.3 }}
        />

        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          
          {/* ───────────────────────────────────────────────────────── */}
          {/* SECTION 1: PROFILE                                          */}
          {/* ───────────────────────────────────────────────────────── */}
          <Text style={styles.sectionTitle}>Profile Setup</Text>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Display Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Your display name"
                placeholderTextColor={Palette.textMuted}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Avatar</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.avatarRow}>
                {AVATARS.map((avatar) => {
                  const isSelected = avatarId === avatar.id;
                  return (
                    <TouchableOpacity 
                      key={avatar.id} 
                      style={[styles.avatarChoice, isSelected && styles.avatarChoiceSelected]}
                      onPress={() => setAvatarId(avatar.id)}
                    >
                      <UserAvatar avatarId={avatar.id} size="sm" />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <Text style={styles.helpText}>Pick your study buddy!</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Change Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="New password (leave blank to keep)"
                placeholderTextColor={Palette.textMuted}
                secureTextEntry
              />
            </View>

            <TouchableOpacity 
              style={styles.saveBtn} 
              onPress={handleSaveProfile}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Profile</Text>}
            </TouchableOpacity>
          </View>

          {/* ───────────────────────────────────────────────────────── */}
          {/* SECTION 2: PREFERENCES                                      */}
          {/* ───────────────────────────────────────────────────────── */}
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.card}>
            
            {/* Volume Picker (Placeholder UI) */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingName}>Sound Volume</Text>
                <Text style={styles.settingDesc}>Adjust the app sound effects level</Text>
              </View>
              <Text style={styles.placeholderLink}>Medium ▼</Text>
            </View>
            <View style={styles.divider} />

            {/* Sound FX */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingName}>Sound Effects</Text>
                <Text style={styles.settingDesc}>Play sounds completing sessions</Text>
              </View>
              <Switch value={soundEffects} onValueChange={setSoundEffects} trackColor={{ true: Palette.primary }} />
            </View>
            <View style={styles.divider} />

            {/* Motivational Messages (Push Notifs) */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingName}>Motivational Messages</Text>
                <Text style={styles.settingDesc}>Receive daily push notifications</Text>
              </View>
              <Switch value={motivationalMessages} onValueChange={setMotivationalMessages} trackColor={{ true: Palette.primary }} />
            </View>
            <View style={styles.divider} />

            {/* Friend Quests */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingName}>Friend Quests</Text>
                <Text style={styles.settingDesc}>Participate in weekly co-op quests</Text>
              </View>
              <Switch value={friendQuests} onValueChange={setFriendQuests} trackColor={{ true: Palette.primary }} />
            </View>
            <View style={styles.divider} />

            {/* Leaderboard Opt-out */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingName}>Hide from Leaderboard</Text>
                <Text style={styles.settingDesc}>Opt-out of public global rankings</Text>
              </View>
              <Switch value={optOutLeaderboard} onValueChange={handleToggleLeaderboard} trackColor={{ true: Palette.primary }} />
            </View>

          </View>

          {/* ───────────────────────────────────────────────────────── */}
          {/* SECTION 3: ACCOUNT ACTIONS                                  */}
          {/* ───────────────────────────────────────────────────────── */}
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={[styles.card, { padding: 0, overflow: 'hidden' }]}>
            
            <TouchableOpacity style={styles.actionBtn} onPress={onLogout}>
              <IconSymbol name="house.fill" size={20} color={Palette.textPrimary} /> 
              {/* Note: IconSymbol house.fill maps to home, but styling it for logout. We'll just use text. */}
              <Text style={styles.actionBtnText}>Sign Out</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.actionBtn} onPress={handleDeleteAccount}>
              <Text style={[styles.actionBtnText, { color: Palette.danger }]}>Delete Account</Text>
            </TouchableOpacity>

          </View>

          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Palette.textPrimary },
  closeBtnText: { fontSize: 16, fontWeight: '600', color: Palette.primary },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.md, gap: Spacing.lg },

  sectionTitle: { fontSize: 13, fontWeight: '700', color: Palette.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: -10, marginLeft: 4 },
  
  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  
  inputGroup: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600', color: Palette.textPrimary },
  helpText: { fontSize: 12, color: Palette.textMuted, marginTop: 2 },
  input: {
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.md,
    backgroundColor: Palette.bg,
    padding: Spacing.md,
    color: Palette.textPrimary,
    fontSize: 15,
  },

  avatarRow: { flexDirection: 'row', gap: Spacing.sm, paddingVertical: 4 },
  avatarChoice: {
    padding: 2,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarChoiceSelected: {
    borderColor: Palette.primary,
  },

  saveBtn: {
    backgroundColor: Palette.primary,
    borderRadius: Radius.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  divider: { height: 1, backgroundColor: Palette.border, marginVertical: Spacing.xs },

  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.xs },
  settingInfo: { flex: 1, paddingRight: Spacing.md },
  settingName: { fontSize: 15, fontWeight: '600', color: Palette.textPrimary },
  settingDesc: { fontSize: 12, color: Palette.textMuted, marginTop: 2 },
  placeholderLink: { fontSize: 14, fontWeight: '600', color: Palette.primary },

  actionBtn: { padding: Spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  actionBtnText: { fontSize: 16, fontWeight: '700', color: Palette.textPrimary },
});
