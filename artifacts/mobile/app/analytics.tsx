import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Platform, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useApp } from '@/context/AppContext';
import GlassCard from '@/components/GlassCard';
import BlobBackground from '@/components/BlobBackground';
import { getMetrics, AnalyticsMetrics } from '@/utils/analytics';
import colors from '@/constants/colors';

const PINK  = '#FF2D95';
const CYAN  = '#00D4FF';
const GREEN = '#00FF88';
const LAVENDER = '#7B2CFF';
const MUTED = 'rgba(255,255,255,0.50)';

// ─── Mini bar chart ──────────────────────────────────────────────────────────

function BarChart({ values, labels, color }: { values: number[]; labels: string[]; color: string }) {
  const max = Math.max(...values, 1);
  return (
    <View style={{ gap: 6 }}>
      <View style={chart.barRow}>
        {values.map((v, i) => (
          <View key={i} style={chart.barCol}>
            <View style={[chart.bar, { height: Math.max((v / max) * 70, 3), backgroundColor: color + 'CC' }]} />
          </View>
        ))}
      </View>
      <View style={chart.labelRow}>
        {labels.map((l, i) => <Text key={i} style={chart.label}>{l}</Text>)}
      </View>
    </View>
  );
}

const chart = StyleSheet.create({
  barRow: { flexDirection: 'row', alignItems: 'flex-end', height: 70, gap: 3 },
  barCol: { flex: 1, justifyContent: 'flex-end' },
  bar: { borderRadius: 4, width: '100%' },
  labelRow: { flexDirection: 'row' },
  label: { flex: 1, textAlign: 'center', fontSize: 10, color: MUTED, fontFamily: 'Inter_400Regular' },
});

// ─── Horizontal progress bar ─────────────────────────────────────────────────

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  return (
    <View style={{ height: 8, backgroundColor: color + '20', borderRadius: 4, overflow: 'hidden' as const }}>
      <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: color, borderRadius: 4 }} />
    </View>
  );
}

// ─── Metric card ─────────────────────────────────────────────────────────────

function MetricCard({ emoji, label, value, sub, color }: {
  emoji: string; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <GlassCard style={mc.card} padding={14}>
      <Text style={mc.emoji}>{emoji}</Text>
      <Text style={[mc.value, { color }]}>{typeof value === 'number' ? value.toLocaleString() : value}</Text>
      <Text style={mc.label}>{label}</Text>
      {sub && <Text style={mc.sub}>{sub}</Text>}
    </GlassCard>
  );
}

const mc = StyleSheet.create({
  card: { flex: 1, minWidth: '44%', alignItems: 'center', gap: 3 },
  emoji: { fontSize: 22 },
  value: { fontSize: 22, fontFamily: 'SpaceGrotesk_700Bold' },
  label: { fontSize: 11, color: MUTED, textAlign: 'center', fontFamily: 'Inter_500Medium' },
  sub: { fontSize: 10, color: MUTED, textAlign: 'center', fontFamily: 'Inter_400Regular' },
});

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [loading, setLoading] = useState(false);

  const isOwner = user?.role === 'owner' || user?.isAdmin === true;

  useEffect(() => {
    if (!isOwner) return;
    loadMetrics();
  }, [isOwner]);

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    const m = await getMetrics();
    setMetrics(m);
    setLoading(false);
  }, []);

  // ── Access Denied — not an owner ──────────────────────────────────────────
  if (!isOwner) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center', padding: 32 }]}>
        <BlobBackground variant="purple" />
        <Animated.View entering={FadeInDown.springify()} style={{ alignItems: 'center', gap: 18 }}>
          <Text style={{ fontSize: 56 }}>🚫</Text>
          <Text style={{ color: '#FFFFFF', fontSize: 22, fontFamily: 'SpaceGrotesk_700Bold', textAlign: 'center' }}>
            Access Denied
          </Text>
          <Text style={{ color: MUTED, fontSize: 14, lineHeight: 21, textAlign: 'center', fontFamily: 'Inter_400Regular' }}>
            This page is restricted to the app owner. If you are the owner, please log in with your owner credentials.
          </Text>
          <TouchableOpacity
            onPress={() => router.replace('/owner-login')}
            style={{ borderRadius: 16, overflow: 'hidden' as const, width: '100%' }}
            activeOpacity={0.88}
          >
            <LinearGradient colors={['#6C0FBF', '#2D0B6B']} style={{ paddingVertical: 15, alignItems: 'center' }}>
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontFamily: 'SpaceGrotesk_700Bold' }}>Owner Login</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()} style={{ paddingVertical: 8 }}>
            <Text style={{ color: MUTED, fontSize: 13, fontFamily: 'Inter_500Medium' }}>← Go back</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading || !metrics) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={CYAN} />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────

  const intentLabels: Record<string, string> = {
    skills_career: '💼 Skills & Career', education: '🎓 Education', job_opportunity: '🌟 Jobs',
    emotional_support: '❤️ Emotional', culture_history: '🌍 Culture', general: '✨ General',
    chat_suggestion: '💬 Chat Tips', habits_growth: '🚀 Habits', crisis: '🛡️ Crisis',
  };
  const totalIntents = Object.values(metrics.intentBreakdown).reduce((a, b) => a + b, 0) || 1;
  const sortedIntents = Object.entries(metrics.intentBreakdown).sort((a, b) => b[1] - a[1]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1A0B2E', '#050505']} style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>📊 Analytics</Text>
            <Text style={styles.headerSub}>Owner · Restricted View</Text>
          </View>
          <TouchableOpacity onPress={loadMetrics} style={styles.lockBtn}>
            <Ionicons name="refresh" size={20} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: botPad + 40 }} showsVerticalScrollIndicator={false}>

        <Animated.View entering={FadeInDown.delay(60)}>
          <Text style={styles.section}>👥 User Growth</Text>
          <View style={styles.cardRow}>
            <MetricCard emoji="👥" label="Total Users" value={metrics.totalUsers} color={PINK} />
            <MetricCard emoji="✨" label="New Today"   value={metrics.newToday}   color={GREEN} />
          </View>
          <View style={[styles.cardRow, { marginTop: 8 }]}>
            <MetricCard emoji="📅" label="This Week"  value={metrics.newThisWeek}  color={CYAN}    />
            <MetricCard emoji="🗓️" label="This Month" value={metrics.newThisMonth} color={LAVENDER} />
          </View>
          <GlassCard style={styles.chartCard} padding={16}>
            <Text style={styles.chartTitle}>New Users — Last 7 Days</Text>
            <BarChart values={metrics.userGrowthChart} labels={metrics.chartLabels} color={PINK} />
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100)}>
          <Text style={styles.section}>🔥 Active Users</Text>
          <View style={styles.cardRow}>
            <MetricCard emoji="⚡" label="DAU" value={metrics.dauCount} sub="Today"      color={CYAN}    />
            <MetricCard emoji="📈" label="WAU" value={metrics.wauCount} sub="This week"  color={LAVENDER} />
            <MetricCard emoji="🌍" label="MAU" value={metrics.mauCount} sub="This month" color={PINK}    />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(140)}>
          <Text style={styles.section}>🎯 Engagement Funnel</Text>
          <GlassCard padding={16} style={{ gap: 12 }}>
            {[
              { label: 'Registered',              value: metrics.totalUsers,          max: metrics.totalUsers, emoji: '👤', color: PINK     },
              { label: 'Completed Onboarding',    value: metrics.onboardingCompleted, max: metrics.totalUsers, emoji: '✅', color: GREEN    },
              { label: 'Created Anonymous Link',  value: metrics.linksCreated,        max: metrics.totalUsers, emoji: '🔗', color: CYAN     },
              { label: 'Shared Their Link',       value: metrics.linksShared,         max: metrics.totalUsers, emoji: '📤', color: LAVENDER },
              { label: 'Opened Inbox',            value: metrics.inboxOpened,         max: metrics.totalUsers, emoji: '📬', color: '#D633FF'},
              { label: 'Clicked "Find Someone"',  value: metrics.findMatchClicked,    max: metrics.totalUsers, emoji: '🤝', color: GREEN    },
            ].map(row => (
              <View key={row.label} style={{ gap: 5 }}>
                <View style={styles.funnelRow}>
                  <Text style={styles.funnelEmoji}>{row.emoji}</Text>
                  <Text style={styles.funnelLabel}>{row.label}</Text>
                  <Text style={[styles.funnelValue, { color: row.color }]}>{row.value.toLocaleString()}</Text>
                </View>
                <ProgressBar value={row.value} max={row.max} color={row.color} />
              </View>
            ))}
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(180)}>
          <Text style={styles.section}>💬 One-on-One Chats</Text>
          <View style={styles.cardRow}>
            <MetricCard emoji="🚀" label="Started"    value={metrics.chatsStarted}       color={PINK}  />
            <MetricCard emoji="✅" label="Completed"  value={metrics.chatsCompleted}      color={GREEN} />
            <MetricCard emoji="📊" label="Completion" value={`${metrics.chatCompletionRate}%`} color={CYAN} />
          </View>
          <GlassCard style={styles.chartCard} padding={16}>
            <Text style={styles.chartTitle}>Chats Started — Last 7 Days</Text>
            <BarChart values={metrics.chatsChart} labels={metrics.chartLabels} color={GREEN} />
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(220)}>
          <Text style={styles.section}>📬 Anonymous Messaging</Text>
          <View style={styles.cardRow}>
            <MetricCard emoji="📨" label="Messages Sent" value={metrics.messagesSent} color={CYAN}    />
            <MetricCard emoji="🔗" label="Link Visits"   value={metrics.linkVisits}   color={LAVENDER} />
          </View>
          <GlassCard style={styles.chartCard} padding={16}>
            <Text style={styles.chartTitle}>Anonymous Messages — Last 7 Days</Text>
            <BarChart values={metrics.messagesChart} labels={metrics.chartLabels} color={CYAN} />
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(260)}>
          <Text style={styles.section}>✨ Bestie AI Usage</Text>
          <View style={styles.cardRow}>
            <MetricCard emoji="🤖" label="Questions Asked" value={metrics.bridgeGuideQuestions} color={CYAN}    />
            <MetricCard emoji="👥" label="AI Users"        value={metrics.bridgeGuideUsers}      color={PINK}    />
          </View>
          <GlassCard padding={16} style={{ gap: 12 }}>
            <Text style={styles.chartTitle}>Question Categories</Text>
            {sortedIntents.slice(0, 7).map(([intent, count]) => (
              <View key={intent} style={{ gap: 5 }}>
                <View style={styles.funnelRow}>
                  <Text style={styles.funnelLabel}>{intentLabels[intent] ?? intent}</Text>
                  <Text style={[styles.funnelValue, { color: CYAN }]}>{Math.round((count / totalIntents) * 100)}%</Text>
                </View>
                <ProgressBar value={count} max={totalIntents} color={CYAN} />
              </View>
            ))}
          </GlassCard>
          <GlassCard style={styles.chartCard} padding={16}>
            <Text style={styles.chartTitle}>AI Questions — Last 7 Days</Text>
            <BarChart values={metrics.aiUsageChart} labels={metrics.chartLabels} color={LAVENDER} />
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300)}>
          <Text style={styles.section}>🚀 Viral Growth</Text>
          <View style={styles.cardRow}>
            <MetricCard emoji="🔗" label="Link Visits"    value={metrics.linkVisits}          color={PINK}  />
            <MetricCard emoji="🎉" label="Viral Signups"  value={metrics.viralRegistrations}  color={GREEN} />
            <MetricCard emoji="📊" label="Conversion"     value={`${metrics.conversionRate}%`} color={CYAN} />
          </View>
          <GlassCard padding={14} style={{ gap: 8 }}>
            {[
              { emoji: '👁️', label: 'Anonymous link visits', value: metrics.linkVisits,         max: metrics.linkVisits, color: PINK  },
              { emoji: '📨', label: 'Sent a message',         value: metrics.messagesSent,       max: metrics.linkVisits, color: CYAN  },
              { emoji: '🎉', label: 'Registered after sending', value: metrics.viralRegistrations, max: metrics.linkVisits, color: GREEN },
            ].map(row => (
              <React.Fragment key={row.label}>
                <View style={styles.funnelRow}>
                  <Text style={styles.funnelEmoji}>{row.emoji}</Text>
                  <Text style={styles.funnelLabel}>{row.label}</Text>
                  <Text style={[styles.funnelValue, { color: row.color }]}>{row.value.toLocaleString()}</Text>
                </View>
                <ProgressBar value={row.value} max={row.max} color={row.color} />
              </React.Fragment>
            ))}
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(340)}>
          <GlassCard padding={14} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
            <Text style={{ fontSize: 16 }}>🛡️</Text>
            <Text style={{ flex: 1, fontSize: 12, lineHeight: 18, color: MUTED, fontFamily: 'Inter_400Regular' }}>
              Analytics are aggregated and anonymised. No private chat messages, anonymous message content, or user identities are displayed.
            </Text>
          </GlassCard>
        </Animated.View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#050505' },
  loadingText:  { color: MUTED, fontSize: 14, marginTop: 12, fontFamily: 'Inter_400Regular' },
  header:       { paddingHorizontal: 18, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  headerRow:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn:      { padding: 4 },
  headerCenter: { flex: 1 },
  headerTitle:  { color: '#FFFFFF', fontSize: 20, fontFamily: 'SpaceGrotesk_700Bold' },
  headerSub:    { color: MUTED, fontSize: 12, marginTop: 1, fontFamily: 'Inter_400Regular' },
  lockBtn:      { padding: 4 },
  section:      { color: '#FFFFFF', fontSize: 16, fontFamily: 'SpaceGrotesk_700Bold', marginBottom: 10 },
  cardRow:      { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chartCard:    { marginTop: 8 },
  chartTitle:   { color: '#FFFFFF', fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: 10 },
  funnelRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  funnelEmoji:  { fontSize: 15 },
  funnelLabel:  { flex: 1, fontSize: 12, color: '#FFFFFF', fontFamily: 'Inter_500Medium' },
  funnelValue:  { fontSize: 12, fontFamily: 'SpaceGrotesk_600SemiBold' },
});
