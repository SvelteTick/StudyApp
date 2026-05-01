export const AVATARS = [
  { id: 'owl', image: require('../assets/avatars/owl.png') },
  { id: 'cat', image: require('../assets/avatars/cat.png') },
  { id: 'dragon', image: require('../assets/avatars/dragon.png') },
  { id: 'unicorn', image: require('../assets/avatars/unicorn.png') },
  { id: 'fox', image: require('../assets/avatars/fox.png') },
];

export function getAvatarImage(id: string | null | undefined) {
  if (!id) return null;
  const match = AVATARS.find(a => a.id === id);
  return match ? match.image : null;
}
