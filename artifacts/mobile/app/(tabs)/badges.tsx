import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
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
      <LinearGradient colors={[colors.purple, colors.primary]} style={[styles.header, { paddingTop: topPad + 20 }]}>
        <Text style={styles.headerTitle}>Achievements</Text>
        <Text style={styles.headerSub}>{earned.length} of {BADGES.length} badges earned</Text>

        <View style={[styles.progressOuter, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
          <View style={[styles.progressInner, { width: `${(earned.length / BADGES.length) * 100}%` as any }]} />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {earned.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>EARNED</Text>
            {earned.map((badge, i) => (
              <Animated.View key={badge.id} entering={FadeInDown.delay(i * 80).springify()}>
                <View style={[styles.badgeCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
                  <View style={[styles.badgeIconWrap, { backgroundColor: badge.color + '20' }]}>
                    <Ionicons name={badge.icon as keyof typeof Ionicons.glyphMap} size={28} color={badge.color} />
                  </View>
                  <View style={styles.badgeInfo}>
                    <Text style={[styles.badgeName, { color: colors.foreground }]}>{badge.label}</Text>
                    <Text style={[styles.badgeDesc, { color: colors.mutedForeground }]}>{badge.description}</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={22} color={colors.accent} />
                </View>
              </Animated.View>
            ))}
          </>
        )}

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: earned.length > 0 ? 8 : 0 }]}>
          {locked.length > 0 ? 'LOCKED' : 'ALL BADGES EARNED!'}
        </Text>
        {locked.map((badge, i) => (
          <Animated.View key={badge.id} entering={FadeInDown.delay(i * 80).springify()}>
            <View style={[styles.badgeCard, styles.lockedCard, { backgroundColor: colors.muted, borderColor: colors.border, borderRadius: colors.radius }]}>
              <View style={[styles.badgeIconWrap, { backgroundColor: colors.border }]}>
                <Ionicons name="lock-closed-outline" size={24} color={colors.mutedForeground} />
              </View>
              <View style={styles.badgeInfo}>
                <Text style={[styles.badgeName, { color: colors.mutedForeground }]}>{badge.label}</Text>
                <Text style={[styles.badgeDesc, { color: colors.mutedForeground, opacity: 0.7 }]}>{badge.description}</Text>
              </View>
            </View>
          </Animated.View>
        ))}

        <View style={[styles.infoCard, { backgroundColor: colors.purpleLight, borderRadius: colors.radius }]}>
          <Ionicons name="ribbon-outline" size={20} color={colors.purple} />
          <Text style={[styles.infoText, { color: colors.purple }]}>
            Badges are awarded for kindness, learning, and meaningful conversations — never for sharing pain.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 28 },
  headerTitle: { color: '#FFFFFF', fontSize: 26, fontWeight: '800' as const, marginBottom: 4 },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 16 },
  progressOuter: { height: 6, borderRadius: 3, overflow: 'hidden' as const },
  progressInner: { height: 6, backgroundColor: '#FFFFFF', borderRadius: 3 },
  content: { padding: 20, gap: 10 },
  sectionLabel: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.8, marginBottom: 4 },
  badgeCard: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderWidth: 1, gap: 14,
  },
  lockedCard: { opacity: 0.6 },
  badgeIconWrap: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  badgeInfo: { flex: 1 },
  badgeName: { fontSize: 15, fontWeight: '600' as const, marginBottom: 3 },
  badgeDesc: { fontSize: 12, lineHeight: 17 },
  infoCard: { flexDirection: 'row', padding: 14, gap: 10, alignItems: 'flex-start', marginTop: 8 },
  infoText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '500' as const },
});
