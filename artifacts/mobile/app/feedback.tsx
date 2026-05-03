import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, TextInput } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import GlassCard from '@/components/GlassCard';
import BlobBackground from '@/components/BlobBackground';

export default function FeedbackScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addBadge } = useApp();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [helpful, setHelpful] = useState(0);
  const [respectful, setRespectful] = useState(0);
  const [wouldMatch, setWouldMatch] = useState<null | boolean>(null);
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (helpful >= 4) await addBadge('kind_soul');
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <BlobBackground variant="green" />
        <View style={[styles.thankYou, { paddingTop: topPad + 60 }]}>
          <Animated.View entering={FadeInDown.springify()} style={styles.thankContent}>
            <Text style={styles.thankEmoji}>🎉</Text>
            <Text style={[styles.thankTitle, { color: colors.primary, fontFamily: 'Poppins_700Bold' }]}>Thank You!</Text>
            <Text style={[styles.thankSub, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              Your feedback helps MindBridge become a safer and more meaningful platform for everyone.
            </Text>
            <TouchableOpacity
              onPress={() => router.replace('/(tabs)/home')}
              style={[styles.doneBtn, { borderRadius: colors.radius }]}
            >
              <LinearGradient colors={['#1F6F8B', '#0B3C5D']} style={styles.doneBtnGrad}>
                <Text style={[styles.doneBtnText, { fontFamily: 'Inter_600SemiBold' }]}>Back to Home 🏠</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <BlobBackground />
      <ScrollView
        contentContainerStyle={{ paddingTop: topPad + 24, paddingBottom: botPad + 40, paddingHorizontal: 20, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100)}>
          <Text style={[styles.title, { color: colors.primary, fontFamily: 'Poppins_700Bold' }]}>
            How was your conversation?
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            Your feedback is anonymous and helps improve matches.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150)}>
          <GlassCard style={styles.ratingCard}>
            <Text style={[styles.ratingTitle, { color: colors.foreground, fontFamily: 'Poppins_600SemiBold' }]}>
              Was this conversation helpful?
            </Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(v => (
                <TouchableOpacity key={v} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setHelpful(v); }}>
                  <Text style={[styles.star, { opacity: v <= helpful ? 1 : 0.3 }]}>⭐</Text>
                </TouchableOpacity>
              ))}
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200)}>
          <GlassCard style={styles.ratingCard}>
            <Text style={[styles.ratingTitle, { color: colors.foreground, fontFamily: 'Poppins_600SemiBold' }]}>
              Was the other person respectful?
            </Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(v => (
                <TouchableOpacity key={v} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setRespectful(v); }}>
                  <Text style={[styles.star, { opacity: v <= respectful ? 1 : 0.3 }]}>❤️</Text>
                </TouchableOpacity>
              ))}
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(250)}>
          <GlassCard style={styles.yesnoCard}>
            <Text style={[styles.ratingTitle, { color: colors.foreground, fontFamily: 'Poppins_600SemiBold' }]}>
              Would you match with this person again?
            </Text>
            <View style={styles.yesnoRow}>
              {[{ value: true, label: '👍 Yes', bg: colors.safeGreenLight, text: colors.safeGreen }, { value: false, label: '👎 No', bg: '#FFF0F0', text: colors.destructive }].map(btn => (
                <TouchableOpacity
                  key={String(btn.value)}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setWouldMatch(btn.value); }}
                  style={[styles.yesnoBtn, {
                    backgroundColor: wouldMatch === btn.value ? btn.bg : colors.muted,
                    borderColor: wouldMatch === btn.value ? btn.text : colors.border,
                    borderRadius: colors.radius,
                  }]}
                >
                  <Text style={[styles.yesnoBtnText, { color: wouldMatch === btn.value ? btn.text : colors.mutedForeground, fontFamily: 'Inter_600SemiBold' }]}>{btn.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300)}>
          <GlassCard>
            <Text style={[styles.ratingTitle, { color: colors.foreground, fontFamily: 'Poppins_600SemiBold' }]}>
              Any additional thoughts? (Optional)
            </Text>
            <TextInput
              style={[styles.noteInput, { color: colors.foreground, borderColor: colors.border, borderRadius: colors.radius - 6, fontFamily: 'Inter_400Regular' }]}
              value={note}
              onChangeText={setNote}
              placeholder="Share your reflection... 💭"
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={4}
              maxLength={300}
            />
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(350)} style={styles.actions}>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={helpful === 0 || respectful === 0}
            style={[styles.submitBtn, { borderRadius: colors.radius, opacity: helpful > 0 && respectful > 0 ? 1 : 0.4 }]}
          >
            <LinearGradient colors={['#1F6F8B', '#0B3C5D']} style={styles.submitGrad}>
              <Text style={[styles.submitText, { fontFamily: 'Inter_600SemiBold' }]}>✅  Submit Feedback</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.replace('/(tabs)/home')} style={styles.skipBtn}>
            <Text style={[styles.skipText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>Skip for now</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  thankYou: { flex: 1, alignItems: 'center', paddingHorizontal: 24 },
  thankContent: { alignItems: 'center', gap: 16 },
  thankEmoji: { fontSize: 60 },
  thankTitle: { fontSize: 30 },
  thankSub: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  doneBtn: { marginTop: 8, overflow: 'hidden' as const, width: '100%' },
  doneBtnGrad: { paddingVertical: 16, alignItems: 'center' },
  doneBtnText: { color: '#FFFFFF', fontSize: 16 },
  title: { fontSize: 26, marginBottom: 6 },
  subtitle: { fontSize: 14, lineHeight: 20 },
  ratingCard: { gap: 14 },
  yesnoCard: { gap: 14 },
  ratingTitle: { fontSize: 15, lineHeight: 22 },
  starsRow: { flexDirection: 'row', gap: 10 },
  star: { fontSize: 30 },
  yesnoRow: { flexDirection: 'row', gap: 12 },
  yesnoBtn: { flex: 1, alignItems: 'center', paddingVertical: 14, borderWidth: 1.5 },
  yesnoBtnText: { fontSize: 16 },
  noteInput: { borderWidth: 1, padding: 12, minHeight: 80, textAlignVertical: 'top', fontSize: 14, marginTop: 8 },
  actions: { gap: 10 },
  submitBtn: { overflow: 'hidden' as const },
  submitGrad: { paddingVertical: 16, alignItems: 'center' },
  submitText: { color: '#FFFFFF', fontSize: 16 },
  skipBtn: { alignItems: 'center', paddingVertical: 8 },
  skipText: { fontSize: 14 },
});
