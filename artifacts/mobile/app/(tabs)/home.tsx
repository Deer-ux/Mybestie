import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import AvatarDisplay from '@/components/AvatarDisplay';
import BlobBackground from '@/components/BlobBackground';
import GlassCard from '@/components/GlassCard';
import { MOODS, GOALS, PERSONALITIES } from '@/utils/helpers';

const TIPS = [
  { emoji: '🔒', title: 'Stay Anonymous', desc: 'Never share your real name or location.' },
  { emoji: '❤️', title: 'Be Kind', desc: 'Everyone here is looking for safe connection.' },
  { emoji: '✨', title: 'BridgeGuide AI', desc: 'Your AI assistant is always by your side.' },
];

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, isTeenMode } = useApp();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const moodLabel = MOODS.find(m => m.id === user?.mood)?.label ?? '';
  const moodEmoji = MOODS.find(m => m.id === user?.mood)?.emoji ?? '😊';
  const goalLabel = GOALS.find(g => g.id === user?.goal)?.label ?? '';
  const personalityLabel = PERSONALITIES.find(p => p.id === user?.personality)?.label ?? '';

  async function handleFindMatch() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/matching');
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      <BlobBackground />
      <LinearGradient colors={['#0B3C5D', '#1F6F8B']} style={[styles.header, { paddingTop: topPad + 20 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.greeting, { fontFamily: 'Inter_400Regular' }]}>Welcome back 👋</Text>
            <Text style={[styles.username, { fontFamily: 'Poppins_700Bold' }]}>{user?.username}</Text>
          </View>
          {user && <AvatarDisplay iconIndex={user.iconIndex} colorIndex={user.colorIndex} size={50} showRing />}
        </View>
        <View style={styles.chipsRow}>
          <View style={[styles.chip, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
            <Text style={styles.chipText}>{moodEmoji} {moodLabel}</Text>
          </View>
          {isTeenMode && (
            <View style={[styles.chip, { backgroundColor: 'rgba(76,175,80,0.25)' }]}>
              <Text style={styles.chipText}>🌱 Teen Mode</Text>
            </View>
          )}
        </View>
        <View style={styles.statsRow}>
          {[
            { label: 'Conversations', value: user?.totalChats ?? 0 },
            { label: 'Badges', value: user?.badges.length ?? 0 },
            { label: 'Streak', value: user?.positiveStreak ?? 0 },
          ].map((stat, i) => (
            <React.Fragment key={stat.label}>
              {i > 0 && <View style={[styles.statDivider, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />}
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { fontFamily: 'Poppins_700Bold' }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { fontFamily: 'Inter_400Regular' }]}>{stat.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <TouchableOpacity
            onPress={handleFindMatch}
            activeOpacity={0.88}
            style={[styles.matchBtn, { borderRadius: colors.radius + 4 }]}
          >
            <LinearGradient colors={['#4CAF50', '#2E7D32']} style={styles.matchGrad}>
              <Text style={styles.matchEmoji}>🤝</Text>
              <View>
                <Text style={[styles.matchTitle, { fontFamily: 'Poppins_700Bold' }]}>Find Someone to Talk To</Text>
                <Text style={[styles.matchSub, { fontFamily: 'Inter_400Regular' }]}>Smart matching by mood, goals & interests</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).springify()}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: 'Poppins_600SemiBold' }]}>Your Profile Summary</Text>
          <GlassCard style={styles.profileCard}>
            <View style={styles.profileRow}>
              <Text style={styles.profileEmoji}>{moodEmoji}</Text>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileLabel, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>Current mood</Text>
                <Text style={[styles.profileValue, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>{moodLabel}</Text>
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.profileRow}>
              <Text style={styles.profileEmoji}>🎯</Text>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileLabel, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>Conversation goal</Text>
                <Text style={[styles.profileValue, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>{goalLabel}</Text>
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.profileRow}>
              <Text style={styles.profileEmoji}>🌊</Text>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileLabel, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>Personality</Text>
                <Text style={[styles.profileValue, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>{personalityLabel}</Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: 'Poppins_600SemiBold' }]}>How MindBridge Keeps You Safe</Text>
          <View style={styles.tipsGrid}>
            {TIPS.map((t, i) => (
              <GlassCard key={i} style={styles.tipCard} padding={14}>
                <Text style={styles.tipEmoji}>{t.emoji}</Text>
                <Text style={[styles.tipTitle, { color: colors.foreground, fontFamily: 'Poppins_500Medium' }]}>{t.title}</Text>
                <Text style={[styles.tipDesc, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>{t.desc}</Text>
              </GlassCard>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(250).springify()} style={styles.quickLinks}>
          <TouchableOpacity
            onPress={() => router.push('/safety')}
            style={[styles.quickLink, { backgroundColor: colors.safeGreenLight, borderRadius: colors.radius }]}
          >
            <Text style={{ fontSize: 18 }}>🛡️</Text>
            <Text style={[styles.quickLinkText, { color: colors.safeGreen, fontFamily: 'Inter_600SemiBold' }]}>Safety Center</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/badges')}
            style={[styles.quickLink, { backgroundColor: colors.lavenderLight, borderRadius: colors.radius }]}
          >
            <Text style={{ fontSize: 18 }}>🌟</Text>
            <Text style={[styles.quickLinkText, { color: colors.accent, fontFamily: 'Inter_600SemiBold' }]}>My Badges</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  greeting: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  username: { color: '#FFFFFF', fontSize: 22 },
  chipsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  chipText: { color: 'rgba(255,255,255,0.9)', fontSize: 13 },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { color: '#FFFFFF', fontSize: 24 },
  statLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, height: 30 },
  content: { padding: 20, gap: 20 },
  matchBtn: { overflow: 'hidden' as const },
  matchGrad: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16 },
  matchEmoji: { fontSize: 36 },
  matchTitle: { color: '#FFFFFF', fontSize: 18 },
  matchSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 3 },
  sectionTitle: { fontSize: 17, marginBottom: 10 },
  profileCard: { gap: 2 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10 },
  profileEmoji: { fontSize: 22, width: 30, textAlign: 'center' },
  profileInfo: { flex: 1 },
  profileLabel: { fontSize: 11, marginBottom: 2 },
  profileValue: { fontSize: 14 },
  divider: { height: StyleSheet.hairlineWidth },
  tipsGrid: { flexDirection: 'row', gap: 10 },
  tipCard: { flex: 1, gap: 6, borderWidth: 1 },
  tipEmoji: { fontSize: 22 },
  tipTitle: { fontSize: 13 },
  tipDesc: { fontSize: 11, lineHeight: 16 },
  quickLinks: { flexDirection: 'row', gap: 12 },
  quickLink: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, gap: 8 },
  quickLinkText: { fontSize: 13 },
});
