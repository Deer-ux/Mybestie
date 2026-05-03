import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  borderRadius?: number;
  padding?: number;
  neonBorder?: boolean;
}

export default function GlassCard({ children, style, borderRadius = 20, padding = 16, neonBorder }: GlassCardProps) {
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: 'rgba(255,255,255,0.05)',
          borderRadius,
          borderColor: neonBorder ? 'rgba(255,45,149,0.35)' : 'rgba(255,255,255,0.10)',
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
    shadowColor: '#FF2D95',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  },
});
