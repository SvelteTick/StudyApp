import LeaderboardScreen from '@/screens/LeaderboardScreen';
import { useAppAuth } from '@/hooks/AppContext';

export default function LeaderboardTab() {
  const { userData } = useAppAuth();
  return <LeaderboardScreen currentUserId={userData?.profile.id ?? ''} />;
}
