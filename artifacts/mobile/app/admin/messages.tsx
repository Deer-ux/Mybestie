import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useApp } from '@/context/AppContext';
import GlassCard from '@/components/GlassCard';
import BlobBackground from '@/components/BlobBackground';
import AdminNav from '@/components/AdminNav';
import { getMetrics } from '@/utils/analytics';

const PINK   = '#FF2D95';
const CYAN   = '#00D4FF';
const GREEN  = '#00FF88';
const RED    = '#FF4455';
const YELLOW = '#F59E0B';
const MUTED  = 'rgba(255,255,255,0.50)';

interface InboxMessage {
  id: string;
  text: string;
  timestamp: string;
  moderationStatus?: 'approved' | 'pending' | 'rejected';
  isReported?: boolean;
  reportReason?: string;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' + d.toLocaleDateString();
}

export default function AdminMessagesScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const [loading,   setLoading]   = useState(true);
  const [stats,     setStats]     = useState({ total: 0, today: 0, reported: 0, flagged: 0, deleted: 0 });
  const [reported,  setReported]  = useState<InboxMessage[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const isOwner = user?.role === 'owner' || user?.isAdmin === true;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const metrics = await getMetrics();

      const allKeys = await AsyncStorage.getAllKeys();
      const inboxKeys = allKeys.filter(k => k.startsWith('@inbox_'));

      let allMessages: InboxMessage[] = [];
      for (const key of inboxKeys) {
        const raw = await AsyncStorage.getItem(key);
        if (raw) {
          const msgs: InboxMessage[] = JSON.parse(raw);
          allMessages = [...allMessages, ...msgs];
        }
      }

      const reportedMsgs = allMessages.filter(m => m.isReported);
      const flaggedMsgs  = allMessages.filter(m => m.moderationStatus === 'rejected');
      const deletedMsgs  = allMessages.filter(m => m.moderationStatus === 'rejected');

      setStats({
        total:   metrics.messagesSent,
        today:   metrics.newToday > 0 ? Math.round(metrics.messagesSent / 30) : 0,
        reported: reportedMsgs.length,
        flagged:  flaggedMsgs.length,
        deleted:  deletedMsgs.length,
      });
      setReported(reportedMsgs);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (isOwner) load(); }, [isOwner, load]);

  function dismiss(id: string) {
    setDismissed(prev => new Set([...prev, id]));
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

  const visibleReported = reported.filter(m => !dismissed.has(m.id));

  return (
    <View style={styles.container}>
      <BlobBackground variant="purple" />
      <LinearGradient colors={['#1A0B2E', '#050505']} style={[styles.header, { paddingTop: topPad + 12 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>💬 Messages</Text>
            <Text style={styles.headerSub}>Owner-only · Anonymous message overview</Text>
          </View>
          <TouchableOpacity onPress={load} style={styles.iconBtn}>
            <Ionicons name="refresh" size={20} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <AdminNav />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {loading ? (
          <View style={{ alignItems: 'center', paddingTop: 60, gap: 14 }}>
            <ActivityIndicator color={PINK} size="large" />
            <Text style={{ color: MUTED, fontFamily: 'Inter_400Regular', fontSize: 14 }}>Loading message data…</Text>
          </View>
        ) : (
          <>
            {/* Stats grid */}
            <Animated.View entering={FadeInDown.delay(40)}>
              <Text style={styles.sectionTitle}>Message Overview</Text>
              <View style={styles.statsGrid}>
                {[
                  { emoji: '📨', label: 'Total Anon Messages', value: stats.total,    color: CYAN   },
                  { emoji: '📅', label: 'Avg Per Day',         value: Math.round(stats.total / 30), color: GREEN  },
                  { emoji: '🚩', label: 'Reported',            value: stats.reported, color: YELLOW },
                  { emoji: '🛡️', label: 'Flagged / Rejected',  value: stats.flagged,  color: RED    },
                ].map(s => (
                  <GlassCard key={s.label} style={styles.statCard} padding={14}>
                    <Text style={{ fontSize: 22 }}>{s.emoji}</Text>
                    <Text style={[styles.statValue, { color: s.color }]}>{s.value.toLocaleString()}</Text>
                    <Text style={styles.statLabel}>{s.label}</Text>
                  </GlassCard>
                ))}
              </View>
            </Animated.View>

            {/* Policy notice */}
            <Animated.View entering={FadeInDown.delay(80)}>
              <GlassCard padding={14} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                <Text style={{ fontSize: 16 }}>🔒</Text>
                <Text style={{ flex: 1, fontSize: 12, lineHeight: 18, color: MUTED, fontFamily: 'Inter_400Regular' }}>
                  Private message content is never displayed here unless the message was reported. Only reported or flagged messages are shown below for moderation purposes.
                </Text>
              </GlassCard>
            </Animated.View>

            {/* Reported messages */}
            <Animated.View entering={FadeInDown.delay(120)}>
              <Text style={styles.sectionTitle}>🚩 Reported Messages ({visibleReported.length})</Text>
              {visibleReported.length === 0 ? (
                <GlassCard style={{ alignItems: 'center', paddingVertical: 36, gap: 10 }}>
                  <Text style={{ fontSize: 36 }}>✅</Text>
                  <Text style={{ color: '#FFF', fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 15 }}>No reported messages</Text>
                  <Text style={[styles.statLabel, { textAlign: 'center' }]}>All clear — no messages have been reported on this device.</Text>
                </GlassCard>
              ) : (
                visibleReported.map((msg, i) => (
                  <Animated.View key={msg.id} entering={FadeInDown.delay(140 + i * 50)}>
                    <GlassCard style={styles.msgCard} padding={14}>
                      <View style={styles.msgHeader}>
                        <View style={styles.flagIcon}>
                          <Text style={{ fontSize: 16 }}>🚩</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.msgId}>Message #{msg.id.slice(-6).toUpperCase()}</Text>
                          <Text style={styles.msgTime}>{formatTime(msg.timestamp)}</Text>
                        </View>
                        {msg.reportReason && (
                          <View style={styles.reasonTag}>
                            <Text style={styles.reasonText}>{msg.reportReason}</Text>
                          </View>
                        )}
                      </View>

                      {/* Content preview — only shown because it was reported */}
                      <View style={styles.msgPreview}>
                        <Text style={styles.msgLabel}>REPORTED CONTENT</Text>
                        <Text style={styles.msgText} numberOfLines={3}>{msg.text}</Text>
                      </View>

                      <View style={styles.msgActions}>
                        <TouchableOpacity onPress={() => dismiss(msg.id)} style={styles.dismissBtn} activeOpacity={0.8}>
                          <Text style={styles.dismissText}>Dismiss</Text>
                        </TouchableOpacity>
                        <View style={[styles.statusBadge, { backgroundColor: 'rgba(255,68,85,0.12)', borderColor: 'rgba(255,68,85,0.25)' }]}>
                          <Text style={[styles.statusText, { color: RED }]}>Reported</Text>
                        </View>
                      </View>
                    </GlassCard>
                  </Animated.View>
                ))
              )}
            </Animated.View>

            {/* Delivery stats */}
            <Animated.View entering={FadeInDown.delay(220)}>
              <Text style={styles.sectionTitle}>📊 Delivery Breakdown</Text>
              <GlassCard padding={16} style={{ gap: 12 }}>
                {[
                  { label: 'Delivered successfully', pct: 94, color: GREEN  },
                  { label: 'Awaiting review',         pct: 4,  color: YELLOW },
                  { label: 'Flagged / blocked',       pct: 2,  color: RED   },
                ].map(row => (
                  <View key={row.label} style={{ gap: 6 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 12, color: '#FFF', fontFamily: 'Inter_500Medium' }}>{row.label}</Text>
                      <Text style={{ fontSize: 12, color: row.color, fontFamily: 'SpaceGrotesk_600SemiBold' }}>{row.pct}%</Text>
                    </View>
                    <View style={{ height: 5, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                      <View style={{ height: 5, width: `${row.pct}%`, backgroundColor: row.color, borderRadius: 3 }} />
                    </View>
                  </View>
                ))}
              </GlassCard>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </View>
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
  sectionTitle: { color: '#FFF', fontSize: 16, fontFamily: 'SpaceGrotesk_700Bold', marginBottom: 2 },

  statsGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard:    { width: '47%', flexGrow: 1, alignItems: 'center', gap: 5 },
  statValue:   { fontSize: 24, fontFamily: 'SpaceGrotesk_700Bold' },
  statLabel:   { fontSize: 11, color: MUTED, textAlign: 'center', fontFamily: 'Inter_400Regular' },

  msgCard:     { marginBottom: 8, gap: 10 },
  msgHeader:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  flagIcon:    { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,68,85,0.12)', alignItems: 'center', justifyContent: 'center' },
  msgId:       { color: '#FFF', fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  msgTime:     { color: MUTED, fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },
  reasonTag:   { paddingHorizontal: 8, paddingVertical: 3, backgroundColor: 'rgba(255,68,85,0.10)', borderRadius: 8 },
  reasonText:  { color: RED, fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  msgPreview:  { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 10, gap: 5 },
  msgLabel:    { color: MUTED, fontSize: 9, letterSpacing: 1.5, fontFamily: 'SpaceGrotesk_600SemiBold' },
  msgText:     { color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 18, fontFamily: 'Inter_400Regular' },
  msgActions:  { flexDirection: 'row', gap: 8, alignItems: 'center' },
  dismissBtn:  { paddingHorizontal: 12, paddingVertical: 7, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 10 },
  dismissText: { color: MUTED, fontSize: 12, fontFamily: 'Inter_500Medium' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  statusText:  { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
});
