import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Share } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import { useInbox } from '@/context/InboxContext';
import { trackEvent } from '@/utils/analytics';
import AvatarDisplay from '@/components/AvatarDisplay';
import BlobBackground from '@/components/BlobBackground';
import GlassCard from '@/components/GlassCard';
import { MOODS, GOALS, PERSONALITIES } from '@/utils/helpers';
import colors from '@/constants/colors';

function getPublicLink(slug: string): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/message/${slug}`;
  }
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) return `https://${domain}/message/${slug}`;
  return `/message/${slug}`;
}

const PINK   = '#FF2D95';
const CYAN   = '#00D4FF';
const GREEN  = '#00FF88';
const MUTED  = 'rgba(255,255,255,0.50)';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user, isTeenMode } = useApp();
  const { unreadCount } = useInbox();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const [copied, setCopied] = useState(false);

  const moodLabel       = MOODS.find(m => m.id === user?.mood)?.label ?? '';
  const moodEmoji       = MOODS.find(m => m.id === user?.mood)?.emoji ?? '😊';
  const goalLabel       = GOALS.find(g => g.id === user?.goal)?.label ?? '';
  const personalityLabel = PERSONALITIES.find(p => p.id === user?.personality)?.label ?? '';
  const slug = user?.username?.toLowerCase().replace(/[^a-z0-9]/g, '') ?? '';
  const publicLink = getPublicLink(slug);

  async function handleCopyLink() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent('copy_link_clicked');
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(publicLink);
      } catch {
        await Share.share({ message: publicLink });
      }
    } else {
      await Share.share({ message: publicLink, url: publicLink });
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function handleShareLink() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    trackEvent('share_link_clicked');
    await Share.share({
      message: `Send me an anonymous message — I won't know who it's from 👀\n${publicLink}`,
      url: publicLink,
    });
  }

  async function handleFindMatch() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    trackEvent('find_match_clicked', user?.id);
    router.push('/matching');
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 130 }}
      showsVerticalScrollIndicator={false}
    >
      <BlobBackground />

      {/* ── Header ──────────────────────────────── */}
      <LinearGradient
        colors={['#0B0B0F', '#150A1E']}
        style={[styles.header, { paddingTop: topPad + 20 }]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Welcome back 👋</Text>
            <Text style={styles.username}>{user?.username}</Text>
          </View>
          {user && <AvatarDisplay iconIndex={user.iconIndex} colorIndex={user.colorIndex} size={50} showRing />}
        </View>

        <View style={styles.chipsRow}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{moodEmoji} {moodLabel}</Text>
          </View>
          {isTeenMode && (
            <View style={[styles.chip, { borderColor: 'rgba(0,255,136,0.35)', backgroundColor: 'rgba(0,255,136,0.08)' }]}>
              <Text style={[styles.chipText, { color: GREEN }]}>🌱 Teen Mode</Text>
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
              {i > 0 && <View style={styles.statDivider} />}
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      </LinearGradient>

      <View style={styles.content}>

        {/* ── Find Match ───────────────────────── */}
        <Animated.View entering={FadeInDown.delay(80).springify()}>
          <TouchableOpacity onPress={handleFindMatch} activeOpacity={0.88} style={styles.matchBtnWrap}>
            <LinearGradient
              colors={colors.gradPrimary}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.matchBtn}
            >
              <Text style={{ fontSize: 34 }}>🤝</Text>
              <View>
                <Text style={styles.matchTitle}>Find Someone to Talk To</Text>
                <Text style={styles.matchSub}>Smart matching by mood, goals & interests</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* ── BridgeGuide AI ───────────────────── */}
        <Animated.View entering={FadeInDown.delay(140).springify()}>
          <TouchableOpacity
            onPress={() => router.push('/bridge-guide')}
            activeOpacity={0.88}
            style={styles.aiCardWrap}
          >
            <LinearGradient
              colors={['#1A0B2E', '#2D1554']}
              style={styles.aiCard}
            >
              <View style={styles.aiLeft}>
                <View style={styles.aiIconWrap}>
                  <Text style={{ fontSize: 28 }}>✨</Text>
                </View>
                <View style={styles.aiInfo}>
                  <Text style={styles.aiName}>Bestie AI</Text>
                  <Text style={styles.aiTagline}>Career · Health · Travel · Business · Life</Text>
                  <View style={styles.aiChipsRow}>
                    {['💼 Career', '❤️ Health', '🎓 Study', '🤖 Tech', '🌟 Life'].map(c => (
                      <View key={c} style={styles.aiChip}>
                        <Text style={styles.aiChipText}>{c}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
              <View style={styles.aiArrow}>
                <Text style={{ color: PINK, fontSize: 20 }}>›</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Anonymous Inbox ──────────────────── */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <GlassCard padding={16} style={styles.inboxCard}>
            <View style={styles.inboxTop}>
              <View style={styles.inboxLeft}>
                <Text style={{ fontSize: 24 }}>📬</Text>
                <View>
                  <Text style={styles.inboxTitle}>Anonymous Inbox</Text>
                  <Text style={styles.inboxSub}>
                    {unreadCount > 0 ? `${unreadCount} new message${unreadCount > 1 ? 's' : ''}` : 'Share your link & receive messages'}
                  </Text>
                </View>
              </View>
              {unreadCount > 0 && (
                <View style={styles.inboxBadge}>
                  <Text style={styles.inboxBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity onPress={handleCopyLink} style={styles.linkPreview} activeOpacity={0.75}>
              <Text style={{ fontSize: 13 }}>🔗</Text>
              <Text style={styles.linkText} numberOfLines={1}>{publicLink}</Text>
              <Text style={[styles.copyHint, copied && styles.copyHintDone]}>
                {copied ? '✓ Copied!' : 'Tap to copy'}
              </Text>
            </TouchableOpacity>

            <View style={styles.inboxActions}>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/inbox')}
                style={styles.inboxBtnOutline}
              >
                <Text style={styles.inboxBtnOutlineText}>Open Inbox</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleShareLink}
                style={styles.inboxBtnFill}
              >
                <LinearGradient colors={colors.gradPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.inboxBtnGrad}>
                  <Text style={styles.inboxBtnFillText}>📤 Share Link</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </Animated.View>

        {/* ── Profile Summary ──────────────────── */}
        <Animated.View entering={FadeInDown.delay(260).springify()}>
          <Text style={styles.sectionTitle}>YOUR PROFILE</Text>
          <GlassCard padding={0} style={{ overflow: 'hidden' as const }}>
            {[
              { emoji: moodEmoji, label: 'Current mood', value: moodLabel || '—' },
              { emoji: '🎯', label: 'Conversation goal', value: goalLabel || '—' },
              { emoji: '🌊', label: 'Personality', value: personalityLabel || '—' },
            ].map((row, i, arr) => (
              <View key={row.label} style={[styles.profileRow, i < arr.length - 1 && styles.profileDivider]}>
                <Text style={{ fontSize: 22 }}>{row.emoji}</Text>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileLabel}>{row.label}</Text>
                  <Text style={styles.profileValue}>{row.value}</Text>
                </View>
              </View>
            ))}
          </GlassCard>
        </Animated.View>

        {/* ── Quick Access ──────────────────────── */}
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <Text style={styles.sectionTitle}>QUICK ACCESS</Text>
          <View style={styles.quickGrid}>
            {[
              { emoji: '🛡️', label: 'Safety Center',  bg: 'rgba(0,255,136,0.08)', col: GREEN,   route: '/safety'          },
              { emoji: '🌟', label: 'My Badges',       bg: 'rgba(255,45,149,0.08)', col: PINK,   route: '/(tabs)/badges'   },
              ...(user?.isAdmin ? [{ emoji: '⚙️', label: 'Admin Panel', bg: 'rgba(0,212,255,0.08)', col: CYAN, route: '/admin' as const }] : []),
              { emoji: '📝', label: 'Feedback',        bg: 'rgba(255,255,255,0.05)', col: MUTED, route: '/feedback'        },
            ].map(item => (
              <TouchableOpacity
                key={item.label}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(item.route as any); }}
                style={[styles.quickItem, {
                  backgroundColor: item.bg,
                  borderColor: item.col + '30',
                }]}
              >
                <Text style={{ fontSize: 22 }}>{item.emoji}</Text>
                <Text style={[styles.quickItemText, { color: item.col }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(340).springify()}>
          <GlassCard padding={14} style={styles.safetyNote}>
            <Text style={{ fontSize: 15 }}>🛡️</Text>
            <Text style={styles.safetyText}>
              MyBestie is not a therapy or crisis service. If you are in immediate danger, contact emergency services.
            </Text>
          </GlassCard>
        </Animated.View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  header: { paddingHorizontal: 20, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  greeting: { color: MUTED, fontSize: 13, fontFamily: 'Inter_400Regular' },
  username: { color: '#FFFFFF', fontSize: 22, fontFamily: 'SpaceGrotesk_700Bold' },
  chipsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,45,149,0.30)', backgroundColor: 'rgba(255,45,149,0.08)',
  },
  chipText: { color: PINK, fontSize: 13, fontFamily: 'Inter_500Medium' },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { color: '#FFFFFF', fontSize: 24, fontFamily: 'SpaceGrotesk_700Bold' },
  statLabel: { color: MUTED, fontSize: 11, marginTop: 2, fontFamily: 'Inter_400Regular' },
  statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.10)' },

  content: { padding: 20, gap: 16 },
  sectionTitle: { color: MUTED, fontSize: 11, fontFamily: 'SpaceGrotesk_600SemiBold', letterSpacing: 2, marginBottom: 8 },

  matchBtnWrap: {
    borderRadius: 20, overflow: 'hidden' as const,
    shadowColor: PINK, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.40, shadowRadius: 20, elevation: 10,
  },
  matchBtn: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16 },
  matchTitle: { color: '#FFFFFF', fontSize: 17, fontFamily: 'SpaceGrotesk_700Bold' },
  matchSub: { color: 'rgba(255,255,255,0.70)', fontSize: 12, marginTop: 3, fontFamily: 'Inter_400Regular' },

  aiCardWrap: { borderRadius: 20, overflow: 'hidden' as const, borderWidth: 1, borderColor: 'rgba(123,44,255,0.30)' },
  aiCard: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14 },
  aiLeft: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  aiIconWrap: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: 'rgba(123,44,255,0.25)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(123,44,255,0.40)',
  },
  aiInfo: { flex: 1, gap: 3 },
  aiName: { color: '#FFFFFF', fontSize: 16, fontFamily: 'SpaceGrotesk_700Bold' },
  aiTagline: { color: MUTED, fontSize: 12, fontFamily: 'Inter_400Regular' },
  aiChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  aiChip: { backgroundColor: 'rgba(255,45,149,0.15)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  aiChipText: { color: PINK, fontSize: 11, fontFamily: 'Inter_500Medium' },
  aiArrow: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,45,149,0.12)' },

  inboxCard: { gap: 12 },
  inboxTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  inboxLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  inboxTitle: { color: '#FFFFFF', fontSize: 15, fontFamily: 'SpaceGrotesk_600SemiBold' },
  inboxSub: { color: MUTED, fontSize: 12, marginTop: 2, fontFamily: 'Inter_400Regular' },
  inboxBadge: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: PINK },
  inboxBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' as const },
  linkPreview: {
    flexDirection: 'row', alignItems: 'center', padding: 10, gap: 7,
    backgroundColor: 'rgba(0,212,255,0.08)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(0,212,255,0.20)',
  },
  linkText:     { flex: 1, fontSize: 12, color: CYAN, fontFamily: 'Inter_400Regular' },
  copyHint:     { fontSize: 11, color: MUTED, fontFamily: 'Inter_400Regular' },
  copyHintDone: { color: '#00FF88' },
  inboxActions: { flexDirection: 'row', gap: 10 },
  inboxBtnOutline: {
    flex: 1, paddingVertical: 11, alignItems: 'center',
    borderRadius: 12, borderWidth: 1.5, borderColor: CYAN, backgroundColor: 'rgba(0,212,255,0.06)',
  },
  inboxBtnOutlineText: { color: CYAN, fontSize: 13, fontFamily: 'SpaceGrotesk_600SemiBold' },
  inboxBtnFill: { flex: 1, borderRadius: 12, overflow: 'hidden' as const },
  inboxBtnGrad: { paddingVertical: 11, alignItems: 'center' },
  inboxBtnFillText: { color: '#FFFFFF', fontSize: 13, fontFamily: 'SpaceGrotesk_600SemiBold' },

  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  profileDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.07)' },
  profileInfo: { flex: 1 },
  profileLabel: { color: MUTED, fontSize: 11, marginBottom: 2, fontFamily: 'Inter_400Regular' },
  profileValue: { color: '#FFFFFF', fontSize: 14, fontFamily: 'Inter_600SemiBold' },

  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickItem: {
    width: '47%', flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10,
    borderRadius: 16, borderWidth: 1,
  },
  quickItemText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },

  safetyNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  safetyText: { flex: 1, color: MUTED, fontSize: 12, lineHeight: 18, fontFamily: 'Inter_400Regular' },
});
