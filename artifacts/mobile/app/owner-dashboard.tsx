import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Platform, ActivityIndicator, Modal, Pressable,
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

const PINK    = '#FF2D95';
const CYAN    = '#00D4FF';
const GREEN   = '#00FF88';
const PURPLE  = '#D633FF';
const MUTED   = 'rgba(255,255,255,0.50)';
const RED     = '#FF4455';

function StatCard({ emoji, label, value, sub, color }: { emoji: string; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <GlassCard style={styles.statCard} padding={14}>
      <Text style={{ fontSize: 22 }}>{emoji}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </GlassCard>
  );
}

export default function OwnerDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useApp();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [metrics,        setMetrics]        = useState<AnalyticsMetrics | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [showLogout,     setShowLogout]     = useState(false);
  const [loggingOut,     setLoggingOut]     = useState(false);

  const isOwner = user?.role === 'owner' || user?.isAdmin === true;

  useEffect(() => {
    if (isOwner) loadMetrics();
  }, [isOwner]);

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    const m = await getMetrics();
    setMetrics(m);
    setLoading(false);
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    setShowLogout(false);
    router.replace('/');
    await logout();
  }

  // ── Access denied ─────────────────────────────────────────────────────────
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
            This page is restricted to the app owner only.
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
          <TouchableOpacity onPress={() => router.replace('/')} style={{ paddingVertical: 8 }}>
            <Text style={{ color: MUTED, fontSize: 13, fontFamily: 'Inter_500Medium' }}>← Go to landing page</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: botPad + 48 }}
        showsVerticalScrollIndicator={false}
      >
        <BlobBackground variant="purple" />

        {/* ── Header ── */}
        <LinearGradient
          colors={['#1A0B2E', '#050505']}
          style={[styles.header, { paddingTop: topPad + 16 }]}
        >
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerEmoji}>⚙️</Text>
              <View>
                <Text style={styles.headerTitle}>Owner Dashboard</Text>
                <Text style={styles.headerSub}>MyBestie · Restricted access</Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={loadMetrics} style={styles.iconBtn} activeOpacity={0.75}>
                <Ionicons name="refresh" size={20} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowLogout(true)} style={styles.iconBtn} activeOpacity={0.75}>
                <Ionicons name="log-out-outline" size={20} color="rgba(255,68,85,0.80)" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>

          {/* ── Loading ── */}
          {loading && (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={PINK} size="large" />
              <Text style={styles.loadingText}>Loading analytics…</Text>
            </View>
          )}

          {!loading && metrics && (
            <>
              {/* ── Quick Links ── */}
              <Animated.View entering={FadeInDown.delay(60)}>
                <Text style={styles.sectionTitle}>Quick Access</Text>
                <View style={styles.quickRow}>
                  {[
                    { emoji: '📊', label: 'Full Analytics', col: PINK,   bg: 'rgba(255,45,149,0.10)',  route: '/analytics'  },
                    { emoji: '🛡️', label: 'Moderation',     col: CYAN,   bg: 'rgba(0,212,255,0.10)',   route: '/admin'      },
                  ].map(item => (
                    <TouchableOpacity
                      key={item.label}
                      onPress={() => router.push(item.route as never)}
                      style={[styles.quickCard, { backgroundColor: item.bg, borderColor: item.col + '30' }]}
                      activeOpacity={0.8}
                    >
                      <Text style={{ fontSize: 26 }}>{item.emoji}</Text>
                      <Text style={[styles.quickLabel, { color: item.col }]}>{item.label}</Text>
                      <Ionicons name="chevron-forward" size={16} color={item.col} />
                    </TouchableOpacity>
                  ))}
                </View>
              </Animated.View>

              {/* ── User Growth ── */}
              <Animated.View entering={FadeInDown.delay(100)}>
                <Text style={styles.sectionTitle}>👥 Users</Text>
                <View style={styles.statsGrid}>
                  <StatCard emoji="👥" label="Total Users"  value={metrics.totalUsers}    color={CYAN}   />
                  <StatCard emoji="✨" label="New Today"    value={metrics.newToday}      color={GREEN}  />
                  <StatCard emoji="📅" label="This Week"    value={metrics.newThisWeek}   color={PINK}   />
                  <StatCard emoji="🗓️" label="This Month"   value={metrics.newThisMonth}  color={PURPLE} />
                </View>
              </Animated.View>

              {/* ── Active Users ── */}
              <Animated.View entering={FadeInDown.delay(140)}>
                <Text style={styles.sectionTitle}>🔥 Active Users</Text>
                <View style={styles.statsGrid}>
                  <StatCard emoji="⚡" label="DAU" value={metrics.dauCount} sub="Today"       color={CYAN}   />
                  <StatCard emoji="📈" label="WAU" value={metrics.wauCount} sub="This week"   color={PINK}   />
                  <StatCard emoji="🌍" label="MAU" value={metrics.mauCount} sub="This month"  color={PURPLE} />
                </View>
              </Animated.View>

              {/* ── Messaging ── */}
              <Animated.View entering={FadeInDown.delay(180)}>
                <Text style={styles.sectionTitle}>💬 Messaging</Text>
                <View style={styles.statsGrid}>
                  <StatCard emoji="📨" label="Anon Messages"  value={metrics.messagesSent}  color={CYAN}  />
                  <StatCard emoji="🔗" label="Link Visits"    value={metrics.linkVisits}    color={PINK}  />
                  <StatCard emoji="🚀" label="Chats Started"  value={metrics.chatsStarted}  color={GREEN} />
                  <StatCard emoji="✅" label="Completed"      value={metrics.chatsCompleted} color={PURPLE}/>
                </View>
              </Animated.View>

              {/* ── Engagement Funnel ── */}
              <Animated.View entering={FadeInDown.delay(220)}>
                <Text style={styles.sectionTitle}>🎯 Engagement</Text>
                <GlassCard padding={16} style={{ gap: 12 }}>
                  {[
                    { label: 'Completed Onboarding',   value: metrics.onboardingCompleted, max: metrics.totalUsers, color: GREEN  },
                    { label: 'Created Anonymous Link',  value: metrics.linksCreated,        max: metrics.totalUsers, color: CYAN   },
                    { label: 'Opened Inbox',            value: metrics.inboxOpened,         max: metrics.totalUsers, color: PURPLE },
                    { label: 'Found a Match',           value: metrics.findMatchClicked,    max: metrics.totalUsers, color: PINK   },
                  ].map(row => {
                    const pct = metrics.totalUsers > 0 ? Math.round((row.value / metrics.totalUsers) * 100) : 0;
                    return (
                      <View key={row.label} style={{ gap: 6 }}>
                        <View style={styles.funnelRow}>
                          <Text style={styles.funnelLabel}>{row.label}</Text>
                          <Text style={[styles.funnelValue, { color: row.color }]}>{row.value.toLocaleString()}</Text>
                          <Text style={[styles.funnelPct, { color: row.color }]}>{pct}%</Text>
                        </View>
                        <View style={styles.barBg}>
                          <View style={[styles.barFill, { width: `${Math.min(pct, 100)}%` as any, backgroundColor: row.color }]} />
                        </View>
                      </View>
                    );
                  })}
                </GlassCard>
              </Animated.View>

              {/* ── AI Usage ── */}
              <Animated.View entering={FadeInDown.delay(260)}>
                <Text style={styles.sectionTitle}>✨ BridgeGuide AI</Text>
                <View style={styles.statsGrid}>
                  <StatCard emoji="🤖" label="Questions Asked" value={metrics.bridgeGuideQuestions} color={CYAN} />
                  <StatCard emoji="👥" label="AI Users"        value={metrics.bridgeGuideUsers}      color={PINK} />
                </View>
              </Animated.View>

              {/* ── Viral Growth ── */}
              <Animated.View entering={FadeInDown.delay(300)}>
                <Text style={styles.sectionTitle}>🚀 Viral Growth</Text>
                <View style={styles.statsGrid}>
                  <StatCard emoji="🎉" label="Viral Signups"  value={metrics.viralRegistrations}              color={GREEN}  />
                  <StatCard emoji="📊" label="Conversion"     value={`${metrics.conversionRate}%`}            color={CYAN}   />
                </View>
              </Animated.View>

              {/* ── Privacy notice ── */}
              <Animated.View entering={FadeInDown.delay(340)}>
                <GlassCard padding={14} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                  <Text style={{ fontSize: 16 }}>🛡️</Text>
                  <Text style={{ flex: 1, fontSize: 12, lineHeight: 18, color: MUTED, fontFamily: 'Inter_400Regular' }}>
                    Analytics are aggregated and anonymised. No private messages, anonymous message content, or user identities are displayed.
                  </Text>
                </GlassCard>
              </Animated.View>
            </>
          )}
        </View>
      </ScrollView>

      {/* ── Logout Confirm Modal ── */}
      <Modal visible={showLogout} transparent animationType="fade" onRequestClose={() => setShowLogout(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => !loggingOut && setShowLogout(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={[styles.modalIcon, { backgroundColor: 'rgba(255,68,85,0.12)' }]}>
              <Text style={{ fontSize: 32 }}>🚪</Text>
            </View>
            <Text style={styles.modalTitle}>Log Out?</Text>
            <Text style={styles.modalBody}>
              You will be returned to the landing page. Your owner session will be fully cleared.
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity
                onPress={() => setShowLogout(false)}
                disabled={loggingOut}
                style={styles.cancelBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleLogout}
                disabled={loggingOut}
                style={[styles.confirmBtn, { opacity: loggingOut ? 0.6 : 1 }]}
                activeOpacity={0.85}
              >
                <Text style={styles.confirmText}>{loggingOut ? 'Logging out…' : 'Log Out'}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#050505' },
  header: {
    paddingHorizontal: 20, paddingBottom: 20,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerEmoji:   { fontSize: 28 },
  headerTitle:   { color: '#FFFFFF', fontSize: 20, fontFamily: 'SpaceGrotesk_700Bold' },
  headerSub:     { color: MUTED, fontSize: 12, marginTop: 1, fontFamily: 'Inter_400Regular' },
  headerActions: { flexDirection: 'row', gap: 4 },
  iconBtn:       { padding: 8 },

  content:       { padding: 20, gap: 20 },
  loadingWrap:   { alignItems: 'center', paddingTop: 60, gap: 14 },
  loadingText:   { color: MUTED, fontSize: 14, fontFamily: 'Inter_400Regular' },

  sectionTitle:  { color: '#FFFFFF', fontSize: 16, fontFamily: 'SpaceGrotesk_700Bold', marginBottom: 10 },
  quickRow:      { gap: 10 },
  quickCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, borderRadius: 16, borderWidth: 1,
  },
  quickLabel:    { flex: 1, fontSize: 15, fontFamily: 'SpaceGrotesk_600SemiBold' },

  statsGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard:      { width: '47%', flexGrow: 1, alignItems: 'center', gap: 5 },
  statValue:     { fontSize: 26, fontFamily: 'SpaceGrotesk_700Bold' },
  statLabel:     { fontSize: 11, color: MUTED, textAlign: 'center', fontFamily: 'Inter_400Regular' },
  statSub:       { fontSize: 10, color: 'rgba(255,255,255,0.30)', fontFamily: 'Inter_400Regular' },

  funnelRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  funnelLabel:   { flex: 1, fontSize: 12, color: '#FFFFFF', fontFamily: 'Inter_500Medium' },
  funnelValue:   { fontSize: 12, fontFamily: 'SpaceGrotesk_600SemiBold' },
  funnelPct:     { fontSize: 11, fontFamily: 'Inter_500Medium', minWidth: 30, textAlign: 'right' },
  barBg:         { height: 5, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' },
  barFill:       { height: 5, borderRadius: 3 },

  modalBackdrop: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.72)', paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%', maxWidth: 360,
    backgroundColor: '#131318', borderRadius: 24, padding: 28,
    alignItems: 'center', gap: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
  },
  modalIcon:     { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  modalTitle:    { color: '#FFFFFF', fontSize: 20, fontFamily: 'SpaceGrotesk_700Bold', textAlign: 'center' },
  modalBody:     { color: MUTED, fontSize: 14, lineHeight: 21, textAlign: 'center', fontFamily: 'Inter_400Regular' },
  modalBtns:     { flexDirection: 'row', gap: 12, marginTop: 8, width: '100%' },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  cancelText:    { color: '#FFFFFF', fontSize: 15, fontFamily: 'SpaceGrotesk_600SemiBold' },
  confirmBtn:    { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: RED },
  confirmText:   { color: '#FFFFFF', fontSize: 15, fontFamily: 'SpaceGrotesk_700Bold' },
});
