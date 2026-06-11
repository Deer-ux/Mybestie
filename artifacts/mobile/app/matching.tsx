import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Share } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown, FadeIn,
  useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming, Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import GlassCard from '@/components/GlassCard';
import BlobBackground from '@/components/BlobBackground';
import { MOODS, PERSONALITIES, TEMPERAMENTS } from '@/utils/helpers';
import colors from '@/constants/colors';

const PINK  = '#FF2D95';
const CYAN  = '#00D4FF';
const MUTED = 'rgba(255,255,255,0.50)';

type Phase = 'idle' | 'searching' | 'still_searching' | 'no_match';

function apiBase(): string {
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin;
  return '';
}

export default function MatchingScreen() {
  const insets = useSafeAreaInsets();
  const { user, isTeenMode } = useApp();
  const [phase, setPhase]           = useState<Phase>('idle');
  const [elapsed, setElapsed]       = useState(0);
  const [errorMsg, setErrorMsg]     = useState('');

  const pollRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelledRef  = useRef(false);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const pulse  = useSharedValue(1);
  const rotate = useSharedValue(0);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const rotStyle   = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotate.value * 360}deg` }] }));

  const stopPolling = useCallback(() => {
    if (pollRef.current)  clearInterval(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    pollRef.current  = null;
    timerRef.current = null;
  }, []);

  // Leave the waiting pool when unmounting
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      stopPolling();
      if (user?.id) {
        fetch(`${apiBase()}/api/match/leave`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        }).catch(() => {});
      }
    };
  }, [user?.id, stopPolling]);

  useEffect(() => {
    if (phase === 'searching' || phase === 'still_searching') {
      pulse.value  = withRepeat(withSequence(withTiming(1.12, { duration: 800 }), withTiming(1, { duration: 800 })), -1, true);
      rotate.value = withRepeat(withTiming(1, { duration: 2400, easing: Easing.linear }), -1, false);
    }
  }, [phase]);

  async function handleFind() {
    if (!user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    cancelledRef.current = false;
    setElapsed(0);
    setErrorMsg('');
    setPhase('searching');

    try {
      // Join the waiting pool (may immediately return a match)
      const resp = await fetch(`${apiBase()}/api/match/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId:            user.id,
          anonymousUsername: user.username,
          ageGroup:          user.ageGroup || 'adult',
          conversationMode:  'general',
          mood:              user.mood || '',
        }),
      });

      if (!resp.ok) throw new Error('join failed');
      const data = await resp.json() as { status: string; sessionId?: string; entryId?: string };

      if (cancelledRef.current) return;

      if (data.status === 'matched' && data.sessionId) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace(`/chat/${data.sessionId}`);
        return;
      }

      // No immediate match — start polling
      startPolling();
    } catch {
      if (cancelledRef.current) return;
      setErrorMsg('Could not reach the server. Check your connection.');
      setPhase('no_match');
    }
  }

  function startPolling() {
    // Elapsed timer
    timerRef.current = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 1;
        if (next >= 30 && !cancelledRef.current) {
          setPhase('still_searching');
        }
        if (next >= 120) {
          // 2 minutes — give up
          stopPolling();
          if (!cancelledRef.current) setPhase('no_match');
        }
        return next;
      });
    }, 1000);

    // Status poll every 2 s
    pollRef.current = setInterval(async () => {
      if (cancelledRef.current || !user?.id) return;
      try {
        const resp = await fetch(`${apiBase()}/api/match/status/${user.id}`);
        if (!resp.ok) return;
        const data = await resp.json() as { status: string; sessionId?: string };
        if (data.status === 'matched' && data.sessionId) {
          stopPolling();
          if (!cancelledRef.current) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.replace(`/chat/${data.sessionId}`);
          }
        }
      } catch {}
    }, 2000);
  }

  function handleCancel() {
    cancelledRef.current = true;
    stopPolling();
    if (user?.id) {
      fetch(`${apiBase()}/api/match/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      }).catch(() => {});
    }
    setPhase('idle');
  }

  async function handleShareLink() {
    const slug = user?.username?.toLowerCase().replace(/[^a-z0-9]/g, '') ?? '';
    const origin = (Platform.OS === 'web' && typeof window !== 'undefined')
      ? window.location.origin
      : `https://${process.env.EXPO_PUBLIC_DOMAIN ?? ''}`;
    const url = `${origin}/message/${slug}`;
    await Share.share({
      message: `Send me an anonymous message! Say anything — I won't know it's you 👀\n\n${url}`,
      url,
    });
  }

  const moodEmoji        = MOODS.find(m => m.id === user?.mood)?.emoji ?? '😊';
  const moodLabel        = MOODS.find(m => m.id === user?.mood)?.label ?? '';
  const personalityLabel = PERSONALITIES.find(p => p.id === user?.personality)?.label ?? '';
  const temperamentLabel = TEMPERAMENTS.find(t => t.id === user?.temperament)?.label ?? '';

  const isSearching = phase === 'searching' || phase === 'still_searching';

  return (
    <View style={styles.container}>
      <BlobBackground variant="purple" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <TouchableOpacity
          onPress={isSearching ? handleCancel : () => router.back()}
          style={styles.backBtn}
        >
          <Ionicons name={isSearching ? 'close' : 'chevron-back'} size={24} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FIND A MATCH</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={[styles.content, { paddingBottom: botPad + 20 }]}>

        {/* ── Idle ─────────────────────────────────── */}
        {phase === 'idle' && (
          <Animated.View entering={FadeIn} style={styles.idleContent}>
            <GlassCard style={styles.profileCard} padding={16}>
              <Text style={styles.cardTitle}>YOUR PROFILE</Text>
              <View style={styles.chipWrap}>
                {[
                  { emoji: moodEmoji,  label: moodLabel },
                  { emoji: '🌊',       label: personalityLabel },
                  { emoji: '🎯',       label: temperamentLabel.split('&')[0].trim() },
                  ...(user?.interests.slice(0, 2).map(id => ({ emoji: '✨', label: id })) ?? []),
                  ...(isTeenMode ? [{ emoji: '🌱', label: 'Teen Mode' }] : []),
                ].filter(c => c.label).map((chip, i) => (
                  <View key={i} style={styles.chip}>
                    <Text style={{ fontSize: 13 }}>{chip.emoji}</Text>
                    <Text style={styles.chipText}>{chip.label}</Text>
                  </View>
                ))}
              </View>
            </GlassCard>

            <GlassCard padding={16} style={styles.honestCard}>
              <Text style={styles.honestEmoji}>ℹ️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.honestTitle}>How matching works</Text>
                <Text style={styles.honestBody}>
                  MyBestie connects you with another real user in the same age group. Only age group is required — everything else is optional.
                </Text>
              </View>
            </GlassCard>

            <TouchableOpacity onPress={handleFind} activeOpacity={0.88} style={styles.findBtnWrap}>
              <LinearGradient
                colors={colors.gradPrimary}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.findBtn}
              >
                <Text style={{ fontSize: 38 }}>🤝</Text>
                <Text style={styles.findBtnText}>Find Someone to Talk To</Text>
                <Text style={styles.findBtnSub}>Matched by age group · real users only</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ── Searching (0–30 s) ───────────────────── */}
        {phase === 'searching' && (
          <Animated.View entering={FadeIn} style={styles.searchContent}>
            <Animated.View style={pulseStyle}>
              <Animated.View style={[styles.searchRing, rotStyle]}>
                <View style={styles.searchInner}>
                  <Text style={{ fontSize: 38 }}>🤝</Text>
                </View>
              </Animated.View>
            </Animated.View>

            <Text style={styles.searchTitle}>Looking for someone…</Text>
            <Text style={styles.searchSub}>
              Searching for a real {isTeenMode ? 'teen' : 'adult'} user right now…
            </Text>

            <GlassCard style={styles.criteriaCard}>
              <View style={styles.criteriaRow}>
                <Text style={{ fontSize: 16 }}>🔒</Text>
                <Text style={styles.criteriaText}>
                  {isTeenMode ? 'Teen-only matching' : 'Adult-only matching'}
                </Text>
                <Ionicons name="sync" size={14} color={CYAN} />
              </View>
              <View style={styles.criteriaRow}>
                <Text style={{ fontSize: 16 }}>{moodEmoji}</Text>
                <Text style={styles.criteriaText}>Mood: {moodLabel || 'any'}</Text>
                <Ionicons name="sync" size={14} color={CYAN} />
              </View>
            </GlassCard>

            <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn}>
              <Ionicons name="close-circle-outline" size={16} color={MUTED} />
              <Text style={styles.cancelText}>Cancel search</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ── Still searching (30 s+) ──────────────── */}
        {phase === 'still_searching' && (
          <Animated.View entering={FadeIn} style={styles.searchContent}>
            <Animated.View style={pulseStyle}>
              <Animated.View style={[styles.searchRing, rotStyle]}>
                <View style={styles.searchInner}>
                  <Text style={{ fontSize: 38 }}>⏳</Text>
                </View>
              </Animated.View>
            </Animated.View>

            <Text style={styles.searchTitle}>Still searching…</Text>
            <Text style={styles.searchSub}>
              No match yet — keep waiting or talk to Bestie AI while you wait.
            </Text>

            <TouchableOpacity
              onPress={() => { handleCancel(); router.push('/bridge-guide'); }}
              activeOpacity={0.88}
              style={styles.findBtnWrap}
            >
              <LinearGradient
                colors={['#1A0B2E', '#2D1554']}
                style={styles.findBtn}
              >
                <Text style={{ fontSize: 22 }}>✨</Text>
                <Text style={styles.findBtnText}>Talk to Bestie AI</Text>
                <Text style={styles.findBtnSub}>We'll keep searching in the background</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn}>
              <Ionicons name="close-circle-outline" size={16} color={MUTED} />
              <Text style={styles.cancelText}>Cancel search</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ── No match / error ────────────────────── */}
        {phase === 'no_match' && (
          <Animated.View entering={FadeInDown.springify()} style={styles.noMatchContent}>
            <View style={styles.noMatchIcon}>
              <Text style={{ fontSize: 52 }}>😔</Text>
            </View>

            <Text style={styles.noMatchTitle}>No one is available right now</Text>
            <Text style={styles.noMatchSub}>
              {errorMsg || 'We searched for 2 minutes but no one in your age group was waiting. Try again soon or talk to Bestie AI.'}
            </Text>

            <TouchableOpacity
              onPress={() => router.replace('/bridge-guide')}
              activeOpacity={0.88}
              style={styles.optionBtnWrap}
            >
              <LinearGradient colors={['#1A0B2E', '#2D1554']} style={styles.optionBtn}>
                <View style={styles.optionIcon}>
                  <Text style={{ fontSize: 22 }}>✨</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionTitle}>Talk to Bestie AI</Text>
                  <Text style={styles.optionSub}>Get career, study, and life advice — or just chat</Text>
                </View>
                <View style={styles.aiBadge}>
                  <Text style={styles.aiBadgeText}>AI</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleShareLink}
              activeOpacity={0.88}
              style={[styles.optionBtnWrap, { borderWidth: 1, borderColor: 'rgba(0,212,255,0.30)', borderRadius: 18 }]}
            >
              <View style={[styles.optionBtn, { backgroundColor: 'rgba(0,212,255,0.07)' }]}>
                <View style={[styles.optionIcon, { backgroundColor: 'rgba(0,212,255,0.15)' }]}>
                  <Text style={{ fontSize: 22 }}>📤</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionTitle, { color: CYAN }]}>Share Your Anonymous Link</Text>
                  <Text style={styles.optionSub}>Let people send you messages anonymously</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setPhase('idle')} style={styles.cancelBtn}>
              <Ionicons name="refresh" size={16} color={MUTED} />
              <Text style={styles.cancelText}>Try searching again</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#050505' },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 10 },
  backBtn:       { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)' },
  headerTitle:   { color: '#FFFFFF', fontSize: 15, fontFamily: 'SpaceGrotesk_700Bold', letterSpacing: 2 },
  content:       { flex: 1, paddingHorizontal: 20, justifyContent: 'center', gap: 16 },

  idleContent:   { gap: 16 },
  profileCard:   { gap: 12 },
  cardTitle:     { color: 'rgba(255,255,255,0.45)', fontSize: 11, fontFamily: 'SpaceGrotesk_600SemiBold', letterSpacing: 1.8 },
  chipWrap:      { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 11, paddingVertical: 5, backgroundColor: 'rgba(255,45,149,0.12)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,45,149,0.25)', gap: 5 },
  chipText:      { fontSize: 12, color: PINK, fontFamily: 'Inter_500Medium' },

  honestCard:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  honestEmoji:   { fontSize: 18, marginTop: 2 },
  honestTitle:   { fontSize: 13, color: '#FFFFFF', fontFamily: 'SpaceGrotesk_600SemiBold', marginBottom: 4 },
  honestBody:    { fontSize: 12, color: MUTED, lineHeight: 18, fontFamily: 'Inter_400Regular' },

  findBtnWrap:   { borderRadius: 24, overflow: 'hidden' as const, shadowColor: PINK, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 24, elevation: 10 },
  findBtn:       { alignItems: 'center', padding: 28, gap: 6 },
  findBtnText:   { color: '#FFFFFF', fontSize: 20, fontFamily: 'SpaceGrotesk_700Bold', textAlign: 'center' },
  findBtnSub:    { color: 'rgba(255,255,255,0.65)', fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center' },

  searchContent: { alignItems: 'center', gap: 24 },
  searchRing:    { width: 136, height: 136, borderRadius: 68, borderWidth: 2.5, borderColor: PINK, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  searchInner:   { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,45,149,0.12)' },
  searchTitle:   { color: '#FFFFFF', fontSize: 22, fontFamily: 'SpaceGrotesk_700Bold', textAlign: 'center' },
  searchSub:     { color: MUTED, fontSize: 14, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20, fontFamily: 'Inter_400Regular' },
  criteriaCard:  { width: '100%', gap: 4 },
  criteriaRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  criteriaText:  { flex: 1, fontSize: 14, color: '#FFFFFF', fontFamily: 'Inter_400Regular' },
  cancelBtn:     { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
  cancelText:    { color: MUTED, fontSize: 14, fontFamily: 'Inter_400Regular' },

  noMatchContent:{ alignItems: 'center', gap: 16 },
  noMatchIcon:   { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  noMatchTitle:  { color: '#FFFFFF', fontSize: 22, fontFamily: 'SpaceGrotesk_700Bold', textAlign: 'center' },
  noMatchSub:    { color: MUTED, fontSize: 14, textAlign: 'center', lineHeight: 21, paddingHorizontal: 10, fontFamily: 'Inter_400Regular' },

  optionBtnWrap: { width: '100%', borderRadius: 18, overflow: 'hidden' as const },
  optionBtn:     { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  optionIcon:    { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,45,149,0.18)', flexShrink: 0 },
  optionTitle:   { color: '#FFFFFF', fontSize: 15, fontFamily: 'SpaceGrotesk_600SemiBold', marginBottom: 3 },
  optionSub:     { color: MUTED, fontSize: 12, fontFamily: 'Inter_400Regular' },
  aiBadge:       { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(255,45,149,0.25)', borderWidth: 1, borderColor: 'rgba(255,45,149,0.40)', flexShrink: 0 },
  aiBadgeText:   { color: PINK, fontSize: 11, fontFamily: 'SpaceGrotesk_700Bold' },
});
