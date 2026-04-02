import RewardScreen from '@/screens/RewardScreen';
import { useAppProgress } from '@/hooks/AppContext';

export default function RewardsTab() {
  const { userData } = useAppProgress();
  return <RewardScreen userData={userData} />;
}
