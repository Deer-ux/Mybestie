import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Platform, Switch, TextInput, Modal, Pressable, ActivityIndicator,
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
const PURPLE = '#D633FF';
const MUTED  = 'rgba(255,255,255,0.50)';

const SETTINGS_KEY = '@mindbridge_admin_settings';

interface AppSettings {
  appName: string;
  safetyDisclaimer: string;
  maintenanceMode: boolean;
  teenModeEnforced: boolean;
  aiModerationEnabled: boolean;
  maxReportsBeforeBan: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  appName: 'MyBestie',
  safetyDisclaimer: 'MyBestie is not a therapy or crisis service. If you are in immediate danger, contact emergency services.',
  maintenanceMode: false,
  teenModeEnforced: true,
  aiModerationEnabled: true,
  maxReportsBeforeBan: 3,
};

export default function AdminSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useApp();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const [settings,    setSettings]    = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [showLogout,  setShowLogout]  = useState(false);
  const [showClear,   setShowClear]   = useState(false);
  const [editField,   setEditField]   = useState<'appName' | 'safetyDisclaimer' | null>(null);
  const [editValue,   setEditValue]   = useState('');

  const isOwner = user?.role === 'owner' || user?.isAdmin === true;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await AsyncStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const parsed: Partial<AppSettings> = JSON.parse(raw);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (isOwner) load(); }, [isOwner, load]);

  async function save(updates: Partial<AppSettings>) {
    const next = { ...settings, ...updates };
    setSettings(next);
    setSaving(true);
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function openEdit(field: 'appName' | 'safetyDisclaimer') {
    setEditField(field);
    setEditValue(settings[field]);
  }

  async function saveEdit() {
    if (!editField) return;
    await save({ [editField]: editValue.trim() || DEFAULT_SETTINGS[editField] });
    setEditField(null);
  }

  async function clearDemoData() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    const SEEDED_KEY = '@mindbridge_analytics_seeded';
    const EVENTS_KEY = '@mindbridge_analytics_events';
    await AsyncStorage.multiRemove([SEEDED_KEY, EVENTS_KEY]);
    setShowClear(false);
  }

  async function handleLogout() {
    setShowLogout(false);
    router.replace('/');
    await logout();
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
              <Text style={styles.headerTitle}>⚙️ Settings</Text>
              <Text style={styles.headerSub}>Owner-only · App configuration</Text>
            </View>
            {saving && <ActivityIndicator color={CYAN} size="small" />}
            {saved && !saving && <Ionicons name="checkmark-circle" size={22} color={GREEN} />}
          </View>
        </LinearGradient>

        <AdminNav onLogout={() => setShowLogout(true)} />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={{ alignItems: 'center', paddingTop: 60, gap: 14 }}>
              <ActivityIndicator color={PINK} size="large" />
            </View>
          ) : (
            <>
              {/* App Info */}
              <Animated.View entering={FadeInDown.delay(40)}>
                <Text style={styles.sectionTitle}>App Information</Text>
                <GlassCard style={{ gap: 0 }} padding={0}>
                  {[
                    { label: 'App Name',       value: settings.appName,          field: 'appName' as const },
                    { label: 'Safety Disclaimer', value: settings.safetyDisclaimer, field: 'safetyDisclaimer' as const },
                  ].map((row, i) => (
                    <TouchableOpacity
                      key={row.field}
                      onPress={() => openEdit(row.field)}
                      style={[styles.settingRow, i > 0 && styles.rowDivider]}
                      activeOpacity={0.8}
                    >
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={styles.rowLabel}>{row.label}</Text>
                        <Text style={styles.rowValue} numberOfLines={2}>{row.value}</Text>
                      </View>
                      <Ionicons name="pencil-outline" size={16} color={MUTED} />
                    </TouchableOpacity>
                  ))}
                </GlassCard>
              </Animated.View>

              {/* Safety & Moderation toggles */}
              <Animated.View entering={FadeInDown.delay(80)}>
                <Text style={styles.sectionTitle}>Safety & Moderation</Text>
                <GlassCard style={{ gap: 0 }} padding={0}>
                  {[
                    { label: 'Teen Mode Enforced',   sub: 'Teens matched only with teens',          key: 'teenModeEnforced',      color: GREEN  },
                    { label: 'AI Moderation',         sub: 'Scan messages for policy violations',    key: 'aiModerationEnabled',   color: CYAN   },
                    { label: 'Maintenance Mode',      sub: 'Block new connections temporarily',      key: 'maintenanceMode',       color: YELLOW },
                  ].map((row, i) => (
                    <View key={row.key} style={[styles.settingRow, i > 0 && styles.rowDivider]}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={styles.rowLabel}>{row.label}</Text>
                        <Text style={styles.rowSub}>{row.sub}</Text>
                      </View>
                      <Switch
                        value={settings[row.key as keyof AppSettings] as boolean}
                        onValueChange={v => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); save({ [row.key]: v }); }}
                        trackColor={{ false: 'rgba(255,255,255,0.12)', true: row.color + '55' }}
                        thumbColor={settings[row.key as keyof AppSettings] ? row.color : 'rgba(255,255,255,0.35)'}
                        ios_backgroundColor="rgba(255,255,255,0.12)"
                      />
                    </View>
                  ))}
                </GlassCard>
              </Animated.View>

              {/* Auto-ban threshold */}
              <Animated.View entering={FadeInDown.delay(120)}>
                <Text style={styles.sectionTitle}>Auto-Ban Threshold</Text>
                <GlassCard padding={14}>
                  <Text style={styles.rowLabel}>Reports before automatic restriction</Text>
                  <View style={styles.thresholdRow}>
                    {[1, 2, 3, 5, 10].map(n => (
                      <TouchableOpacity
                        key={n}
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); save({ maxReportsBeforeBan: n }); }}
                        style={[styles.thresholdBtn, settings.maxReportsBeforeBan === n && styles.thresholdBtnActive]}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.thresholdText, settings.maxReportsBeforeBan === n && { color: PINK }]}>{n}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={[styles.rowSub, { marginTop: 6 }]}>
                    Current: {settings.maxReportsBeforeBan} report{settings.maxReportsBeforeBan > 1 ? 's' : ''} triggers review
                  </Text>
                </GlassCard>
              </Animated.View>

              {/* Status indicators */}
              <Animated.View entering={FadeInDown.delay(160)}>
                <Text style={styles.sectionTitle}>System Status</Text>
                <GlassCard style={{ gap: 0 }} padding={0}>
                  {[
                    { emoji: '🟢', label: 'API Server',       value: 'Online',        color: GREEN  },
                    { emoji: '🟢', label: 'Anonymous Inbox',  value: 'Active',        color: GREEN  },
                    { emoji: '🟢', label: 'Bestie AI',        value: 'Responding',    color: GREEN  },
                    { emoji: settings.maintenanceMode ? '🟡' : '🟢', label: 'Maintenance Mode', value: settings.maintenanceMode ? 'Active' : 'Off', color: settings.maintenanceMode ? YELLOW : GREEN },
                    { emoji: settings.teenModeEnforced ? '🟢' : '🔴', label: 'Teen Safety',  value: settings.teenModeEnforced ? 'Enforced' : 'Disabled', color: settings.teenModeEnforced ? GREEN : RED },
                  ].map((row, i) => (
                    <View key={row.label} style={[styles.settingRow, i > 0 && styles.rowDivider]}>
                      <Text style={{ fontSize: 16, marginRight: 2 }}>{row.emoji}</Text>
                      <Text style={[styles.rowLabel, { flex: 1, color: '#FFF' }]}>{row.label}</Text>
                      <View style={[styles.badge, { backgroundColor: row.color + '18', borderColor: row.color + '30' }]}>
                        <Text style={[styles.badgeText, { color: row.color }]}>{row.value}</Text>
                      </View>
                    </View>
                  ))}
                </GlassCard>
              </Animated.View>

              {/* Danger zone */}
              <Animated.View entering={FadeInDown.delay(200)}>
                <Text style={styles.sectionTitle}>Danger Zone</Text>
                <GlassCard style={{ borderColor: 'rgba(255,68,85,0.25)', gap: 12 }} padding={16}>
                  <TouchableOpacity onPress={() => setShowClear(true)} style={styles.dangerBtn} activeOpacity={0.8}>
                    <Ionicons name="trash-outline" size={18} color={YELLOW} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.dangerLabel, { color: YELLOW }]}>Clear Demo Analytics Data</Text>
                      <Text style={styles.dangerSub}>Removes seeded/demo analytics. Real data is retained.</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={YELLOW} />
                  </TouchableOpacity>

                  <View style={styles.divider} />

                  <TouchableOpacity onPress={() => setShowLogout(true)} style={styles.dangerBtn} activeOpacity={0.8}>
                    <Ionicons name="log-out-outline" size={18} color={RED} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.dangerLabel, { color: RED }]}>Owner Logout</Text>
                      <Text style={styles.dangerSub}>Clear owner session and return to landing page.</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={RED} />
                  </TouchableOpacity>
                </GlassCard>
              </Animated.View>

              <View style={{ height: 40 }} />
            </>
          )}
        </ScrollView>
      </View>

      {/* Edit field modal */}
      <Modal visible={editField !== null} transparent animationType="fade" onRequestClose={() => setEditField(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setEditField(null)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>
              {editField === 'appName' ? 'Edit App Name' : 'Edit Safety Disclaimer'}
            </Text>
            <TextInput
              style={styles.modalInput}
              value={editValue}
              onChangeText={setEditValue}
              multiline={editField === 'safetyDisclaimer'}
              numberOfLines={editField === 'safetyDisclaimer' ? 4 : 1}
              placeholderTextColor={MUTED}
              autoFocus
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setEditField(null)} style={styles.cancelBtn} activeOpacity={0.8}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveEdit} style={[styles.confirmBtn, { backgroundColor: PINK }]} activeOpacity={0.85}>
                <Text style={[styles.confirmText, { color: '#FFF' }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Logout confirm */}
      <Modal visible={showLogout} transparent animationType="fade" onRequestClose={() => setShowLogout(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowLogout(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={[styles.modalIcon, { backgroundColor: 'rgba(255,68,85,0.12)' }]}>
              <Text style={{ fontSize: 30 }}>🚪</Text>
            </View>
            <Text style={styles.modalTitle}>Log Out?</Text>
            <Text style={styles.modalBody}>Your owner session will be cleared and you'll return to the landing page.</Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setShowLogout(false)} style={styles.cancelBtn} activeOpacity={0.8}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogout} style={[styles.confirmBtn, { backgroundColor: RED }]} activeOpacity={0.85}>
                <Text style={[styles.confirmText, { color: '#FFF' }]}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Clear demo confirm */}
      <Modal visible={showClear} transparent animationType="fade" onRequestClose={() => setShowClear(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowClear(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={[styles.modalIcon, { backgroundColor: 'rgba(245,158,11,0.12)' }]}>
              <Text style={{ fontSize: 30 }}>🗑️</Text>
            </View>
            <Text style={styles.modalTitle}>Clear Demo Data?</Text>
            <Text style={styles.modalBody}>This removes the seeded analytics baseline. The dashboard will show only real usage data going forward.</Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setShowClear(false)} style={styles.cancelBtn} activeOpacity={0.8}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={clearDemoData} style={[styles.confirmBtn, { backgroundColor: YELLOW }]} activeOpacity={0.85}>
                <Text style={[styles.confirmText, { color: '#050505' }]}>Clear</Text>
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

  content:     { padding: 16, gap: 14 },
  sectionTitle: { color: '#FFF', fontSize: 16, fontFamily: 'SpaceGrotesk_700Bold', marginBottom: 2 },

  settingRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  rowDivider:  { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.07)' },
  rowLabel:    { color: '#FFF', fontSize: 13, fontFamily: 'Inter_500Medium', marginBottom: 2 },
  rowValue:    { color: MUTED, fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17 },
  rowSub:      { color: MUTED, fontSize: 11, fontFamily: 'Inter_400Regular' },

  divider:     { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.08)' },

  thresholdRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  thresholdBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  thresholdBtnActive: { backgroundColor: 'rgba(255,45,149,0.12)', borderColor: 'rgba(255,45,149,0.40)' },
  thresholdText: { color: MUTED, fontSize: 14, fontFamily: 'SpaceGrotesk_600SemiBold' },

  badge:       { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  badgeText:   { fontSize: 11, fontFamily: 'Inter_600SemiBold' },

  dangerBtn:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dangerLabel: { fontSize: 14, fontFamily: 'SpaceGrotesk_600SemiBold', marginBottom: 2 },
  dangerSub:   { color: MUTED, fontSize: 11, fontFamily: 'Inter_400Regular' },

  modalBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.72)', paddingHorizontal: 24 },
  modalCard:     { width: '100%', maxWidth: 360, backgroundColor: '#131318', borderRadius: 24, padding: 28, alignItems: 'center', gap: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  modalIcon:     { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  modalTitle:    { color: '#FFF', fontSize: 20, fontFamily: 'SpaceGrotesk_700Bold', textAlign: 'center' },
  modalBody:     { color: MUTED, fontSize: 14, lineHeight: 21, textAlign: 'center', fontFamily: 'Inter_400Regular' },
  modalInput:    { width: '100%', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', padding: 12, color: '#FFF', fontSize: 14, fontFamily: 'Inter_400Regular', textAlignVertical: 'top' },
  modalBtns:     { flexDirection: 'row', gap: 12, marginTop: 4, width: '100%' },
  cancelBtn:     { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  cancelText:    { color: '#FFF', fontSize: 15, fontFamily: 'SpaceGrotesk_600SemiBold' },
  confirmBtn:    { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  confirmText:   { fontSize: 15, fontFamily: 'SpaceGrotesk_700Bold' },
});
