import FocusScreen from '@/screens/FocusScreen';
import { useRouter, useNavigation } from 'expo-router';
import { useAppProgress } from '@/hooks/AppContext';
import { Palette } from '@/constants/theme';

export default function FocusTab() {
  const router = useRouter();
  const navigation = useNavigation();
  const { completeSession } = useAppProgress();

  return (
    <FocusScreen 
      onRunningChange={(isRunning) => {
        navigation.setOptions({
          tabBarStyle: isRunning ? { display: 'none' } : {
            backgroundColor: Palette.surface,
            borderTopColor: Palette.border,
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
            paddingTop: 6,
          }
        });
      }}
      onSessionComplete={(mins, xp) => {
        completeSession(mins, xp);
        router.push('/(tabs)/rewards');
      }} 
    />
  );
}
