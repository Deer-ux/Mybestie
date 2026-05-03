import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useApp } from '@/context/AppContext';
import GlassCard from '@/components/GlassCard';
import BlobBackground from '@/components/BlobBackground';
import { BADGES } from '@/utils/helpers';
import colors from '@/constants/colors';

const PINK  = '#FF2D95';
const MUTED = 'rgba(255,255,255,0.50)';

export default function BadgesScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const earned = BADGES.filter(b => user?.badges.includes(b.id));
  const locked = BADGES.filter(b => !user?.badges.includes(b.id));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      <BlobBackground variant="purple" />

      {/* Header */}
      <LinearGradient
        colors={['#1A0B2E', '#0B0B0F']}
        style={[styles.header, { paddingTop: topPad + 24 }]}
      >
        <Text style={styles.headerTitle}>ACHIEVEMENTS 🌟</Text>
        <Text style={styles.headerSub}>{earned.length} of {BADGES.length} badges earned</Text>
        <View style={styles.progressBg}>
          <LinearGradient
            colors={colors.gradPrimary}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${(earned.length / BADGES.length) * 100}%` as any }]}
          />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {earned.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>EARNED ✅</Text>
            {earned.map((badge, i) => (
              <Animated.View key={badge.id} entering={FadeInDown.delay(i * 80).springify()}>
                <GlassCard style={styles.badgeCard} padding={16} neonBorder>
                  <View style={[styles.badgeEmoji, { backgroundColor: badge.color + '18', borderWidth: 1, borderColor: badge.color + '35' }]}>
                    <Text style={styles.emojiText}>{badge.emoji}</Text>
                  </View>
                  <View style={styles.badgeInfo}>
                    <Text style={styles.badgeName}>{badge.label}</Text>
                    <Text style={styles.badgeDesc}>{badge.description}</Text>
                  </View>
                  <View style={[styles.earnedPill, { backgroundColor: 'rgba(0,255,136,0.12)', borderColor: 'rgba(0,255,136,0.30)' }]}>
                    <Text style={{ color: '#00FF88', fontSize: 14 }}>✅</Text>
                  </View>
                </GlassCard>
              </Animated.View>
            ))}
          </>
        )}

        {locked.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: earned.length > 0 ? 8 : 0 }]}>LOCKED 🔒</Text>
            {locked.map((badge, i) => (
              <Animated.View key={badge.id} entering={FadeInDown.delay(i * 60).springify()}>
                <View style={styles.lockedCard}>
                  <View style={[styles.badgeEmoji, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                    <Text style={[styles.emojiText, { opacity: 0.30 }]}>{badge.emoji}</Text>
                  </View>
                  <View style={styles.badgeInfo}>
                    <Text style={[styles.badgeName, { opacity: 0.40 }]}>{badge.label}</Text>
                    <Text style={[styles.badgeDesc, { opacity: 0.35 }]}>{badge.description}</Text>
                  </View>
                  <Animated.Text style={[styles.lockIcon]}>🔒</Animated.Text>
                </View>
              </Animated.View>
            ))}
          </>
        )}

        <GlassCard style={styles.infoCard} padding={14}>
          <Text style={{ fontSize: 20 }}>🌱</Text>
          <Text style={styles.infoText}>
            Badges are earned for kindness, growth, and meaningful conversations — never for sharing pain.
          </Text>
        </GlassCard>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  header: { paddingHorizontal: 24, paddingBottom: 28, gap: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  headerTitle: { color: '#FFFFFF', fontSize: 24, fontFamily: 'SpaceGrotesk_700Bold', letterSpacing: 1.5 },
  headerSub: { color: MUTED, fontSize: 14, fontFamily: 'Inter_400Regular' },
  progressBg: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.10)', marginTop: 4, overflow: 'hidden' as const },
  progressFill: { height: 6, borderRadius: 3 },
  content: { padding: 20, gap: 10 },
  sectionLabel: { color: MUTED, fontSize: 11, fontFamily: 'SpaceGrotesk_600SemiBold', letterSpacing: 2, marginBottom: 4 },
  badgeCard: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  lockedCard: {
    flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14, marginBottom: 0,
    backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  badgeEmoji: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  emojiText: { fontSize: 26 },
  badgeInfo: { flex: 1 },
  badgeName: { color: '#FFFFFF', fontSize: 15, fontFamily: 'SpaceGrotesk_600SemiBold', marginBottom: 3 },
  badgeDesc: { color: MUTED, fontSize: 12, lineHeight: 17, fontFamily: 'Inter_400Regular' },
  earnedPill: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  lockIcon: { fontSize: 18, opacity: 0.30 },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 8 },
  infoText: { flex: 1, color: PINK, fontSize: 13, lineHeight: 19, fontFamily: 'Inter_500Medium' },
});
