import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import GlassCard from '@/components/GlassCard';
import BlobBackground from '@/components/BlobBackground';
import { BADGES } from '@/utils/helpers';

export default function BadgesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const earned = BADGES.filter(b => user?.badges.includes(b.id));
  const locked = BADGES.filter(b => !user?.badges.includes(b.id));

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      <BlobBackground variant="purple" />
      <LinearGradient colors={['#6C63FF', '#A29BFE']} style={[styles.header, { paddingTop: topPad + 24 }]}>
        <Text style={[styles.headerTitle, { fontFamily: 'Poppins_700Bold' }]}>Achievements 🌟</Text>
        <Text style={[styles.headerSub, { fontFamily: 'Inter_400Regular' }]}>{earned.length} of {BADGES.length} badges earned</Text>
        <View style={[styles.progressOuter, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
          <View style={[styles.progressInner, { width: `${(earned.length / BADGES.length) * 100}%` as any }]} />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {earned.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold' }]}>EARNED</Text>
            {earned.map((badge, i) => (
              <Animated.View key={badge.id} entering={FadeInDown.delay(i * 80).springify()}>
                <GlassCard style={styles.badgeCard} padding={16}>
                  <View style={[styles.badgeEmoji, { backgroundColor: badge.color + '18' }]}>
                    <Text style={styles.emojiText}>{badge.emoji}</Text>
                  </View>
                  <View style={styles.badgeInfo}>
                    <Text style={[styles.badgeName, { color: colors.foreground, fontFamily: 'Poppins_600SemiBold' }]}>{badge.label}</Text>
                    <Text style={[styles.badgeDesc, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>{badge.description}</Text>
                  </View>
                  <Text style={styles.earnedCheck}>✅</Text>
                </GlassCard>
              </Animated.View>
            ))}
          </>
        )}

        {locked.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold', marginTop: earned.length > 0 ? 8 : 0 }]}>
              LOCKED 🔒
            </Text>
            {locked.map((badge, i) => (
              <Animated.View key={badge.id} entering={FadeInDown.delay(i * 60).springify()}>
                <View style={[styles.lockedCard, { backgroundColor: colors.muted, borderRadius: colors.radius }]}>
                  <View style={[styles.badgeEmoji, { backgroundColor: colors.border }]}>
                    <Text style={[styles.emojiText, { opacity: 0.35 }]}>{badge.emoji}</Text>
                  </View>
                  <View style={styles.badgeInfo}>
                    <Text style={[styles.badgeName, { color: colors.mutedForeground, fontFamily: 'Poppins_600SemiBold', opacity: 0.7 }]}>{badge.label}</Text>
                    <Text style={[styles.badgeDesc, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular', opacity: 0.6 }]}>{badge.description}</Text>
                  </View>
                </View>
              </Animated.View>
            ))}
          </>
        )}

        <GlassCard style={styles.infoCard} padding={14}>
          <Text style={{ fontSize: 20 }}>🌱</Text>
          <Text style={[styles.infoText, { color: colors.accent, fontFamily: 'Inter_500Medium' }]}>
            Badges are earned for kindness, growth, and meaningful conversations — never for sharing pain.
          </Text>
        </GlassCard>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingBottom: 28, gap: 6 },
  headerTitle: { color: '#FFFFFF', fontSize: 28 },
  headerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 14 },
  progressOuter: { height: 6, borderRadius: 3, marginTop: 4, overflow: 'hidden' as const },
  progressInner: { height: 6, backgroundColor: '#FFFFFF', borderRadius: 3 },
  content: { padding: 20, gap: 10 },
  sectionLabel: { fontSize: 11, letterSpacing: 0.8, marginBottom: 4 },
  badgeCard: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  lockedCard: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14, marginBottom: 0 },
  badgeEmoji: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  emojiText: { fontSize: 26 },
  badgeInfo: { flex: 1 },
  badgeName: { fontSize: 15, marginBottom: 3 },
  badgeDesc: { fontSize: 12, lineHeight: 17 },
  earnedCheck: { fontSize: 20 },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 8 },
  infoText: { flex: 1, fontSize: 13, lineHeight: 19 },
});
