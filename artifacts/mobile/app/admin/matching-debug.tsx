import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Platform, ActivityIndicator, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import GlassCard from '@/components/GlassCard';
import BlobBackground from '@/components/BlobBackground';
import AdminNav from '@/components/AdminNav';

const PINK  = '#FF2D95';
const CYAN  = '#00D4FF';
const GREEN = '#00FF88';
const MUTED = 'rgba(255,255,255,0.45)';

function apiBase(): string {
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin;
  return '';
}

interface WaitingEntry {
  id: string;
  userId: string;
  anonymousUsername: string;
  ageGroup: string;
  conversationMode: string;
  mood: string;
  status: string;
  joinedAt: string;
  lastActive: string;
  matchedSessionId: string | null;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

export default function MatchingDebugPage() {
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const [entries,     setEntries]     = useState<WaitingEntry[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [lastFetch,   setLastFetch]   = useState('');
  const [error,       setError]       = useState('');

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const isOwner = user?.role === 'owner' || user?.isAdmin === true;

  const fetchDebug = useCallback(async (quiet = false) => {
    if (!isOwner) return;
    if (!quiet) setLoading(true);
    setError('');
    try {
      const token = user?.sessionToken ?? '';
      const resp = await fetch(`${apiBase()}/api/match/debug`, {
        headers: { 'x-owner-token': token },
      });
      if (!resp.ok) {
        setError(`Server returned ${resp.status}`);
        return;
      }
      const data = await resp.json() as { entries: WaitingEntry[] };
      setEntries(data.entries ?? []);
      setLastFetch(new Date().toLocaleTimeString());
    } catch (e) {
      setError('Could not fetch debug data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isOwner, user?.sessionToken]);

  useEffect(() => {
    if (!isOwner) return;
    fetchDebug();
    const interval = setInterval(() => fetchDebug(true), 3000);
    return () => clearInterval(interval);
  }, [fetchDebug]);

  if (!isOwner) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center', padding: 32 }]}>
        <BlobBackground variant="purple" />
        <Text style={{ fontSize: 48 }}>🔒</Text>
        <Text style={[styles.headerTitle, { marginTop: 16 }]}>Owner Access Only</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{ color: PINK }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const waiting  = entries.filter(e => e.status === 'waiting');
  const matched  = entries.filter(e => e.status === 'matched');

  return (
    <View style={styles.container}>
      <BlobBackground variant="purple" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 80 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchDebug(); }}
            tintColor={PINK}
          />
        }
      >
        {/* Header */}
        <View style={[styles.headerArea, { paddingTop: topPad + 16 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.headerTitle}>Matching Debug</Text>
            <Text style={styles.headerSub}>
              Auto-refreshes every 3 s{lastFetch ? ` · Last: ${lastFetch}` : ''}
            </Text>
          </View>
          <TouchableOpacity onPress={() => fetchDebug()} style={styles.refreshBtn}>
            <Ionicons name="refresh" size={18} color={CYAN} />
          </TouchableOpacity>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <GlassCard style={styles.statCard} padding={14}>
            <Text style={styles.statNum}>{entries.length}</Text>
            <Text style={styles.statLabel}>Total records</Text>
          </GlassCard>
          <GlassCard style={styles.statCard} padding={14}>
            <Text style={[styles.statNum, { color: GREEN }]}>{waiting.length}</Text>
            <Text style={styles.statLabel}>Waiting</Text>
          </GlassCard>
          <GlassCard style={styles.statCard} padding={14}>
            <Text style={[styles.statNum, { color: CYAN }]}>{matched.length}</Text>
            <Text style={styles.statLabel}>Matched</Text>
          </GlassCard>
        </View>

        {error ? (
          <GlassCard style={{ margin: 16, gap: 6 }} padding={14}>
            <Text style={{ color: '#FF4455', fontFamily: 'Inter_500Medium' }}>⚠️ {error}</Text>
          </GlassCard>
        ) : null}

        {loading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={PINK} />
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16, gap: 10, marginTop: 6 }}>
            {entries.length === 0 ? (
              <GlassCard padding={20}>
                <Text style={{ color: MUTED, textAlign: 'center', fontFamily: 'Inter_400Regular' }}>
                  No records in waiting_pool right now.
                </Text>
              </GlassCard>
            ) : (
              entries.map(entry => (
                <GlassCard key={entry.id} padding={14} style={{ gap: 8 }}>
                  {/* Top row */}
                  <View style={styles.entryHeader}>
                    <View style={[styles.statusBadge, {
                      backgroundColor: entry.status === 'waiting'
                        ? 'rgba(0,255,136,0.12)'
                        : 'rgba(0,212,255,0.12)',
                      borderColor: entry.status === 'waiting'
                        ? 'rgba(0,255,136,0.30)'
                        : 'rgba(0,212,255,0.30)',
                    }]}>
                      <Text style={[styles.statusText, {
                        color: entry.status === 'waiting' ? GREEN : CYAN,
                      }]}>
                        {entry.status.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.usernameText}>{entry.anonymousUsername}</Text>
                    <Text style={styles.agoText}>{timeAgo(entry.joinedAt)}</Text>
                  </View>

                  {/* Details */}
                  <View style={styles.detailGrid}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>user_id</Text>
                      <Text style={styles.detailValue} numberOfLines={1}>{entry.userId}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>age_group</Text>
                      <Text style={styles.detailValue}>{entry.ageGroup}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>mood</Text>
                      <Text style={styles.detailValue}>{entry.mood || '—'}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>last_active</Text>
                      <Text style={styles.detailValue}>{timeAgo(entry.lastActive)}</Text>
                    </View>
                    {entry.matchedSessionId ? (
                      <View style={[styles.detailItem, { flex: 1, minWidth: '100%' }]}>
                        <Text style={styles.detailLabel}>matched_session_id</Text>
                        <Text style={[styles.detailValue, { color: CYAN }]} numberOfLines={1}>
                          {entry.matchedSessionId}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </GlassCard>
              ))
            )}
          </View>
        )}
      </ScrollView>

      <AdminNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#050505' },
  headerArea:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 14 },
  backBtn:      { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.07)' },
  headerTitle:  { color: '#FFFFFF', fontSize: 17, fontFamily: 'SpaceGrotesk_700Bold' },
  headerSub:    { color: MUTED, fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  refreshBtn:   { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,212,255,0.08)' },

  statsRow:     { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 4 },
  statCard:     { flex: 1, alignItems: 'center', gap: 4 },
  statNum:      { color: '#FFFFFF', fontSize: 24, fontFamily: 'SpaceGrotesk_700Bold' },
  statLabel:    { color: MUTED, fontSize: 11, fontFamily: 'Inter_400Regular' },

  entryHeader:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusBadge:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  statusText:   { fontSize: 10, fontFamily: 'SpaceGrotesk_700Bold', letterSpacing: 0.5 },
  usernameText: { flex: 1, color: '#FFFFFF', fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  agoText:      { color: MUTED, fontSize: 11, fontFamily: 'Inter_400Regular' },

  detailGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  detailItem:   { minWidth: '45%', gap: 2 },
  detailLabel:  { color: MUTED, fontSize: 10, fontFamily: 'Inter_400Regular', letterSpacing: 0.5 },
  detailValue:  { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontFamily: 'Inter_500Medium' },
});
