import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';
import GlassCard from '@/components/GlassCard';
import BlobBackground from '@/components/BlobBackground';

interface Report {
  id: string;
  reason: string;
  timestamp: string;
  partnerUsername: string;
}

const STATS = [
  { emoji: '👥', label: 'Total Users', value: '2,847', color: '#0B3C5D' },
  { emoji: '💬', label: 'Active Chats', value: '143', color: '#1F6F8B' },
  { emoji: '♾️', label: 'Total Conversations', value: '18,394', color: '#6C63FF' },
  { emoji: '🚩', label: 'Flagged Today', value: '7', color: '#F59E0B' },
  { emoji: '✅', label: 'Resolved Today', value: '5', color: '#4CAF50' },
  { emoji: '🚫', label: 'Banned Users', value: '23', color: '#E57373' },
];

const DEMO_REPORTS: Report[] = [
  { id: '1', reason: 'Harassment', timestamp: new Date(Date.now() - 3600000).toISOString(), partnerUsername: 'StormCloud_447' },
  { id: '2', reason: 'Inappropriate content', timestamp: new Date(Date.now() - 7200000).toISOString(), partnerUsername: 'QuickFox_182' },
  { id: '3', reason: 'Sharing personal info', timestamp: new Date(Date.now() - 10800000).toISOString(), partnerUsername: 'BoldStar_931' },
];

const SETTINGS = [
  { emoji: '🤖', label: 'AI Moderation', value: 'Active', color: '#4CAF50' },
  { emoji: '👁️', label: 'Content Scanning', value: 'Real-time', color: '#0B3C5D' },
  { emoji: '🚫', label: 'Auto-ban Threshold', value: '3 reports', color: '#F59E0B' },
  { emoji: '👻', label: 'Shadow Ban', value: 'Enabled', color: '#6C63FF' },
  { emoji: '🌱', label: 'Teen Mode Enforced', value: 'Active', color: '#1F6F8B' },
  { emoji: '🔒', label: 'Cross-age Matching', value: 'Blocked', color: '#E57373' },
];

export default function AdminScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [reports, setReports] = useState<Report[]>([]);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  useEffect(() => {
    AsyncStorage.getItem('@mindbridge_reports').then(stored => {
      const userReports: Report[] = stored ? JSON.parse(stored) : [];
      setReports([...DEMO_REPORTS, ...userReports]);
    });
  }, []);

  function formatTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' + d.toLocaleDateString();
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <BlobBackground variant="purple" />
      <LinearGradient colors={['#C62828', '#8E0000']} style={[styles.header, { paddingTop: topPad + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: 'Poppins_700Bold' }]}>🛡️ Moderation Dashboard</Text>
        <Text style={[styles.headerSub, { fontFamily: 'Inter_400Regular' }]}>Admin access only</Text>
      </LinearGradient>

      <View style={styles.content}>
        <Animated.View entering={FadeInDown.delay(100)}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: 'Poppins_600SemiBold' }]}>Platform Overview</Text>
          <View style={styles.statsGrid}>
            {STATS.map((stat, i) => (
              <GlassCard key={i} style={styles.statCard} padding={14}>
                <Text style={styles.statEmoji}>{stat.emoji}</Text>
                <Text style={[styles.statValue, { color: stat.color, fontFamily: 'Poppins_700Bold' }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>{stat.label}</Text>
              </GlassCard>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200)}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: 'Poppins_600SemiBold' }]}>
            Recent Reports ({reports.length})
          </Text>
          {reports.length === 0 ? (
            <GlassCard style={styles.emptyCard}>
              <Text style={{ fontSize: 32 }}>✅</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>No reports — all clear!</Text>
            </GlassCard>
          ) : (
            reports.map((report, i) => (
              <Animated.View key={report.id} entering={FadeInDown.delay(200 + i * 80)}>
                <GlassCard style={styles.reportCard} padding={14}>
                  <View style={styles.reportHeader}>
                    <View style={[styles.reportFlagWrap, { backgroundColor: '#FFF0F0' }]}>
                      <Text style={{ fontSize: 18 }}>🚩</Text>
                    </View>
                    <View style={styles.reportInfo}>
                      <Text style={[styles.reportUser, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>{report.partnerUsername}</Text>
                      <Text style={[styles.reportTime, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>{formatTime(report.timestamp)}</Text>
                    </View>
                  </View>
                  <View style={[styles.reasonTag, { backgroundColor: '#FFF0F0', borderRadius: 8 }]}>
                    <Text style={[styles.reasonText, { color: colors.destructive, fontFamily: 'Inter_600SemiBold' }]}>{report.reason}</Text>
                  </View>
                  <View style={styles.reportActions}>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.muted, borderRadius: 8 }]}>
                      <Text style={[styles.actionText, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>Dismiss</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FFF0F0', borderRadius: 8 }]}>
                      <Text style={[styles.actionText, { color: colors.destructive, fontFamily: 'Inter_500Medium' }]}>🚫 Ban User</Text>
                    </TouchableOpacity>
                  </View>
                </GlassCard>
              </Animated.View>
            ))
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(350)}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: 'Poppins_600SemiBold' }]}>Moderation Settings</Text>
          <GlassCard style={styles.settingsList}>
            {SETTINGS.map((s, i) => (
              <View key={i} style={[styles.settingRow, { borderBottomColor: colors.border }]}>
                <Text style={styles.settingEmoji}>{s.emoji}</Text>
                <Text style={[styles.settingLabel, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>{s.label}</Text>
                <View style={[styles.settingBadge, { backgroundColor: s.color + '18', borderRadius: 10 }]}>
                  <Text style={[styles.settingValue, { color: s.color, fontFamily: 'Inter_600SemiBold' }]}>{s.value}</Text>
                </View>
              </View>
            ))}
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(450)}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: 'Poppins_600SemiBold' }]}>Safety Alerts</Text>
          <View style={[styles.alertsCard, { backgroundColor: colors.safeGreenLight, borderRadius: colors.radius }]}>
            <Text style={{ fontSize: 20 }}>✅</Text>
            <Text style={[styles.alertsText, { color: colors.safeGreen, fontFamily: 'Inter_500Medium' }]}>
              Teen Mode is active — teens cannot be matched with adults. Cross-age matching is fully blocked.
            </Text>
          </View>
        </Animated.View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 24, gap: 6 },
  backBtn: { marginBottom: 10 },
  headerTitle: { color: '#FFFFFF', fontSize: 22 },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  content: { padding: 20, gap: 20 },
  sectionTitle: { fontSize: 18, marginBottom: 10 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '30%', flexGrow: 1, alignItems: 'center', gap: 5 },
  statEmoji: { fontSize: 22 },
  statValue: { fontSize: 20 },
  statLabel: { fontSize: 11, textAlign: 'center' },
  emptyCard: { alignItems: 'center', gap: 10, paddingVertical: 28 },
  emptyText: { fontSize: 14 },
  reportCard: { gap: 10, marginBottom: 8 },
  reportHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reportFlagWrap: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  reportInfo: { flex: 1 },
  reportUser: { fontSize: 14 },
  reportTime: { fontSize: 12, marginTop: 1 },
  reasonTag: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4 },
  reasonText: { fontSize: 12 },
  reportActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { paddingHorizontal: 14, paddingVertical: 8 },
  actionText: { fontSize: 13 },
  settingsList: { gap: 2 },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  settingEmoji: { fontSize: 18, width: 26, textAlign: 'center' },
  settingLabel: { flex: 1, fontSize: 13 },
  settingBadge: { paddingHorizontal: 10, paddingVertical: 4 },
  settingValue: { fontSize: 12 },
  alertsCard: { flexDirection: 'row', padding: 14, gap: 10, alignItems: 'flex-start', borderRadius: 16 },
  alertsText: { flex: 1, fontSize: 13, lineHeight: 19 },
});
