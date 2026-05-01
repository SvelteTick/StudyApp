import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from './useAuth';
import { useUserProgress } from './useUserProgress';
import type { UserData } from './useUserProgress';
import LoginScreen from '@/screens/LoginScreen';
import { View, ActivityIndicator } from 'react-native';
import { Palette } from '@/constants/theme';
import { useNotifications } from './useNotifications';

const AuthContext = createContext<ReturnType<typeof useAuth> | null>(null);
const ProgressContext = createContext<ReturnType<typeof useUserProgress> | null>(null);
const NotificationsContext = createContext<ReturnType<typeof useNotifications> | null>(null);

export function useAppAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAppAuth must be used within AppProvider');
  return context;
}

export function useAppProgress() {
  const context = useContext(ProgressContext);
  if (!context) throw new Error('useAppProgress must be used within AppProvider');
  return context;
}

export function useAppNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) throw new Error('useAppNotifications must be used within AppProvider');
  return context;
}

function AuthenticatedApp({
  children,
  initialUserData,
}: {
  children: ReactNode;
  initialUserData: UserData;
}) {
  const progressAPI = useUserProgress(initialUserData);
  const notificationsAPI = useNotifications(initialUserData.profile.id);

  return (
    <ProgressContext.Provider value={progressAPI}>
      <NotificationsContext.Provider value={notificationsAPI}>
        {children}
      </NotificationsContext.Provider>
    </ProgressContext.Provider>
  );
}

export function AppProvider({ children }: { children: ReactNode }) {
  const authAPI = useAuth();

  if (authAPI.loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Palette.bg }}>
        <ActivityIndicator size="large" color={Palette.primary} />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={authAPI}>
      {authAPI.isAuthenticated && authAPI.userData ? (
        <AuthenticatedApp initialUserData={authAPI.userData}>
          {children}
        </AuthenticatedApp>
      ) : (
        <LoginScreen onLogin={authAPI.login} onSignup={authAPI.signup} />
      )}
    </AuthContext.Provider>
  );
}
