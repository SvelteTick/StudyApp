import HomeScreen from '@/screens/HomeScreen';
import { useRouter } from 'expo-router';
import { useAppProgress, useAppAuth } from '@/hooks/AppContext';

export default function HomeTab() {
  const router = useRouter();
  const { userData, updateProfile } = useAppProgress();
  const { logout, updatePassword, deleteAccount } = useAppAuth();
  
  return (
    <HomeScreen 
      userData={userData} 
      onLogout={logout}
      onUpdateProfile={updateProfile}
      onUpdatePassword={updatePassword}
      onDeleteAccount={deleteAccount}
      onStartSession={() => router.push('/(tabs)/focus')} 
    />
  );
}
