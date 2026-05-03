import React, { useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';

interface Props { bottomOffset?: number; }

export default function FloatingBridgeButton({ bottomOffset = 90 }: Props) {
  const scale = useSharedValue(1);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(withTiming(1.08, { duration: 1400 }), withTiming(1, { duration: 1400 })),
      -1, true,
    );
  }, []);

  return (
    <View style={[styles.wrap, { bottom: bottomOffset }]} pointerEvents="box-none">
      <Animated.View style={pulseStyle}>
        <TouchableOpacity
          onPress={() => router.push('/bridge-guide')}
          activeOpacity={0.88}
          style={styles.btn}
        >
          <LinearGradient
            colors={['#FF2D95', '#7B2CFF']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            <Text style={styles.emoji}>✨</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
      <View style={styles.label}>
        <Text style={styles.labelText}>AI</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', right: 18, alignItems: 'center', gap: 4 },
  btn: {
    shadowColor: '#FF2D95',
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.60, shadowRadius: 16, elevation: 10,
  },
  gradient: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 24 },
  label: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
    backgroundColor: 'rgba(255,45,149,0.15)', borderWidth: 1, borderColor: 'rgba(255,45,149,0.30)',
  },
  labelText: { color: '#FF2D95', fontSize: 11, fontFamily: 'Inter_600SemiBold' },
});
