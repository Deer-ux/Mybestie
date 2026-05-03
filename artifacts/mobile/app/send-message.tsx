import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Platform, Keyboard, Share,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useInbox, MessageCategory } from '@/context/InboxContext';
import { trackEvent } from '@/utils/analytics';
import GlassCard from '@/components/GlassCard';
import BlobBackground from '@/components/BlobBackground';
import colors from '@/constants/colors';

const PINK  = '#FF2D95';
const CYAN  = '#00D4FF';
const MUTED = 'rgba(255,255,255,0.50)';

const CATEGORIES: { id: MessageCategory; label: string; emoji: string; color: string; placeholder: string }[] = [
  {
    id: 'compliment', label: 'Compliment', emoji: '❤️', color: '#FF6B6B',
    placeholder: 'Tell them something you genuinely admire about them...',
  },
  {
    id: 'question', label: 'Question', emoji: '🤔', color: '#38BDF8',
    placeholder: 'Ask something you\'ve always wanted to know...',
  },
  {
    id: 'advice', label: 'Advice', emoji: '💡', color: '#F59E0B',
    placeholder: 'Share advice you think they need to hear...',
  },
  {
    id: 'confession', label: 'Confession', emoji: '🤫', color: '#7B2CFF',
    placeholder: 'Say something you\'ve never told them out loud...',
  },
  {
    id: 'encouragement', label: 'Encouragement', emoji: '✨', color: '#00FF88',
    placeholder: 'Give them the push they need right now...',
  },
  {
    id: 'feedback', label: 'Feedback', emoji: '📝', color: '#A29BFE',
    placeholder: 'Give them real, constructive feedback...',
  },
  {
    id: 'other', label: 'Just Say It', emoji: '💬', color: '#9CA3AF',
    placeholder: 'Just say it — anything on your mind...',
  },
];

const EMOJIS = ['😊', '❤️', '🔥', '✨', '💯', '😂', '🤔', '👀', '💙', '🙌', '😍', '💪', '🥺', '😭', '🌟', '👏'];

export default function SendMessageScreen() {
  const insets = useSafeAreaInsets();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { sendMessage } = useInbox();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  useEffect(() => { trackEvent('link_visited'); }, []);

  const [step, setStep]             = useState<'compose' | 'success'>('compose');
  const [category, setCategory]     = useState<MessageCategory>('compliment');
  const [content, setContent]       = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const [sending, setSending]       = useState(false);
  const inputRef = useRef<TextInput>(null);

  const recipientName = slug ?? 'Someone';
  const selectedCat   = CATEGORIES.find(c => c.id === category)!;

  async function handleSend() {
    if (!content.trim() || !slug) return;
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSending(true);
    const result = await sendMessage(slug, category, content);
    trackEvent('anonymous_message_sent');
    setSending(false);
    if (result.success) {
      setStep('success');
    }
  }

  function addEmoji(e: string) {
    setContent(prev => prev + e);
    setShowEmojis(false);
    inputRef.current?.focus();
  }

  if (step === 'success') {
    return (
      <View style={styles.container}>
        <BlobBackground variant="purple" />
        <ScrollView
          contentContainerStyle={[styles.successScroll, { paddingTop: topPad + 30, paddingBottom: botPad + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={ZoomIn.springify()} style={styles.successIconWrap}>
            <LinearGradient colors={colors.gradPrimary} style={styles.successIconGrad}>
              <Text style={{ fontSize: 48 }}>📬</Text>
            </LinearGradient>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200)} style={styles.successTextWrap}>
            <Text style={styles.successTitle}>Message Sent! ✨</Text>
            <Text style={styles.successSub}>
              Your anonymous message has been sent.{'\n'}They'll never know it was you.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(350)} style={{ width: '100%' }}>
            <GlassCard style={styles.viralCard} padding={22} neonBorder>
              <Text style={styles.viralTitle}>Want to receive anonymous messages too? 🔗</Text>
              <Text style={styles.viralSub}>
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
                    <Text style={styles.viralFeatureText}>{f}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); trackEvent('viral_registration'); router.replace('/'); }}
                style={styles.viralPrimaryBtn}
                activeOpacity={0.88}
              >
                <LinearGradient colors={colors.gradPrimary} style={styles.viralPrimaryGrad}>
                  <Text style={{ fontSize: 20 }}>🔗</Text>
                  <Text style={styles.viralPrimaryText}>Create My Anonymous Link</Text>
                </LinearGradient>
              </TouchableOpacity>
            </GlassCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(450)} style={styles.sendAnotherRow}>
            <TouchableOpacity
              onPress={() => { setStep('compose'); setContent(''); }}
              style={styles.sendAnotherBtn}
            >
              <Text style={styles.sendAnotherText}>Send another message</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1A0B2E', '#050505']}
        style={[styles.headerGrad, { paddingTop: topPad + 10 }]}
      >
        <View style={styles.headerInner}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color="rgba(255,255,255,0.85)" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <View style={styles.lockBadge}>
              <Text style={{ fontSize: 14 }}>🔒</Text>
              <Text style={styles.lockText}>100% Anonymous</Text>
            </View>
            <Text style={styles.headerTitle}>Send an anonymous{'\n'}message to</Text>
            <Text style={styles.headerName}>{recipientName}</Text>
            <Text style={styles.headerSub}>They won't know who sent it. Say what you honestly feel.</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.body}
        contentContainerStyle={{ padding: 18, paddingBottom: botPad + 110, gap: 18 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Category picker ── */}
        <Animated.View entering={FadeInDown.delay(80)}>
          <Text style={styles.sectionLabel}>What kind of message?</Text>
          <View style={styles.catGrid}>
            {CATEGORIES.map(cat => {
              const active = category === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCategory(cat.id); }}
                  style={[styles.catBtn, {
                    borderColor: active ? cat.color : 'rgba(255,255,255,0.10)',
                    backgroundColor: active ? cat.color + '18' : 'rgba(255,255,255,0.04)',
                  }]}
                  activeOpacity={0.82}
                >
                  <Text style={styles.catEmoji}>{cat.emoji}</Text>
                  <Text style={[styles.catLabel, { color: active ? cat.color : '#FFFFFF' }]}>{cat.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        {/* ── Message input ── */}
        <Animated.View entering={FadeInDown.delay(160)}>
          <Text style={styles.sectionLabel}>{selectedCat.emoji} Your message</Text>
          <View style={[styles.inputCard, { borderColor: selectedCat.color + '55' }]}>
            <TextInput
              ref={inputRef}
              style={styles.textInput}
              value={content}
              onChangeText={setContent}
              placeholder={selectedCat.placeholder}
              placeholderTextColor="rgba(255,255,255,0.30)"
              multiline
              maxLength={1000}
              textAlignVertical="top"
            />
            <View style={styles.inputActions}>
              <TouchableOpacity onPress={() => setShowEmojis(v => !v)} style={styles.inputActionBtn}>
                <Text style={{ fontSize: 22 }}>😊</Text>
              </TouchableOpacity>
              <Text style={styles.charCount}>{content.length}/1000</Text>
            </View>
          </View>
          {showEmojis && (
            <Animated.View entering={FadeInDown.springify()} style={styles.emojiPicker}>
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

        {/* ── Safety note ── */}
        <Animated.View entering={FadeInDown.delay(220)}>
          <View style={styles.safetyInfo}>
            <Text style={{ fontSize: 16 }}>🛡️</Text>
            <Text style={styles.safetyText}>Your identity stays completely private. No account needed. No tracking.</Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* ── Send bar ── */}
      <View style={[styles.sendBar, { paddingBottom: botPad + 10 }]}>
        <TouchableOpacity
          onPress={handleSend}
          disabled={!content.trim() || sending}
          style={[styles.sendBtn, { opacity: content.trim() ? 1 : 0.45 }]}
          activeOpacity={0.88}
        >
          <LinearGradient colors={colors.gradPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.sendGrad}>
            <Text style={{ fontSize: 20 }}>{selectedCat.emoji}</Text>
            <Text style={styles.sendText}>{sending ? 'Sending...' : 'Send Anonymously'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#050505' },
  headerGrad:       { paddingHorizontal: 20, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  headerInner:      { gap: 16 },
  closeBtn:         { alignSelf: 'flex-start', padding: 4 },
  headerCenter:     { gap: 6 },
  lockBadge:        { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: 'rgba(255,45,149,0.15)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, gap: 6, borderWidth: 1, borderColor: 'rgba(255,45,149,0.30)' },
  lockText:         { color: PINK, fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  headerTitle:      { color: 'rgba(255,255,255,0.70)', fontSize: 18, lineHeight: 26, fontFamily: 'SpaceGrotesk_600SemiBold' },
  headerName:       { color: '#FFFFFF', fontSize: 28, fontFamily: 'SpaceGrotesk_700Bold' },
  headerSub:        { color: MUTED, fontSize: 13, lineHeight: 19, fontFamily: 'Inter_400Regular' },
  body:             { flex: 1 },
  sectionLabel:     { color: '#FFFFFF', fontSize: 15, marginBottom: 10, fontFamily: 'SpaceGrotesk_600SemiBold' },
  catGrid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catBtn:           { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 14, borderWidth: 1.5 },
  catEmoji:         { fontSize: 18 },
  catLabel:         { fontSize: 13, fontFamily: 'Inter_500Medium' },
  inputCard:        { borderWidth: 2, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' as const },
  textInput:        { padding: 16, fontSize: 15, minHeight: 150, lineHeight: 23, color: '#FFFFFF', fontFamily: 'Inter_400Regular' },
  inputActions:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.08)' },
  inputActionBtn:   { padding: 4 },
  charCount:        { fontSize: 12, color: MUTED, fontFamily: 'Inter_400Regular' },
  emojiPicker:      { borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', padding: 12, marginTop: 4, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)' },
  emojiGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  emojiBtn:         { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  safetyInfo:       { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, backgroundColor: 'rgba(0,255,136,0.08)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0,255,136,0.20)' },
  safetyText:       { flex: 1, fontSize: 12, lineHeight: 18, color: '#00FF88', fontFamily: 'Inter_400Regular' },
  sendBar:          { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)', paddingHorizontal: 18, paddingTop: 10, backgroundColor: '#0B0B0F' },
  sendBtn:          { borderRadius: 20, overflow: 'hidden' as const },
  sendGrad:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 },
  sendText:         { color: '#FFFFFF', fontSize: 17, fontFamily: 'SpaceGrotesk_600SemiBold' },
  successScroll:    { alignItems: 'center', paddingHorizontal: 20, gap: 24 },
  successIconWrap:  {},
  successIconGrad:  { width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center' },
  successTextWrap:  { alignItems: 'center', gap: 8 },
  successTitle:     { fontSize: 28, textAlign: 'center', color: PINK, fontFamily: 'SpaceGrotesk_700Bold' },
  successSub:       { fontSize: 15, textAlign: 'center', lineHeight: 23, color: MUTED, fontFamily: 'Inter_400Regular' },
  viralCard:        { width: '100%', gap: 16 },
  viralTitle:       { fontSize: 20, textAlign: 'center', color: '#FFFFFF', fontFamily: 'SpaceGrotesk_700Bold' },
  viralSub:         { fontSize: 14, textAlign: 'center', lineHeight: 21, color: MUTED, fontFamily: 'Inter_400Regular' },
  viralFeatures:    { gap: 8 },
  viralFeatureRow:  { flexDirection: 'row', alignItems: 'flex-start' },
  viralFeatureText: { fontSize: 14, lineHeight: 21, flex: 1, color: '#FFFFFF', fontFamily: 'Inter_400Regular' },
  viralPrimaryBtn:  { borderRadius: 20, overflow: 'hidden' as const },
  viralPrimaryGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 },
  viralPrimaryText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'SpaceGrotesk_600SemiBold' },
  sendAnotherRow:   { width: '100%' },
  sendAnotherBtn:   { paddingVertical: 12, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 20 },
  sendAnotherText:  { fontSize: 14, color: MUTED, fontFamily: 'Inter_500Medium' },
});
