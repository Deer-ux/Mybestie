import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat,
  withTiming, withSequence, Easing, FadeInDown,
} from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';

export default function MatchingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const pulse = useSharedValue(1);
  const rotate = useSharedValue(0);
  const dot1 = useSharedValue(0.3);
  const dot2 = useSharedValue(0.3);
  const dot3 = useSharedValue(0.3);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1.12, { duration: 900 }), withTiming(1, { duration: 900 })),
      -1, true,
    );
    rotate.value = withRepeat(withTiming(1, { duration: 3000, easing: Easing.linear }), -1, false);
    dot1.value = withRepeat(withSequence(withTiming(1, { duration: 400 }), withTiming(0.3, { duration: 400 }), withTiming(0.3, { duration: 400 })), -1, false);
    setTimeout(() => {
      dot2.value = withRepeat(withSequence(withTiming(0.3, { duration: 400 }), withTiming(1, { duration: 400 }), withTiming(0.3, { duration: 400 })), -1, false);
    }, 400);
    setTimeout(() => {
      dot3.value = withRepeat(withSequence(withTiming(0.3, { duration: 400 }), withTiming(0.3, { duration: 400 }), withTiming(1, { duration: 400 })), -1, false);
    }, 800);
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value * 360}deg` }],
  }));
  const d1Style = useAnimatedStyle(() => ({ opacity: dot1.value }));
  const d2Style = useAnimatedStyle(() => ({ opacity: dot2.value }));
  const d3Style = useAnimatedStyle(() => ({ opacity: dot3.value }));

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <LinearGradient colors={['#0D1B33', '#1B3A6B', '#2E1B5A']} style={styles.container}>
      <View style={[styles.content, { paddingTop: topPad + 40 }]}>
        <Animated.View entering={FadeInDown.delay(100)} style={styles.pulseContainer}>
          <Animated.View style={pulseStyle}>
            <Animated.View style={[styles.outerRing, rotateStyle]}>
              <View style={styles.innerRing}>
                <Ionicons name="people" size={40} color="#FFFFFF" />
              </View>
            </Animated.View>
          </Animated.View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300)} style={styles.textSection}>
          <Text style={styles.title}>Finding Your Match</Text>
          <Text style={styles.subtitle}>Searching for someone with a compatible mood, goal, and interests...</Text>

          <View style={styles.dotsRow}>
            <Animated.View style={[styles.dot, d1Style]} />
            <Animated.View style={[styles.dot, d2Style]} />
            <Animated.View style={[styles.dot, d3Style]} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500)} style={styles.criteriaSection}>
          {[
            { icon: 'happy-outline', label: 'Matching mood compatibility' },
            { icon: 'flag-outline', label: 'Aligning conversation goals' },
            { icon: 'star-outline', label: 'Finding shared interests' },
            { icon: 'heart-outline', label: 'Checking temperament fit' },
          ].map((item, i) => (
            <View key={i} style={[styles.criteriaRow, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
              <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={16} color="rgba(255,255,255,0.7)" />
              <Text style={styles.criteriaText}>{item.label}</Text>
              <Ionicons name="checkmark-circle-outline" size={16} color="#27AE60" />
            </View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(700)}>
          <View style={[styles.safetyNote, { backgroundColor: 'rgba(39,174,96,0.15)' }]}>
            <Ionicons name="shield-checkmark-outline" size={16} color="#27AE60" />
            <Text style={styles.safetyNoteText}>Both users are fully anonymous. No personal data is shared.</Text>
          </View>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1, paddingHorizontal: 24, alignItems: 'center', gap: 32,
  },
  pulseContainer: { alignItems: 'center', justifyContent: 'center' },
  outerRing: {
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 2, borderColor: 'rgba(155,127,212,0.5)',
    borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  innerRing: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(74,144,217,0.3)',
    borderWidth: 2, borderColor: 'rgba(74,144,217,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  textSection: { alignItems: 'center', gap: 12 },
  title: { color: '#FFFFFF', fontSize: 24, fontWeight: '700' as const, textAlign: 'center' },
  subtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  dotsRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#7C5CBF' },
  criteriaSection: { gap: 8, width: '100%' },
  criteriaRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12,
  },
  criteriaText: { flex: 1, color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  safetyNote: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12,
  },
  safetyNoteText: { color: '#27AE60', fontSize: 13, flex: 1 },
});
