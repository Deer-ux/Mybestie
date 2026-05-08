import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Platform, ActivityIndicator, TextInput, Modal, Pressable,
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

const SUSPENDED_KEY = '@mindbridge_suspended_users';

interface UserRow {
  id: string;
  username: string;
  ageGroup: string;
  mood: string;
  isOnboarded: boolean;
  joinedAt: string;
  isSuspended: boolean;
}

function RelDate({ iso }: { iso: string }) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  const label = days > 0 ? `${days}d ago` : hrs > 0 ? `${hrs}h ago` : `${mins}m ago`;
  return <Text style={styles.rowSub}>{label} · {d.toLocaleDateString()}</Text>;
}

export default function AdminUsersScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useApp();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const [rows,       setRows]       = useState<UserRow[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [suspended,  setSuspended]  = useState<Set<string>>(new Set());
  const [confirm,    setConfirm]    = useState<{ user: UserRow; action: 'suspend' | 'reactivate' } | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [newToday,   setNewToday]   = useState(0);

  const isOwner = user?.role === 'owner' || user?.isAdmin === true;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [metricsData, suspRaw, stored] = await Promise.all([
        getMetrics(),
        AsyncStorage.getItem(SUSPENDED_KEY),
        AsyncStorage.getItem('@mindbridge_user_v3'),
      ]);

      const suspSet = new Set<string>(suspRaw ? JSON.parse(suspRaw) : []);
      setSuspended(suspSet);
      setTotalCount(metricsData.totalUsers);
      setNewToday(metricsData.newToday);

      const built: UserRow[] = [];

      if (stored) {
        const parsed = JSON.parse(stored) as {
          id: string; username: string; ageGroup: string; mood: string;
          isOnboarded: boolean; sessionToken: string;
        };
        built.push({
          id: parsed.id,
          username: parsed.username,
          ageGroup: parsed.ageGroup || 'unknown',
          mood: parsed.mood || '—',
          isOnboarded: parsed.isOnboarded,
          joinedAt: new Date(parseInt(parsed.id.slice(0, 13)) || Date.now()).toISOString(),
          isSuspended: suspSet.has(parsed.id),
        });
      }

      setRows(built);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (isOwner) load(); }, [isOwner, load]);

  async function toggleSuspend(userId: string, suspend: boolean) {
    const next = new Set(suspended);
    if (suspend) next.add(userId); else next.delete(userId);
    await AsyncStorage.setItem(SUSPENDED_KEY, JSON.stringify([...next]));
    setSuspended(next);
    setRows(prev => prev.map(r => r.id === userId ? { ...r, isSuspended: suspend } : r));
    setConfirm(null);
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

  const filtered = rows.filter(r =>
    !search || r.username.toLowerCase().includes(search.toLowerCase())
  );

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
              <Text style={styles.headerTitle}>👥 User Management</Text>
              <Text style={styles.headerSub}>Owner-only · {totalCount.toLocaleString()} total users</Text>
            </View>
            <TouchableOpacity onPress={load} style={styles.iconBtn}>
              <Ionicons name="refresh" size={20} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <AdminNav />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Stats row */}
          <Animated.View entering={FadeInDown.delay(40)} style={styles.statsRow}>
            {[
              { emoji: '👥', label: 'Total',     value: totalCount,            color: CYAN   },
              { emoji: '✨', label: 'New Today',  value: newToday,              color: GREEN  },
              { emoji: '🚫', label: 'Suspended',  value: suspended.size,        color: RED    },
              { emoji: '📱', label: 'This Device',value: rows.length,           color: YELLOW },
            ].map(s => (
              <GlassCard key={s.label} style={styles.statCard} padding={12}>
                <Text style={{ fontSize: 18 }}>{s.emoji}</Text>
                <Text style={[styles.statValue, { color: s.color }]}>{s.value.toLocaleString()}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </GlassCard>
            ))}
          </Animated.View>

          {/* Search */}
          <Animated.View entering={FadeInDown.delay(80)}>
            <View style={styles.searchRow}>
              <Ionicons name="search-outline" size={16} color={MUTED} />
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Search username…"
                placeholderTextColor={MUTED}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {search ? (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={16} color={MUTED} />
                </TouchableOpacity>
              ) : null}
            </View>
          </Animated.View>

          {/* User list */}
          <Animated.View entering={FadeInDown.delay(120)}>
            <Text style={styles.sectionTitle}>User Records</Text>

            {loading ? (
              <GlassCard style={{ alignItems: 'center', paddingVertical: 40 }}>
                <ActivityIndicator color={PINK} />
                <Text style={[styles.statLabel, { marginTop: 10 }]}>Loading users…</Text>
              </GlassCard>
            ) : filtered.length === 0 ? (
              <GlassCard style={{ alignItems: 'center', paddingVertical: 40, gap: 10 }}>
                <Text style={{ fontSize: 36 }}>👥</Text>
                <Text style={{ color: '#FFF', fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 15 }}>
                  {search ? 'No matches' : 'No users on this device'}
                </Text>
                <Text style={[styles.statLabel, { textAlign: 'center', lineHeight: 18 }]}>
                  {search
                    ? 'Try a different search term.'
                    : `Analytics show ${totalCount.toLocaleString()} total users across all devices. Individual anonymous profiles are stored only on each user's own device for privacy.`}
                </Text>
              </GlassCard>
            ) : filtered.map((row, i) => (
              <Animated.View key={row.id} entering={FadeInDown.delay(140 + i * 50)}>
                <GlassCard style={styles.userCard} padding={14}>
                  <View style={styles.userTop}>
                    <View style={[styles.avatar, { backgroundColor: row.isSuspended ? 'rgba(255,68,85,0.15)' : 'rgba(255,45,149,0.12)' }]}>
                      <Text style={{ fontSize: 20 }}>{row.isSuspended ? '🚫' : '👤'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.userNameRow}>
                        <Text style={styles.userName}>{row.username}</Text>
                        {row.isSuspended && (
                          <View style={styles.suspendedBadge}>
                            <Text style={styles.suspendedBadgeText}>Suspended</Text>
                          </View>
                        )}
                        {!row.isSuspended && row.isOnboarded && (
                          <View style={styles.activeBadge}>
                            <Text style={styles.activeBadgeText}>Active</Text>
                          </View>
                        )}
                      </View>
                      <RelDate iso={row.joinedAt} />
                    </View>
                  </View>

                  <View style={styles.userMeta}>
                    {[
                      { label: 'Age Group',  value: row.ageGroup   },
                      { label: 'Mood',       value: row.mood       },
                      { label: 'Onboarded', value: row.isOnboarded ? 'Yes' : 'No' },
                    ].map(m => (
                      <View key={m.label} style={styles.metaItem}>
                        <Text style={styles.metaLabel}>{m.label}</Text>
                        <Text style={styles.metaValue}>{m.value}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.userActions}>
                    {row.isSuspended ? (
                      <TouchableOpacity
                        onPress={() => setConfirm({ user: row, action: 'reactivate' })}
                        style={styles.reactivateBtn}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="checkmark-circle-outline" size={14} color={GREEN} />
                        <Text style={[styles.actionBtnText, { color: GREEN }]}>Reactivate</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        onPress={() => setConfirm({ user: row, action: 'suspend' })}
                        style={styles.suspendBtn}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="ban-outline" size={14} color={RED} />
                        <Text style={[styles.actionBtnText, { color: RED }]}>Suspend</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </GlassCard>
              </Animated.View>
            ))}
          </Animated.View>

          {/* Privacy note */}
          <Animated.View entering={FadeInDown.delay(300)}>
            <GlassCard padding={14} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 40 }}>
              <Text style={{ fontSize: 16 }}>🔒</Text>
              <Text style={{ flex: 1, fontSize: 12, lineHeight: 18, color: MUTED, fontFamily: 'Inter_400Regular' }}>
                MyBestie is anonymous-first. User profiles are stored only on each user's device. This view shows users on the current device. Aggregate counts come from anonymised analytics events.
              </Text>
            </GlassCard>
          </Animated.View>

        </ScrollView>
      </View>

      {/* Confirm modal */}
      <Modal visible={confirm !== null} transparent animationType="fade" onRequestClose={() => setConfirm(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setConfirm(null)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={[styles.modalIcon, { backgroundColor: confirm?.action === 'suspend' ? 'rgba(255,68,85,0.12)' : 'rgba(0,255,136,0.10)' }]}>
              <Text style={{ fontSize: 30 }}>{confirm?.action === 'suspend' ? '🚫' : '✅'}</Text>
            </View>
            <Text style={styles.modalTitle}>
              {confirm?.action === 'suspend' ? 'Suspend User?' : 'Reactivate User?'}
            </Text>
            <Text style={styles.modalBody}>
              {confirm?.action === 'suspend'
                ? `Suspend "${confirm?.user.username}"? They will be flagged as suspended on this device.`
                : `Reactivate "${confirm?.user.username}"? Their suspension will be lifted.`}
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setConfirm(null)} style={styles.cancelBtn} activeOpacity={0.8}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => confirm && toggleSuspend(confirm.user.id, confirm.action === 'suspend')}
                style={[styles.confirmBtn, { backgroundColor: confirm?.action === 'suspend' ? RED : GREEN }]}
                activeOpacity={0.85}
              >
                <Text style={[styles.confirmText, { color: confirm?.action === 'suspend' ? '#FFF' : '#050505' }]}>
                  {confirm?.action === 'suspend' ? 'Suspend' : 'Reactivate'}
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

  searchRow:   {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
  },
  searchInput: { flex: 1, color: '#FFF', fontSize: 14, fontFamily: 'Inter_400Regular' },

  sectionTitle: { color: '#FFF', fontSize: 16, fontFamily: 'SpaceGrotesk_700Bold', marginBottom: 2 },

  userCard:    { marginBottom: 8, gap: 10 },
  userTop:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar:      { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  userNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userName:    { color: '#FFF', fontSize: 15, fontFamily: 'SpaceGrotesk_600SemiBold' },
  rowSub:      { color: MUTED, fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },

  suspendedBadge:     { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: 'rgba(255,68,85,0.15)' },
  suspendedBadgeText: { color: RED, fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  activeBadge:        { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: 'rgba(0,255,136,0.12)' },
  activeBadgeText:    { color: GREEN, fontSize: 10, fontFamily: 'Inter_600SemiBold' },

  userMeta:    { flexDirection: 'row', gap: 10 },
  metaItem:    { flex: 1, gap: 2 },
  metaLabel:   { color: MUTED, fontSize: 10, fontFamily: 'Inter_400Regular' },
  metaValue:   { color: '#FFF', fontSize: 12, fontFamily: 'Inter_500Medium' },

  userActions: { flexDirection: 'row', gap: 8 },
  suspendBtn:  {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    backgroundColor: 'rgba(255,68,85,0.10)', borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(255,68,85,0.25)',
  },
  reactivateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    backgroundColor: 'rgba(0,255,136,0.10)', borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(0,255,136,0.25)',
  },
  actionBtnText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },

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
