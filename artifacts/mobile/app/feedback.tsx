import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, TextInput } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

const RATING_LABELS = ['', 'Not helpful', 'Somewhat helpful', 'Neutral', 'Helpful', 'Very helpful'];

export default function FeedbackScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addBadge } = useApp();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const [helpful, setHelpful] = useState(0);
  const [respectful, setRespectful] = useState(0);
  const [wouldMatch, setWouldMatch] = useState<null | boolean>(null);
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function select(setter: (v: number) => void, val: number) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setter(val);
  }

  async function handleSubmit() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (helpful >= 4) await addBadge('kind_soul');
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <LinearGradient colors={[colors.primary, colors.purple]} style={styles.container}>
        <View style={[styles.thankYouContent, { paddingTop: topPad + 40 }]}>
          <Animated.View entering={FadeInDown.springify()} style={styles.thankYouCard}>
            <View style={[styles.checkCircle, { backgroundColor: colors.accent }]}>
              <Ionicons name="checkmark" size={36} color="#FFFFFF" />
            </View>
            <Text style={[styles.thankTitle, { color: colors.foreground }]}>Thank You!</Text>
            <Text style={[styles.thankSub, { color: colors.mutedForeground }]}>
              Your feedback helps MindBridge become a safer and more meaningful platform for everyone.
            </Text>
            <TouchableOpacity
              onPress={() => router.replace('/(tabs)/home')}
              style={[styles.doneBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
            >
              <Text style={styles.doneBtnText}>Back to Home</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[colors.primary, colors.purple]} style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: topPad + 20, paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100)}>
          <Text style={styles.title}>How was your conversation?</Text>
          <Text style={styles.subtitle}>Your feedback is anonymous and helps improve matches.</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200)} style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Was this conversation helpful?</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map(v => (
              <TouchableOpacity key={v} onPress={() => select(setHelpful, v)}>
                <Ionicons name={v <= helpful ? 'star' : 'star-outline'} size={32} color={v <= helpful ? '#F39C12' : colors.border} />
              </TouchableOpacity>
            ))}
          </View>
          {helpful > 0 && <Text style={[styles.ratingLabel, { color: colors.mutedForeground }]}>{RATING_LABELS[helpful]}</Text>}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300)} style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Was the other person respectful?</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map(v => (
              <TouchableOpacity key={v} onPress={() => select(setRespectful, v)}>
                <Ionicons name={v <= respectful ? 'heart' : 'heart-outline'} size={30} color={v <= respectful ? '#E74C3C' : colors.border} />
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400)} style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Would you like to match with this person again?</Text>
          <View style={styles.yesNoRow}>
            <TouchableOpacity
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setWouldMatch(true); }}
              style={[styles.yesNoBtn, {
                backgroundColor: wouldMatch === true ? colors.greenLight : colors.muted,
                borderColor: wouldMatch === true ? colors.accent : colors.border,
                borderRadius: colors.radius,
              }]}
            >
              <Ionicons name="thumbs-up-outline" size={22} color={wouldMatch === true ? colors.accent : colors.mutedForeground} />
              <Text style={[styles.yesNoText, { color: wouldMatch === true ? colors.accent : colors.mutedForeground }]}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setWouldMatch(false); }}
              style={[styles.yesNoBtn, {
                backgroundColor: wouldMatch === false ? '#FFF0F0' : colors.muted,
                borderColor: wouldMatch === false ? colors.destructive : colors.border,
                borderRadius: colors.radius,
              }]}
            >
              <Ionicons name="thumbs-down-outline" size={22} color={wouldMatch === false ? colors.destructive : colors.mutedForeground} />
              <Text style={[styles.yesNoText, { color: wouldMatch === false ? colors.destructive : colors.mutedForeground }]}>No</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500)} style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Any additional thoughts? (Optional)</Text>
          <TextInput
            style={[styles.noteInput, { color: colors.foreground, borderColor: colors.border, borderRadius: colors.radius - 4 }]}
            value={note}
            onChangeText={setNote}
            placeholder="Share your reflection..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={4}
            maxLength={300}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600)}>
          <TouchableOpacity
            onPress={handleSubmit}
            style={[styles.submitBtn, { backgroundColor: '#FFFFFF', borderRadius: colors.radius }]}
            disabled={helpful === 0 || respectful === 0}
          >
            <Text style={[styles.submitText, { color: colors.primary }]}>Submit Feedback</Text>
            <Ionicons name="checkmark-circle-outline" size={20} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace('/(tabs)/home')} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, gap: 16 },
  title: { color: '#FFFFFF', fontSize: 26, fontWeight: '800' as const, marginBottom: 8 },
  subtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 20, marginBottom: 8 },
  card: { padding: 20, gap: 14 },
  cardTitle: { fontSize: 15, fontWeight: '600' as const, lineHeight: 21 },
  starsRow: { flexDirection: 'row', gap: 8 },
  ratingLabel: { fontSize: 13, textAlign: 'center', marginTop: -4 },
  yesNoRow: { flexDirection: 'row', gap: 12 },
  yesNoBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, gap: 8, borderWidth: 1.5,
  },
  yesNoText: { fontSize: 15, fontWeight: '600' as const },
  noteInput: { borderWidth: 1, padding: 12, minHeight: 80, textAlignVertical: 'top', fontSize: 14 },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, gap: 8,
  },
  submitText: { fontSize: 16, fontWeight: '700' as const },
  skipBtn: { alignItems: 'center', paddingVertical: 12 },
  skipText: { color: 'rgba(255,255,255,0.55)', fontSize: 14 },
  thankYouContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  thankYouCard: { alignItems: 'center', gap: 16 },
  checkCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  thankTitle: { fontSize: 28, fontWeight: '800' as const },
  thankSub: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  doneBtn: { marginTop: 8, paddingHorizontal: 32, paddingVertical: 14 },
  doneBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' as const },
});
