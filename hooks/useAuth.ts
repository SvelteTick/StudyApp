import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { createDefaultUserData, UserData } from './useUserProgress';

export type AuthState =
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; userData: UserData };

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({ status: 'unauthenticated' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const name = session.user.user_metadata?.full_name || 'User';
        const userData = createDefaultUserData(session.user.id, name, session.user.email || '');
        setAuthState({ status: 'authenticated', userData });
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        const name = session.user.user_metadata?.full_name || 'User';
        const userData = createDefaultUserData(session.user.id, name, session.user.email || '');
        setAuthState({ status: 'authenticated', userData });
      } else {
        setAuthState({ status: 'unauthenticated' });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (name: string, email: string, password: string): Promise<void> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string): Promise<void> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const updatePassword = useCallback(async (newPassword: string): Promise<void> => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  }, []);

  const deleteAccount = useCallback(async (): Promise<void> => {
    // 1. Call the secure RPC function to delete own account
    const { error } = await supabase.rpc('delete_own_account');
    if (error) throw new Error(error.message);
    // 2. Sign out locally
    await supabase.auth.signOut();
  }, []);

  return {
    authState,
    isAuthenticated: authState.status === 'authenticated',
    userData: authState.status === 'authenticated' ? authState.userData : null,
    loading,
    login,
    signup,
    logout,
    updatePassword,
    deleteAccount,
  };
}
