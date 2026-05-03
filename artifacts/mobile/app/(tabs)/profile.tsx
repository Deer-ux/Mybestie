import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Platform, Modal, Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import AvatarDisplay from '@/components/AvatarDisplay';
import GlassCard from '@/components/GlassCard';
import BlobBackground from '@/components/BlobBackground';
import {
  MOODS, GOALS, PERSONALITIES, TEMPERAMENTS,
  AVATAR_ICON_NAMES, AVATAR_COLOR_OPTIONS,
} from '@/utils/helpers';

const PINK  = '#FF2D95';
const CYAN  = '#00D4FF';
const GREEN = '#00FF88';
const RED   = '#FF4455';
const MUTED = 'rgba(255,255,255,0.50)';

type ConfirmKind = 'logout' | 'reset' | null;

const CONFIRM_CONFIG = {
  logout: {
    title:   'Log Out?',
    body:    'You will be returned to the welcome screen. Your anonymous data stays on this device.',
    confirm: 'Log Out',
    color:   RED,
  },
  reset: {
    title:   'Reset Profile?',
    body:    'This will erase your entire profile, badges, and chat history and start fresh. This cannot be undone.',
    confirm: 'Reset Everything',
    color:   RED,
  },
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, updateUser, resetUser, logout, isTeenMode } = useApp();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const [adminTaps,   setAdminTaps]   = useState(0);
  const [confirming,  setConfirming]  = useState<ConfirmKind>(null);
  const [busy,        setBusy]        = useState(false);

  // ── helpers ──────────────────────────────────────────────────────────────
  const moodEmoji        = (id: string) => MOODS.find(m => m.id === id)?.emoji ?? '';
  const moodLabel        = (id: string) => MOODS.find(m => m.id === id)?.label ?? id;
  const goalEmoji        = (id: string) => GOALS.find(g => g.id === id)?.emoji ?? '';
  const goalLabel        = (id: string) => GOALS.find(g => g.id === id)?.label ?? id;
  const personalityEmoji = (id: string) => PERSONALITIES.find(p => p.id === id)?.emoji ?? '';
  const personalityLabel = (id: string) => PERSONALITIES.find(p => p.id === id)?.label ?? id;
  const temperamentEmoji = (id: string) => TEMPERAMENTS.find(t => t.id === id)?.emoji ?? '';
  const temperamentLabel = (id: string) => TEMPERAMENTS.find(t => t.id === id)?.label ?? id;

  function handleAdminTap() {
    const n = adminTaps + 1;
    setAdminTaps(n);
    if (n >= 5) { setAdminTaps(0); router.push('/admin'); }
  }

  async function cycleAvatar() {
    if (!user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateUser({
      iconIndex:  (user.iconIndex  + 1) % AVATAR_ICON_NAMES.length,
      colorIndex: (user.colorIndex + 1) % AVATAR_COLOR_OPTIONS.length,
    });
  }

  // ── confirm handlers ──────────────────────────────────────────────────────
  function askConfirm(kind: ConfirmKind) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setConfirming(kind);
  }

  async function handleConfirm() {
    if (!confirming || busy) return;
    setBusy(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    try {
      if (confirming === 'logout') {
        setConfirming(null);
        await logout();
        router.replace('/onboarding');
      } else if (confirming === 'reset') {
        setConfirming(null);
        await resetUser();
        router.replace('/onboarding');
      }
    } finally {
      setBusy(false);
    }
  }

  function handleCancel() {
    if (busy) return;
    setConfirming(null);
  }

  const cfg = confirming ? CONFIRM_CONFIG[confirming] : null;

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <BlobBackground />

        {/* ── Header ── */}
        <LinearGradient
          colors={['#0B0B0F', '#1A0B2E']}
          style={[styles.header, { paddingTop: topPad + 24 }]}
        >
          {/* Logout top-right shortcut */}
          <TouchableOpacity
            onPress={() => askConfirm('logout')}
            style={styles.logoutBtn}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={18} color={MUTED} />
            <Text style={styles.logoutBtnText}>Log Out</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={cycleAvatar} activeOpacity={0.85} style={styles.avatarWrap}>
            {user && <AvatarDisplay iconIndex={user.iconIndex} colorIndex={user.colorIndex} size={86} showRing />}
            <View style={[styles.editBadge, { backgroundColor: PINK }]}>
              <Ionicons name="refresh" size={12} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.username}>{user?.username}</Text>
          <View style={styles.pillsRow}>
            <View style={styles.anonPill}>
              <Text style={styles.pillText}>🔒 Anonymous</Text>
            </View>
            {isTeenMode && (
              <View style={[styles.anonPill, { borderColor: 'rgba(0,255,136,0.35)', backgroundColor: 'rgba(0,255,136,0.08)' }]}>
                <Text style={[styles.pillText, { color: GREEN }]}>🌱 Teen Mode</Text>
              </View>
            )}
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* ── Stats ── */}
          <GlassCard style={styles.statsCard} padding={16}>
            {[
              { label: 'Conversations', value: user?.totalChats ?? 0,    emoji: '💬', color: CYAN  },
              { label: 'Badges',        value: user?.badges.length ?? 0,  emoji: '🌟', color: PINK  },
              { label: 'Streak',        value: user?.positiveStreak ?? 0, emoji: '✨', color: GREEN },
            ].map((s, i) => (
              <React.Fragment key={s.label}>
                {i > 0 && <View style={styles.statDiv} />}
                <View style={styles.statItem}>
                  <Text style={{ fontSize: 20 }}>{s.emoji}</Text>
                  <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              </React.Fragment>
            ))}
          </GlassCard>

          {/* ── Profile details ── */}
          <GlassCard padding={0} style={{ overflow: 'hidden' as const }}>
            <View style={styles.cardTitleWrap}>
              <Text style={styles.cardTitle}>YOUR PROFILE</Text>
            </View>
            {[
              { emoji: moodEmoji(user?.mood ?? ''),               label: 'Mood',        value: moodLabel(user?.mood ?? '')               },
              { emoji: goalEmoji(user?.goal ?? ''),               label: 'Goal',        value: goalLabel(user?.goal ?? '')               },
              { emoji: personalityEmoji(user?.personality ?? ''), label: 'Personality', value: personalityLabel(user?.personality ?? '') },
              { emoji: temperamentEmoji(user?.temperament ?? ''), label: 'Temperament', value: temperamentLabel(user?.temperament ?? '') },
            ].map((row, i, arr) => (
              <View key={i} style={[styles.row, i < arr.length - 1 && styles.rowDivider]}>
                <Text style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{row.emoji}</Text>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowLabel}>{row.label}</Text>
                  <Text style={styles.rowValue}>{row.value}</Text>
                </View>
              </View>
            ))}
          </GlassCard>

          {/* ── Interests ── */}
          <GlassCard padding={16}>
            <Text style={styles.cardTitle}>YOUR INTERESTS</Text>
            <View style={styles.tagsWrap}>
              {(user?.interests ?? []).length > 0 ? (
                (user?.interests ?? []).map(id => (
                  <View key={id} style={styles.tag}>
                    <Text style={styles.tagText}>{id}</Text>
                  </View>
                ))
              ) : (
                <Text style={[styles.rowLabel, { marginTop: 6 }]}>No interests set yet</Text>
              )}
            </View>
          </GlassCard>

          {/* ── Actions ── */}
          {[
            { emoji: '🛡️', label: 'Safety Center',  bg: 'rgba(0,255,136,0.08)',  col: GREEN, onPress: () => router.push('/safety')        },
            { emoji: '🌟', label: 'View All Badges', bg: 'rgba(255,45,149,0.08)', col: PINK,  onPress: () => router.push('/(tabs)/badges') },
            { emoji: '🔄', label: 'Reset Profile',   bg: 'rgba(255,68,85,0.08)',  col: RED,   onPress: () => askConfirm('reset')           },
          ].map((action, i) => (
            <TouchableOpacity
              key={i}
              onPress={action.onPress}
              style={[styles.actionBtn, { backgroundColor: action.bg, borderColor: action.col + '30' }]}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 18 }}>{action.emoji}</Text>
              <Text style={[styles.actionText, { color: action.col }]}>{action.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={action.col} />
            </TouchableOpacity>
          ))}

          {/* ── Logout (prominent) ── */}
          <TouchableOpacity
            onPress={() => askConfirm('logout')}
            style={styles.logoutFullBtn}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['rgba(255,68,85,0.18)', 'rgba(255,68,85,0.08)']}
              style={styles.logoutFullGrad}
            >
              <Ionicons name="log-out-outline" size={20} color={RED} />
              <Text style={styles.logoutFullText}>Log Out</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleAdminTap} style={styles.versionRow}>
            <Text style={styles.version}>MindBridge v1.0.0</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Confirmation modal (web + native safe) ── */}
      <Modal
        visible={confirming !== null}
        transparent
        animationType="fade"
        onRequestClose={handleCancel}
        statusBarTranslucent
      >
        <Pressable style={styles.modalBackdrop} onPress={handleCancel}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            {/* Icon */}
            <View style={[styles.modalIcon, { backgroundColor: `${cfg?.color ?? RED}20` }]}>
              <Text style={{ fontSize: 32 }}>
                {confirming === 'logout' ? '🚪' : '🔄'}
              </Text>
            </View>

            <Text style={styles.modalTitle}>{cfg?.title}</Text>
            <Text style={styles.modalBody}>{cfg?.body}</Text>

            <View style={styles.modalBtns}>
              {/* Cancel */}
              <TouchableOpacity
                onPress={handleCancel}
                style={styles.cancelBtn}
                disabled={busy}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              {/* Confirm */}
              <TouchableOpacity
                onPress={handleConfirm}
                disabled={busy}
                activeOpacity={0.85}
                style={[styles.confirmBtn, { backgroundColor: cfg?.color ?? RED, opacity: busy ? 0.6 : 1 }]}
              >
                <Text style={styles.confirmBtnText}>
                  {busy ? 'Please wait…' : cfg?.confirm}
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
  container:       { flex: 1, backgroundColor: '#050505' },
  header:          { paddingHorizontal: 20, paddingBottom: 28, alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },

  logoutBtn:       { position: 'absolute', top: 0, right: 20, flexDirection: 'row', alignItems: 'center', gap: 5, padding: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)' },
  logoutBtnText:   { fontSize: 12, color: MUTED, fontFamily: 'Inter_500Medium' },

  avatarWrap:      { position: 'relative', marginTop: 28 },
  editBadge:       { position: 'absolute', bottom: 2, right: 2, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  username:        { color: '#FFFFFF', fontSize: 22, fontFamily: 'SpaceGrotesk_700Bold' },
  pillsRow:        { flexDirection: 'row', gap: 8 },
  anonPill:        { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,45,149,0.35)', backgroundColor: 'rgba(255,45,149,0.08)' },
  pillText:        { color: PINK, fontSize: 12, fontFamily: 'Inter_500Medium' },

  content:         { padding: 20, gap: 12 },
  statsCard:       { flexDirection: 'row', alignItems: 'center' },
  statItem:        { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 6 },
  statDiv:         { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.09)' },
  statValue:       { fontSize: 24, fontFamily: 'SpaceGrotesk_700Bold' },
  statLabel:       { color: MUTED, fontSize: 11, fontFamily: 'Inter_400Regular' },

  cardTitleWrap:   { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 6 },
  cardTitle:       { color: MUTED, fontSize: 11, fontFamily: 'SpaceGrotesk_600SemiBold', letterSpacing: 2 },

  row:             { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  rowDivider:      { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.07)' },
  rowInfo:         { flex: 1 },
  rowLabel:        { color: MUTED, fontSize: 11, marginBottom: 2, fontFamily: 'Inter_400Regular' },
  rowValue:        { color: '#FFFFFF', fontSize: 14, fontFamily: 'Inter_500Medium' },

  tagsWrap:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  tag:             { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: 'rgba(255,45,149,0.12)', borderWidth: 1, borderColor: 'rgba(255,45,149,0.25)' },
  tagText:         { color: PINK, fontSize: 13, fontFamily: 'Inter_500Medium' },

  actionBtn:       { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, borderRadius: 16, borderWidth: 1 },
  actionText:      { flex: 1, fontSize: 14, fontFamily: 'SpaceGrotesk_600SemiBold' },

  logoutFullBtn:   { borderRadius: 16, overflow: 'hidden' as const, borderWidth: 1, borderColor: 'rgba(255,68,85,0.30)', marginTop: 4 },
  logoutFullGrad:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 },
  logoutFullText:  { fontSize: 15, color: RED, fontFamily: 'SpaceGrotesk_600SemiBold' },

  versionRow:      { alignItems: 'center', paddingVertical: 16 },
  version:         { color: MUTED, fontSize: 12, fontFamily: 'Inter_400Regular' },

  // ── Modal ──────────────────────────────────────────────────────────────────
  modalBackdrop:   {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.72)',
    paddingHorizontal: 24,
  },
  modalCard:       {
    width: '100%', maxWidth: 360,
    backgroundColor: '#131318',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  modalIcon:       {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  modalTitle:      { color: '#FFFFFF', fontSize: 20, fontFamily: 'SpaceGrotesk_700Bold', textAlign: 'center' },
  modalBody:       { color: MUTED, fontSize: 14, lineHeight: 21, textAlign: 'center', fontFamily: 'Inter_400Regular' },
  modalBtns:       { flexDirection: 'row', gap: 12, marginTop: 8, width: '100%' },
  cancelBtn:       {
    flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  cancelBtnText:   { color: '#FFFFFF', fontSize: 15, fontFamily: 'SpaceGrotesk_600SemiBold' },
  confirmBtn:      { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  confirmBtnText:  { color: '#FFFFFF', fontSize: 15, fontFamily: 'SpaceGrotesk_700Bold' },
});
