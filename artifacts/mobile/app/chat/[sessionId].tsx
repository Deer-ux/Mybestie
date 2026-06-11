import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  FlatList, Platform, KeyboardAvoidingView, ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import GlassCard from '@/components/GlassCard';
import BlobBackground from '@/components/BlobBackground';

const PINK  = '#FF2D95';
const CYAN  = '#00D4FF';
const MUTED = 'rgba(255,255,255,0.45)';

function apiBase(): string {
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin;
  return '';
}

interface RawMessage {
  id: string;
  sessionId: string;
  senderId: string;
  text: string;
  createdAt: string;
}

interface Session {
  id: string;
  user1Id: string;
  user2Id: string;
  status: string;
}

export default function ChatScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useApp();

  const [messages,      setMessages]      = useState<RawMessage[]>([]);
  const [session,       setSession]       = useState<Session | null>(null);
  const [usernameMap,   setUsernameMap]   = useState<Record<string, string>>({});
  const [inputText,     setInputText]     = useState('');
  const [loading,       setLoading]       = useState(true);
  const [sending,       setSending]       = useState(false);
  const [sessionEnded,  setSessionEnded]  = useState(false);
  const [showEndModal,  setShowEndModal]  = useState(false);

  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const flatRef    = useRef<FlatList>(null);
  const lastMsgId  = useRef<string>('');

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const fetchSession = useCallback(async () => {
    if (!sessionId) return;
    try {
      const resp = await fetch(`${apiBase()}/api/chat/${sessionId}`);
      if (!resp.ok) return;
      const data = await resp.json() as {
        session: Session;
        messages: RawMessage[];
        usernameMap: Record<string, string>;
      };
      setSession(data.session);
      setUsernameMap(data.usernameMap ?? {});
      if (data.session.status === 'ended') {
        setSessionEnded(true);
        stopPolling();
      }

      // Only update messages if something changed (avoid re-render flicker)
      const latestId = data.messages[data.messages.length - 1]?.id ?? '';
      if (latestId !== lastMsgId.current) {
        lastMsgId.current = latestId;
        setMessages(data.messages);
        if (data.messages.length > 0) {
          setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 80);
        }
        // Haptic for new message from partner
        if (data.messages.length > messages.length) {
          const newest = data.messages[data.messages.length - 1];
          if (newest && newest.senderId !== user?.id) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        }
      }
    } catch {}
  }, [sessionId, messages.length, user?.id]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  useEffect(() => {
    fetchSession().finally(() => setLoading(false));
    pollRef.current = setInterval(fetchSession, 2000);
    return () => stopPolling();
  }, [sessionId]);

  async function sendMessage() {
    if (!inputText.trim() || !user?.id || !sessionId || sending) return;
    const text = inputText.trim();
    setInputText('');
    setSending(true);
    try {
      const resp = await fetch(`${apiBase()}/api/chat/${sessionId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, text }),
      });
      if (resp.ok) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await fetchSession();
      }
    } catch {}
    setSending(false);
  }

  async function endChat() {
    setShowEndModal(false);
    stopPolling();
    try {
      await fetch(`${apiBase()}/api/chat/${sessionId}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id }),
      });
    } catch {}
    router.replace('/(tabs)');
  }

  // Partner username
  const partnerId = session
    ? (session.user1Id === user?.id ? session.user2Id : session.user1Id)
    : null;
  const partnerName = partnerId ? (usernameMap[partnerId] ?? 'Anonymous') : 'Anonymous';

  if (loading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <BlobBackground variant="purple" />
        <ActivityIndicator size="large" color={PINK} />
        <Text style={[styles.mutedText, { marginTop: 16 }]}>Connecting to chat…</Text>
      </View>
    );
  }

  if (!session) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 }]}>
        <BlobBackground variant="purple" />
        <Text style={{ fontSize: 48 }}>😔</Text>
        <Text style={styles.titleText}>Chat not found</Text>
        <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.endBtnSmall}>
          <Text style={styles.endBtnSmallText}>Go Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BlobBackground variant="purple" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 10 }]}>
        <View style={styles.partnerInfo}>
          <View style={styles.avatarDot} />
          <View>
            <Text style={styles.partnerName}>{partnerName}</Text>
            <Text style={styles.onlineLabel}>
              {sessionEnded ? '🔴 Session ended' : '🟢 Connected · anonymous'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => setShowEndModal(true)}
          style={styles.endBtn}
        >
          <Text style={styles.endBtnText}>End</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.messageList, { paddingBottom: 12 }]}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={() => (
            <View style={styles.emptyChat}>
              <Text style={{ fontSize: 36 }}>👋</Text>
              <Text style={styles.emptyChatText}>You're connected! Say hello to {partnerName}.</Text>
            </View>
          )}
          renderItem={({ item, index }) => {
            const isMine = item.senderId === user?.id;
            return (
              <Animated.View
                key={item.id}
                entering={FadeInUp.delay(Math.min(index * 20, 200))}
                style={[styles.bubbleRow, isMine ? styles.bubbleRowRight : styles.bubbleRowLeft]}
              >
                <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>
                    {item.text}
                  </Text>
                  <Text style={[styles.bubbleTime, isMine && { color: 'rgba(255,255,255,0.55)' }]}>
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </Animated.View>
            );
          }}
        />

        {/* Ended banner */}
        {sessionEnded && (
          <View style={styles.endedBanner}>
            <Text style={styles.endedBannerText}>This chat has ended.</Text>
            <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
              <Text style={[styles.endedBannerText, { color: CYAN, marginLeft: 8 }]}>Go home →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Input */}
        {!sessionEnded && (
          <View style={[styles.inputRow, { paddingBottom: botPad + 8 }]}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message…"
              placeholderTextColor={MUTED}
              multiline
              maxLength={500}
              onSubmitEditing={sendMessage}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              onPress={sendMessage}
              disabled={!inputText.trim() || sending}
              style={[styles.sendBtn, (!inputText.trim() || sending) && styles.sendBtnDisabled]}
            >
              {sending
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="send" size={20} color="#fff" />
              }
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* End chat modal */}
      {showEndModal && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setShowEndModal(false)} />
          <GlassCard style={styles.modal} padding={24}>
            <Text style={styles.modalTitle}>End this chat?</Text>
            <Text style={styles.modalBody}>This will end the session for both of you. You won't be able to continue.</Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setShowEndModal(false)} style={styles.modalCancel}>
                <Text style={styles.modalCancelText}>Keep chatting</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={endChat} style={styles.modalEnd}>
                <Text style={styles.modalEndText}>End chat</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#050505' },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
  partnerInfo:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarDot:     { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,45,149,0.20)', borderWidth: 1, borderColor: 'rgba(255,45,149,0.40)' },
  partnerName:   { color: '#FFFFFF', fontSize: 15, fontFamily: 'SpaceGrotesk_600SemiBold' },
  onlineLabel:   { color: MUTED, fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  endBtn:        { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,68,68,0.40)', backgroundColor: 'rgba(255,68,68,0.10)' },
  endBtnText:    { color: '#FF4444', fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  endBtnSmall:   { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 16, backgroundColor: 'rgba(255,45,149,0.15)', borderWidth: 1, borderColor: 'rgba(255,45,149,0.30)' },
  endBtnSmallText:{ color: PINK, fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  titleText:     { color: '#FFFFFF', fontSize: 20, fontFamily: 'SpaceGrotesk_700Bold', textAlign: 'center' },
  mutedText:     { color: MUTED, fontSize: 14, fontFamily: 'Inter_400Regular' },

  messageList:   { paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  bubbleRow:     { flexDirection: 'row' },
  bubbleRowRight:{ justifyContent: 'flex-end' },
  bubbleRowLeft: { justifyContent: 'flex-start' },
  bubble:        { maxWidth: '78%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9, gap: 4 },
  bubbleMine:    { backgroundColor: PINK, borderBottomRightRadius: 4 },
  bubbleTheirs:  { backgroundColor: 'rgba(255,255,255,0.09)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', borderBottomLeftRadius: 4 },
  bubbleText:    { fontSize: 15, color: '#E0E0E0', fontFamily: 'Inter_400Regular', lineHeight: 21 },
  bubbleTextMine:{ color: '#FFFFFF' },
  bubbleTime:    { fontSize: 10, color: MUTED, fontFamily: 'Inter_400Regular', alignSelf: 'flex-end' },

  emptyChat:     { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyChatText: { color: MUTED, fontSize: 14, textAlign: 'center', fontFamily: 'Inter_400Regular', lineHeight: 20, paddingHorizontal: 32 },

  inputRow:      { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 14, paddingTop: 10, gap: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)', backgroundColor: 'rgba(5,5,5,0.85)' },
  input:         { flex: 1, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: '#FFFFFF', fontSize: 15, fontFamily: 'Inter_400Regular', maxHeight: 120, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  sendBtn:       { width: 44, height: 44, borderRadius: 22, backgroundColor: PINK, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled:{ opacity: 0.40 },

  endedBanner:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)' },
  endedBannerText:{ color: MUTED, fontSize: 13, fontFamily: 'Inter_400Regular' },

  modalOverlay:  { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 100 },
  modal:         { width: '100%', gap: 16 },
  modalTitle:    { color: '#FFFFFF', fontSize: 18, fontFamily: 'SpaceGrotesk_700Bold' },
  modalBody:     { color: MUTED, fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  modalBtns:     { flexDirection: 'row', gap: 12 },
  modalCancel:   { flex: 1, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center' },
  modalCancelText:{ color: '#FFFFFF', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  modalEnd:      { flex: 1, paddingVertical: 12, borderRadius: 14, backgroundColor: 'rgba(255,68,68,0.18)', borderWidth: 1, borderColor: 'rgba(255,68,68,0.35)', alignItems: 'center' },
  modalEndText:  { color: '#FF4444', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});
