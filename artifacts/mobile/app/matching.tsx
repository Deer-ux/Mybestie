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
import { useColors } from '@/hooks/useColors';
import AvatarDisplay from '@/components/AvatarDisplay';
import GlassCard from '@/components/GlassCard';
import BlobBackground from '@/components/BlobBackground';
import { MOODS, PERSONALITIES, TEMPERAMENTS } from '@/utils/helpers';

export default function MatchingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, isTeenMode } = useApp();
  const { startMatching, isMatching, matchFound, confirmMatch, clearSession } = useChat();
  const [phase, setPhase] = useState<'idle' | 'searching' | 'found'>('idle');

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const pulse = useSharedValue(1);
  const rotate = useSharedValue(0);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const rotStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotate.value * 360}deg` }] }));

  useEffect(() => {
    if (phase === 'searching') {
      pulse.value = withRepeat(withSequence(withTiming(1.1, { duration: 800 }), withTiming(1, { duration: 800 })), -1, true);
      rotate.value = withRepeat(withTiming(1, { duration: 2500, easing: Easing.linear }), -1, false);
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

  function handleStartChat() {
    confirmMatch();
    router.replace('/conversation');
  }

  const moodEmoji = MOODS.find(m => m.id === user?.mood)?.emoji ?? '😊';
  const moodLabel = MOODS.find(m => m.id === user?.mood)?.label ?? '';
  const personalityLabel = PERSONALITIES.find(p => p.id === user?.personality)?.label ?? '';
  const temperamentLabel = TEMPERAMENTS.find(t => t.id === user?.temperament)?.label ?? '';

  const partnerMoodEmoji = MOODS.find(m => m.id === matchFound?.mood)?.emoji ?? '😊';
  const partnerMoodLabel = MOODS.find(m => m.id === matchFound?.mood)?.label ?? '';
  const partnerPersonalityLabel = PERSONALITIES.find(p => p.id === matchFound?.personality)?.label ?? '';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <BlobBackground variant="purple" />

      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <TouchableOpacity onPress={() => { clearSession(); router.back(); }}>
          <Ionicons name="chevron-back" size={26} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.primary, fontFamily: 'Poppins_600SemiBold' }]}>Find a Match</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.content}>
        {phase === 'idle' && (
          <Animated.View entering={FadeIn} style={styles.idleContent}>
            <GlassCard style={styles.profileSummary}>
              <Text style={[styles.profileSummaryTitle, { color: colors.foreground, fontFamily: 'Poppins_600SemiBold' }]}>
                Your Profile
              </Text>
              <View style={styles.chipWrap}>
                {[
                  { emoji: moodEmoji, label: moodLabel },
                  { emoji: '🌊', label: personalityLabel },
                  { emoji: '🎯', label: temperamentLabel.split('&')[0].trim() },
                  ...(user?.interests.slice(0, 2).map(id => ({ emoji: '✨', label: id })) ?? []),
                  ...(isTeenMode ? [{ emoji: '🌱', label: 'Teen Mode' }] : []),
                ].map((chip, i) => (
                  <View key={i} style={[styles.chip, { backgroundColor: colors.lavenderLight }]}>
                    <Text style={{ fontSize: 13 }}>{chip.emoji}</Text>
                    <Text style={[styles.chipText, { color: colors.accent, fontFamily: 'Inter_500Medium' }]}>{chip.label}</Text>
                  </View>
                ))}
              </View>
            </GlassCard>

            <TouchableOpacity
              onPress={handleFind}
              style={[styles.findBtn, { borderRadius: colors.radius + 4 }]}
              activeOpacity={0.88}
            >
              <LinearGradient colors={['#1F6F8B', '#0B3C5D']} style={styles.findGrad}>
                <Text style={styles.findEmoji}>🤝</Text>
                <Text style={[styles.findText, { fontFamily: 'Poppins_700Bold' }]}>Find My Match</Text>
                <Text style={[styles.findSub, { fontFamily: 'Inter_400Regular' }]}>Smart matching in seconds</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {phase === 'searching' && (
          <Animated.View entering={FadeIn} style={styles.searchingContent}>
            <Animated.View style={pulseStyle}>
              <Animated.View style={[styles.searchRing, { borderColor: colors.lavender }, rotStyle]}>
                <View style={[styles.searchInner, { backgroundColor: colors.lavenderLight }]}>
                  <Text style={styles.searchEmoji}>🤝</Text>
                </View>
              </Animated.View>
            </Animated.View>
            <Text style={[styles.searchTitle, { color: colors.primary, fontFamily: 'Poppins_700Bold' }]}>
              Finding your match...
            </Text>
            <Text style={[styles.searchSub, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              Checking mood, personality, goals, and interests{isTeenMode ? ' within Teen Mode' : ''}...
            </Text>
            <GlassCard style={styles.criteriaCard}>
              {[
                { emoji: moodEmoji, label: `Mood: ${moodLabel}` },
                { emoji: '🌊', label: `Personality: ${personalityLabel}` },
                { emoji: '🔒', label: isTeenMode ? 'Teen-only matching' : 'Adult-only matching' },
              ].map((c, i) => (
                <View key={i} style={styles.criteriaRow}>
                  <Text style={{ fontSize: 16 }}>{c.emoji}</Text>
                  <Text style={[styles.criteriaText, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}>{c.label}</Text>
                  <Ionicons name="checkmark-circle" size={16} color={colors.safeGreen} />
                </View>
              ))}
            </GlassCard>
          </Animated.View>
        )}

        {phase === 'found' && matchFound && (
          <Animated.View entering={FadeInDown.springify()} style={styles.foundContent}>
            <Text style={[styles.foundHeading, { color: colors.primary, fontFamily: 'Poppins_700Bold' }]}>
              Match Found! 🎉
            </Text>

            <GlassCard style={styles.matchCard} padding={24}>
              <AvatarDisplay iconIndex={matchFound.iconIndex} colorIndex={matchFound.colorIndex} size={72} showRing />
              <Text style={[styles.matchName, { color: colors.foreground, fontFamily: 'Poppins_700Bold' }]}>{matchFound.username}</Text>

              <View style={styles.matchChips}>
                <View style={[styles.matchChip, { backgroundColor: colors.lavenderLight }]}>
                  <Text style={styles.matchChipEmoji}>{partnerMoodEmoji}</Text>
                  <Text style={[styles.matchChipText, { color: colors.accent, fontFamily: 'Inter_500Medium' }]}>{partnerMoodLabel}</Text>
                </View>
                <View style={[styles.matchChip, { backgroundColor: colors.muted }]}>
                  <Text style={styles.matchChipEmoji}>🌊</Text>
                  <Text style={[styles.matchChipText, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>{partnerPersonalityLabel}</Text>
                </View>
                {matchFound.interests[0] && (
                  <View style={[styles.matchChip, { backgroundColor: colors.safeGreenLight }]}>
                    <Text style={styles.matchChipEmoji}>✨</Text>
                    <Text style={[styles.matchChipText, { color: colors.safeGreen, fontFamily: 'Inter_500Medium' }]}>{matchFound.interests[0]}</Text>
                  </View>
                )}
              </View>

              <LinearGradient colors={['#1F6F8B', '#0B3C5D']} style={styles.compatBar}>
                <Text style={[styles.compatText, { fontFamily: 'Poppins_700Bold' }]}>
                  {matchFound.compatibilityScore}% Compatibility
                </Text>
              </LinearGradient>
            </GlassCard>

            <TouchableOpacity
              onPress={handleStartChat}
              style={[styles.startBtn, { borderRadius: colors.radius }]}
              activeOpacity={0.88}
            >
              <LinearGradient colors={['#4CAF50', '#2E7D32']} style={styles.startGrad}>
                <Text style={styles.startEmoji}>💬</Text>
                <Text style={[styles.startText, { fontFamily: 'Inter_600SemiBold' }]}>Start Conversation</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setPhase('idle'); }} style={styles.skipBtn}>
              <Text style={[styles.skipText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                Find a different match
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 10,
  },
  headerTitle: { fontSize: 18 },
  content: { flex: 1, paddingHorizontal: 20, justifyContent: 'center', gap: 20 },
  idleContent: { gap: 20 },
  profileSummary: { gap: 12 },
  profileSummaryTitle: { fontSize: 15 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 5 },
  chipText: { fontSize: 13 },
  findBtn: { overflow: 'hidden' as const },
  findGrad: { alignItems: 'center', padding: 24, gap: 6 },
  findEmoji: { fontSize: 40 },
  findText: { color: '#FFFFFF', fontSize: 22 },
  findSub: { color: 'rgba(255,255,255,0.75)', fontSize: 14 },
  searchingContent: { alignItems: 'center', gap: 24 },
  searchRing: {
    width: 130, height: 130, borderRadius: 65, borderWidth: 2.5,
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center',
  },
  searchInner: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  searchEmoji: { fontSize: 38 },
  searchTitle: { fontSize: 22, textAlign: 'center' },
  searchSub: { fontSize: 14, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
  criteriaCard: { width: '100%', gap: 4 },
  criteriaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  criteriaText: { flex: 1, fontSize: 14 },
  foundContent: { alignItems: 'center', gap: 16 },
  foundHeading: { fontSize: 26 },
  matchCard: { alignItems: 'center', gap: 14, width: '100%' },
  matchName: { fontSize: 22 },
  matchChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  matchChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 5 },
  matchChipEmoji: { fontSize: 14 },
  matchChipText: { fontSize: 13 },
  compatBar: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
  compatText: { color: '#FFFFFF', fontSize: 15 },
  startBtn: { width: '100%', overflow: 'hidden' as const },
  startGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 },
  startEmoji: { fontSize: 20 },
  startText: { color: '#FFFFFF', fontSize: 17 },
  skipBtn: { paddingVertical: 8 },
  skipText: { fontSize: 14 },
});
