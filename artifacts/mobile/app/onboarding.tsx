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
import AvatarDisplay from '@/components/AvatarDisplay';
import {
  AGE_GROUPS, MOODS, GOALS, PERSONALITIES, TEMPERAMENTS,
  AVATAR_ICON_NAMES, AVATAR_COLOR_OPTIONS, generateUsername,
  getInterestsForAge,
} from '@/utils/helpers';
import colors from '@/constants/colors';

const STEPS = ['Age', 'Mood', 'Goal', 'Topics', 'Personality', 'Temperament', 'Avatar'];

const PINK  = '#FF2D95';
const CYAN  = '#00D4FF';
const MUTED = 'rgba(255,255,255,0.50)';
const BG    = '#050505';
const CARD  = 'rgba(255,255,255,0.05)';
const CBORDER = 'rgba(255,255,255,0.09)';

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { user, completeOnboarding } = useApp();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [step, setStep]             = useState(0);
  const [ageGroup, setAgeGroup]     = useState('');
  const [mood, setMood]             = useState('');
  const [goal, setGoal]             = useState('');
  const [interests, setInterests]   = useState<string[]>([]);
  const [personality, setPersonality] = useState('');
  const [temperament, setTemperament] = useState('');
  const [username, setUsername]     = useState(user?.username ?? generateUsername());
  const [iconIndex, setIconIndex]   = useState(user?.iconIndex ?? 0);
  const [colorIndex, setColorIndex] = useState(user?.colorIndex ?? 0);
  const [ageBlocked, setAgeBlocked] = useState(false);

  const isTeenMode          = ageGroup === 'teen';
  const availableInterests  = getInterestsForAge(isTeenMode);

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
    <View style={styles.container}>
      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: topPad + 10 }]}>
        <View style={styles.progressDotsRow}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[styles.progDot, {
                backgroundColor: i < step ? PINK : i === step ? PINK : 'rgba(255,255,255,0.18)',
                width: i === step ? 20 : 8,
              }]}
            />
          ))}
        </View>
        <View style={styles.topBarMeta}>
          <Text style={styles.stepLabel}>Step {step + 1}: {STEPS[step]}</Text>
          <Text style={styles.stepCount}>{step + 1} / {STEPS.length}</Text>
        </View>
        {/* Progress bar */}
        <View style={styles.progBarBg}>
          <LinearGradient
            colors={colors.gradPrimary}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[styles.progBarFill, { width: `${progress}%` as any }]}
          />
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingTop: 24, paddingHorizontal: 20, paddingBottom: botPad + 120, gap: 20 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Step 0 — Age gate */}
        {step === 0 && (
          <Animated.View entering={FadeInRight} style={styles.stepWrap}>
            <Text style={styles.stepTitle}>Let's keep it safe 🛡️</Text>
            <Text style={styles.stepSub}>MyBestie separates teen and adult spaces for safer conversations.</Text>
            <View style={styles.safetyNote}>
              <Text style={{ fontSize: 16 }}>🛡️</Text>
              <Text style={styles.safetyNoteText}>Teens are only matched with teens. Adults only with adults.</Text>
            </View>
            {AGE_GROUPS.map(g => {
              const active = ageGroup === g.id;
              return (
                <TouchableOpacity
                  key={g.id}
                  onPress={() => handleAgeSelect(g.id)}
                  style={[styles.listCard, {
                    borderColor: active ? (g.blocked ? '#FF4455' : PINK) : CBORDER,
                    backgroundColor: active ? (g.blocked ? 'rgba(255,68,85,0.10)' : 'rgba(255,45,149,0.10)') : CARD,
                  }]}
                >
                  <Text style={{ fontSize: 28 }}>{g.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.listLabel, { color: active && g.blocked ? '#FF4455' : '#FFFFFF' }]}>{g.label}</Text>
                    <Text style={[styles.listSub]}>{g.description}</Text>
                  </View>
                  {active && <Ionicons name={g.blocked ? 'close-circle' : 'checkmark-circle'} size={22} color={g.blocked ? '#FF4455' : PINK} />}
                </TouchableOpacity>
              );
            })}
            {ageBlocked && (
              <View style={[styles.blockedCard]}>
                <Text style={{ fontSize: 22 }}>🚫</Text>
                <Text style={styles.blockedText}>MyBestie is only available for users aged 13 and above.</Text>
              </View>
            )}
          </Animated.View>
        )}

        {/* Step 1 — Mood */}
        {step === 1 && (
          <Animated.View entering={FadeInRight} style={styles.stepWrap}>
            <Text style={styles.stepTitle}>How are you feeling? 💫</Text>
            <Text style={styles.stepSub}>This helps us find someone who complements your current mood.</Text>
            <View style={styles.emojiGrid}>
              {MOODS.map(m => {
                const active = mood === m.id;
                return (
                  <TouchableOpacity
                    key={m.id}
                    onPress={() => { tap(); setMood(m.id); }}
                    style={[styles.emojiCard, {
                      borderColor: active ? PINK : CBORDER,
                      backgroundColor: active ? 'rgba(255,45,149,0.12)' : CARD,
                    }]}
                  >
                    <Text style={{ fontSize: 28 }}>{m.emoji}</Text>
                    <Text style={[styles.cardLabel, { color: active ? PINK : '#FFFFFF' }]}>{m.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* Step 2 — Goal */}
        {step === 2 && (
          <Animated.View entering={FadeInRight} style={styles.stepWrap}>
            <Text style={styles.stepTitle}>What brings you here? 🎯</Text>
            <Text style={styles.stepSub}>Your conversation goal helps us find the right match.</Text>
            {GOALS.map(g => {
              const active = goal === g.id;
              return (
                <TouchableOpacity
                  key={g.id}
                  onPress={() => { tap(); setGoal(g.id); }}
                  style={[styles.listCard, {
                    borderColor: active ? PINK : CBORDER,
                    backgroundColor: active ? 'rgba(255,45,149,0.10)' : CARD,
                  }]}
                >
                  <Text style={{ fontSize: 22 }}>{g.emoji}</Text>
                  <Text style={[styles.listLabel, { flex: 1, color: active ? PINK : '#FFFFFF' }]}>{g.label}</Text>
                  {active && <Ionicons name="checkmark-circle" size={20} color={PINK} />}
                </TouchableOpacity>
              );
            })}
          </Animated.View>
        )}

        {/* Step 3 — Topics */}
        {step === 3 && (
          <Animated.View entering={FadeInRight} style={styles.stepWrap}>
            <Text style={styles.stepTitle}>What topics interest you? ✨</Text>
            <Text style={styles.stepSub}>Pick at least one.{isTeenMode ? ' (Some adult topics are hidden in Teen Mode.)' : ''}</Text>
            <View style={styles.tagGrid}>
              {availableInterests.map(interest => {
                const active = interests.includes(interest.id);
                return (
                  <TouchableOpacity
                    key={interest.id}
                    onPress={() => toggleInterest(interest.id)}
                    style={[styles.tag, {
                      backgroundColor: active ? PINK : CARD,
                      borderColor: active ? PINK : CBORDER,
                    }]}
                  >
                    <Text style={{ fontSize: 15 }}>{interest.emoji}</Text>
                    <Text style={[styles.tagText, { color: active ? '#FFFFFF' : 'rgba(255,255,255,0.75)' }]}>
                      {interest.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* Step 4 — Personality */}
        {step === 4 && (
          <Animated.View entering={FadeInRight} style={styles.stepWrap}>
            <Text style={styles.stepTitle}>How do you connect? 🌊</Text>
            <Text style={styles.stepSub}>Select your personality style.</Text>
            <View style={styles.emojiGrid}>
              {PERSONALITIES.map(p => {
                const active = personality === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => { tap(); setPersonality(p.id); }}
                    style={[styles.emojiCard, {
                      borderColor: active ? PINK : CBORDER,
                      backgroundColor: active ? 'rgba(255,45,149,0.12)' : CARD,
                    }]}
                  >
                    <Text style={{ fontSize: 28 }}>{p.emoji}</Text>
                    <Text style={[styles.cardLabel, { color: active ? PINK : '#FFFFFF' }]}>{p.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* Step 5 — Temperament */}
        {step === 5 && (
          <Animated.View entering={FadeInRight} style={styles.stepWrap}>
            <Text style={styles.stepTitle}>Your communication style 💬</Text>
            <Text style={styles.stepSub}>How do you naturally approach conversations?</Text>
            {TEMPERAMENTS.map(t => {
              const active = temperament === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => { tap(); setTemperament(t.id); }}
                  style={[styles.listCard, {
                    borderColor: active ? PINK : CBORDER,
                    backgroundColor: active ? 'rgba(255,45,149,0.10)' : CARD,
                  }]}
                >
                  <Text style={{ fontSize: 22 }}>{t.emoji}</Text>
                  <Text style={[styles.listLabel, { flex: 1, color: active ? PINK : '#FFFFFF' }]}>{t.label}</Text>
                  {active && <Ionicons name="checkmark-circle" size={20} color={PINK} />}
                </TouchableOpacity>
              );
            })}
          </Animated.View>
        )}

        {/* Step 6 — Avatar */}
        {step === 6 && (
          <Animated.View entering={FadeInRight} style={styles.stepWrap}>
            <Text style={styles.stepTitle}>Your anonymous identity 👤</Text>
            <Text style={styles.stepSub}>Your real identity is never shared. Pick a name and avatar.</Text>

            <View style={styles.avatarPreview}>
              <AvatarDisplay iconIndex={iconIndex} colorIndex={colorIndex} size={88} showRing />
              <Text style={styles.previewName}>{username}</Text>
              {isTeenMode && (
                <View style={styles.modeBadge}>
                  <Text style={{ fontSize: 13 }}>🌱</Text>
                  <Text style={styles.modeText}>Teen Mode</Text>
                </View>
              )}
            </View>

            <Text style={styles.fieldLabel}>AVATAR COLOR</Text>
            <View style={styles.colorRow}>
              {AVATAR_COLOR_OPTIONS.map((c, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => { tap(); setColorIndex(i); }}
                  style={[styles.colorDot, { backgroundColor: c, borderWidth: i === colorIndex ? 3 : 0, borderColor: PINK }]}
                />
              ))}
            </View>

            <Text style={styles.fieldLabel}>AVATAR ICON</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
              {AVATAR_ICON_NAMES.map((icon, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => { tap(); setIconIndex(i); }}
                  style={[styles.iconOption, {
                    backgroundColor: i === iconIndex ? PINK : 'rgba(255,255,255,0.07)',
                  }]}
                >
                  <Ionicons name={icon as any} size={20} color={i === iconIndex ? '#FFFFFF' : 'rgba(255,255,255,0.5)'} />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>USERNAME</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                maxLength={24}
                placeholder="Your anonymous name"
                placeholderTextColor={MUTED}
              />
              <TouchableOpacity onPress={() => setUsername(generateUsername())} style={styles.refreshBtn}>
                <Ionicons name="refresh" size={18} color={CYAN} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: botPad + 16 }]}>
        {step > 0 && (
          <TouchableOpacity onPress={() => setStep(s => s - 1)} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color={MUTED} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={handleNext}
          disabled={!canAdvance()}
          style={[styles.nextBtnWrap, { opacity: canAdvance() ? 1 : 0.35 }]}
        >
          <LinearGradient
            colors={colors.gradPrimary}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.nextBtn}
          >
            <Text style={styles.nextText}>
              {step === STEPS.length - 1 ? '🚀  Enter MyBestie' : 'Continue'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  topBar: { paddingHorizontal: 20, paddingBottom: 16, backgroundColor: '#0B0B0F', gap: 10 },
  progressDotsRow: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  progDot: { height: 4, borderRadius: 2 },
  topBarMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepLabel: { color: '#FFFFFF', fontSize: 13, fontFamily: 'SpaceGrotesk_600SemiBold' },
  stepCount: { color: MUTED, fontSize: 12, fontFamily: 'Inter_400Regular' },
  progBarBg: { height: 3, backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 2, overflow: 'hidden' as const },
  progBarFill: { height: 3, borderRadius: 2 },

  scroll: { flex: 1 },
  stepWrap: { gap: 14 },
  stepTitle: { fontSize: 24, color: '#FFFFFF', fontFamily: 'SpaceGrotesk_700Bold', lineHeight: 33 },
  stepSub: { fontSize: 14, color: MUTED, fontFamily: 'Inter_400Regular', lineHeight: 20 },

  safetyNote: {
    flexDirection: 'row', padding: 14, gap: 10, alignItems: 'flex-start',
    backgroundColor: 'rgba(0,255,136,0.08)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0,255,136,0.18)',
  },
  safetyNoteText: { flex: 1, fontSize: 13, color: '#00FF88', fontFamily: 'Inter_500Medium', lineHeight: 19 },

  listCard: {
    flexDirection: 'row', alignItems: 'center', padding: 14, gap: 14,
    borderWidth: 1.5, borderRadius: 16,
  },
  listLabel: { fontSize: 15, fontFamily: 'SpaceGrotesk_600SemiBold' },
  listSub: { fontSize: 12, color: MUTED, fontFamily: 'Inter_400Regular', marginTop: 2 },

  blockedCard: {
    flexDirection: 'row', padding: 16, gap: 12, alignItems: 'flex-start',
    backgroundColor: 'rgba(255,68,85,0.10)', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,68,85,0.25)',
  },
  blockedText: { flex: 1, fontSize: 14, color: '#FF4455', fontFamily: 'Inter_500Medium', lineHeight: 20 },

  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  emojiCard: {
    width: '46%', flexGrow: 1, alignItems: 'center', paddingVertical: 16,
    borderWidth: 1.5, borderRadius: 16, gap: 8,
  },
  cardLabel: { fontSize: 13, fontFamily: 'SpaceGrotesk_500Medium', textAlign: 'center' },

  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1.5, borderRadius: 20, gap: 6,
  },
  tagText: { fontSize: 13, fontFamily: 'Inter_500Medium' },

  avatarPreview: { alignItems: 'center', paddingVertical: 20, gap: 10 },
  previewName: { fontSize: 20, color: '#FFFFFF', fontFamily: 'SpaceGrotesk_600SemiBold' },
  modeBadge: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 5,
    backgroundColor: 'rgba(0,255,136,0.12)', borderRadius: 12, gap: 6,
  },
  modeText: { fontSize: 13, color: '#00FF88', fontFamily: 'Inter_600SemiBold' },

  fieldLabel: { fontSize: 11, color: MUTED, fontFamily: 'SpaceGrotesk_600SemiBold', letterSpacing: 1.5, marginTop: 4 },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorDot: { width: 34, height: 34, borderRadius: 17 },
  iconOption: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: 8, borderRadius: 22 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5,
    borderColor: '#FF2D95', borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' as const,
  },
  input: { flex: 1, padding: 14, fontSize: 16, color: '#FFFFFF', fontFamily: 'Inter_500Medium' },
  refreshBtn: { padding: 14 },

  footer: {
    paddingHorizontal: 20, paddingTop: 12,
    backgroundColor: '#0B0B0F',
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontSize: 14, color: MUTED, fontFamily: 'Inter_500Medium' },
  nextBtnWrap: { flex: 1, borderRadius: 20, overflow: 'hidden' as const },
  nextBtn: { paddingVertical: 17, alignItems: 'center', justifyContent: 'center' },
  nextText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'SpaceGrotesk_700Bold' },
});
