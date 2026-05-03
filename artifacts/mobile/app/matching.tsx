import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
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
import { useChat } from '@/context/ChatContext';
import AvatarDisplay from '@/components/AvatarDisplay';
import GlassCard from '@/components/GlassCard';
import BlobBackground from '@/components/BlobBackground';
import { MOODS, PERSONALITIES, TEMPERAMENTS } from '@/utils/helpers';
import colors from '@/constants/colors';

const PINK = '#FF2D95';
const CYAN = '#00D4FF';
const MUTED = 'rgba(255,255,255,0.50)';

export default function MatchingScreen() {
  const insets = useSafeAreaInsets();
  const { user, isTeenMode } = useApp();
  const { startMatching, isMatching, matchFound, confirmMatch, clearSession } = useChat();
  const [phase, setPhase] = useState<'idle' | 'searching' | 'found'>('idle');

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const pulse = useSharedValue(1);
  const rotate = useSharedValue(0);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const rotStyle   = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotate.value * 360}deg` }] }));

  useEffect(() => {
    if (phase === 'searching') {
      pulse.value  = withRepeat(withSequence(withTiming(1.12, { duration: 800 }), withTiming(1, { duration: 800 })), -1, true);
      rotate.value = withRepeat(withTiming(1, { duration: 2400, easing: Easing.linear }), -1, false);
    }
  }, [phase]);

  useEffect(() => {
    if (matchFound) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPhase('found');
    }
  }, [matchFound]);

  async function handleFind() {
    if (!user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setPhase('searching');
    await startMatching(user.mood, user.goal, user.interests, user.personality, user.id, user.ageGroup);
  }

  function handleStartChat() { confirmMatch(); router.replace('/conversation'); }

  const moodEmoji         = MOODS.find(m => m.id === user?.mood)?.emoji ?? '😊';
  const moodLabel         = MOODS.find(m => m.id === user?.mood)?.label ?? '';
  const personalityLabel  = PERSONALITIES.find(p => p.id === user?.personality)?.label ?? '';
  const temperamentLabel  = TEMPERAMENTS.find(t => t.id === user?.temperament)?.label ?? '';
  const partnerMoodEmoji  = MOODS.find(m => m.id === matchFound?.mood)?.emoji ?? '😊';
  const partnerMoodLabel  = MOODS.find(m => m.id === matchFound?.mood)?.label ?? '';
  const partnerPersonalityLabel = PERSONALITIES.find(p => p.id === matchFound?.personality)?.label ?? '';

  return (
    <View style={styles.container}>
      <BlobBackground variant="purple" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <TouchableOpacity
          onPress={() => { clearSession(); router.back(); }}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color="rgba(255,255,255,0.7)" />
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
                ].map((chip, i) => (
                  <View key={i} style={styles.chip}>
                    <Text style={{ fontSize: 13 }}>{chip.emoji}</Text>
                    <Text style={styles.chipText}>{chip.label}</Text>
                  </View>
                ))}
              </View>
            </GlassCard>

            <TouchableOpacity onPress={handleFind} activeOpacity={0.88} style={styles.findBtnWrap}>
              <LinearGradient
                colors={colors.gradPrimary}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.findBtn}
              >
                <Text style={{ fontSize: 38 }}>🤝</Text>
                <Text style={styles.findBtnText}>Find My Match</Text>
                <Text style={styles.findBtnSub}>Smart matching in seconds</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ── Searching ───────────────────────────── */}
        {phase === 'searching' && (
          <Animated.View entering={FadeIn} style={styles.searchContent}>
            <Animated.View style={pulseStyle}>
              <Animated.View style={[styles.searchRing, rotStyle]}>
                <View style={styles.searchInner}>
                  <Text style={{ fontSize: 38 }}>🤝</Text>
                </View>
              </Animated.View>
            </Animated.View>

            <Text style={styles.searchTitle}>Finding your match...</Text>
            <Text style={styles.searchSub}>
              Checking mood, personality, goals, and interests{isTeenMode ? ' in Teen Mode' : ''}...
            </Text>

            <GlassCard style={styles.criteriaCard}>
              {[
                { emoji: moodEmoji, label: `Mood: ${moodLabel}` },
                { emoji: '🌊',     label: `Style: ${personalityLabel}` },
                { emoji: '🔒',     label: isTeenMode ? 'Teen-only matching' : 'Adult-only matching' },
              ].map((c, i) => (
                <View key={i} style={styles.criteriaRow}>
                  <Text style={{ fontSize: 16 }}>{c.emoji}</Text>
                  <Text style={styles.criteriaText}>{c.label}</Text>
                  <Ionicons name="checkmark-circle" size={16} color="#00FF88" />
                </View>
              ))}
            </GlassCard>
          </Animated.View>
        )}

        {/* ── Match found ──────────────────────────── */}
        {phase === 'found' && matchFound && (
          <Animated.View entering={FadeInDown.springify()} style={styles.foundContent}>
            <Text style={styles.foundHeading}>Match Found! 🎉</Text>

            <GlassCard style={styles.matchCard} padding={24} neonBorder>
              <AvatarDisplay iconIndex={matchFound.iconIndex} colorIndex={matchFound.colorIndex} size={72} showRing />
              <Text style={styles.matchName}>{matchFound.username}</Text>

              <View style={styles.matchChips}>
                {[
                  { emoji: partnerMoodEmoji, label: partnerMoodLabel, color: PINK },
                  { emoji: '🌊', label: partnerPersonalityLabel, color: CYAN },
                  ...(matchFound.interests[0] ? [{ emoji: '✨', label: matchFound.interests[0], color: '#00FF88' }] : []),
                ].map((c, i) => (
                  <View key={i} style={[styles.matchChip, { borderColor: c.color + '40' }]}>
                    <Text style={{ fontSize: 14 }}>{c.emoji}</Text>
                    <Text style={[styles.matchChipText, { color: c.color }]}>{c.label}</Text>
                  </View>
                ))}
              </View>

              <LinearGradient
                colors={colors.gradPrimary}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.compatBar}
              >
                <Text style={styles.compatText}>⚡ {matchFound.compatibilityScore}% Compatibility</Text>
              </LinearGradient>
            </GlassCard>

            <TouchableOpacity onPress={handleStartChat} activeOpacity={0.88} style={styles.startBtnWrap}>
              <LinearGradient colors={colors.gradSuccess} style={styles.startBtn}>
                <Text style={{ fontSize: 20 }}>💬</Text>
                <Text style={styles.startBtnText}>Start Conversation</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setPhase('idle')} style={styles.skipBtn}>
              <Text style={styles.skipText}>Find a different match</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerTitle: { color: '#FFFFFF', fontSize: 15, fontFamily: 'SpaceGrotesk_700Bold', letterSpacing: 2 },
  content: { flex: 1, paddingHorizontal: 20, justifyContent: 'center', gap: 20 },

  idleContent: { gap: 20 },
  profileCard: { gap: 12 },
  cardTitle: { color: 'rgba(255,255,255,0.45)', fontSize: 11, fontFamily: 'SpaceGrotesk_600SemiBold', letterSpacing: 1.8 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 11, paddingVertical: 5,
    backgroundColor: 'rgba(255,45,149,0.12)', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,45,149,0.25)', gap: 5,
  },
  chipText: { fontSize: 12, color: PINK, fontFamily: 'Inter_500Medium' },

  findBtnWrap: {
    borderRadius: 24, overflow: 'hidden' as const,
    shadowColor: PINK, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 24, elevation: 10,
  },
  findBtn: { alignItems: 'center', padding: 28, gap: 6 },
  findBtnText: { color: '#FFFFFF', fontSize: 22, fontFamily: 'SpaceGrotesk_700Bold' },
  findBtnSub: { color: 'rgba(255,255,255,0.65)', fontSize: 13, fontFamily: 'Inter_400Regular' },

  searchContent: { alignItems: 'center', gap: 24 },
  searchRing: {
    width: 136, height: 136, borderRadius: 68,
    borderWidth: 2.5, borderColor: PINK,
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center',
  },
  searchInner: {
    width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,45,149,0.12)',
  },
  searchTitle: { color: '#FFFFFF', fontSize: 22, fontFamily: 'SpaceGrotesk_700Bold', textAlign: 'center' },
  searchSub: { color: MUTED, fontSize: 14, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20, fontFamily: 'Inter_400Regular' },
  criteriaCard: { width: '100%', gap: 4 },
  criteriaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  criteriaText: { flex: 1, fontSize: 14, color: '#FFFFFF', fontFamily: 'Inter_400Regular' },

  foundContent: { alignItems: 'center', gap: 16 },
  foundHeading: { color: '#FFFFFF', fontSize: 26, fontFamily: 'SpaceGrotesk_700Bold' },
  matchCard: { alignItems: 'center', gap: 14, width: '100%' },
  matchName: { fontSize: 22, color: '#FFFFFF', fontFamily: 'SpaceGrotesk_700Bold' },
  matchChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  matchChip: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 11, paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, borderWidth: 1, gap: 5,
  },
  matchChipText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  compatBar: { paddingHorizontal: 20, paddingVertical: 9, borderRadius: 20 },
  compatText: { color: '#FFFFFF', fontSize: 14, fontFamily: 'SpaceGrotesk_700Bold' },

  startBtnWrap: { width: '100%', borderRadius: 20, overflow: 'hidden' as const },
  startBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 17, gap: 10 },
  startBtnText: { color: '#FFFFFF', fontSize: 17, fontFamily: 'SpaceGrotesk_600SemiBold' },

  skipBtn: { paddingVertical: 8 },
  skipText: { color: MUTED, fontSize: 14, fontFamily: 'Inter_400Regular' },
});
