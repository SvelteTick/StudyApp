import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { getAvatarImage } from '../constants/avatars';
import { Palette, Radius } from '../constants/theme';

interface UserAvatarProps {
  avatarId?: string | null;
  fallbackName?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function UserAvatar({ avatarId, fallbackName = '?', size = 'md' }: UserAvatarProps) {
  const imageSource = getAvatarImage(avatarId);

  let dim = 60;
  let fontSize = 24;
  if (size === 'sm') {
    dim = 40;
    fontSize = 18;
  } else if (size === 'lg') {
    dim = 100;
    fontSize = 36;
  }

  const containerStyle = [
    styles.container,
    { width: dim, height: dim, borderRadius: dim / 2 }
  ];

  if (imageSource) {
    return (
      <View style={containerStyle}>
        <Image 
          source={imageSource} 
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
        />
      </View>
    );
  }

  // Fallback to text initials
  const initial = fallbackName && fallbackName.length > 0 ? fallbackName.charAt(0).toUpperCase() : '?';

  return (
    <View style={containerStyle}>
      <Text style={[styles.fallbackText, { fontSize }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Palette.primary + '33', // Slight tint for fallback background
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Palette.bg,
  },
  fallbackText: {
    color: Palette.primary,
    fontWeight: '800',
  },
});
