import React from 'react';
import { View, StyleSheet } from 'react-native';

interface BlobBackgroundProps {
  variant?: 'default' | 'purple' | 'green' | 'cyan';
}

export default function BlobBackground({ variant = 'default' }: BlobBackgroundProps) {
  const topColor = variant === 'cyan'
    ? 'rgba(0,212,255,0.14)'
    : variant === 'green'
    ? 'rgba(0,255,136,0.10)'
    : 'rgba(255,45,149,0.12)';

  const bottomColor = variant === 'cyan'
    ? 'rgba(123,44,255,0.12)'
    : variant === 'green'
    ? 'rgba(0,212,255,0.08)'
    : 'rgba(214,51,255,0.10)';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Top-right neon glow */}
      <View style={[styles.blob, styles.topRight, { backgroundColor: topColor }]} />
      {/* Center-left soft glow */}
      <View style={[styles.blob, styles.midLeft, { backgroundColor: 'rgba(123,44,255,0.08)' }]} />
      {/* Bottom-left cyan glow */}
      <View style={[styles.blob, styles.bottomLeft, { backgroundColor: bottomColor }]} />
      {/* Bottom-right faint glow */}
      <View style={[styles.blob, styles.bottomRight, { backgroundColor: topColor, opacity: 0.4 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  blob: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
  },
  topRight:   { top: -130, right: -110 },
  midLeft:    { top: 220,  left: -140 },
  bottomLeft: { bottom: -90, left: -70 },
  bottomRight:{ bottom: 180, right: -130 },
});
