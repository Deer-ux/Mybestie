import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Platform, TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import AvatarDisplay from '@/components/AvatarDisplay';
import BlobBackground from '@/components/BlobBackground';
import {
  AGE_GROUPS, MOODS, GOALS, PERSONALITIES, TEMPERAMENTS,
  AVATAR_ICON_NAMES, AVATAR_COLOR_OPTIONS, generateUsername,
  getInterestsForAge,
} from '@/utils/helpers';

const STEPS = ['Age', 'Mood', 'Goal', 'Topics', 'Personality', 'Temperament', 'Avatar'];

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, completeOnboarding } = useApp();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [step, setStep] = useState(0);
  const [ageGroup, setAgeGroup] = useState('');
  const [mood, setMood] = useState('');
  const [goal, setGoal] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [personality, setPersonality] = useState('');
  const [temperament, setTemperament] = useState('');
  const [username, setUsername] = useState(user?.username ?? generateUsername());
  const [iconIndex, setIconIndex] = useState(user?.iconIndex ?? 0);
  const [colorIndex, setColorIndex] = useState(user?.colorIndex ?? 0);
  const [ageBlocked, setAgeBlocked] = useState(false);

  const isTeenMode = ageGroup === 'teen';
  const availableInterests = getInterestsForAge(isTeenMode);

  function tap() { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }

  function toggleInterest(id: string) {
    tap();
    setInterests(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }

  function canAdvance(): boolean {
    if (step === 0) return ageGroup !== '' && !ageBlocked;
    if (step === 1) return mood !== '';
    if (step === 2) return goal !== '';
    if (step === 3) return interests.length >= 1;
    if (step === 4) return personality !== '';
    if (step === 5) return temperament !== '';
    if (step === 6) return username.trim().length > 2;
    return false;
  }

  async function handleNext() {
    if (step < STEPS.length - 1) { setStep(s => s + 1); return; }
    await completeOnboarding({ ageGroup, mood, goal, interests, personality, temperament, username, iconIndex, colorIndex });
    router.replace('/(tabs)/home');
  }

  function handleAgeSelect(id: string) {
    tap();
    setAgeGroup(id);
    const group = AGE_GROUPS.find(g => g.id === id);
    setAgeBlocked(!!group?.blocked);
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <BlobBackground variant="purple" />

      <LinearGradient colors={['#0B3C5D', '#1F6F8B']} style={[styles.topBar, { paddingTop: topPad + 10 }]}>
        <View style={styles.progressRow}>
          {STEPS.map((_, i) => (
            <View key={i} style={[styles.progDot, { backgroundColor: i <= step ? '#FFFFFF' : 'rgba(255,255,255,0.3)' }]} />
          ))}
        </View>
        <View style={styles.topBarBottom}>
          <Text style={[styles.stepName, { fontFamily: 'Poppins_600SemiBold' }]}>
            Step {step + 1}: {STEPS[step]}
          </Text>
          <Text style={[styles.stepCount, { fontFamily: 'Inter_400Regular' }]}>
            {step + 1}/{STEPS.length}
          </Text>
        </View>
        <View style={[styles.progBar, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
          <View style={[styles.progFill, { width: `${progress}%` as any }]} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: botPad + 110 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 0 && (
          <Animated.View entering={FadeInRight} style={styles.stepWrap}>
            <Text style={[styles.stepTitle, { color: colors.primary, fontFamily: 'Poppins_700Bold' }]}>
              Let's keep it safe
            </Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              MindBridge separates teen and adult spaces to keep all conversations safer.
            </Text>
            <View style={[styles.safetyNote, { backgroundColor: colors.safeGreenLight, borderRadius: colors.radius }]}>
              <Text style={{ fontSize: 18 }}>🛡️</Text>
              <Text style={[styles.safetyNoteText, { color: colors.safeGreen, fontFamily: 'Inter_500Medium' }]}>
                Teen users are matched only with other teens. Adults are matched only with adults.
              </Text>
            </View>
            {AGE_GROUPS.map(g => (
              <TouchableOpacity
                key={g.id}
                onPress={() => handleAgeSelect(g.id)}
                style={[styles.ageCard, {
                  backgroundColor: ageGroup === g.id
                    ? (g.blocked ? '#FFF0F0' : colors.lavenderLight)
                    : colors.glass,
                  borderColor: ageGroup === g.id
                    ? (g.blocked ? colors.destructive : colors.accent)
                    : colors.glassBorder,
                  borderRadius: colors.radius,
                }]}
              >
                <Text style={styles.ageEmoji}>{g.emoji}</Text>
                <View style={styles.ageInfo}>
                  <Text style={[styles.ageLabel, { color: g.blocked && ageGroup === g.id ? colors.destructive : colors.foreground, fontFamily: 'Poppins_600SemiBold' }]}>
                    {g.label}
                  </Text>
                  <Text style={[styles.ageSub, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>{g.description}</Text>
                </View>
                {ageGroup === g.id && (
                  <Ionicons name={g.blocked ? 'close-circle' : 'checkmark-circle'} size={22} color={g.blocked ? colors.destructive : colors.accent} />
                )}
              </TouchableOpacity>
            ))}
            {ageBlocked && (
              <View style={[styles.blockedCard, { backgroundColor: '#FFF0F0', borderRadius: colors.radius }]}>
                <Text style={styles.blockedEmoji}>🚫</Text>
                <Text style={[styles.blockedText, { color: colors.destructive, fontFamily: 'Inter_500Medium' }]}>
                  MindBridge is only available for users aged 13 and above. We care about keeping younger children safe online.
                </Text>
              </View>
            )}
          </Animated.View>
        )}

        {step === 1 && (
          <Animated.View entering={FadeInRight} style={styles.stepWrap}>
            <Text style={[styles.stepTitle, { color: colors.primary, fontFamily: 'Poppins_700Bold' }]}>
              How are you feeling right now?
            </Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              This helps us find someone who complements your current mood.
            </Text>
            <View style={styles.emojiGrid}>
              {MOODS.map(m => (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => { tap(); setMood(m.id); }}
                  style={[styles.emojiCard, {
                    backgroundColor: mood === m.id ? colors.lavenderLight : colors.glass,
                    borderColor: mood === m.id ? colors.accent : colors.glassBorder,
                    borderRadius: colors.radius,
                  }]}
                >
                  <Text style={styles.cardEmoji}>{m.emoji}</Text>
                  <Text style={[styles.cardLabel, { color: mood === m.id ? colors.accent : colors.foreground, fontFamily: 'Inter_500Medium' }]}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {step === 2 && (
          <Animated.View entering={FadeInRight} style={styles.stepWrap}>
            <Text style={[styles.stepTitle, { color: colors.primary, fontFamily: 'Poppins_700Bold' }]}>
              What brings you here?
            </Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              Your conversation goal helps us find the right match.
            </Text>
            {GOALS.map(g => (
              <TouchableOpacity
                key={g.id}
                onPress={() => { tap(); setGoal(g.id); }}
                style={[styles.listCard, {
                  backgroundColor: goal === g.id ? colors.lavenderLight : colors.glass,
                  borderColor: goal === g.id ? colors.accent : colors.glassBorder,
                  borderRadius: colors.radius,
                }]}
              >
                <Text style={styles.listEmoji}>{g.emoji}</Text>
                <Text style={[styles.listLabel, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>{g.label}</Text>
                {goal === g.id && <Ionicons name="checkmark-circle" size={20} color={colors.accent} />}
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}

        {step === 3 && (
          <Animated.View entering={FadeInRight} style={styles.stepWrap}>
            <Text style={[styles.stepTitle, { color: colors.primary, fontFamily: 'Poppins_700Bold' }]}>
              What topics interest you?
            </Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              Pick at least one. Choose as many as you like.
              {isTeenMode && ' (Some adult topics are not available in Teen Mode.)'}
            </Text>
            <View style={styles.tagGrid}>
              {availableInterests.map(interest => (
                <TouchableOpacity
                  key={interest.id}
                  onPress={() => toggleInterest(interest.id)}
                  style={[styles.tag, {
                    backgroundColor: interests.includes(interest.id) ? colors.accent : colors.glass,
                    borderColor: interests.includes(interest.id) ? colors.accent : colors.glassBorder,
                    borderRadius: 20,
                  }]}
                >
                  <Text style={{ fontSize: 15 }}>{interest.emoji}</Text>
                  <Text style={[styles.tagText, { color: interests.includes(interest.id) ? '#FFFFFF' : colors.foreground, fontFamily: 'Inter_500Medium' }]}>
                    {interest.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {step === 4 && (
          <Animated.View entering={FadeInRight} style={styles.stepWrap}>
            <Text style={[styles.stepTitle, { color: colors.primary, fontFamily: 'Poppins_700Bold' }]}>
              How do you connect?
            </Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              Select your personality style.
            </Text>
            <View style={styles.emojiGrid}>
              {PERSONALITIES.map(p => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => { tap(); setPersonality(p.id); }}
                  style={[styles.emojiCard, {
                    backgroundColor: personality === p.id ? colors.lavenderLight : colors.glass,
                    borderColor: personality === p.id ? colors.accent : colors.glassBorder,
                    borderRadius: colors.radius,
                  }]}
                >
                  <Text style={styles.cardEmoji}>{p.emoji}</Text>
                  <Text style={[styles.cardLabel, { color: personality === p.id ? colors.accent : colors.foreground, fontFamily: 'Inter_500Medium' }]}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {step === 5 && (
          <Animated.View entering={FadeInRight} style={styles.stepWrap}>
            <Text style={[styles.stepTitle, { color: colors.primary, fontFamily: 'Poppins_700Bold' }]}>
              Your communication style
            </Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              How do you naturally approach conversations?
            </Text>
            {TEMPERAMENTS.map(t => (
              <TouchableOpacity
                key={t.id}
                onPress={() => { tap(); setTemperament(t.id); }}
                style={[styles.listCard, {
                  backgroundColor: temperament === t.id ? colors.lavenderLight : colors.glass,
                  borderColor: temperament === t.id ? colors.accent : colors.glassBorder,
                  borderRadius: colors.radius,
                }]}
              >
                <Text style={styles.listEmoji}>{t.emoji}</Text>
                <Text style={[styles.listLabel, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>{t.label}</Text>
                {temperament === t.id && <Ionicons name="checkmark-circle" size={20} color={colors.accent} />}
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}

        {step === 6 && (
          <Animated.View entering={FadeInRight} style={styles.stepWrap}>
            <Text style={[styles.stepTitle, { color: colors.primary, fontFamily: 'Poppins_700Bold' }]}>
              Create your anonymous identity
            </Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              Your real identity is never shared. Pick an avatar and anonymous name.
            </Text>

            <View style={styles.avatarPreview}>
              <AvatarDisplay iconIndex={iconIndex} colorIndex={colorIndex} size={90} showRing />
              <Text style={[styles.previewName, { color: colors.foreground, fontFamily: 'Poppins_600SemiBold' }]}>{username}</Text>
              {isTeenMode && (
                <View style={[styles.modeBadge, { backgroundColor: colors.safeGreenLight, borderRadius: 12 }]}>
                  <Text style={styles.modeEmoji}>🌱</Text>
                  <Text style={[styles.modeText, { color: colors.safeGreen, fontFamily: 'Inter_600SemiBold' }]}>Teen Mode</Text>
                </View>
              )}
            </View>

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold' }]}>AVATAR COLOR</Text>
            <View style={styles.colorRow}>
              {AVATAR_COLOR_OPTIONS.map((c, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => { tap(); setColorIndex(i); }}
                  style={[styles.colorDot, { backgroundColor: c, borderWidth: i === colorIndex ? 3 : 0, borderColor: colors.foreground }]}
                />
              ))}
            </View>

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold' }]}>AVATAR ICON</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconRow}>
              {AVATAR_ICON_NAMES.map((icon, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => { tap(); setIconIndex(i); }}
                  style={[styles.iconOption, {
                    backgroundColor: i === iconIndex ? colors.primary : colors.muted,
                    borderRadius: 22,
                  }]}
                >
                  <Ionicons name={icon as any} size={20} color={i === iconIndex ? '#FFFFFF' : colors.mutedForeground} />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold' }]}>USERNAME</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.glass, borderColor: colors.glassBorder, borderRadius: colors.radius }]}>
              <TextInput
                style={[styles.input, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}
                value={username}
                onChangeText={setUsername}
                maxLength={24}
                placeholder="Your anonymous name"
                placeholderTextColor={colors.mutedForeground}
              />
              <TouchableOpacity onPress={() => setUsername(generateUsername())} style={[styles.refreshBtn, { backgroundColor: colors.lavenderLight }]}>
                <Ionicons name="refresh" size={18} color={colors.accent} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: botPad + 16, backgroundColor: colors.background, borderTopColor: colors.border }]}>
        {step > 0 && (
          <TouchableOpacity onPress={() => setStep(s => s - 1)} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color={colors.mutedForeground} />
            <Text style={[styles.backText, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={handleNext}
          disabled={!canAdvance()}
          style={[styles.nextBtn, { borderRadius: colors.radius, opacity: canAdvance() ? 1 : 0.4 }]}
        >
          <LinearGradient colors={['#1F6F8B', '#0B3C5D']} style={styles.nextGrad}>
            <Text style={[styles.nextText, { fontFamily: 'Inter_600SemiBold' }]}>
              {step === STEPS.length - 1 ? '🚀  Start MindBridge' : 'Continue'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { paddingHorizontal: 20, paddingBottom: 16 },
  progressRow: { flexDirection: 'row', gap: 5, marginBottom: 10 },
  progDot: { flex: 1, height: 4, borderRadius: 2 },
  topBarBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  stepName: { color: '#FFFFFF', fontSize: 13 },
  stepCount: { color: 'rgba(255,255,255,0.65)', fontSize: 12 },
  progBar: { height: 2, borderRadius: 1 },
  progFill: { height: 2, backgroundColor: '#FFFFFF', borderRadius: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 24, paddingHorizontal: 20, gap: 20 },
  stepWrap: { gap: 14 },
  stepTitle: { fontSize: 24, lineHeight: 32 },
  stepSub: { fontSize: 14, lineHeight: 20, color: '#6B7280' },
  safetyNote: { flexDirection: 'row', padding: 14, gap: 10, alignItems: 'flex-start' },
  safetyNoteText: { flex: 1, fontSize: 13, lineHeight: 19 },
  ageCard: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    borderWidth: 1.5, gap: 14,
  },
  ageEmoji: { fontSize: 30 },
  ageInfo: { flex: 1 },
  ageLabel: { fontSize: 18, marginBottom: 3 },
  ageSub: { fontSize: 13, lineHeight: 18 },
  blockedCard: { flexDirection: 'row', padding: 16, gap: 12, alignItems: 'flex-start' },
  blockedEmoji: { fontSize: 24 },
  blockedText: { flex: 1, fontSize: 14, lineHeight: 20 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  emojiCard: {
    width: '46%', flexGrow: 1, alignItems: 'center', paddingVertical: 16,
    borderWidth: 1.5, gap: 8,
  },
  cardEmoji: { fontSize: 28 },
  cardLabel: { fontSize: 13, textAlign: 'center' },
  listCard: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderWidth: 1.5, gap: 14,
  },
  listEmoji: { fontSize: 22 },
  listLabel: { flex: 1, fontSize: 15 },
  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1.5, gap: 6 },
  tagText: { fontSize: 13 },
  avatarPreview: { alignItems: 'center', paddingVertical: 20, gap: 10 },
  previewName: { fontSize: 20 },
  modeBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 5, gap: 6 },
  modeEmoji: { fontSize: 14 },
  modeText: { fontSize: 13 },
  fieldLabel: { fontSize: 11, letterSpacing: 0.8, marginTop: 4 },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorDot: { width: 34, height: 34, borderRadius: 17 },
  iconRow: { marginBottom: 4 },
  iconOption: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, overflow: 'hidden' as const },
  input: { flex: 1, padding: 14, fontSize: 16 },
  refreshBtn: { padding: 14 },
  footer: {
    paddingHorizontal: 20, paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontSize: 14 },
  nextBtn: { flex: 1, overflow: 'hidden' as const },
  nextGrad: { paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  nextText: { color: '#FFFFFF', fontSize: 16 },
});
