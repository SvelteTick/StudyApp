import FocusScreen from '@/screens/FocusScreen';
import { useRouter } from 'expo-router';
import { useAppProgress } from '@/hooks/AppContext';

export default function FocusTab() {
  const router = useRouter();
  const { completeSession } = useAppProgress();

  return (
    <FocusScreen 
      onSessionComplete={(mins, xp) => {
        completeSession(mins, xp);
        router.push('/(tabs)/rewards');
      }} 
    />
  );
}
