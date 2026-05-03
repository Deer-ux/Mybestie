import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Platform, TextInput, Modal, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import GlassCard from '@/components/GlassCard';
import BlobBackground from '@/components/BlobBackground';
import { getMetrics, AnalyticsMetrics } from '@/utils/analytics';
import { verifyOwner, getOwnerConfig, OwnerConfig } from '@/utils/ownerAuth';

// ─── Mini bar chart ─────────────────────────────────────────────────────────

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
        {labels.map((l, i) => (
          <Text key={i} style={chart.label}>{l}</Text>
        ))}
      </View>
    </View>
  );
}

const chart = StyleSheet.create({
  barRow: { flexDirection: 'row', alignItems: 'flex-end', height: 70, gap: 3 },
  barCol: { flex: 1, justifyContent: 'flex-end' },
  bar: { borderRadius: 4, width: '100%' },
  labelRow: { flexDirection: 'row' },
  label: { flex: 1, textAlign: 'center', fontSize: 10, color: '#6B7280', fontFamily: 'Inter_400Regular' },
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
      <Text style={[mc.value, { color, fontFamily: 'Poppins_700Bold' }]}>{value.toLocaleString()}</Text>
      <Text style={[mc.label, { fontFamily: 'Inter_500Medium' }]}>{label}</Text>
      {sub && <Text style={[mc.sub, { fontFamily: 'Inter_400Regular' }]}>{sub}</Text>}
    </GlassCard>
  );
}

const mc = StyleSheet.create({
  card: { flex: 1, minWidth: '44%', alignItems: 'center', gap: 3 },
  emoji: { fontSize: 22 },
  value: { fontSize: 22 },
  label: { fontSize: 11, color: '#1F2937', textAlign: 'center' },
  sub: { fontSize: 10, color: '#6B7280', textAlign: 'center' },
});

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function AnalyticsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  // Auth gate
  const [authed, setAuthed] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [ownerConfig, setOwnerConfig] = useState<OwnerConfig | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Dashboard data
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getOwnerConfig().then(setOwnerConfig);
    // Non-admin users get immediate redirect
    if (user && !user.isAdmin) {
      router.replace('/(tabs)/home');
    }
  }, [user]);

  async function handleVerify() {
    if (!pin.trim()) { setPinError('Please enter your owner password.'); return; }
    setAuthLoading(true);
    const ok = await verifyOwner(pin);
    setAuthLoading(false);
    if (ok) {
      setAuthed(true);
      loadMetrics();
    } else {
      setPinError('Incorrect password. Try again.');
      setPin('');
    }
  }

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    const m = await getMetrics();
    setMetrics(m);
    setLoading(false);
  }, []);

  // ── Auth gate ──────────────────────────────────────────────────────────────

  if (!authed) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <BlobBackground variant="purple" />
        <LinearGradient colors={['#0B3C5D', '#1F6F8B']} style={[styles.authHeader, { paddingTop: topPad + 16 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <Text style={[styles.authTitle, { fontFamily: 'Poppins_700Bold' }]}>📊 Analytics</Text>
          <Text style={[styles.authSub, { fontFamily: 'Inter_400Regular' }]}>Owner-only access</Text>
        </LinearGradient>

        <ScrollView contentContainerStyle={[styles.authBody, { paddingBottom: botPad + 40 }]}>
          <Animated.View entering={FadeInDown.delay(100)}>
            <GlassCard style={styles.authCard} padding={24}>
              <View style={styles.shieldWrap}>
                <Text style={{ fontSize: 52 }}>🔐</Text>
              </View>
              <Text style={[styles.authCardTitle, { color: colors.primary, fontFamily: 'Poppins_700Bold' }]}>
                Owner Authentication
              </Text>
              <Text style={[styles.authCardSub, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                {ownerConfig
                  ? `Signed in as: ${ownerConfig.displayName}`
                  : 'Enter your owner password to access the analytics dashboard.'}
              </Text>

              <View style={[styles.pinInput, { borderColor: pinError ? colors.destructive : colors.border, borderRadius: colors.radius - 4 }]}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.pinText, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
                  value={pin}
                  onChangeText={t => { setPin(t); setPinError(''); }}
                  placeholder="Enter owner password"
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry
                  onSubmitEditing={handleVerify}
                  autoFocus
                />
              </View>
              {pinError !== '' && (
                <Text style={[styles.pinError, { color: colors.destructive, fontFamily: 'Inter_400Regular' }]}>{pinError}</Text>
              )}

              <TouchableOpacity
                onPress={handleVerify}
                disabled={authLoading || !pin.trim()}
                style={[styles.verifyBtn, { borderRadius: colors.radius, opacity: pin.trim() ? 1 : 0.4 }]}
              >
                <LinearGradient colors={['#0B3C5D', '#1F6F8B']} style={styles.verifyGrad}>
                  {authLoading
                    ? <ActivityIndicator color="#FFF" />
                    : <Text style={[styles.verifyText, { fontFamily: 'Inter_600SemiBold' }]}>Verify & Enter Dashboard</Text>
                  }
                </LinearGradient>
              </TouchableOpacity>

              <View style={[styles.defaultHint, { backgroundColor: colors.lavenderLight, borderRadius: 8 }]}>
                <Text style={{ fontSize: 14 }}>💡</Text>
                <Text style={[styles.hintText, { color: colors.accent, fontFamily: 'Inter_400Regular' }]}>
                  Default password: {' '}
                  <Text style={{ fontFamily: 'Inter_600SemiBold' }}>MindBridge2025</Text>
                  {'\n'}Change it in Admin → Owner Setup.
                </Text>
              </View>
            </GlassCard>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────

  if (loading || !metrics) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>Loading analytics...</Text>
      </View>
    );
  }

  const intentLabels: Record<string, string> = {
    skills_career: '💼 Skills & Career',
    education: '🎓 Education',
    job_opportunity: '🌟 Jobs',
    emotional_support: '❤️ Emotional',
    culture_history: '🌍 Culture',
    general: '✨ General',
    chat_suggestion: '💬 Chat Tips',
    habits_growth: '🚀 Habits',
    crisis: '🛡️ Crisis',
  };
  const totalIntents = Object.values(metrics.intentBreakdown).reduce((a, b) => a + b, 0) || 1;
  const sortedIntents = Object.entries(metrics.intentBreakdown).sort((a, b) => b[1] - a[1]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={['#0B3C5D', '#1F6F8B']} style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { fontFamily: 'Poppins_700Bold' }]}>📊 Analytics</Text>
            <Text style={[styles.headerSub, { fontFamily: 'Inter_400Regular' }]}>
              {ownerConfig?.displayName ?? 'Owner'} · Owner View
            </Text>
          </View>
          <TouchableOpacity onPress={() => setAuthed(false)} style={styles.lockBtn}>
            <Ionicons name="lock-closed" size={20} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={loadMetrics} style={[styles.refreshBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
          <Ionicons name="refresh" size={14} color="#FFF" />
          <Text style={[styles.refreshText, { fontFamily: 'Inter_500Medium' }]}>Refresh data</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: botPad + 40 }} showsVerticalScrollIndicator={false}>

        {/* ── User Growth ─────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(60)}>
          <Text style={[styles.section, { color: colors.foreground, fontFamily: 'Poppins_600SemiBold' }]}>👥 User Growth</Text>
          <View style={styles.cardRow}>
            <MetricCard emoji="👥" label="Total Users" value={metrics.totalUsers} color={colors.primary} />
            <MetricCard emoji="✨" label="New Today" value={metrics.newToday} color={colors.safeGreen} />
          </View>
          <View style={[styles.cardRow, { marginTop: 8 }]}>
            <MetricCard emoji="📅" label="This Week" value={metrics.newThisWeek} color={colors.accent} />
            <MetricCard emoji="🗓️" label="This Month" value={metrics.newThisMonth} color={colors.secondary} />
          </View>
          <GlassCard style={styles.chartCard} padding={16}>
            <Text style={[styles.chartTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>New Users — Last 7 Days</Text>
            <BarChart values={metrics.userGrowthChart} labels={metrics.chartLabels} color={colors.primary} />
          </GlassCard>
        </Animated.View>

        {/* ── Active Users ─────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <Text style={[styles.section, { color: colors.foreground, fontFamily: 'Poppins_600SemiBold' }]}>🔥 Active Users</Text>
          <View style={styles.cardRow}>
            <MetricCard emoji="⚡" label="DAU" value={metrics.dauCount} sub="Today" color={colors.accent} />
            <MetricCard emoji="📈" label="WAU" value={metrics.wauCount} sub="This week" color={colors.secondary} />
            <MetricCard emoji="🌍" label="MAU" value={metrics.mauCount} sub="This month" color={colors.primary} />
          </View>
        </Animated.View>

        {/* ── Engagement ────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(140)}>
          <Text style={[styles.section, { color: colors.foreground, fontFamily: 'Poppins_600SemiBold' }]}>🎯 Engagement Funnel</Text>
          <GlassCard padding={16} style={{ gap: 12 }}>
            {[
              { label: 'Registered', value: metrics.totalUsers, max: metrics.totalUsers, emoji: '👤', color: colors.primary },
              { label: 'Completed Onboarding', value: metrics.onboardingCompleted, max: metrics.totalUsers, emoji: '✅', color: colors.safeGreen },
              { label: 'Created Anonymous Link', value: metrics.linksCreated, max: metrics.totalUsers, emoji: '🔗', color: colors.accent },
              { label: 'Shared Their Link', value: metrics.linksShared, max: metrics.totalUsers, emoji: '📤', color: colors.secondary },
              { label: 'Opened Inbox', value: metrics.inboxOpened, max: metrics.totalUsers, emoji: '📬', color: colors.lavender },
              { label: 'Clicked "Find Someone"', value: metrics.findMatchClicked, max: metrics.totalUsers, emoji: '🤝', color: colors.safeGreen },
            ].map(row => (
              <View key={row.label} style={{ gap: 5 }}>
                <View style={styles.funnelRow}>
                  <Text style={styles.funnelEmoji}>{row.emoji}</Text>
                  <Text style={[styles.funnelLabel, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>{row.label}</Text>
                  <Text style={[styles.funnelValue, { color: row.color, fontFamily: 'Poppins_600SemiBold' }]}>
                    {row.value.toLocaleString()}
                  </Text>
                </View>
                <ProgressBar value={row.value} max={row.max} color={row.color} />
              </View>
            ))}
          </GlassCard>
        </Animated.View>

        {/* ── Chats ─────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(180)}>
          <Text style={[styles.section, { color: colors.foreground, fontFamily: 'Poppins_600SemiBold' }]}>💬 One-on-One Chats</Text>
          <View style={styles.cardRow}>
            <MetricCard emoji="🚀" label="Started" value={metrics.chatsStarted} color={colors.primary} />
            <MetricCard emoji="✅" label="Completed" value={metrics.chatsCompleted} color={colors.safeGreen} />
            <MetricCard emoji="📊" label="Completion" value={`${metrics.chatCompletionRate}%`} color={colors.accent} />
          </View>
          <GlassCard style={styles.chartCard} padding={16}>
            <Text style={[styles.chartTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>Chats Started — Last 7 Days</Text>
            <BarChart values={metrics.chatsChart} labels={metrics.chartLabels} color={colors.safeGreen} />
          </GlassCard>
        </Animated.View>

        {/* ── Anonymous Messaging ───────────────────────── */}
        <Animated.View entering={FadeInDown.delay(220)}>
          <Text style={[styles.section, { color: colors.foreground, fontFamily: 'Poppins_600SemiBold' }]}>📬 Anonymous Messaging</Text>
          <View style={styles.cardRow}>
            <MetricCard emoji="📨" label="Messages Sent" value={metrics.messagesSent} color={colors.accent} />
            <MetricCard emoji="🔗" label="Link Visits" value={metrics.linkVisits} color={colors.secondary} />
          </View>
          <GlassCard style={styles.chartCard} padding={16}>
            <Text style={[styles.chartTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>Anonymous Messages — Last 7 Days</Text>
            <BarChart values={metrics.messagesChart} labels={metrics.chartLabels} color={colors.accent} />
          </GlassCard>
        </Animated.View>

        {/* ── AI Usage ─────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(260)}>
          <Text style={[styles.section, { color: colors.foreground, fontFamily: 'Poppins_600SemiBold' }]}>✨ BridgeGuide AI Usage</Text>
          <View style={styles.cardRow}>
            <MetricCard emoji="🤖" label="Questions Asked" value={metrics.bridgeGuideQuestions} color={colors.accent} />
            <MetricCard emoji="👥" label="AI Users" value={metrics.bridgeGuideUsers} color={colors.primary} />
          </View>
          <GlassCard padding={16} style={{ gap: 12 }}>
            <Text style={[styles.chartTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>Question Categories</Text>
            {sortedIntents.slice(0, 7).map(([intent, count]) => (
              <View key={intent} style={{ gap: 5 }}>
                <View style={styles.funnelRow}>
                  <Text style={[styles.funnelLabel, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>
                    {intentLabels[intent] ?? intent}
                  </Text>
                  <Text style={[styles.funnelValue, { color: colors.accent, fontFamily: 'Poppins_600SemiBold' }]}>
                    {Math.round((count / totalIntents) * 100)}%
                  </Text>
                </View>
                <ProgressBar value={count} max={totalIntents} color={colors.accent} />
              </View>
            ))}
          </GlassCard>
          <GlassCard style={styles.chartCard} padding={16}>
            <Text style={[styles.chartTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>AI Questions — Last 7 Days</Text>
            <BarChart values={metrics.aiUsageChart} labels={metrics.chartLabels} color={colors.lavender} />
          </GlassCard>
        </Animated.View>

        {/* ── Viral Growth ─────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <Text style={[styles.section, { color: colors.foreground, fontFamily: 'Poppins_600SemiBold' }]}>🚀 Viral Growth</Text>
          <View style={styles.cardRow}>
            <MetricCard emoji="🔗" label="Link Visits" value={metrics.linkVisits} color={colors.primary} />
            <MetricCard emoji="🎉" label="Viral Signups" value={metrics.viralRegistrations} color={colors.safeGreen} />
            <MetricCard emoji="📊" label="Conversion" value={`${metrics.conversionRate}%`} color={colors.accent} />
          </View>
          <GlassCard padding={14} style={{ gap: 8 }}>
            <View style={styles.funnelRow}>
              <Text style={styles.funnelEmoji}>👁️</Text>
              <Text style={[styles.funnelLabel, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>Anonymous link visits</Text>
              <Text style={[styles.funnelValue, { color: colors.primary, fontFamily: 'Poppins_600SemiBold' }]}>{metrics.linkVisits.toLocaleString()}</Text>
            </View>
            <ProgressBar value={metrics.linkVisits} max={metrics.linkVisits} color={colors.primary} />
            <View style={styles.funnelRow}>
              <Text style={styles.funnelEmoji}>📨</Text>
              <Text style={[styles.funnelLabel, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>Sent a message</Text>
              <Text style={[styles.funnelValue, { color: colors.accent, fontFamily: 'Poppins_600SemiBold' }]}>{metrics.messagesSent.toLocaleString()}</Text>
            </View>
            <ProgressBar value={metrics.messagesSent} max={metrics.linkVisits} color={colors.accent} />
            <View style={styles.funnelRow}>
              <Text style={styles.funnelEmoji}>🎉</Text>
              <Text style={[styles.funnelLabel, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>Registered after sending</Text>
              <Text style={[styles.funnelValue, { color: colors.safeGreen, fontFamily: 'Poppins_600SemiBold' }]}>{metrics.viralRegistrations.toLocaleString()}</Text>
            </View>
            <ProgressBar value={metrics.viralRegistrations} max={metrics.linkVisits} color={colors.safeGreen} />
          </GlassCard>
        </Animated.View>

        {/* ── Privacy Notice ────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(340)}>
          <GlassCard padding={14} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
            <Text style={{ fontSize: 16 }}>🛡️</Text>
            <Text style={[{ flex: 1, fontSize: 12, lineHeight: 18, color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              Analytics are aggregated and anonymised. No private chat messages, anonymous message content, or user identities are displayed.
            </Text>
          </GlassCard>
        </Animated.View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  // Auth gate
  authHeader: { paddingHorizontal: 20, paddingBottom: 24, gap: 6 },
  authBody: { padding: 20, alignItems: 'center' },
  authCard: { width: '100%', alignItems: 'center', gap: 16 },
  shieldWrap: { marginTop: 8 },
  authCardTitle: { fontSize: 22, textAlign: 'center' },
  authCardSub: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  pinInput: {
    flexDirection: 'row', alignItems: 'center', width: '100%',
    borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 12, gap: 10,
  },
  pinText: { flex: 1, fontSize: 15 },
  pinError: { fontSize: 13, alignSelf: 'flex-start' },
  verifyBtn: { width: '100%', overflow: 'hidden' as const },
  verifyGrad: { paddingVertical: 15, alignItems: 'center' },
  verifyText: { color: '#FFFFFF', fontSize: 15 },
  defaultHint: { flexDirection: 'row', alignItems: 'flex-start', padding: 12, gap: 8, width: '100%' },
  hintText: { flex: 1, fontSize: 12, lineHeight: 18 },
  // Header
  header: { paddingHorizontal: 18, paddingBottom: 16, gap: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1 },
  headerTitle: { color: '#FFFFFF', fontSize: 20 },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 1 },
  lockBtn: { padding: 4 },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, gap: 5 },
  refreshText: { color: '#FFFFFF', fontSize: 12 },
  // Dashboard
  section: { fontSize: 16, marginBottom: 8 },
  cardRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chartCard: { marginTop: 8, gap: 12 },
  chartTitle: { fontSize: 13 },
  funnelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  funnelEmoji: { fontSize: 15, width: 22, textAlign: 'center' },
  funnelLabel: { flex: 1, fontSize: 12 },
  funnelValue: { fontSize: 13 },
  loadingText: { marginTop: 12, fontSize: 14 },
  authTitle: { color: '#FFFFFF', fontSize: 22 },
  authSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
});
