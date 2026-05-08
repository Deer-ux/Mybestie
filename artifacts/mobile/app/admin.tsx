import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Platform, Modal, Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import GlassCard from '@/components/GlassCard';
import BlobBackground from '@/components/BlobBackground';
import AdminNav from '@/components/AdminNav';

const PINK  = '#FF2D95';
const CYAN  = '#00D4FF';
const GREEN = '#00FF88';
const RED   = '#FF4455';
const MUTED = 'rgba(255,255,255,0.50)';

interface Report { id: string; reason: string; timestamp: string; partnerUsername: string; }

const STATS = [
  { emoji: '👥', label: 'Total Users',    value: '2,847',  color: CYAN  },
  { emoji: '💬', label: 'Active Chats',   value: '143',    color: PINK  },
  { emoji: '♾️',  label: 'Conversations',  value: '18,394', color: '#7B2CFF' },
  { emoji: '🚩', label: 'Flagged Today',  value: '7',      color: '#F59E0B' },
  { emoji: '✅', label: 'Resolved Today', value: '5',      color: GREEN },
  { emoji: '🚫', label: 'Banned Users',   value: '23',     color: RED },
];

const DEMO_REPORTS: Report[] = [
  { id: '1', reason: 'Harassment',            timestamp: new Date(Date.now() - 3600000).toISOString(),  partnerUsername: 'StormCloud_447' },
  { id: '2', reason: 'Inappropriate content', timestamp: new Date(Date.now() - 7200000).toISOString(),  partnerUsername: 'QuickFox_182'   },
  { id: '3', reason: 'Sharing personal info', timestamp: new Date(Date.now() - 10800000).toISOString(), partnerUsername: 'BoldStar_931'   },
];

const SETTINGS = [
  { emoji: '🤖', label: 'AI Moderation',       value: 'Active',    color: GREEN    },
  { emoji: '👁️', label: 'Content Scanning',     value: 'Real-time', color: CYAN     },
  { emoji: '🚫', label: 'Auto-ban Threshold',   value: '3 reports', color: '#F59E0B'},
  { emoji: '👻', label: 'Shadow Ban',           value: 'Enabled',   color: '#7B2CFF'},
  { emoji: '🌱', label: 'Teen Mode Enforced',   value: 'Active',    color: PINK     },
  { emoji: '🔒', label: 'Cross-age Matching',   value: 'Blocked',   color: RED      },
];

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' + d.toLocaleDateString();
}

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const [reports,        setReports]        = useState<Report[]>([]);
  const [dismissing,     setDismissing]     = useState<string | null>(null);
  const [showBanConfirm, setShowBanConfirm] = useState<Report | null>(null);

  const isOwner = user?.role === 'owner' || user?.isAdmin === true;

  useEffect(() => {
    AsyncStorage.getItem('@mindbridge_reports').then(stored => {
      const userReports: Report[] = stored ? JSON.parse(stored) : [];
      setReports([...DEMO_REPORTS, ...userReports]);
    });
  }, []);

  function dismiss(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDismissing(id);
    setTimeout(() => {
      setReports(prev => prev.filter(r => r.id !== id));
      setDismissing(null);
    }, 400);
  }

  // ── Access Denied ─────────────────────────────────────────────────────────
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
            The moderation dashboard is restricted to the app owner.
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

  return (
    <>
      <View style={styles.container}>
        <BlobBackground variant="purple" />

        <LinearGradient colors={['#1A0B2E', '#050505']} style={[styles.header, { paddingTop: topPad + 16 }]}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>🛡️ Moderation</Text>
              <Text style={styles.headerSub}>Owner-only · Content & safety dashboard</Text>
            </View>
          </View>
        </LinearGradient>

        <AdminNav />

        <ScrollView
          contentContainerStyle={{ paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.content}>

          {/* Platform Overview */}
          <Animated.View entering={FadeInDown.delay(60)}>
            <Text style={styles.sectionTitle}>Platform Overview</Text>
            <View style={styles.statsGrid}>
              {STATS.map((stat, i) => (
                <GlassCard key={i} style={styles.statCard} padding={14}>
                  <Text style={styles.statEmoji}>{stat.emoji}</Text>
                  <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </GlassCard>
              ))}
            </View>
          </Animated.View>

          {/* Recent Reports */}
          <Animated.View entering={FadeInDown.delay(160)}>
            <Text style={styles.sectionTitle}>Recent Reports ({reports.length})</Text>
            {reports.length === 0 ? (
              <GlassCard style={styles.emptyCard}>
                <Text style={{ fontSize: 32 }}>✅</Text>
                <Text style={styles.emptyText}>No reports — all clear!</Text>
              </GlassCard>
            ) : reports.map((report, i) => (
              <Animated.View key={report.id} entering={FadeInDown.delay(160 + i * 60)}>
                <GlassCard style={[styles.reportCard, { opacity: dismissing === report.id ? 0.4 : 1 }]} padding={14}>
                  <View style={styles.reportHeader}>
                    <View style={styles.reportFlagWrap}>
                      <Text style={{ fontSize: 18 }}>🚩</Text>
                    </View>
                    <View style={styles.reportInfo}>
                      <Text style={styles.reportUser}>{report.partnerUsername}</Text>
                      <Text style={styles.reportTime}>{formatTime(report.timestamp)}</Text>
                    </View>
                  </View>
                  <View style={styles.reasonTag}>
                    <Text style={styles.reasonText}>{report.reason}</Text>
                  </View>
                  <View style={styles.reportActions}>
                    <TouchableOpacity
                      onPress={() => dismiss(report.id)}
                      style={styles.actionDismiss}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.actionDismissText}>Dismiss</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowBanConfirm(report); }}
                      style={styles.actionBan}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.actionBanText}>🚫 Ban User</Text>
                    </TouchableOpacity>
                  </View>
                </GlassCard>
              </Animated.View>
            ))}
          </Animated.View>

          {/* Moderation Settings */}
          <Animated.View entering={FadeInDown.delay(300)}>
            <Text style={styles.sectionTitle}>Moderation Settings</Text>
            <GlassCard style={styles.settingsList}>
              {SETTINGS.map((s, i) => (
                <View key={i} style={[styles.settingRow, i < SETTINGS.length - 1 && styles.settingDivider]}>
                  <Text style={styles.settingEmoji}>{s.emoji}</Text>
                  <Text style={styles.settingLabel}>{s.label}</Text>
                  <View style={[styles.settingBadge, { backgroundColor: s.color + '18' }]}>
                    <Text style={[styles.settingValue, { color: s.color }]}>{s.value}</Text>
                  </View>
                </View>
              ))}
            </GlassCard>
          </Animated.View>

          {/* Safety Alert */}
          <Animated.View entering={FadeInDown.delay(400)}>
            <View style={styles.alertsCard}>
              <Text style={{ fontSize: 20 }}>✅</Text>
              <Text style={styles.alertsText}>
                Teen Mode is active — teens cannot be matched with adults. Cross-age matching is fully blocked.
              </Text>
            </View>
          </Animated.View>

        </View>
        </ScrollView>
      </View>

      {/* Ban Confirm Modal */}
      <Modal
        visible={showBanConfirm !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBanConfirm(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowBanConfirm(null)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={[styles.modalIcon, { backgroundColor: 'rgba(255,68,85,0.12)' }]}>
              <Text style={{ fontSize: 30 }}>🚫</Text>
            </View>
            <Text style={styles.modalTitle}>Ban User?</Text>
            <Text style={styles.modalBody}>
              Ban <Text style={{ color: '#FFFFFF', fontFamily: 'Inter_600SemiBold' }}>{showBanConfirm?.partnerUsername}</Text> for "{showBanConfirm?.reason}"? This cannot be undone.
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setShowBanConfirm(null)} style={styles.cancelBtn} activeOpacity={0.8}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (showBanConfirm) dismiss(showBanConfirm.id);
                  setShowBanConfirm(null);
                }}
                style={styles.confirmBtn}
                activeOpacity={0.85}
              >
                <Text style={styles.confirmText}>Ban User</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#050505' },
  header:       { paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  headerRow:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn:      { padding: 4 },
  headerTitle:  { color: '#FFFFFF', fontSize: 20, fontFamily: 'SpaceGrotesk_700Bold' },
  headerSub:    { color: MUTED, fontSize: 12, marginTop: 1, fontFamily: 'Inter_400Regular' },
  analyticsBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,212,255,0.25)', backgroundColor: 'rgba(0,212,255,0.08)' },
  analyticsBtnText: { color: CYAN, fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  content:      { padding: 20, gap: 20 },
  sectionTitle: { color: '#FFFFFF', fontSize: 18, marginBottom: 10, fontFamily: 'SpaceGrotesk_700Bold' },
  statsGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard:     { width: '30%', flexGrow: 1, alignItems: 'center', gap: 5 },
  statEmoji:    { fontSize: 22 },
  statValue:    { fontSize: 20, fontFamily: 'SpaceGrotesk_700Bold' },
  statLabel:    { fontSize: 11, textAlign: 'center', color: MUTED, fontFamily: 'Inter_400Regular' },
  emptyCard:    { alignItems: 'center', gap: 10, paddingVertical: 28 },
  emptyText:    { fontSize: 14, color: MUTED, fontFamily: 'Inter_400Regular' },
  reportCard:   { gap: 10, marginBottom: 8 },
  reportHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reportFlagWrap: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,68,85,0.12)' },
  reportInfo:   { flex: 1 },
  reportUser:   { fontSize: 14, color: '#FFFFFF', fontFamily: 'Inter_600SemiBold' },
  reportTime:   { fontSize: 12, marginTop: 1, color: MUTED, fontFamily: 'Inter_400Regular' },
  reasonTag:    { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(255,68,85,0.10)', borderRadius: 8 },
  reasonText:   { fontSize: 12, color: RED, fontFamily: 'Inter_600SemiBold' },
  reportActions: { flexDirection: 'row', gap: 8 },
  actionDismiss: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 10 },
  actionDismissText: { fontSize: 13, color: MUTED, fontFamily: 'Inter_500Medium' },
  actionBan:    { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: 'rgba(255,68,85,0.10)', borderRadius: 10 },
  actionBanText: { fontSize: 13, color: RED, fontFamily: 'Inter_500Medium' },
  settingsList: { gap: 2 },
  settingRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  settingDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.07)' },
  settingEmoji: { fontSize: 18, width: 26, textAlign: 'center' },
  settingLabel: { flex: 1, fontSize: 13, color: '#FFFFFF', fontFamily: 'Inter_500Medium' },
  settingBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  settingValue: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  alertsCard: {
    flexDirection: 'row', padding: 14, gap: 10, alignItems: 'flex-start',
    backgroundColor: 'rgba(0,255,136,0.08)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(0,255,136,0.20)',
  },
  alertsText:   { flex: 1, fontSize: 13, lineHeight: 19, color: GREEN, fontFamily: 'Inter_500Medium' },
  modalBackdrop: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.72)', paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%', maxWidth: 360, backgroundColor: '#131318', borderRadius: 24,
    padding: 28, alignItems: 'center', gap: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
  },
  modalIcon:    { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  modalTitle:   { color: '#FFFFFF', fontSize: 20, fontFamily: 'SpaceGrotesk_700Bold', textAlign: 'center' },
  modalBody:    { color: MUTED, fontSize: 14, lineHeight: 21, textAlign: 'center', fontFamily: 'Inter_400Regular' },
  modalBtns:    { flexDirection: 'row', gap: 12, marginTop: 8, width: '100%' },
  cancelBtn:    { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  cancelText:   { color: '#FFFFFF', fontSize: 15, fontFamily: 'SpaceGrotesk_600SemiBold' },
  confirmBtn:   { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: RED },
  confirmText:  { color: '#FFFFFF', fontSize: 15, fontFamily: 'SpaceGrotesk_700Bold' },
});
