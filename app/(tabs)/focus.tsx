import FocusScreen from '@/screens/FocusScreen';
import { useRouter } from 'expo-router';

export default function FocusTab() {
  const router = useRouter();
  return (
    <FocusScreen onSessionComplete={() => router.push('/(tabs)/rewards')} />
  );
}
