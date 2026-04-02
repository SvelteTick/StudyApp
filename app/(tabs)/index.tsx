import HomeScreen from '@/screens/HomeScreen';
import { useRouter } from 'expo-router';
import { useAppProgress, useAppAuth } from '@/hooks/AppContext';

export default function HomeTab() {
  const router = useRouter();
  const { userData } = useAppProgress();
  const { logout } = useAppAuth();
  
  return (
    <HomeScreen 
      userData={userData} 
      onLogout={logout}
      onStartSession={() => router.push('/(tabs)/focus')} 
    />
  );
}
