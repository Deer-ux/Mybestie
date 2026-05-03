import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import { useInbox } from '@/context/InboxContext';
import { useColors } from '@/hooks/useColors';
import { trackEvent } from '@/utils/analytics';
import AvatarDisplay from '@/components/AvatarDisplay';
import BlobBackground from '@/components/BlobBackground';
import GlassCard from '@/components/GlassCard';
import { MOODS, GOALS, PERSONALITIES } from '@/utils/helpers';

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, isTeenMode } = useApp();
  const { unreadCount } = useInbox();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const moodLabel = MOODS.find(m => m.id === user?.mood)?.label ?? '';
  const moodEmoji = MOODS.find(m => m.id === user?.mood)?.emoji ?? '😊';
  const goalLabel = GOALS.find(g => g.id === user?.goal)?.label ?? '';
  const personalityLabel = PERSONALITIES.find(p => p.id === user?.personality)?.label ?? '';
  const slug = user?.username?.toLowerCase().replace(/[^a-z0-9]/g, '') ?? '';

  async function handleFindMatch() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    trackEvent('find_match_clicked', user?.id);
    router.push('/matching');
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 130 }}
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
        <Animated.View entering={FadeInDown.delay(80).springify()}>
          <TouchableOpacity onPress={handleFindMatch} activeOpacity={0.88} style={[styles.matchBtn, { borderRadius: colors.radius + 4 }]}>
            <LinearGradient colors={['#4CAF50', '#2E7D32']} style={styles.matchGrad}>
              <Text style={styles.matchEmoji}>🤝</Text>
              <View>
                <Text style={[styles.matchTitle, { fontFamily: 'Poppins_700Bold' }]}>Find Someone to Talk To</Text>
                <Text style={[styles.matchSub, { fontFamily: 'Inter_400Regular' }]}>Smart matching by mood, goals & interests</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(140).springify()}>
          <TouchableOpacity onPress={() => router.push('/bridge-guide')} activeOpacity={0.88} style={[styles.aiCard, { borderRadius: colors.radius + 4, overflow: 'hidden' as const }]}>
            <LinearGradient colors={['#6C63FF', '#A29BFE']} style={styles.aiGrad}>
              <View style={styles.aiLeft}>
                <View style={styles.aiAvatarWrap}>
                  <Text style={{ fontSize: 28 }}>✨</Text>
                </View>
                <View style={styles.aiInfo}>
                  <Text style={[styles.aiName, { fontFamily: 'Poppins_700Bold' }]}>BridgeGuide AI</Text>
                  <Text style={[styles.aiTagline, { fontFamily: 'Inter_400Regular' }]}>Career · Study · Habits · Culture · Chat</Text>
                  <View style={styles.aiChipsRow}>
                    {['💼 Skills', '🎓 Education', '🚀 Growth', '💬 Starters'].map(c => (
                      <View key={c} style={styles.aiChip}>
                        <Text style={[styles.aiChipText, { fontFamily: 'Inter_400Regular' }]}>{c}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
              <View style={[styles.aiArrow, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Text style={{ fontSize: 18 }}>›</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <GlassCard style={styles.inboxCard} padding={16}>
            <View style={styles.inboxTop}>
              <View style={styles.inboxLeft}>
                <Text style={{ fontSize: 24 }}>📬</Text>
                <View>
                  <Text style={[styles.inboxTitle, { color: colors.foreground, fontFamily: 'Poppins_600SemiBold' }]}>Anonymous Inbox</Text>
                  <Text style={[styles.inboxSub, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                    {unreadCount > 0 ? `${unreadCount} new message${unreadCount > 1 ? 's' : ''}` : 'Share your link and receive messages'}
                  </Text>
                </View>
              </View>
              {unreadCount > 0 && (
                <View style={[styles.inboxBadge, { backgroundColor: colors.accent }]}>
                  <Text style={styles.inboxBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
            <View style={[styles.linkPreview, { backgroundColor: colors.lavenderLight, borderRadius: 8 }]}>
              <Text style={{ fontSize: 13 }}>🔗</Text>
              <Text style={[styles.linkText, { color: colors.accent, fontFamily: 'Inter_400Regular' }]} numberOfLines={1}>
                mindbridge.app/message/{slug}
              </Text>
            </View>
            <View style={styles.inboxActions}>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/inbox')}
                style={[styles.inboxBtn, { backgroundColor: colors.lavenderLight, borderRadius: 8, flex: 1 }]}
              >
                <Text style={[styles.inboxBtnText, { color: colors.accent, fontFamily: 'Inter_600SemiBold' }]}>Open Inbox</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/send-message', params: { slug } })}
                style={[styles.inboxBtn, { backgroundColor: colors.accent, borderRadius: 8, flex: 1 }]}
              >
                <Text style={[styles.inboxBtnText, { color: '#FFFFFF', fontFamily: 'Inter_600SemiBold' }]}>📤 Share Link</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(260).springify()}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: 'Poppins_600SemiBold' }]}>Your Profile Summary</Text>
          <GlassCard style={styles.profileCard}>
            <View style={styles.profileRow}>
              <Text style={styles.profileEmoji}>{moodEmoji}</Text>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileLabel, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>Current mood</Text>
                <Text style={[styles.profileValue, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>{moodLabel || '—'}</Text>
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.profileRow}>
              <Text style={styles.profileEmoji}>🎯</Text>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileLabel, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>Conversation goal</Text>
                <Text style={[styles.profileValue, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>{goalLabel || '—'}</Text>
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.profileRow}>
              <Text style={styles.profileEmoji}>🌊</Text>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileLabel, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>Personality</Text>
                <Text style={[styles.profileValue, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>{personalityLabel || '—'}</Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: 'Poppins_600SemiBold' }]}>Quick Access</Text>
          <View style={styles.quickGrid}>
            {[
              { emoji: '🛡️', label: 'Safety Center', color: colors.safeGreenLight, textColor: colors.safeGreen, route: '/safety' },
              { emoji: '🌟', label: 'My Badges', color: colors.lavenderLight, textColor: colors.accent, route: '/(tabs)/badges' },
              { emoji: '⚙️', label: 'Admin Panel', color: '#FFF3E0', textColor: '#E65100', route: '/admin' },
              { emoji: '📝', label: 'Feedback', color: '#F0FFF4', textColor: colors.safeGreen, route: '/feedback' },
            ].map(item => (
              <TouchableOpacity
                key={item.label}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(item.route as any); }}
                style={[styles.quickItem, { backgroundColor: item.color, borderRadius: colors.radius - 4 }]}
              >
                <Text style={{ fontSize: 22 }}>{item.emoji}</Text>
                <Text style={[styles.quickItemText, { color: item.textColor, fontFamily: 'Inter_500Medium' }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(340).springify()}>
          <GlassCard style={styles.safetyNote} padding={14}>
            <Text style={{ fontSize: 15 }}>🛡️</Text>
            <Text style={[styles.safetyText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              MindBridge is not a therapy or crisis service. If you are in immediate danger, contact emergency services.
            </Text>
          </GlassCard>
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
  content: { padding: 20, gap: 16 },
  matchBtn: { overflow: 'hidden' as const },
  matchGrad: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16 },
  matchEmoji: { fontSize: 36 },
  matchTitle: { color: '#FFFFFF', fontSize: 18 },
  matchSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 3 },
  aiCard: {},
  aiGrad: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14 },
  aiLeft: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  aiAvatarWrap: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  aiInfo: { flex: 1, gap: 4 },
  aiName: { color: '#FFFFFF', fontSize: 17 },
  aiTagline: { color: 'rgba(255,255,255,0.75)', fontSize: 12 },
  aiChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 },
  aiChip: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  aiChipText: { color: '#FFFFFF', fontSize: 11 },
  aiArrow: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  inboxCard: { gap: 12 },
  inboxTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  inboxLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  inboxTitle: { fontSize: 15 },
  inboxSub: { fontSize: 12, marginTop: 2 },
  inboxBadge: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  inboxBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' as const },
  linkPreview: { flexDirection: 'row', alignItems: 'center', padding: 10, gap: 7 },
  linkText: { flex: 1, fontSize: 12 },
  inboxActions: { flexDirection: 'row', gap: 10 },
  inboxBtn: { paddingVertical: 11, alignItems: 'center' },
  inboxBtnText: { fontSize: 13 },
  sectionTitle: { fontSize: 17, marginBottom: 10 },
  profileCard: { gap: 2 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10 },
  profileEmoji: { fontSize: 22, width: 30, textAlign: 'center' },
  profileInfo: { flex: 1 },
  profileLabel: { fontSize: 11, marginBottom: 2 },
  profileValue: { fontSize: 14 },
  divider: { height: StyleSheet.hairlineWidth },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickItem: { width: '47%', flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  quickItemText: { fontSize: 13 },
  safetyNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  safetyText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
