import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AVATAR_ICON_NAMES, AVATAR_COLOR_OPTIONS } from '@/utils/helpers';

interface AvatarDisplayProps {
  iconIndex: number;
  colorIndex: number;
  size?: number;
  showRing?: boolean;
  ringColor?: string;
}

function lighten(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  const r = Math.min(255, parseInt(result[1], 16) + 60);
  const g = Math.min(255, parseInt(result[2], 16) + 60);
  const b = Math.min(255, parseInt(result[3], 16) + 60);
  return `rgb(${r},${g},${b})`;
}

export default function AvatarDisplay({ iconIndex, colorIndex, size = 48, showRing = false, ringColor = '#FFFFFF' }: AvatarDisplayProps) {
  const iconName = AVATAR_ICON_NAMES[iconIndex % AVATAR_ICON_NAMES.length] as keyof typeof Ionicons.glyphMap;
  const baseColor = AVATAR_COLOR_OPTIONS[colorIndex % AVATAR_COLOR_OPTIONS.length];
  const lightColor = lighten(baseColor);
  const iconSize = Math.floor(size * 0.48);

  return (
    <View
      style={[
        styles.ring,
        {
          width: size + (showRing ? 6 : 0),
          height: size + (showRing ? 6 : 0),
          borderRadius: (size + (showRing ? 6 : 0)) / 2,
          borderWidth: showRing ? 2.5 : 0,
          borderColor: showRing ? ringColor : 'transparent',
        },
      ]}
    >
      <LinearGradient
        colors={[lightColor, baseColor]}
        style={[styles.gradient, { width: size, height: size, borderRadius: size / 2 }]}
      >
        <Ionicons name={iconName} size={iconSize} color="#FFFFFF" />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradient: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
