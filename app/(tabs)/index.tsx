import HomeScreen from '@/screens/HomeScreen';
import { useRouter } from 'expo-router';

export default function HomeTab() {
  const router = useRouter();
  return <HomeScreen onStartSession={() => router.push('/(tabs)/focus')} />;
}
