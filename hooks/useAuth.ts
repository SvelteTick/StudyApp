import { useState, useCallback } from 'react';
import { createDefaultUserData, UserData } from './useUserProgress';

export type AuthState =
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; userData: UserData };

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({ status: 'unauthenticated' });

  const login = useCallback((name: string, email: string, _password: string): Promise<void> => {
    // TODO: swap with real API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const userData = createDefaultUserData(name, email);
        setAuthState({ status: 'authenticated', userData });
        resolve();
      }, 800);
    });
  }, []);

  const signup = useCallback((name: string, email: string, _password: string): Promise<void> => {
    // TODO: swap with real API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const userData = createDefaultUserData(name, email);
        setAuthState({ status: 'authenticated', userData });
        resolve();
      }, 1000);
    });
  }, []);

  const logout = useCallback(() => {
    setAuthState({ status: 'unauthenticated' });
  }, []);

  return {
    authState,
    isAuthenticated: authState.status === 'authenticated',
    userData: authState.status === 'authenticated' ? authState.userData : null,
    login,
    signup,
    logout,
  };
}
