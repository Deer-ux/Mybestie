import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';

interface Report {
  id: string;
  reason: string;
  timestamp: string;
  partnerUsername: string;
}

const DEMO_STATS = {
  totalUsers: 2847,
  activeChats: 143,
  totalConversations: 18394,
  flaggedToday: 7,
  resolvedToday: 5,
  bannedUsers: 23,
};

const DEMO_REPORTS: Report[] = [
  { id: '1', reason: 'Harassment', timestamp: new Date(Date.now() - 3600000).toISOString(), partnerUsername: 'StormCloud_447' },
  { id: '2', reason: 'Inappropriate content', timestamp: new Date(Date.now() - 7200000).toISOString(), partnerUsername: 'QuickFox_182' },
  { id: '3', reason: 'Sharing personal info', timestamp: new Date(Date.now() - 10800000).toISOString(), partnerUsername: 'BoldStar_931' },
];

export default function AdminScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [reports, setReports] = useState<Report[]>([]);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    try {
      const stored = await AsyncStorage.getItem('@mindbridge_reports');
      const userReports: Report[] = stored ? JSON.parse(stored) : [];
      setReports([...DEMO_REPORTS, ...userReports]);
    } catch {
      setReports(DEMO_REPORTS);
    }
  }

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
      <LinearGradient colors={['#C0392B', '#8E0000']} style={[styles.header, { paddingTop: topPad + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Ionicons name="shield-half-outline" size={32} color="#FFFFFF" />
          <Text style={styles.headerTitle}>Moderation Dashboard</Text>
          <Text style={styles.headerSub}>Admin access only</Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <Animated.View entering={FadeInDown.delay(100)}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Platform Overview</Text>
          <View style={styles.statsGrid}>
            {[
              { label: 'Total Users', value: DEMO_STATS.totalUsers.toLocaleString(), icon: 'people-outline', color: colors.primary },
              { label: 'Active Chats', value: DEMO_STATS.activeChats.toString(), icon: 'chatbubbles-outline', color: colors.accent },
              { label: 'Total Conversations', value: DEMO_STATS.totalConversations.toLocaleString(), icon: 'infinite-outline', color: colors.purple },
              { label: 'Flagged Today', value: DEMO_STATS.flaggedToday.toString(), icon: 'flag-outline', color: colors.warning },
              { label: 'Resolved Today', value: DEMO_STATS.resolvedToday.toString(), icon: 'checkmark-circle-outline', color: colors.accent },
              { label: 'Banned Users', value: DEMO_STATS.bannedUsers.toString(), icon: 'ban-outline', color: colors.destructive },
            ].map((stat, i) => (
              <View key={i} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
                <Ionicons name={stat.icon as keyof typeof Ionicons.glyphMap} size={20} color={stat.color} />
                <Text style={[styles.statValue, { color: colors.foreground }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200)}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Reports ({reports.length})</Text>
          {reports.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
              <Ionicons name="checkmark-circle-outline" size={32} color={colors.accent} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No reports — all clear!</Text>
            </View>
          ) : (
            reports.map((report, i) => (
              <Animated.View key={report.id} entering={FadeInDown.delay(i * 80)}>
                <View style={[styles.reportCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
                  <View style={styles.reportHeader}>
                    <View style={[styles.flagIcon, { backgroundColor: '#FFF0F0' }]}>
                      <Ionicons name="flag" size={16} color={colors.destructive} />
                    </View>
                    <View style={styles.reportInfo}>
                      <Text style={[styles.reportUser, { color: colors.foreground }]}>{report.partnerUsername}</Text>
                      <Text style={[styles.reportTime, { color: colors.mutedForeground }]}>{formatTime(report.timestamp)}</Text>
                    </View>
                  </View>
                  <View style={[styles.reasonTag, { backgroundColor: '#FFF0F0', borderRadius: 8 }]}>
                    <Text style={[styles.reasonText, { color: colors.destructive }]}>{report.reason}</Text>
                  </View>
                  <View style={styles.reportActions}>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.muted, borderRadius: 8 }]}>
                      <Text style={[styles.actionBtnText, { color: colors.mutedForeground }]}>Dismiss</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FFF0F0', borderRadius: 8 }]}>
                      <Text style={[styles.actionBtnText, { color: colors.destructive }]}>Ban User</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            ))
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400)}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Moderation Settings</Text>
          {[
            { icon: 'shield-outline', label: 'AI Moderation', value: 'Active', color: colors.accent },
            { icon: 'eye-outline', label: 'Content Scanning', value: 'Real-time', color: colors.primary },
            { icon: 'ban-outline', label: 'Auto-ban Threshold', value: '3 reports', color: colors.warning },
            { icon: 'lock-closed-outline', label: 'Shadow Ban', value: 'Enabled', color: colors.purple },
          ].map((setting, i) => (
            <View key={i} style={[styles.settingRow, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
              <Ionicons name={setting.icon as keyof typeof Ionicons.glyphMap} size={18} color={setting.color} />
              <Text style={[styles.settingLabel, { color: colors.foreground }]}>{setting.label}</Text>
              <View style={[styles.settingBadge, { backgroundColor: setting.color + '20' }]}>
                <Text style={[styles.settingValue, { color: setting.color }]}>{setting.value}</Text>
              </View>
            </View>
          ))}
        </Animated.View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 24 },
  backBtn: { marginBottom: 12 },
  headerContent: { alignItems: 'center', gap: 8 },
  headerTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' as const },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  content: { padding: 20, gap: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700' as const, marginBottom: 10 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: '30%', flexGrow: 1, alignItems: 'center', padding: 12,
    borderWidth: 1, gap: 6,
  },
  statValue: { fontSize: 20, fontWeight: '800' as const },
  statLabel: { fontSize: 11, textAlign: 'center' },
  emptyCard: { alignItems: 'center', padding: 24, borderWidth: 1, gap: 10 },
  emptyText: { fontSize: 14 },
  reportCard: { borderWidth: 1, padding: 14, gap: 10, marginBottom: 8 },
  reportHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  flagIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  reportInfo: { flex: 1 },
  reportUser: { fontSize: 14, fontWeight: '600' as const },
  reportTime: { fontSize: 12, marginTop: 2 },
  reasonTag: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4 },
  reasonText: { fontSize: 12, fontWeight: '600' as const },
  reportActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { paddingHorizontal: 14, paddingVertical: 8 },
  actionBtnText: { fontSize: 13, fontWeight: '600' as const },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderWidth: 1, gap: 12, marginBottom: 8 },
  settingLabel: { flex: 1, fontSize: 14, fontWeight: '500' as const },
  settingBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  settingValue: { fontSize: 12, fontWeight: '600' as const },
});
