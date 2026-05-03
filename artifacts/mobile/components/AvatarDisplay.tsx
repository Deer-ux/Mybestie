import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AVATAR_ICON_NAMES, AVATAR_COLOR_OPTIONS } from '@/utils/helpers';

interface AvatarDisplayProps {
  iconIndex: number;
  colorIndex: number;
  size?: number;
  showBorder?: boolean;
  borderColor?: string;
}

export default function AvatarDisplay({ iconIndex, colorIndex, size = 48, showBorder = false, borderColor = '#FFFFFF' }: AvatarDisplayProps) {
  const iconName = AVATAR_ICON_NAMES[iconIndex % AVATAR_ICON_NAMES.length] as keyof typeof Ionicons.glyphMap;
  const bgColor = AVATAR_COLOR_OPTIONS[colorIndex % AVATAR_COLOR_OPTIONS.length];
  const iconSize = Math.floor(size * 0.5);

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bgColor,
          borderWidth: showBorder ? 2.5 : 0,
          borderColor: showBorder ? borderColor : 'transparent',
        },
      ]}
    >
      <Ionicons name={iconName} size={iconSize} color="#FFFFFF" />
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
