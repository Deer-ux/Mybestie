import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import { useChat } from '@/context/ChatContext';
import { useColors } from '@/hooks/useColors';
import AvatarDisplay from '@/components/AvatarDisplay';
import { MOODS } from '@/utils/helpers';

const TIPS = [
  { icon: 'shield-checkmark-outline', title: 'Stay Anonymous', desc: 'Never share your real name, phone, or location.' },
  { icon: 'heart-outline', title: 'Be Kind', desc: 'Everyone here is looking for safe, honest connection.' },
  { icon: 'bulb-outline', title: 'BridgeGuide', desc: 'Our AI assistant helps guide your conversation.' },
];

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const { startMatching, isMatching } = useChat();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const currentMoodLabel = MOODS.find(m => m.id === user?.mood)?.label ?? 'Unknown';

  async function handleFindMatch() {
    if (!user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await startMatching(user.mood, user.goal, user.interests, user.personality, user.id);
    router.push('/conversation');
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient colors={[colors.primary, colors.purple]} style={[styles.header, { paddingTop: topPad + 20 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Welcome back</Text>
            <Text style={styles.username}>{user?.username}</Text>
          </View>
          {user && <AvatarDisplay iconIndex={user.iconIndex} colorIndex={user.colorIndex} size={48} showBorder />}
        </View>

        <View style={[styles.moodBadge, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
          <Ionicons name="happy-outline" size={14} color="rgba(255,255,255,0.8)" />
          <Text style={styles.moodText}>Feeling {currentMoodLabel} today</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user?.totalChats ?? 0}</Text>
            <Text style={styles.statLabel}>Conversations</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user?.badges.length ?? 0}</Text>
            <Text style={styles.statLabel}>Badges</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user?.positiveStreak ?? 0}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <TouchableOpacity
            onPress={handleFindMatch}
            activeOpacity={0.88}
            style={[styles.matchButton, { borderRadius: colors.radius + 4 }]}
            disabled={isMatching}
          >
            <LinearGradient colors={['#27AE60', '#1A7A4A']} style={styles.matchGradient}>
              <Ionicons name="people" size={28} color="#FFFFFF" />
              <Text style={styles.matchText}>Find Someone to Talk To</Text>
              <Text style={styles.matchSub}>Smart matching based on your mood & interests</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>How MindBridge Keeps You Safe</Text>
          <View style={styles.tipsGrid}>
            {TIPS.map((tip, i) => (
              <View
                key={i}
                style={[styles.tipCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
              >
                <View style={[styles.tipIcon, { backgroundColor: colors.blueLight }]}>
                  <Ionicons name={tip.icon as keyof typeof Ionicons.glyphMap} size={20} color={colors.primary} />
                </View>
                <Text style={[styles.tipTitle, { color: colors.foreground }]}>{tip.title}</Text>
                <Text style={[styles.tipDesc, { color: colors.mutedForeground }]}>{tip.desc}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Links</Text>
          <View style={styles.quickLinks}>
            <TouchableOpacity
              onPress={() => router.push('/safety')}
              style={[styles.quickLink, { backgroundColor: colors.greenLight, borderRadius: colors.radius }]}
            >
              <Ionicons name="shield-outline" size={20} color={colors.accent} />
              <Text style={[styles.quickLinkText, { color: colors.accent }]}>Safety Center</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/badges')}
              style={[styles.quickLink, { backgroundColor: colors.blueLight, borderRadius: colors.radius }]}
            >
              <Ionicons name="ribbon-outline" size={20} color={colors.primary} />
              <Text style={[styles.quickLinkText, { color: colors.primary }]}>My Badges</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <View style={[styles.disclaimerCard, { backgroundColor: colors.warningLight, borderRadius: colors.radius }]}>
            <Ionicons name="information-circle-outline" size={18} color={colors.warning} />
            <Text style={[styles.disclaimerText, { color: colors.foreground }]}>
              MindBridge is not a therapy service, medical provider, or emergency crisis service. For emergencies, please contact local emergency services immediately.
            </Text>
          </View>
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
  username: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' as const },
  moodBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, marginBottom: 16,
  },
  moodText: { color: 'rgba(255,255,255,0.85)', fontSize: 13 },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' as const },
  statLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, height: 30 },
  content: { padding: 20, gap: 24 },
  matchButton: { overflow: 'hidden' as const },
  matchGradient: { padding: 24, alignItems: 'center', gap: 8 },
  matchText: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' as const },
  matchSub: { color: 'rgba(255,255,255,0.75)', fontSize: 13, textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700' as const, marginBottom: 12 },
  tipsGrid: { gap: 10 },
  tipCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderWidth: 1, gap: 12 },
  tipIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  tipTitle: { fontSize: 14, fontWeight: '600' as const, flex: 1 },
  tipDesc: { fontSize: 12, flex: 2, lineHeight: 17 },
  quickLinks: { flexDirection: 'row', gap: 10 },
  quickLink: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, gap: 8 },
  quickLinkText: { fontSize: 13, fontWeight: '600' as const },
  disclaimerCard: { flexDirection: 'row', padding: 14, gap: 10, alignItems: 'flex-start' },
  disclaimerText: { flex: 1, fontSize: 13, lineHeight: 18 },
});
