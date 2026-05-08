import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Platform, ActivityIndicator, Modal, Pressable,
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

const PINK   = '#FF2D95';
const CYAN   = '#00D4FF';
const GREEN  = '#00FF88';
const RED    = '#FF4455';
const YELLOW = '#F59E0B';
const MUTED  = 'rgba(255,255,255,0.50)';

const REPORTS_KEY  = '@mindbridge_reports';
const REVIEWED_KEY = '@mindbridge_reviewed_reports';
const RESTRICTED_KEY = '@mindbridge_restricted_users';

interface Report {
  id: string;
  reason: string;
  timestamp: string;
  partnerUsername: string;
  details?: string;
}

type ReportStatus = 'pending' | 'reviewed' | 'restricted';

function formatTime(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(hrs / 24);
  const rel  = days > 0 ? `${days}d ago` : hrs > 0 ? `${hrs}h ago` : 'Just now';
  return `${rel} · ${d.toLocaleDateString()}`;
}

const REASON_COLORS: Record<string, string> = {
  'Harassment':           RED,
  'Inappropriate content': YELLOW,
  'Sharing personal info': YELLOW,
  'Spam':                  CYAN,
  'Abuse':                 RED,
  'Other':                 MUTED,
};

export default function AdminReportsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const [loading,     setLoading]     = useState(true);
  const [reports,     setReports]     = useState<Report[]>([]);
  const [reviewed,    setReviewed]    = useState<Set<string>>(new Set());
  const [restricted,  setRestricted]  = useState<Set<string>>(new Set());
  const [confirm,     setConfirm]     = useState<{ report: Report; action: 'review' | 'restrict' } | null>(null);
  const [filter,      setFilter]      = useState<ReportStatus | 'all'>('all');

  const isOwner = user?.role === 'owner' || user?.isAdmin === true;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [raw, revRaw, restrRaw] = await Promise.all([
        AsyncStorage.getItem(REPORTS_KEY),
        AsyncStorage.getItem(REVIEWED_KEY),
        AsyncStorage.getItem(RESTRICTED_KEY),
      ]);

      const userReports: Report[] = raw ? JSON.parse(raw) : [];
      const revSet   = new Set<string>(revRaw   ? JSON.parse(revRaw)   : []);
      const restrSet = new Set<string>(restrRaw ? JSON.parse(restrRaw) : []);

      setReports(userReports.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      setReviewed(revSet);
      setRestricted(restrSet);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (isOwner) load(); }, [isOwner, load]);

  function getStatus(r: Report): ReportStatus {
    if (restricted.has(r.partnerUsername)) return 'restricted';
    if (reviewed.has(r.id)) return 'reviewed';
    return 'pending';
  }

  async function markReviewed(report: Report) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = new Set([...reviewed, report.id]);
    await AsyncStorage.setItem(REVIEWED_KEY, JSON.stringify([...next]));
    setReviewed(next);
    setConfirm(null);
  }

  async function restrictUser(report: Report) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    const revNext   = new Set([...reviewed, report.id]);
    const restrNext = new Set([...restricted, report.partnerUsername]);
    await Promise.all([
      AsyncStorage.setItem(REVIEWED_KEY,   JSON.stringify([...revNext])),
      AsyncStorage.setItem(RESTRICTED_KEY, JSON.stringify([...restrNext])),
    ]);
    setReviewed(revNext);
    setRestricted(restrNext);
    setConfirm(null);
  }

  async function clearReviewed() {
    const remaining = reports.filter(r => !reviewed.has(r.id) && !restricted.has(r.partnerUsername));
    await Promise.all([
      AsyncStorage.setItem(REPORTS_KEY,   JSON.stringify(remaining)),
      AsyncStorage.setItem(REVIEWED_KEY,  JSON.stringify([])),
    ]);
    setReports(remaining);
    setReviewed(new Set());
  }

  if (!isOwner) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center', padding: 32 }]}>
        <BlobBackground variant="purple" />
        <Text style={{ fontSize: 52 }}>🚫</Text>
        <Text style={{ color: '#FFF', fontSize: 20, fontFamily: 'SpaceGrotesk_700Bold', marginTop: 16, textAlign: 'center' }}>Access Denied</Text>
        <TouchableOpacity onPress={() => router.replace('/owner-login')} style={{ marginTop: 20 }}>
          <Text style={{ color: CYAN, fontFamily: 'Inter_500Medium' }}>→ Owner Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const all = reports;
  const pending    = all.filter(r => getStatus(r) === 'pending');
  const revList    = all.filter(r => getStatus(r) === 'reviewed');
  const restrList  = all.filter(r => getStatus(r) === 'restricted');

  const shown = filter === 'all' ? all : filter === 'pending' ? pending : filter === 'reviewed' ? revList : restrList;

  return (
    <>
      <View style={styles.container}>
        <BlobBackground variant="purple" />
        <LinearGradient colors={['#1A0B2E', '#050505']} style={[styles.header, { paddingTop: topPad + 12 }]}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#FFF" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>🚩 Reports</Text>
              <Text style={styles.headerSub}>Owner-only · {pending.length} pending</Text>
            </View>
            <TouchableOpacity onPress={load} style={styles.iconBtn}>
              <Ionicons name="refresh" size={20} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <AdminNav />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Summary */}
          <Animated.View entering={FadeInDown.delay(40)} style={styles.statsRow}>
            {[
              { emoji: '🚩', label: 'Total',      value: all.length,       color: YELLOW },
              { emoji: '⏳', label: 'Pending',     value: pending.length,   color: RED    },
              { emoji: '✅', label: 'Reviewed',    value: revList.length,   color: GREEN  },
              { emoji: '🚫', label: 'Restricted',  value: restrList.length, color: PINK   },
            ].map(s => (
              <GlassCard key={s.label} style={styles.statCard} padding={12}>
                <Text style={{ fontSize: 18 }}>{s.emoji}</Text>
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </GlassCard>
            ))}
          </Animated.View>

          {/* Filter tabs */}
          <Animated.View entering={FadeInDown.delay(70)} style={styles.filterRow}>
            {(['all', 'pending', 'reviewed', 'restricted'] as const).map(f => (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                style={[styles.filterTab, filter === f && styles.filterTabActive]}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>

          {/* Clear reviewed */}
          {reviewed.size > 0 && (
            <Animated.View entering={FadeInDown.delay(90)}>
              <TouchableOpacity onPress={clearReviewed} style={styles.clearBtn} activeOpacity={0.8}>
                <Ionicons name="trash-outline" size={14} color={MUTED} />
                <Text style={styles.clearText}>Clear {reviewed.size} reviewed report{reviewed.size > 1 ? 's' : ''}</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Report list */}
          <Animated.View entering={FadeInDown.delay(110)}>
            <Text style={styles.sectionTitle}>
              {filter === 'all' ? 'All Reports' : filter === 'pending' ? 'Pending Reports' : filter === 'reviewed' ? 'Reviewed' : 'Restricted Users'} ({shown.length})
            </Text>

            {loading ? (
              <GlassCard style={{ alignItems: 'center', paddingVertical: 40 }}>
                <ActivityIndicator color={PINK} />
              </GlassCard>
            ) : shown.length === 0 ? (
              <GlassCard style={{ alignItems: 'center', paddingVertical: 40, gap: 10 }}>
                <Text style={{ fontSize: 36 }}>✅</Text>
                <Text style={{ color: '#FFF', fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 15 }}>
                  {filter === 'pending' ? 'No pending reports' : `No ${filter} reports`}
                </Text>
                <Text style={[styles.statLabel, { textAlign: 'center' }]}>All clear in this category.</Text>
              </GlassCard>
            ) : shown.map((report, i) => {
              const status = getStatus(report);
              const reasonColor = REASON_COLORS[report.reason] ?? MUTED;
              return (
                <Animated.View key={report.id} entering={FadeInDown.delay(120 + i * 50)}>
                  <GlassCard style={styles.reportCard} padding={14}>
                    <View style={styles.reportHeader}>
                      <View style={styles.flagWrap}>
                        <Text style={{ fontSize: 18 }}>
                          {status === 'restricted' ? '🚫' : status === 'reviewed' ? '✅' : '🚩'}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.reportUser}>{report.partnerUsername}</Text>
                        <Text style={styles.reportTime}>{formatTime(report.timestamp)}</Text>
                      </View>
                      <View style={[styles.statusBadge, {
                        backgroundColor: status === 'pending' ? 'rgba(255,159,0,0.10)' : status === 'reviewed' ? 'rgba(0,255,136,0.10)' : 'rgba(255,68,85,0.10)',
                        borderColor:     status === 'pending' ? 'rgba(255,159,0,0.25)' : status === 'reviewed' ? 'rgba(0,255,136,0.25)' : 'rgba(255,68,85,0.25)',
                      }]}>
                        <Text style={[styles.statusText, {
                          color: status === 'pending' ? YELLOW : status === 'reviewed' ? GREEN : RED,
                        }]}>{status}</Text>
                      </View>
                    </View>

                    <View style={[styles.reasonTag, { borderColor: reasonColor + '30', backgroundColor: reasonColor + '12' }]}>
                      <Text style={[styles.reasonText, { color: reasonColor }]}>{report.reason}</Text>
                    </View>

                    {report.details && (
                      <Text style={styles.detailsText} numberOfLines={2}>{report.details}</Text>
                    )}

                    {status === 'pending' && (
                      <View style={styles.actions}>
                        <TouchableOpacity
                          onPress={() => setConfirm({ report, action: 'review' })}
                          style={styles.reviewBtn}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="checkmark-outline" size={14} color={GREEN} />
                          <Text style={[styles.actionText, { color: GREEN }]}>Mark Reviewed</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => setConfirm({ report, action: 'restrict' })}
                          style={styles.restrictBtn}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="ban-outline" size={14} color={RED} />
                          <Text style={[styles.actionText, { color: RED }]}>Restrict User</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </GlassCard>
                </Animated.View>
              );
            })}
          </Animated.View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>

      {/* Confirm modal */}
      <Modal visible={confirm !== null} transparent animationType="fade" onRequestClose={() => setConfirm(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setConfirm(null)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={[styles.modalIcon, {
              backgroundColor: confirm?.action === 'restrict' ? 'rgba(255,68,85,0.12)' : 'rgba(0,255,136,0.10)',
            }]}>
              <Text style={{ fontSize: 30 }}>{confirm?.action === 'restrict' ? '🚫' : '✅'}</Text>
            </View>
            <Text style={styles.modalTitle}>
              {confirm?.action === 'restrict' ? 'Restrict User?' : 'Mark as Reviewed?'}
            </Text>
            <Text style={styles.modalBody}>
              {confirm?.action === 'restrict'
                ? `Restrict "${confirm?.report.partnerUsername}"? They will be flagged as restricted on this device.`
                : `Mark this report from "${confirm?.report.partnerUsername}" as reviewed and no further action needed?`}
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setConfirm(null)} style={styles.cancelBtn} activeOpacity={0.8}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => confirm && (confirm.action === 'restrict' ? restrictUser(confirm.report) : markReviewed(confirm.report))}
                style={[styles.confirmBtn, { backgroundColor: confirm?.action === 'restrict' ? RED : GREEN }]}
                activeOpacity={0.85}
              >
                <Text style={[styles.confirmText, { color: confirm?.action === 'restrict' ? '#FFF' : '#050505' }]}>
                  {confirm?.action === 'restrict' ? 'Restrict' : 'Mark Reviewed'}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#050505' },
  header:      { paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  headerRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn:     { padding: 4 },
  headerTitle: { color: '#FFF', fontSize: 18, fontFamily: 'SpaceGrotesk_700Bold' },
  headerSub:   { color: MUTED, fontSize: 12, marginTop: 1, fontFamily: 'Inter_400Regular' },
  iconBtn:     { padding: 8 },

  content:     { padding: 16, gap: 14 },

  statsRow:    { flexDirection: 'row', gap: 8 },
  statCard:    { flex: 1, alignItems: 'center', gap: 4 },
  statValue:   { fontSize: 20, fontFamily: 'SpaceGrotesk_700Bold' },
  statLabel:   { fontSize: 10, color: MUTED, textAlign: 'center', fontFamily: 'Inter_400Regular' },

  filterRow:   { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  filterTab:   { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  filterTabActive: { backgroundColor: 'rgba(255,45,149,0.12)', borderColor: 'rgba(255,45,149,0.35)' },
  filterText:  { color: MUTED, fontSize: 12, fontFamily: 'Inter_500Medium' },
  filterTextActive: { color: PINK, fontFamily: 'Inter_600SemiBold' },

  clearBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  clearText:   { color: MUTED, fontSize: 12, fontFamily: 'Inter_500Medium' },

  sectionTitle: { color: '#FFF', fontSize: 16, fontFamily: 'SpaceGrotesk_700Bold', marginBottom: 2 },

  reportCard:  { marginBottom: 8, gap: 10 },
  reportHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  flagWrap:    { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,68,85,0.10)' },
  reportUser:  { color: '#FFF', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  reportTime:  { color: MUTED, fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1 },
  statusText:  { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  reasonTag:   { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  reasonText:  { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  detailsText: { color: MUTED, fontSize: 12, lineHeight: 17, fontFamily: 'Inter_400Regular' },

  actions:     { flexDirection: 'row', gap: 8 },
  reviewBtn:   { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: 'rgba(0,255,136,0.08)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(0,255,136,0.22)' },
  restrictBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: 'rgba(255,68,85,0.08)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,68,85,0.22)' },
  actionText:  { fontSize: 12, fontFamily: 'Inter_600SemiBold' },

  modalBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.72)', paddingHorizontal: 24 },
  modalCard:     { width: '100%', maxWidth: 360, backgroundColor: '#131318', borderRadius: 24, padding: 28, alignItems: 'center', gap: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  modalIcon:     { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  modalTitle:    { color: '#FFF', fontSize: 20, fontFamily: 'SpaceGrotesk_700Bold', textAlign: 'center' },
  modalBody:     { color: MUTED, fontSize: 14, lineHeight: 21, textAlign: 'center', fontFamily: 'Inter_400Regular' },
  modalBtns:     { flexDirection: 'row', gap: 12, marginTop: 8, width: '100%' },
  cancelBtn:     { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  cancelText:    { color: '#FFF', fontSize: 15, fontFamily: 'SpaceGrotesk_600SemiBold' },
  confirmBtn:    { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  confirmText:   { fontSize: 15, fontFamily: 'SpaceGrotesk_700Bold' },
});
