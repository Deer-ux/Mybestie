import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Platform, Keyboard, Share,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useInbox, MessageCategory } from '@/context/InboxContext';
import GlassCard from '@/components/GlassCard';
import BlobBackground from '@/components/BlobBackground';

const CATEGORIES: { id: MessageCategory; label: string; emoji: string; gradient: [string, string] }[] = [
  { id: 'compliment',     label: 'Compliment',     emoji: '❤️',  gradient: ['#FF6B6B', '#E57373'] },
  { id: 'honest_opinion', label: 'Honest Opinion',  emoji: '🎯',  gradient: ['#0B3C5D', '#1F6F8B'] },
  { id: 'confession',     label: 'Confession',      emoji: '🤫',  gradient: ['#6C63FF', '#A29BFE'] },
  { id: 'advice',         label: 'Advice',          emoji: '💡',  gradient: ['#F59E0B', '#FCD34D'] },
  { id: 'question',       label: 'Question',        emoji: '🤔',  gradient: ['#1F6F8B', '#38BDF8'] },
  { id: 'encouragement',  label: 'Encouragement',   emoji: '✨',  gradient: ['#4CAF50', '#81C784'] },
  { id: 'feedback',       label: 'Feedback',        emoji: '📝',  gradient: ['#A29BFE', '#C4B5FD'] },
  { id: 'secret',         label: 'Secret Thought',  emoji: '🔮',  gradient: ['#4A0E8F', '#7C3AED'] },
  { id: 'joke',           label: 'Friendly Joke',   emoji: '😄',  gradient: ['#F97316', '#FB923C'] },
  { id: 'other',          label: 'Just Say It',     emoji: '💬',  gradient: ['#6B7280', '#9CA3AF'] },
];

const EMOJIS = ['😊','❤️','🔥','✨','💯','😂','🤔','👀','💙','🙌','😍','💪','🥺','😭','🌟','👏'];

export default function SendMessageScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { sendMessage } = useInbox();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [step, setStep] = useState<'compose' | 'success'>('compose');
  const [category, setCategory] = useState<MessageCategory>('compliment');
  const [content, setContent] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const [sending, setSending] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const recipientName = slug ?? 'Someone';
  const shareUrl = `mindbridge.app/message/${slug}`;

  const selectedCat = CATEGORIES.find(c => c.id === category)!;

  async function handleSend() {
    if (!content.trim() || !slug) return;
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSending(true);
    await sendMessage(slug, category, content);
    setSending(false);
    setStep('success');
  }

  function addEmoji(e: string) {
    setContent(prev => prev + e);
    setShowEmojis(false);
    inputRef.current?.focus();
  }

  async function handleShareMyLink() {
    await Share.share({ message: `Send me an anonymous message on MindBridge!\nhttps://${shareUrl}` });
  }

  if (step === 'success') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <BlobBackground variant="purple" />
        <ScrollView contentContainerStyle={[styles.successScroll, { paddingTop: topPad + 30, paddingBottom: botPad + 40 }]} showsVerticalScrollIndicator={false}>

          <Animated.View entering={ZoomIn.springify()} style={styles.successIconWrap}>
            <LinearGradient colors={['#6C63FF', '#A29BFE']} style={styles.successIconGrad}>
              <Text style={{ fontSize: 48 }}>📬</Text>
            </LinearGradient>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200)} style={styles.successTextWrap}>
            <Text style={[styles.successTitle, { color: colors.primary, fontFamily: 'Poppins_700Bold' }]}>
              Message Sent! ✨
            </Text>
            <Text style={[styles.successSub, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              Your anonymous message has been delivered safely. {'\n'}They'll never know it was you.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(350)}>
            <GlassCard style={styles.viralCard} padding={22}>
              <Text style={[styles.viralTitle, { color: colors.foreground, fontFamily: 'Poppins_700Bold' }]}>
                Want to receive anonymous messages too? 🔗
              </Text>
              <Text style={[styles.viralSub, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                Create your own anonymous link and let people say what they honestly feel about you.
              </Text>

              <View style={styles.viralFeatures}>
                {[
                  '🤫 Hear confessions people never said out loud',
                  '❤️ Receive compliments from secret admirers',
                  '💡 Get honest feedback you never expected',
                  '🎯 Know what people really think of you',
                ].map((f, i) => (
                  <View key={i} style={styles.viralFeatureRow}>
                    <Text style={[styles.viralFeatureText, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}>{f}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.replace('/'); }}
                style={[styles.viralPrimaryBtn, { borderRadius: colors.radius }]}
                activeOpacity={0.88}
              >
                <LinearGradient colors={['#6C63FF', '#A29BFE']} style={styles.viralPrimaryGrad}>
                  <Text style={{ fontSize: 20 }}>🔗</Text>
                  <Text style={[styles.viralPrimaryText, { fontFamily: 'Poppins_600SemiBold' }]}>Create My Anonymous Link</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.replace('/'); }}
                style={[styles.viralSecondaryBtn, { borderRadius: colors.radius, borderColor: colors.accent }]}
              >
                <Text style={[styles.viralSecondaryText, { color: colors.accent, fontFamily: 'Inter_600SemiBold' }]}>
                  ✨ Explore MindBridge
                </Text>
              </TouchableOpacity>
            </GlassCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(450)} style={styles.sendAnotherRow}>
            <TouchableOpacity
              onPress={() => { setStep('compose'); setContent(''); }}
              style={[styles.sendAnotherBtn, { backgroundColor: colors.muted, borderRadius: colors.radius }]}
            >
              <Text style={[styles.sendAnotherText, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
                Send another message
              </Text>
            </TouchableOpacity>
          </Animated.View>

        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#0D1B2A' }]}>
      <LinearGradient
        colors={selectedCat.gradient}
        style={[styles.headerGrad, { paddingTop: topPad + 10 }]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerInner}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color="rgba(255,255,255,0.85)" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <View style={styles.lockBadge}>
              <Text style={{ fontSize: 14 }}>🔒</Text>
              <Text style={[styles.lockText, { fontFamily: 'Inter_600SemiBold' }]}>100% Anonymous</Text>
            </View>
            <Text style={[styles.headerTitle, { fontFamily: 'Poppins_700Bold' }]}>
              Send an anonymous{'\n'}message to
            </Text>
            <Text style={[styles.headerName, { fontFamily: 'Poppins_700Bold' }]}>{recipientName}</Text>
            <Text style={[styles.headerSub, { fontFamily: 'Inter_400Regular' }]}>
              They won't know who sent it. Say what you honestly feel.
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={[styles.body, { backgroundColor: colors.background }]}
        contentContainerStyle={{ padding: 18, paddingBottom: botPad + 100, gap: 18 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(80)}>
          <Text style={[styles.sectionLabel, { color: colors.foreground, fontFamily: 'Poppins_600SemiBold' }]}>
            What kind of message?
          </Text>
          <View style={styles.catGrid}>
            {CATEGORIES.map(cat => {
              const active = category === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCategory(cat.id); }}
                  style={[styles.catBtn, { borderColor: active ? cat.gradient[0] : colors.border, backgroundColor: active ? cat.gradient[0] + '15' : colors.glass }]}
                  activeOpacity={0.82}
                >
                  <Text style={styles.catEmoji}>{cat.emoji}</Text>
                  <Text style={[styles.catLabel, {
                    color: active ? cat.gradient[0] : colors.foreground,
                    fontFamily: active ? 'Inter_600SemiBold' : 'Inter_400Regular',
                  }]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160)}>
          <Text style={[styles.sectionLabel, { color: colors.foreground, fontFamily: 'Poppins_600SemiBold' }]}>
            {selectedCat.emoji} Your message
          </Text>
          <View style={[styles.inputCard, { backgroundColor: colors.glass, borderColor: selectedCat.gradient[0] + '50', borderRadius: colors.radius }]}>
            <TextInput
              ref={inputRef}
              style={[styles.textInput, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
              value={content}
              onChangeText={setContent}
              placeholder={getPlaceholder(category)}
              placeholderTextColor={colors.mutedForeground}
              multiline
              maxLength={1000}
              textAlignVertical="top"
            />
            <View style={[styles.inputActions, { borderTopColor: colors.border }]}>
              <TouchableOpacity onPress={() => setShowEmojis(v => !v)} style={styles.inputActionBtn}>
                <Text style={{ fontSize: 22 }}>😊</Text>
              </TouchableOpacity>
              <Text style={[styles.charCount, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                {content.length}/1000
              </Text>
            </View>
          </View>

          {showEmojis && (
            <Animated.View entering={FadeInDown.springify()} style={[styles.emojiPicker, { backgroundColor: colors.glass, borderColor: colors.border, borderRadius: colors.radius - 4 }]}>
              <View style={styles.emojiGrid}>
                {EMOJIS.map(e => (
                  <TouchableOpacity key={e} onPress={() => addEmoji(e)} style={styles.emojiBtn}>
                    <Text style={{ fontSize: 26 }}>{e}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(220)}>
          <View style={[styles.safetyInfo, { backgroundColor: colors.safeGreenLight, borderRadius: colors.radius - 4 }]}>
            <Text style={{ fontSize: 16 }}>🛡️</Text>
            <Text style={[styles.safetyText, { color: colors.safeGreen, fontFamily: 'Inter_400Regular' }]}>
              Your identity stays completely private. No account needed. No tracking.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      <View style={[styles.sendBar, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: botPad + 10 }]}>
        <TouchableOpacity
          onPress={handleSend}
          disabled={!content.trim() || sending}
          style={[styles.sendBtn, { borderRadius: colors.radius, opacity: content.trim() ? 1 : 0.45 }]}
          activeOpacity={0.88}
        >
          <LinearGradient colors={selectedCat.gradient} style={styles.sendGrad}>
            <Text style={{ fontSize: 20 }}>{selectedCat.emoji}</Text>
            <Text style={[styles.sendText, { fontFamily: 'Poppins_600SemiBold' }]}>
              {sending ? 'Sending...' : 'Send Anonymously'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function getPlaceholder(cat: MessageCategory): string {
  const p: Record<MessageCategory, string> = {
    compliment: 'Tell them something you genuinely admire about them...',
    honest_opinion: 'Share your honest thoughts — be real but kind...',
    confession: 'Say something you\'ve never told them out loud...',
    advice: 'Share advice you think they need to hear...',
    question: 'Ask something you\'ve always wanted to know...',
    encouragement: 'Give them the push they need right now...',
    feedback: 'Give them real, constructive feedback...',
    secret: 'Share a secret thought you\'ve kept to yourself...',
    joke: 'Make them smile! Drop your best (appropriate) joke...',
    other: 'Just say it — anything on your mind...',
  };
  return p[cat];
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGrad: { paddingHorizontal: 20, paddingBottom: 24 },
  headerInner: { gap: 16 },
  closeBtn: { alignSelf: 'flex-start', padding: 4 },
  headerCenter: { gap: 6 },
  lockBadge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, gap: 6,
  },
  lockText: { color: '#FFFFFF', fontSize: 12 },
  headerTitle: { color: 'rgba(255,255,255,0.85)', fontSize: 18, lineHeight: 26 },
  headerName: { color: '#FFFFFF', fontSize: 26 },
  headerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 19 },
  body: { flex: 1 },
  sectionLabel: { fontSize: 15, marginBottom: 10 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catBtn: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, borderWidth: 1.5 },
  catEmoji: { fontSize: 18 },
  catLabel: { fontSize: 13 },
  inputCard: { borderWidth: 2 },
  textInput: { padding: 16, fontSize: 15, minHeight: 150, lineHeight: 23 },
  inputActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth },
  inputActionBtn: { padding: 4 },
  charCount: { fontSize: 12 },
  emojiPicker: { borderWidth: 1, padding: 12, marginTop: 4 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  emojiBtn: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  safetyInfo: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12 },
  safetyText: { flex: 1, fontSize: 12, lineHeight: 18 },
  sendBar: { borderTopWidth: 1, paddingHorizontal: 18, paddingTop: 10 },
  sendBtn: { overflow: 'hidden' as const },
  sendGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 },
  sendText: { color: '#FFFFFF', fontSize: 17 },
  // Success
  successScroll: { alignItems: 'center', paddingHorizontal: 20, gap: 24 },
  successIconWrap: {},
  successIconGrad: { width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center' },
  successTextWrap: { alignItems: 'center', gap: 8 },
  successTitle: { fontSize: 28, textAlign: 'center' },
  successSub: { fontSize: 15, textAlign: 'center', lineHeight: 23 },
  viralCard: { width: '100%', gap: 16 },
  viralTitle: { fontSize: 20, textAlign: 'center' },
  viralSub: { fontSize: 14, textAlign: 'center', lineHeight: 21 },
  viralFeatures: { gap: 8 },
  viralFeatureRow: { flexDirection: 'row', alignItems: 'flex-start' },
  viralFeatureText: { fontSize: 14, lineHeight: 21, flex: 1 },
  viralPrimaryBtn: { overflow: 'hidden' as const },
  viralPrimaryGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 },
  viralPrimaryText: { color: '#FFFFFF', fontSize: 16 },
  viralSecondaryBtn: { borderWidth: 1.5, paddingVertical: 14, alignItems: 'center' },
  viralSecondaryText: { fontSize: 15 },
  sendAnotherRow: { width: '100%' },
  sendAnotherBtn: { paddingVertical: 12, alignItems: 'center' },
  sendAnotherText: { fontSize: 14 },
});
