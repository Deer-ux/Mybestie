import React, { useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';

interface Props {
  bottomOffset?: number;
}

export default function FloatingBridgeButton({ bottomOffset = 90 }: Props) {
  const colors = useColors();
  const scale = useSharedValue(1);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(withTiming(1.07, { duration: 1400 }), withTiming(1, { duration: 1400 })),
      -1, true,
    );
  }, []);

  return (
    <View style={[styles.wrap, { bottom: bottomOffset }]} pointerEvents="box-none">
      <Animated.View style={pulseStyle}>
        <TouchableOpacity
          onPress={() => router.push('/bridge-guide')}
          activeOpacity={0.88}
          style={[styles.btn, { shadowColor: colors.accent }]}
        >
          <LinearGradient colors={['#6C63FF', '#A29BFE']} style={styles.gradient}>
            <Text style={styles.emoji}>✨</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
      <View style={[styles.label, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
        <Text style={[styles.labelText, { color: colors.accent, fontFamily: 'Inter_600SemiBold' }]}>AI</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', right: 18, alignItems: 'center', gap: 4 },
  btn: {
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 8,
  },
  gradient: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 24 },
  label: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1,
  },
  labelText: { fontSize: 11 },
});
