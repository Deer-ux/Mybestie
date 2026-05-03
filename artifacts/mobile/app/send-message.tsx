import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useInbox, MessageCategory } from '@/context/InboxContext';
import GlassCard from '@/components/GlassCard';
import BlobBackground from '@/components/BlobBackground';

const CATEGORIES: { id: MessageCategory; label: string; emoji: string; color: string }[] = [
  { id: 'compliment', label: 'Compliment', emoji: '❤️', color: '#E57373' },
  { id: 'advice', label: 'Advice', emoji: '💡', color: '#F59E0B' },
  { id: 'confession', label: 'Confession', emoji: '🤫', color: '#6C63FF' },
  { id: 'question', label: 'Question', emoji: '🤔', color: '#1F6F8B' },
  { id: 'encouragement', label: 'Encouragement', emoji: '✨', color: '#4CAF50' },
  { id: 'feedback', label: 'Feedback', emoji: '📝', color: '#A29BFE' },
  { id: 'secret', label: 'Secret', emoji: '🔒', color: '#0B3C5D' },
  { id: 'other', label: 'Other', emoji: '💬', color: '#6B7280' },
];

export default function SendMessageScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { sendMessage } = useInbox();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [category, setCategory] = useState<MessageCategory>('other');
  const [content, setContent] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const recipientName = slug ?? 'Anonymous User';

  async function handleSend() {
    if (!content.trim() || !slug) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSending(true);
    setError('');
    const result = await sendMessage(slug, category, content);
    setSending(false);
    if (result.success) {
      setSent(true);
    } else {
      setError(result.reason ?? 'Could not send message.');
    }
  }

  if (sent) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <BlobBackground variant="green" />
        <View style={[styles.successWrap, { paddingTop: topPad + 40 }]}>
          <Animated.View entering={FadeInDown.springify()} style={styles.successContent}>
            <Text style={styles.successEmoji}>📬</Text>
            <Text style={[styles.successTitle, { color: colors.primary, fontFamily: 'Poppins_700Bold' }]}>Message Sent!</Text>
            <Text style={[styles.successSub, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              Your anonymous message has been delivered safely. Your identity stays private.
            </Text>
            <TouchableOpacity
              onPress={() => { setSent(false); setContent(''); }}
              style={[styles.anotherBtn, { borderRadius: colors.radius }]}
            >
              <LinearGradient colors={['#6C63FF', '#A29BFE']} style={styles.anotherBtnGrad}>
                <Text style={[styles.anotherBtnText, { fontFamily: 'Inter_600SemiBold' }]}>Send Another Message</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
              <Text style={[styles.backLinkText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>← Back</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <BlobBackground variant="purple" />
      <LinearGradient colors={['#6C63FF', '#A29BFE']} style={[styles.header, { paddingTop: topPad + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.lockWrap}>
            <Text style={{ fontSize: 36 }}>📬</Text>
          </View>
          <Text style={[styles.headerTitle, { fontFamily: 'Poppins_700Bold' }]}>
            Send an anonymous message to
          </Text>
          <Text style={[styles.recipientName, { fontFamily: 'Poppins_600SemiBold' }]}>{recipientName}</Text>
          <Text style={[styles.headerSub, { fontFamily: 'Inter_400Regular' }]}>
            They won't know who sent it. Be kind, honest, and respectful.
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: botPad + 40, gap: 20 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInDown.delay(100)}>
          <Text style={[styles.sectionLabel, { color: colors.foreground, fontFamily: 'Poppins_600SemiBold' }]}>
            What type of message is this?
          </Text>
          <View style={styles.catGrid}>
            {CATEGORIES.map(c => (
              <TouchableOpacity
                key={c.id}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCategory(c.id); }}
                style={[styles.catCard, {
                  backgroundColor: category === c.id ? c.color + '18' : colors.glass,
                  borderColor: category === c.id ? c.color : colors.glassBorder,
                  borderRadius: colors.radius - 4,
                }]}
              >
                <Text style={styles.catEmoji}>{c.emoji}</Text>
                <Text style={[styles.catLabel, { color: category === c.id ? c.color : colors.foreground, fontFamily: 'Inter_500Medium' }]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200)}>
          <Text style={[styles.sectionLabel, { color: colors.foreground, fontFamily: 'Poppins_600SemiBold' }]}>
            Write your message
          </Text>
          <View style={[styles.inputWrap, { backgroundColor: colors.glass, borderColor: colors.glassBorder, borderRadius: colors.radius }]}>
            <TextInput
              style={[styles.messageInput, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
              value={content}
              onChangeText={text => { setContent(text); setError(''); }}
              placeholder="Write your anonymous message here..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={6}
              maxLength={1000}
              textAlignVertical="top"
            />
            <View style={[styles.inputFooter, { borderTopColor: colors.border }]}>
              <Text style={{ fontSize: 18 }}>
                {CATEGORIES.find(c => c.id === category)?.emoji}
              </Text>
              <Text style={[styles.charCount, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                {content.length}/1000
              </Text>
            </View>
          </View>
        </Animated.View>

        {error !== '' && (
          <View style={[styles.errorCard, { backgroundColor: '#FFF0F0', borderRadius: colors.radius - 4 }]}>
            <Text style={{ fontSize: 16 }}>⚠️</Text>
            <Text style={[styles.errorText, { color: colors.destructive, fontFamily: 'Inter_500Medium' }]}>{error}</Text>
          </View>
        )}

        <Animated.View entering={FadeInDown.delay(300)}>
          <GlassCard style={styles.safetyNote} padding={12}>
            <Text style={{ fontSize: 16 }}>🛡️</Text>
            <Text style={[styles.safetyText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              MindBridge moderates all messages before delivery. Hate speech, harassment, threats, and unsafe content will not be delivered.
            </Text>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(350)}>
          <TouchableOpacity
            onPress={handleSend}
            disabled={!content.trim() || sending}
            style={[styles.sendBtn, { borderRadius: colors.radius, opacity: content.trim() ? 1 : 0.4 }]}
          >
            <LinearGradient colors={['#6C63FF', '#A29BFE']} style={styles.sendGrad}>
              <Text style={styles.sendEmoji}>📨</Text>
              <Text style={[styles.sendText, { fontFamily: 'Inter_600SemiBold' }]}>
                {sending ? 'Sending...' : 'Send Message Anonymously'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 24 },
  backBtn: { marginBottom: 12 },
  headerCenter: { alignItems: 'center', gap: 8 },
  lockWrap: {},
  headerTitle: { color: '#FFFFFF', fontSize: 16, textAlign: 'center' },
  recipientName: { color: '#FFFFFF', fontSize: 20 },
  headerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, textAlign: 'center' },
  sectionLabel: { fontSize: 15, marginBottom: 10 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catCard: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1.5,
  },
  catEmoji: { fontSize: 16 },
  catLabel: { fontSize: 13 },
  inputWrap: { borderWidth: 1 },
  messageInput: { padding: 14, fontSize: 15, minHeight: 140, lineHeight: 22 },
  inputFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10, borderTopWidth: StyleSheet.hairlineWidth },
  charCount: { fontSize: 12 },
  errorCard: { flexDirection: 'row', alignItems: 'flex-start', padding: 12, gap: 8 },
  errorText: { flex: 1, fontSize: 13, lineHeight: 19 },
  safetyNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  safetyText: { flex: 1, fontSize: 12, lineHeight: 18 },
  sendBtn: { overflow: 'hidden' as const },
  sendGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 },
  sendEmoji: { fontSize: 20 },
  sendText: { color: '#FFFFFF', fontSize: 16 },
  successWrap: { flex: 1, alignItems: 'center', paddingHorizontal: 24 },
  successContent: { alignItems: 'center', gap: 16 },
  successEmoji: { fontSize: 70 },
  successTitle: { fontSize: 28 },
  successSub: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  anotherBtn: { width: '100%', overflow: 'hidden' as const, marginTop: 8 },
  anotherBtnGrad: { paddingVertical: 15, alignItems: 'center' },
  anotherBtnText: { color: '#FFFFFF', fontSize: 15 },
  backLink: { paddingVertical: 8 },
  backLinkText: { fontSize: 14 },
});
