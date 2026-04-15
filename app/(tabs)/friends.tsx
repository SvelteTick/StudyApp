import FriendsScreen from '@/screens/FriendsScreen';
import { useAppAuth } from '@/hooks/AppContext';

export default function FriendsTab() {
  const { userData } = useAppAuth();
  return <FriendsScreen currentUserId={userData?.profile.id ?? ''} />;
}
