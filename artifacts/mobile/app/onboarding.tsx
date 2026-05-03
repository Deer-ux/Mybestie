import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Platform, TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import AvatarDisplay from '@/components/AvatarDisplay';
import {
  MOODS, GOALS, INTERESTS, PERSONALITIES, TEMPERAMENTS,
  AVATAR_ICON_NAMES, AVATAR_COLOR_OPTIONS, generateUsername,
} from '@/utils/helpers';

const STEPS = ['Profile', 'Mood', 'Goal', 'Interests', 'Personality'];

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, updateUser, completeOnboarding } = useApp();

  const [step, setStep] = useState(0);
  const [username, setUsername] = useState(user?.username ?? generateUsername());
  const [iconIndex, setIconIndex] = useState(user?.iconIndex ?? 0);
  const [colorIndex, setColorIndex] = useState(user?.colorIndex ?? 0);
  const [mood, setMood] = useState('');
  const [goal, setGoal] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [personality, setPersonality] = useState('');
  const [temperament, setTemperament] = useState('');

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  function toggleInterest(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInterests(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }

  function select(setter: (v: string) => void, value: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setter(value);
  }

  function canAdvance(): boolean {
    if (step === 0) return username.trim().length > 2;
    if (step === 1) return mood !== '';
    if (step === 2) return goal !== '';
    if (step === 3) return interests.length >= 1;
    if (step === 4) return personality !== '' && temperament !== '';
    return false;
  }

  async function handleNext() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      await completeOnboarding({ username, iconIndex, colorIndex, mood, goal, interests, personality, temperament });
      router.replace('/(tabs)/home');
    }
  }

  const progressWidth = `${((step + 1) / STEPS.length) * 100}%`;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.primary, colors.purple]} style={[styles.topBar, { paddingTop: topPad + 12 }]}>
        <View style={styles.progressRow}>
          {STEPS.map((s, i) => (
            <View key={s} style={[styles.stepDot, { backgroundColor: i <= step ? '#FFFFFF' : 'rgba(255,255,255,0.3)' }]} />
          ))}
        </View>
        <Text style={styles.stepLabel}>{STEPS[step]}</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: progressWidth as any }]} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 100 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 0 && (
          <Animated.View entering={FadeInRight} style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>Create Your Anonymous Profile</Text>
            <Text style={[styles.stepSubtitle, { color: colors.mutedForeground }]}>
              Your real name and identity are never shared. We generate a safe anonymous username for you.
            </Text>

            <View style={styles.avatarPreview}>
              <AvatarDisplay iconIndex={iconIndex} colorIndex={colorIndex} size={80} showBorder />
              <Text style={[styles.previewName, { color: colors.foreground }]}>{username}</Text>
            </View>

            <Text style={[styles.label, { color: colors.mutedForeground }]}>CHOOSE AVATAR ICON</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconRow}>
              {AVATAR_ICON_NAMES.map((icon, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => { setIconIndex(i); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  style={[styles.iconOption, {
                    backgroundColor: i === iconIndex ? colors.primary : colors.muted,
                    borderRadius: 24,
                  }]}
                >
                  <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color={i === iconIndex ? '#FFFFFF' : colors.mutedForeground} />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.label, { color: colors.mutedForeground }]}>CHOOSE COLOR</Text>
            <View style={styles.colorRow}>
              {AVATAR_COLOR_OPTIONS.map((c, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => { setColorIndex(i); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  style={[styles.colorDot, { backgroundColor: c, borderWidth: i === colorIndex ? 3 : 0, borderColor: colors.foreground }]}
                />
              ))}
            </View>

            <Text style={[styles.label, { color: colors.mutedForeground }]}>YOUR USERNAME</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                value={username}
                onChangeText={setUsername}
                maxLength={24}
                placeholder="Your anonymous name"
                placeholderTextColor={colors.mutedForeground}
              />
              <TouchableOpacity onPress={() => setUsername(generateUsername())} style={[styles.refreshBtn, { backgroundColor: colors.muted }]}>
                <Ionicons name="refresh" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {step === 1 && (
          <Animated.View entering={FadeInRight} style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>How are you feeling?</Text>
            <Text style={[styles.stepSubtitle, { color: colors.mutedForeground }]}>
              This helps us match you with someone who complements your current mood.
            </Text>
            <View style={styles.grid}>
              {MOODS.map(m => (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => select(setMood, m.id)}
                  style={[styles.chipCard, {
                    backgroundColor: mood === m.id ? colors.primary : colors.card,
                    borderColor: mood === m.id ? colors.primary : colors.border,
                    borderRadius: colors.radius,
                  }]}
                >
                  <Ionicons
                    name={m.icon as keyof typeof Ionicons.glyphMap}
                    size={22}
                    color={mood === m.id ? '#FFFFFF' : colors.primary}
                  />
                  <Text style={[styles.chipLabel, { color: mood === m.id ? '#FFFFFF' : colors.foreground }]}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {step === 2 && (
          <Animated.View entering={FadeInRight} style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>What brings you here?</Text>
            <Text style={[styles.stepSubtitle, { color: colors.mutedForeground }]}>
              Your conversation goal helps us find the right match for you.
            </Text>
            {GOALS.map(g => (
              <TouchableOpacity
                key={g.id}
                onPress={() => select(setGoal, g.id)}
                style={[styles.listItem, {
                  backgroundColor: goal === g.id ? colors.blueLight : colors.card,
                  borderColor: goal === g.id ? colors.primary : colors.border,
                  borderRadius: colors.radius,
                }]}
              >
                <Ionicons
                  name={g.icon as keyof typeof Ionicons.glyphMap}
                  size={22}
                  color={goal === g.id ? colors.primary : colors.mutedForeground}
                />
                <Text style={[styles.listLabel, { color: colors.foreground }]}>{g.label}</Text>
                {goal === g.id && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}

        {step === 3 && (
          <Animated.View entering={FadeInRight} style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>What topics interest you?</Text>
            <Text style={[styles.stepSubtitle, { color: colors.mutedForeground }]}>
              Select at least one topic. Choose as many as you like.
            </Text>
            <View style={styles.tagsWrap}>
              {INTERESTS.map(interest => (
                <TouchableOpacity
                  key={interest.id}
                  onPress={() => toggleInterest(interest.id)}
                  style={[styles.tag, {
                    backgroundColor: interests.includes(interest.id) ? colors.primary : colors.card,
                    borderColor: interests.includes(interest.id) ? colors.primary : colors.border,
                    borderRadius: 20,
                  }]}
                >
                  <Text style={[styles.tagText, { color: interests.includes(interest.id) ? '#FFFFFF' : colors.foreground }]}>
                    {interest.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {step === 4 && (
          <Animated.View entering={FadeInRight} style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>Your personality style</Text>
            <Text style={[styles.stepSubtitle, { color: colors.mutedForeground }]}>
              Help us understand how you connect with others.
            </Text>

            <Text style={[styles.label, { color: colors.mutedForeground }]}>PERSONALITY</Text>
            <View style={styles.grid}>
              {PERSONALITIES.map(p => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => select(setPersonality, p.id)}
                  style={[styles.chipCard, {
                    backgroundColor: personality === p.id ? colors.purple : colors.card,
                    borderColor: personality === p.id ? colors.purple : colors.border,
                    borderRadius: colors.radius,
                  }]}
                >
                  <Ionicons
                    name={p.icon as keyof typeof Ionicons.glyphMap}
                    size={20}
                    color={personality === p.id ? '#FFFFFF' : colors.purple}
                  />
                  <Text style={[styles.chipLabel, { color: personality === p.id ? '#FFFFFF' : colors.foreground }]}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.mutedForeground, marginTop: 20 }]}>TEMPERAMENT</Text>
            {TEMPERAMENTS.map(t => (
              <TouchableOpacity
                key={t.id}
                onPress={() => select(setTemperament, t.id)}
                style={[styles.listItem, {
                  backgroundColor: temperament === t.id ? colors.purpleLight : colors.card,
                  borderColor: temperament === t.id ? colors.purple : colors.border,
                  borderRadius: colors.radius,
                }]}
              >
                <Ionicons
                  name={t.icon as keyof typeof Ionicons.glyphMap}
                  size={20}
                  color={temperament === t.id ? colors.purple : colors.mutedForeground}
                />
                <Text style={[styles.listLabel, { color: colors.foreground }]}>{t.label}</Text>
                {temperament === t.id && <Ionicons name="checkmark-circle" size={20} color={colors.purple} />}
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomPad + 16, backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.nextBtn, {
            backgroundColor: canAdvance() ? colors.primary : colors.muted,
            borderRadius: colors.radius,
          }]}
          onPress={handleNext}
          disabled={!canAdvance()}
        >
          <Text style={[styles.nextText, { color: canAdvance() ? '#FFFFFF' : colors.mutedForeground }]}>
            {step === STEPS.length - 1 ? 'Start MindBridge' : 'Continue'}
          </Text>
          <Ionicons name={step === STEPS.length - 1 ? 'rocket-outline' : 'arrow-forward'} size={20} color={canAdvance() ? '#FFFFFF' : colors.mutedForeground} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { paddingHorizontal: 20, paddingBottom: 16 },
  progressRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  stepDot: { flex: 1, height: 4, borderRadius: 2 },
  stepLabel: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' as const, marginBottom: 8, opacity: 0.8 },
  progressBar: { height: 2, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 1 },
  progressFill: { height: 2, backgroundColor: '#FFFFFF', borderRadius: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 24, paddingHorizontal: 20 },
  stepContent: { gap: 16 },
  stepTitle: { fontSize: 24, fontWeight: '700' as const, lineHeight: 30 },
  stepSubtitle: { fontSize: 14, lineHeight: 20 },
  avatarPreview: { alignItems: 'center', paddingVertical: 20, gap: 12 },
  previewName: { fontSize: 18, fontWeight: '600' as const },
  label: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.8, marginTop: 8 },
  iconRow: { flexDirection: 'row' as const, marginBottom: 8 },
  iconOption: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  colorDot: { width: 36, height: 36, borderRadius: 18 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, overflow: 'hidden' as const },
  input: { flex: 1, padding: 14, fontSize: 16, fontWeight: '500' as const },
  refreshBtn: { padding: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chipCard: {
    width: '46%', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderWidth: 1.5, gap: 6,
  },
  chipLabel: { fontSize: 13, fontWeight: '500' as const, textAlign: 'center' },
  listItem: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderWidth: 1.5, gap: 12,
  },
  listLabel: { flex: 1, fontSize: 15, fontWeight: '500' as const },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1.5 },
  tagText: { fontSize: 14, fontWeight: '500' as const },
  footer: {
    paddingHorizontal: 20, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth,
  },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, gap: 8,
  },
  nextText: { fontSize: 16, fontWeight: '700' as const },
});
