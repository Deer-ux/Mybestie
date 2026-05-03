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
import { useApp } from '@/context/AppContext';
import GlassCard from '@/components/GlassCard';
import BlobBackground from '@/components/BlobBackground';
import { getOwnerConfig, setupOwner, OwnerConfig, getDefaultPassword } from '@/utils/ownerAuth';
import colors from '@/constants/colors';

const PINK  = '#FF2D95';
const CYAN  = '#00D4FF';
const GREEN = '#00FF88';
const MUTED = 'rgba(255,255,255,0.50)';

interface Report { id: string; reason: string; timestamp: string; partnerUsername: string; }

const STATS = [
  { emoji: '👥', label: 'Total Users',    value: '2,847',  color: CYAN  },
  { emoji: '💬', label: 'Active Chats',   value: '143',    color: PINK  },
  { emoji: '♾️',  label: 'Conversations',  value: '18,394', color: '#7B2CFF' },
  { emoji: '🚩', label: 'Flagged Today',  value: '7',      color: '#F59E0B' },
  { emoji: '✅', label: 'Resolved Today', value: '5',      color: GREEN },
  { emoji: '🚫', label: 'Banned Users',   value: '23',     color: '#FF4455' },
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
  { emoji: '🔒', label: 'Cross-age Matching',   value: 'Blocked',   color: '#FF4455'},
];

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' + d.toLocaleDateString();
}

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const [reports, setReports] = useState<Report[]>([]);
  const [ownerConfig, setOwnerConfig] = useState<OwnerConfig | null>(null);
  const [setupModal, setSetupModal] = useState(false);
  const [setupName, setSetupName]   = useState('');
  const [setupEmail, setSetupEmail] = useState('');
  const [setupPass, setSetupPass]   = useState('');
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
    if (ownerConfig) { setSetupName(ownerConfig.displayName); setSetupEmail(ownerConfig.email); }
    else { setSetupName('MindBridge Owner'); setSetupEmail('owner@mindbridge.app'); }
    setSetupPass('');
    setSetupConfirm('');
    setSetupModal(true);
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 60 }}
      showsVerticalScrollIndicator={false}
    >
      <BlobBackground variant="purple" />

      <LinearGradient colors={['#1A0B2E', '#050505']} style={[styles.header, { paddingTop: topPad + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🛡️ Moderation Dashboard</Text>
        <Text style={styles.headerSub}>Admin access only</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Analytics & Owner Access */}
        {user?.isAdmin && (
          <Animated.View entering={FadeInDown.delay(60)}>
            <GlassCard style={styles.ownerCard} padding={18}>
              <View style={styles.ownerTop}>
                <View style={styles.ownerIcon}>
                  <Text style={{ fontSize: 24 }}>📊</Text>
                </View>
                <View style={styles.ownerInfo}>
                  <Text style={styles.ownerTitle}>Owner Analytics</Text>
                  <Text style={styles.ownerSub}>
                    {ownerConfig ? `Configured as ${ownerConfig.displayName}` : 'Not configured yet. Set up your owner account below.'}
                  </Text>
                </View>
              </View>
              <View style={styles.ownerBtns}>
                <TouchableOpacity
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/analytics'); }}
                  style={styles.ownerBtn}
                >
                  <LinearGradient colors={colors.gradPrimary} style={styles.ownerBtnGrad}>
                    <Text style={{ fontSize: 16 }}>📊</Text>
                    <Text style={styles.ownerBtnText}>View Analytics</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity onPress={openSetup} style={styles.ownerSetupBtn}>
                  <Ionicons name="settings-outline" size={16} color={MUTED} />
                  <Text style={styles.ownerSetupText}>{ownerConfig ? 'Update Owner' : 'Setup Owner'}</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </Animated.View>
        )}

        {/* Platform Overview */}
        <Animated.View entering={FadeInDown.delay(100)}>
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
        <Animated.View entering={FadeInDown.delay(200)}>
          <Text style={styles.sectionTitle}>Recent Reports ({reports.length})</Text>
          {reports.length === 0 ? (
            <GlassCard style={styles.emptyCard}>
              <Text style={{ fontSize: 32 }}>✅</Text>
              <Text style={styles.emptyText}>No reports — all clear!</Text>
            </GlassCard>
          ) : reports.map((report, i) => (
            <Animated.View key={report.id} entering={FadeInDown.delay(200 + i * 80)}>
              <GlassCard style={styles.reportCard} padding={14}>
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
                  <TouchableOpacity style={styles.actionDismiss}>
                    <Text style={styles.actionDismissText}>Dismiss</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBan}>
                    <Text style={styles.actionBanText}>🚫 Ban User</Text>
                  </TouchableOpacity>
                </View>
              </GlassCard>
            </Animated.View>
          ))}
        </Animated.View>

        {/* Moderation Settings */}
        <Animated.View entering={FadeInDown.delay(350)}>
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
        <Animated.View entering={FadeInDown.delay(450)}>
          <View style={styles.alertsCard}>
            <Text style={{ fontSize: 20 }}>✅</Text>
            <Text style={styles.alertsText}>
              Teen Mode is active — teens cannot be matched with adults. Cross-age matching is fully blocked.
            </Text>
          </View>
        </Animated.View>
      </View>

      {/* Owner Setup Modal */}
      <Modal visible={setupModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🔐 Owner Account Setup</Text>
              <TouchableOpacity onPress={() => setSetupModal(false)}>
                <Ionicons name="close" size={22} color={MUTED} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalNote}>Only the owner can access Analytics. Set a strong password and keep it private.</Text>
            {[
              { label: 'Display Name', value: setupName, onChange: setSetupName, placeholder: 'MindBridge Owner', secure: false },
              { label: 'Email', value: setupEmail, onChange: setSetupEmail, placeholder: 'owner@mindbridge.app', secure: false },
              { label: 'New Password (min 6 chars)', value: setupPass, onChange: setSetupPass, placeholder: 'Enter new password', secure: true },
              { label: 'Confirm Password', value: setupConfirm, onChange: setSetupConfirm, placeholder: 'Repeat password', secure: true },
            ].map(field => (
              <View key={field.label} style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                <View style={styles.fieldInput}>
                  <TextInput
                    style={styles.fieldText}
                    value={field.value}
                    onChangeText={field.onChange}
                    placeholder={field.placeholder}
                    placeholderTextColor="rgba(255,255,255,0.30)"
                    secureTextEntry={field.secure}
                    autoCapitalize="none"
                  />
                </View>
              </View>
            ))}
            <View style={styles.defaultNote}>
              <Text style={{ fontSize: 13 }}>💡</Text>
              <Text style={styles.defaultNoteText}>
                Default password is <Text style={{ fontFamily: 'Inter_600SemiBold', color: PINK }}>{getDefaultPassword()}</Text>. Change it to something private.
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleSaveOwner}
              disabled={!setupPass.trim()}
              style={[styles.saveBtn, { opacity: setupPass.trim() ? 1 : 0.4 }]}
            >
              <LinearGradient colors={colors.gradPrimary} style={styles.saveBtnGrad}>
                <Text style={styles.saveBtnText}>Save Owner Account</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  header: { paddingHorizontal: 20, paddingBottom: 24, gap: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  backBtn: { marginBottom: 10 },
  headerTitle: { color: '#FFFFFF', fontSize: 22, fontFamily: 'SpaceGrotesk_700Bold' },
  headerSub: { color: MUTED, fontSize: 13, fontFamily: 'Inter_400Regular' },
  content: { padding: 20, gap: 20 },
  ownerCard: { gap: 14 },
  ownerTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ownerIcon: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,45,149,0.15)', borderWidth: 1, borderColor: 'rgba(255,45,149,0.30)' },
  ownerInfo: { flex: 1 },
  ownerTitle: { color: '#FFFFFF', fontSize: 16, fontFamily: 'SpaceGrotesk_600SemiBold' },
  ownerSub: { color: MUTED, fontSize: 12, marginTop: 2, lineHeight: 17, fontFamily: 'Inter_400Regular' },
  ownerBtns: { flexDirection: 'row', gap: 8 },
  ownerBtn: { flex: 1, overflow: 'hidden' as const, borderRadius: 14 },
  ownerBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 11, gap: 7 },
  ownerBtnText: { color: '#FFFFFF', fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  ownerSetupBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 11, paddingHorizontal: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 14, gap: 6 },
  ownerSetupText: { color: MUTED, fontSize: 13, fontFamily: 'Inter_500Medium' },
  sectionTitle: { color: '#FFFFFF', fontSize: 18, marginBottom: 10, fontFamily: 'SpaceGrotesk_700Bold' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '30%', flexGrow: 1, alignItems: 'center', gap: 5 },
  statEmoji: { fontSize: 22 },
  statValue: { fontSize: 20, fontFamily: 'SpaceGrotesk_700Bold' },
  statLabel: { fontSize: 11, textAlign: 'center', color: MUTED, fontFamily: 'Inter_400Regular' },
  emptyCard: { alignItems: 'center', gap: 10, paddingVertical: 28 },
  emptyText: { fontSize: 14, color: MUTED, fontFamily: 'Inter_400Regular' },
  reportCard: { gap: 10, marginBottom: 8 },
  reportHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reportFlagWrap: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,68,85,0.12)' },
  reportInfo: { flex: 1 },
  reportUser: { fontSize: 14, color: '#FFFFFF', fontFamily: 'Inter_600SemiBold' },
  reportTime: { fontSize: 12, marginTop: 1, color: MUTED, fontFamily: 'Inter_400Regular' },
  reasonTag: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(255,68,85,0.10)', borderRadius: 8 },
  reasonText: { fontSize: 12, color: '#FF4455', fontFamily: 'Inter_600SemiBold' },
  reportActions: { flexDirection: 'row', gap: 8 },
  actionDismiss: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 10 },
  actionDismissText: { fontSize: 13, color: MUTED, fontFamily: 'Inter_500Medium' },
  actionBan: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: 'rgba(255,68,85,0.10)', borderRadius: 10 },
  actionBanText: { fontSize: 13, color: '#FF4455', fontFamily: 'Inter_500Medium' },
  settingsList: { gap: 2 },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
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
  alertsText: { flex: 1, fontSize: 13, lineHeight: 19, color: GREEN, fontFamily: 'Inter_500Medium' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.60)' },
  modalSheet: {
    backgroundColor: '#0B0B0F', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, gap: 14, maxHeight: '90%',
    borderTopWidth: 1, borderTopColor: 'rgba(255,45,149,0.30)',
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { fontSize: 17, color: '#FFFFFF', fontFamily: 'SpaceGrotesk_700Bold' },
  modalNote: { fontSize: 13, lineHeight: 19, color: MUTED, fontFamily: 'Inter_400Regular' },
  fieldWrap: { gap: 5 },
  fieldLabel: { fontSize: 13, color: '#FFFFFF', fontFamily: 'Inter_500Medium' },
  fieldInput: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 12, paddingVertical: 11, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)' },
  fieldText: { fontSize: 14, color: '#FFFFFF', fontFamily: 'Inter_400Regular' },
  defaultNote: { flexDirection: 'row', alignItems: 'flex-start', padding: 10, gap: 7, backgroundColor: 'rgba(255,45,149,0.10)', borderRadius: 10 },
  defaultNoteText: { flex: 1, fontSize: 12, lineHeight: 17, color: MUTED, fontFamily: 'Inter_400Regular' },
  saveBtn: { borderRadius: 20, overflow: 'hidden' as const },
  saveBtnGrad: { paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: '#FFFFFF', fontSize: 15, fontFamily: 'SpaceGrotesk_600SemiBold' },
});
