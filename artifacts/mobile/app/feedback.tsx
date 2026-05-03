import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, TextInput } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import GlassCard from '@/components/GlassCard';
import BlobBackground from '@/components/BlobBackground';
import colors from '@/constants/colors';

const PINK  = '#FF2D95';
const GREEN = '#00FF88';
const MUTED = 'rgba(255,255,255,0.50)';

export default function FeedbackScreen() {
  const insets = useSafeAreaInsets();
  const { addBadge } = useApp();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [helpful, setHelpful]           = useState(0);
  const [respectful, setRespectful]     = useState(0);
  const [wouldMatch, setWouldMatch]     = useState<null | boolean>(null);
  const [note, setNote]                 = useState('');
  const [submitted, setSubmitted]       = useState(false);

  async function handleSubmit() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (helpful >= 4) await addBadge('kind_soul');
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <View style={styles.container}>
        <BlobBackground variant="green" />
        <View style={[styles.thankYou, { paddingTop: topPad + 60 }]}>
          <Animated.View entering={FadeInDown.springify()} style={styles.thankContent}>
            <Text style={styles.thankEmoji}>🎉</Text>
            <Text style={styles.thankTitle}>Thank You!</Text>
            <Text style={styles.thankSub}>
              Your feedback helps MindBridge become a safer and more meaningful platform for everyone.
            </Text>
            <TouchableOpacity onPress={() => router.replace('/(tabs)/home')} style={styles.doneBtn}>
              <LinearGradient colors={colors.gradPrimary} style={styles.doneBtnGrad}>
                <Text style={styles.doneBtnText}>Back to Home 🏠</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BlobBackground />
      <ScrollView
        contentContainerStyle={{ paddingTop: topPad + 24, paddingBottom: botPad + 40, paddingHorizontal: 20, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100)}>
          <Text style={styles.title}>How was your conversation?</Text>
          <Text style={styles.subtitle}>Your feedback is anonymous and helps improve matches.</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150)}>
          <GlassCard style={styles.ratingCard}>
            <Text style={styles.ratingTitle}>Was this conversation helpful?</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(v => (
                <TouchableOpacity key={v} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setHelpful(v); }}>
                  <Text style={[styles.star, { opacity: v <= helpful ? 1 : 0.25 }]}>⭐</Text>
                </TouchableOpacity>
              ))}
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200)}>
          <GlassCard style={styles.ratingCard}>
            <Text style={styles.ratingTitle}>Was the other person respectful?</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(v => (
                <TouchableOpacity key={v} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setRespectful(v); }}>
                  <Text style={[styles.star, { opacity: v <= respectful ? 1 : 0.25 }]}>❤️</Text>
                </TouchableOpacity>
              ))}
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(250)}>
          <GlassCard style={styles.yesnoCard}>
            <Text style={styles.ratingTitle}>Would you match with this person again?</Text>
            <View style={styles.yesnoRow}>
              {[
                { value: true,  label: '👍 Yes', activeColor: GREEN,  activeBg: 'rgba(0,255,136,0.12)' },
                { value: false, label: '👎 No',  activeColor: '#FF4455', activeBg: 'rgba(255,68,85,0.12)' },
              ].map(btn => (
                <TouchableOpacity
                  key={String(btn.value)}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setWouldMatch(btn.value); }}
                  style={[styles.yesnoBtn, {
                    backgroundColor: wouldMatch === btn.value ? btn.activeBg : 'rgba(255,255,255,0.05)',
                    borderColor: wouldMatch === btn.value ? btn.activeColor : 'rgba(255,255,255,0.12)',
                  }]}
                >
                  <Text style={[styles.yesnoBtnText, { color: wouldMatch === btn.value ? btn.activeColor : MUTED }]}>{btn.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300)}>
          <GlassCard>
            <Text style={styles.ratingTitle}>Any additional thoughts? (Optional)</Text>
            <TextInput
              style={styles.noteInput}
              value={note}
              onChangeText={setNote}
              placeholder="Share your reflection... 💭"
              placeholderTextColor="rgba(255,255,255,0.30)"
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
            style={[styles.submitBtn, { opacity: helpful > 0 && respectful > 0 ? 1 : 0.4 }]}
          >
            <LinearGradient colors={colors.gradPrimary} style={styles.submitGrad}>
              <Text style={styles.submitText}>✅  Submit Feedback</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.replace('/(tabs)/home')} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  thankYou: { flex: 1, alignItems: 'center', paddingHorizontal: 24 },
  thankContent: { alignItems: 'center', gap: 16 },
  thankEmoji: { fontSize: 60 },
  thankTitle: { fontSize: 30, color: PINK, fontFamily: 'SpaceGrotesk_700Bold' },
  thankSub: { fontSize: 15, textAlign: 'center', lineHeight: 22, color: MUTED, fontFamily: 'Inter_400Regular' },
  doneBtn: { marginTop: 8, overflow: 'hidden' as const, width: '100%', borderRadius: 20 },
  doneBtnGrad: { paddingVertical: 16, alignItems: 'center' },
  doneBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'SpaceGrotesk_600SemiBold' },
  title: { fontSize: 26, marginBottom: 6, color: PINK, fontFamily: 'SpaceGrotesk_700Bold' },
  subtitle: { fontSize: 14, lineHeight: 20, color: MUTED, fontFamily: 'Inter_400Regular' },
  ratingCard: { gap: 14 },
  yesnoCard: { gap: 14 },
  ratingTitle: { fontSize: 15, lineHeight: 22, color: '#FFFFFF', fontFamily: 'SpaceGrotesk_600SemiBold' },
  starsRow: { flexDirection: 'row', gap: 10 },
  star: { fontSize: 30 },
  yesnoRow: { flexDirection: 'row', gap: 12 },
  yesnoBtn: { flex: 1, alignItems: 'center', paddingVertical: 14, borderWidth: 1.5, borderRadius: 16 },
  yesnoBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  noteInput: {
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 14,
    padding: 12, minHeight: 80, textAlignVertical: 'top',
    fontSize: 14, marginTop: 8, color: '#FFFFFF', fontFamily: 'Inter_400Regular',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  actions: { gap: 10 },
  submitBtn: { overflow: 'hidden' as const, borderRadius: 20 },
  submitGrad: { paddingVertical: 16, alignItems: 'center' },
  submitText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'SpaceGrotesk_600SemiBold' },
  skipBtn: { alignItems: 'center', paddingVertical: 8 },
  skipText: { fontSize: 14, color: MUTED, fontFamily: 'Inter_400Regular' },
});
