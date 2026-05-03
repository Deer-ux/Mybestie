import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  borderRadius?: number;
  padding?: number;
}

export default function GlassCard({ children, style, borderRadius, padding = 16 }: GlassCardProps) {
  const colors = useColors();
  const r = borderRadius ?? colors.radius;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.glass,
          borderRadius: r,
          borderColor: colors.glassBorder,
          shadowColor: colors.primary,
          padding,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
  },
});
