import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface BlobBackgroundProps {
  variant?: 'default' | 'purple' | 'green';
}

export default function BlobBackground({ variant = 'default' }: BlobBackgroundProps) {
  const colors = useColors();

  const topRightColor = variant === 'purple'
    ? 'rgba(108,99,255,0.14)'
    : variant === 'green'
    ? 'rgba(76,175,80,0.10)'
    : colors.blobBlue;

  const bottomLeftColor = variant === 'purple'
    ? 'rgba(162,155,254,0.12)'
    : variant === 'green'
    ? 'rgba(31,111,139,0.08)'
    : colors.blobLavender;

  const midColor = variant === 'purple'
    ? 'rgba(11,60,93,0.06)'
    : colors.blobPurple;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[styles.blob, styles.topRight, { backgroundColor: topRightColor }]} />
      <View style={[styles.blob, styles.topLeft, { backgroundColor: midColor }]} />
      <View style={[styles.blob, styles.bottomLeft, { backgroundColor: bottomLeftColor }]} />
      <View style={[styles.blob, styles.bottomRight, { backgroundColor: topRightColor, opacity: 0.5 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  blob: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
  },
  topRight: { top: -120, right: -100 },
  topLeft: { top: 200, left: -120 },
  bottomLeft: { bottom: -80, left: -60 },
  bottomRight: { bottom: 200, right: -120 },
});
