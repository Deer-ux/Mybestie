import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Platform, Modal, TextInput, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import GlassCard from '@/components/GlassCard';
import BlobBackground from '@/components/BlobBackground';
import { getOwnerConfig, setupOwner, OwnerConfig, getDefaultPassword } from '@/utils/ownerAuth';

interface Report {
  id: string;
  reason: string;
  timestamp: string;
  partnerUsername: string;
}

const STATS = [
  { emoji: '👥', label: 'Total Users',         value: '2,847', color: '#0B3C5D' },
  { emoji: '💬', label: 'Active Chats',         value: '143',   color: '#1F6F8B' },
  { emoji: '♾️',  label: 'Conversations',        value: '18,394',color: '#6C63FF' },
  { emoji: '🚩', label: 'Flagged Today',         value: '7',     color: '#F59E0B' },
  { emoji: '✅', label: 'Resolved Today',        value: '5',     color: '#4CAF50' },
  { emoji: '🚫', label: 'Banned Users',          value: '23',    color: '#E57373' },
];

const DEMO_REPORTS: Report[] = [
  { id: '1', reason: 'Harassment',               timestamp: new Date(Date.now() - 3600000).toISOString(),  partnerUsername: 'StormCloud_447' },
  { id: '2', reason: 'Inappropriate content',    timestamp: new Date(Date.now() - 7200000).toISOString(),  partnerUsername: 'QuickFox_182'   },
  { id: '3', reason: 'Sharing personal info',    timestamp: new Date(Date.now() - 10800000).toISOString(), partnerUsername: 'BoldStar_931'   },
];

const SETTINGS = [
  { emoji: '🤖', label: 'AI Moderation',         value: 'Active',       color: '#4CAF50' },
  { emoji: '👁️', label: 'Content Scanning',       value: 'Real-time',    color: '#0B3C5D' },
  { emoji: '🚫', label: 'Auto-ban Threshold',     value: '3 reports',    color: '#F59E0B' },
  { emoji: '👻', label: 'Shadow Ban',             value: 'Enabled',      color: '#6C63FF' },
  { emoji: '🌱', label: 'Teen Mode Enforced',     value: 'Active',       color: '#1F6F8B' },
  { emoji: '🔒', label: 'Cross-age Matching',     value: 'Blocked',      color: '#E57373' },
];

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' + d.toLocaleDateString();
}

export default function AdminScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const [reports, setReports] = useState<Report[]>([]);
  const [ownerConfig, setOwnerConfig] = useState<OwnerConfig | null>(null);
  const [setupModal, setSetupModal] = useState(false);
  const [setupName, setSetupName] = useState('');
  const [setupEmail, setSetupEmail] = useState('');
  const [setupPass, setSetupPass] = useState('');
  const [setupConfirm, setSetupConfirm] = useState('');

  useEffect(() => {
    AsyncStorage.getItem('@mindbridge_reports').then(stored => {
      const userReports: Report[] = stored ? JSON.parse(stored) : [];
      setReports([...DEMO_REPORTS, ...userReports]);
    });
    getOwnerConfig().then(setOwnerConfig);
  }, []);

  async function handleSaveOwner() {
    if (!setupPass.trim() || setupPass.length < 6) {
      Alert.alert('Password too short', 'Owner password must be at least 6 characters.');
      return;
    }
    if (setupPass !== setupConfirm) {
      Alert.alert('Passwords do not match', 'Please re-enter your password.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await setupOwner(setupName || 'MindBridge Owner', setupEmail || 'owner@mindbridge.app', setupPass);
    const updated = await getOwnerConfig();
    setOwnerConfig(updated);
    setSetupModal(false);
    setSetupPass('');
    setSetupConfirm('');
    Alert.alert('Owner Setup Complete', 'Your owner account has been configured. You can now access Analytics.');
  }

  function openSetup() {
    if (ownerConfig) {
      setSetupName(ownerConfig.displayName);
      setSetupEmail(ownerConfig.email);
    } else {
      setSetupName('MindBridge Owner');
      setSetupEmail('owner@mindbridge.app');
    }
    setSetupPass('');
    setSetupConfirm('');
    setSetupModal(true);
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 60 }}
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

        {/* ── Analytics & Owner Access ─────────────────── */}
        {user?.isAdmin && (
          <Animated.View entering={FadeInDown.delay(60)}>
            <GlassCard style={styles.ownerCard} padding={18}>
              <View style={styles.ownerTop}>
                <View style={[styles.ownerIcon, { backgroundColor: colors.lavenderLight }]}>
                  <Text style={{ fontSize: 24 }}>📊</Text>
                </View>
                <View style={styles.ownerInfo}>
                  <Text style={[styles.ownerTitle, { color: colors.foreground, fontFamily: 'Poppins_600SemiBold' }]}>
                    Owner Analytics
                  </Text>
                  <Text style={[styles.ownerSub, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                    {ownerConfig
                      ? `Configured as ${ownerConfig.displayName}`
                      : 'Not configured yet. Set up your owner account below.'}
                  </Text>
                </View>
              </View>
              <View style={styles.ownerBtns}>
                <TouchableOpacity
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/analytics'); }}
                  style={[styles.ownerBtn, { borderRadius: colors.radius - 4 }]}
                >
                  <LinearGradient colors={['#0B3C5D', '#1F6F8B']} style={styles.ownerBtnGrad}>
                    <Text style={{ fontSize: 16 }}>📊</Text>
                    <Text style={[styles.ownerBtnText, { fontFamily: 'Inter_600SemiBold' }]}>View Analytics</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={openSetup}
                  style={[styles.ownerSetupBtn, { borderRadius: colors.radius - 4, borderColor: colors.border }]}
                >
                  <Ionicons name="settings-outline" size={16} color={colors.mutedForeground} />
                  <Text style={[styles.ownerSetupText, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
                    {ownerConfig ? 'Update Owner' : 'Setup Owner'}
                  </Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </Animated.View>
        )}

        {/* ── Platform Overview ────────────────────────── */}
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

        {/* ── Recent Reports ───────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: 'Poppins_600SemiBold' }]}>
            Recent Reports ({reports.length})
          </Text>
          {reports.length === 0 ? (
            <GlassCard style={styles.emptyCard}>
              <Text style={{ fontSize: 32 }}>✅</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>No reports — all clear!</Text>
            </GlassCard>
          ) : reports.map((report, i) => (
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
          ))}
        </Animated.View>

        {/* ── Moderation Settings ──────────────────────── */}
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

        {/* ── Safety Alert ─────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(450)}>
          <View style={[styles.alertsCard, { backgroundColor: colors.safeGreenLight, borderRadius: colors.radius }]}>
            <Text style={{ fontSize: 20 }}>✅</Text>
            <Text style={[styles.alertsText, { color: colors.safeGreen, fontFamily: 'Inter_500Medium' }]}>
              Teen Mode is active — teens cannot be matched with adults. Cross-age matching is fully blocked.
            </Text>
          </View>
        </Animated.View>
      </View>

      {/* ── Owner Setup Modal ─────────────────────────────── */}
      <Modal visible={setupModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: 'Poppins_600SemiBold' }]}>
                🔐 Owner Account Setup
              </Text>
              <TouchableOpacity onPress={() => setSetupModal(false)}>
                <Ionicons name="close" size={22} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalNote, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              Only the owner can access Analytics. Set a strong password and keep it private.
            </Text>

            {[
              { label: 'Display Name', value: setupName, onChange: setSetupName, placeholder: 'MindBridge Owner', secure: false },
              { label: 'Email', value: setupEmail, onChange: setSetupEmail, placeholder: 'owner@mindbridge.app', secure: false },
              { label: 'New Password (min 6 chars)', value: setupPass, onChange: setSetupPass, placeholder: 'Enter new password', secure: true },
              { label: 'Confirm Password', value: setupConfirm, onChange: setSetupConfirm, placeholder: 'Repeat password', secure: true },
            ].map(field => (
              <View key={field.label} style={styles.fieldWrap}>
                <Text style={[styles.fieldLabel, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>{field.label}</Text>
                <View style={[styles.fieldInput, { borderColor: colors.border, borderRadius: colors.radius - 6 }]}>
                  <TextInput
                    style={[styles.fieldText, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
                    value={field.value}
                    onChangeText={field.onChange}
                    placeholder={field.placeholder}
                    placeholderTextColor={colors.mutedForeground}
                    secureTextEntry={field.secure}
                    autoCapitalize="none"
                  />
                </View>
              </View>
            ))}

            <View style={[styles.defaultNote, { backgroundColor: colors.lavenderLight, borderRadius: 8 }]}>
              <Text style={{ fontSize: 13 }}>💡</Text>
              <Text style={[styles.defaultNoteText, { color: colors.accent, fontFamily: 'Inter_400Regular' }]}>
                Default password is <Text style={{ fontFamily: 'Inter_600SemiBold' }}>{getDefaultPassword()}</Text>. Change it to something private.
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleSaveOwner}
              disabled={!setupPass.trim()}
              style={[styles.saveBtn, { borderRadius: colors.radius, opacity: setupPass.trim() ? 1 : 0.4 }]}
            >
              <LinearGradient colors={['#0B3C5D', '#1F6F8B']} style={styles.saveBtnGrad}>
                <Text style={[styles.saveBtnText, { fontFamily: 'Inter_600SemiBold' }]}>Save Owner Account</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  ownerCard: { gap: 14 },
  ownerTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ownerIcon: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  ownerInfo: { flex: 1 },
  ownerTitle: { fontSize: 16 },
  ownerSub: { fontSize: 12, marginTop: 2, lineHeight: 17 },
  ownerBtns: { flexDirection: 'row', gap: 8 },
  ownerBtn: { flex: 1, overflow: 'hidden' as const },
  ownerBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 11, gap: 7 },
  ownerBtnText: { color: '#FFFFFF', fontSize: 13 },
  ownerSetupBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 11, paddingHorizontal: 14, borderWidth: 1, gap: 6 },
  ownerSetupText: { fontSize: 13 },
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
  alertsCard: { flexDirection: 'row', padding: 14, gap: 10, alignItems: 'flex-start' },
  alertsText: { flex: 1, fontSize: 13, lineHeight: 19 },
  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 14, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { fontSize: 17 },
  modalNote: { fontSize: 13, lineHeight: 19 },
  fieldWrap: { gap: 5 },
  fieldLabel: { fontSize: 13 },
  fieldInput: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 11 },
  fieldText: { fontSize: 14 },
  defaultNote: { flexDirection: 'row', alignItems: 'flex-start', padding: 10, gap: 7 },
  defaultNoteText: { flex: 1, fontSize: 12, lineHeight: 17 },
  saveBtn: { overflow: 'hidden' as const },
  saveBtnGrad: { paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: '#FFFFFF', fontSize: 15 },
});
