import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import {
  getIntentLabel, getIntentEmoji, QUICK_ACTIONS, BridgeIntent,
  ConversationMessage,
} from '@/utils/bridgeGuide';
import { callBridgeGuideApi, buildHistoryForApi } from '@/utils/bridgeguideApi';
import { trackEvent } from '@/utils/analytics';
import colors from '@/constants/colors';

const PINK  = '#FF2D95';
const MUTED = 'rgba(255,255,255,0.50)';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  isError?: boolean;
  timestamp: Date;
}

const GREETING: ChatMessage = {
  id: 'welcome',
  isUser: false,
  text: "Hey! I'm Bestie AI — your AI companion on MyBestie.\n\nAsk me anything: career, skills, study tips, habits, culture, life advice, or just a chat. What's on your mind?",
  timestamp: new Date(),
};

function makeId() { return Date.now().toString() + Math.random().toString(36).substr(2, 9); }

interface Props {
  compact?: boolean;
  onClose?: () => void;
}

export default function BridgeGuideChat({ compact = false, onClose }: Props) {
  const { user } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  async function handleSend(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || isTyping) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMsg: ChatMessage = { id: makeId(), text: msg, isUser: true, timestamp: new Date() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsTyping(true);

    // Build conversation history for the API (exclude the greeting and the just-added user message)
    const historyMessages: ConversationMessage[] = updatedMessages.slice(1).map(m => ({
      text: m.text,
      isUser: m.isUser,
    }));
    // The last item is the current user message — exclude it so it goes as `message` param
    const priorHistory = historyMessages.slice(0, -1);

    try {
      const reply = await callBridgeGuideApi({
        message: msg,
        conversationHistory: buildHistoryForApi(priorHistory),
        userMood: user?.mood,
        userInterests: user?.interests,
        userPersonality: user?.personality,
        userTemperament: user?.temperament,
      });

      trackEvent('bridge_guide_question', user?.id, { source: 'real_ai' });

      const aiMsg: ChatMessage = {
        id: makeId(), text: reply, isUser: false, timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: unknown) {
      const errorText =
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.';

      const errMsg: ChatMessage = {
        id: makeId(),
        text: `⚠️ ${errorText}`,
        isUser: false,
        isError: true,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsTyping(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }

  const showQuickActions = messages.length <= 1;

  return (
    <View style={styles.container}>
      {!compact && (
        <LinearGradient colors={['#1A0B2E', '#050505']} style={styles.chatHeader}>
          <View style={styles.aiAvatar}>
            <Text style={{ fontSize: 22 }}>✨</Text>
          </View>
          <View style={styles.headerInfo}>
            <View style={styles.headerNameRow}>
              <Text style={styles.headerName}>Bestie AI</Text>
              <View style={styles.aiBadge}>
                <Text style={styles.aiBadgeText}>AI</Text>
              </View>
            </View>
            <Text style={styles.headerStatus}>
              Not a real person · Powered by AI · Always here
            </Text>
          </View>
          {onClose && (
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="rgba(255,255,255,0.60)" />
            </TouchableOpacity>
          )}
        </LinearGradient>
      )}

      <ScrollView
        ref={scrollRef}
        style={styles.messageList}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 20 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        showsVerticalScrollIndicator={false}
      >
        {messages.map(msg => (
          <View key={msg.id} style={[styles.msgRow, msg.isUser ? styles.msgRowRight : styles.msgRowLeft]}>
            {!msg.isUser && (
              <View style={[styles.aiDot, msg.isError && styles.aiDotError]}>
                <Text style={{ fontSize: 13 }}>{msg.isError ? '⚠️' : '✨'}</Text>
              </View>
            )}
            <View style={styles.msgContent}>
              {msg.isUser ? (
                <LinearGradient
                  colors={colors.gradPrimary}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.userBubble}
                >
                  <Text style={styles.userBubbleText}>{msg.text}</Text>
                </LinearGradient>
              ) : (
                <View style={[styles.aiBubble, msg.isError && styles.aiBubbleError]}>
                  <Text style={[styles.aiBubbleText, msg.isError && styles.aiBubbleErrorText]}>
                    {msg.text}
                  </Text>
                </View>
              )}
            </View>
          </View>
        ))}

        {isTyping && (
          <View style={[styles.msgRow, styles.msgRowLeft]}>
            <View style={styles.aiDot}><Text style={{ fontSize: 13 }}>✨</Text></View>
            <View style={styles.aiBubble}>
              <Text style={styles.typingText}>Bestie AI is thinking...</Text>
            </View>
          </View>
        )}

        {showQuickActions && (
          <View style={styles.quickSection}>
            <Text style={styles.quickLabel}>QUICK QUESTIONS</Text>
            {QUICK_ACTIONS.map((action, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => handleSend(action.text)}
                style={styles.quickBtn}
                disabled={isTyping}
              >
                <Text style={{ fontSize: 16 }}>{action.emoji}</Text>
                <Text style={styles.quickBtnText}>{action.label}</Text>
                <Ionicons name="chevron-forward" size={14} color={PINK} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.inputArea}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            value={input}
            onChangeText={setInput}
            placeholder="Ask Bestie AI anything..."
            placeholderTextColor="rgba(255,255,255,0.30)"
            multiline
            maxLength={500}
            onSubmitEditing={() => handleSend()}
            editable={!isTyping}
          />
          <TouchableOpacity
            onPress={() => handleSend()}
            disabled={!input.trim() || isTyping}
            style={[styles.sendBtnWrap, { opacity: input.trim() && !isTyping ? 1 : 0.30 }]}
          >
            <LinearGradient colors={['#FF2D95', '#7B2CFF']} style={styles.sendGrad}>
              <Ionicons name="send" size={16} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <Text style={styles.disclaimer}>
          Bestie AI is AI — not a licensed counsellor or real person.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#050505' },
  chatHeader:      { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
  aiAvatar:        { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,45,149,0.20)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,45,149,0.35)' },
  headerInfo:      { flex: 1 },
  headerNameRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerName:      { color: '#FFFFFF', fontSize: 16, fontFamily: 'SpaceGrotesk_700Bold' },
  aiBadge:         { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: 'rgba(255,45,149,0.25)', borderWidth: 1, borderColor: 'rgba(255,45,149,0.40)' },
  aiBadgeText:     { color: '#FF2D95', fontSize: 10, fontFamily: 'SpaceGrotesk_700Bold', letterSpacing: 0.5 },
  headerStatus:    { color: MUTED, fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 3 },

  messageList:     { flex: 1 },
  msgRow:          { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  msgRowRight:     { flexDirection: 'row-reverse' },
  msgRowLeft:      {},

  aiDot:           { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 4, flexShrink: 0, backgroundColor: 'rgba(255,45,149,0.15)' },
  aiDotError:      { backgroundColor: 'rgba(255,100,0,0.15)' },

  msgContent:      { flex: 1, gap: 4 },

  userBubble:      { borderRadius: 16, borderBottomRightRadius: 4, paddingHorizontal: 14, paddingVertical: 10 },
  userBubbleText:  { color: '#FFFFFF', fontSize: 14, lineHeight: 21, fontFamily: 'Inter_400Regular' },

  aiBubble:        { borderRadius: 16, borderBottomLeftRadius: 4, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  aiBubbleText:    { color: '#FFFFFF', fontSize: 14, lineHeight: 21, fontFamily: 'Inter_400Regular' },
  aiBubbleError:   { backgroundColor: 'rgba(255,100,0,0.08)', borderColor: 'rgba(255,100,0,0.25)' },
  aiBubbleErrorText:{ color: 'rgba(255,150,80,0.95)' },

  typingText:      { fontSize: 14, fontStyle: 'italic' as const, color: MUTED, fontFamily: 'Inter_400Regular' },

  quickSection:    { gap: 8, marginTop: 8 },
  quickLabel:      { fontSize: 11, letterSpacing: 1.8, marginBottom: 4, color: MUTED, fontFamily: 'SpaceGrotesk_600SemiBold' },
  quickBtn:        { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10, backgroundColor: 'rgba(255,45,149,0.08)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,45,149,0.20)' },
  quickBtnText:    { flex: 1, fontSize: 14, color: '#FFFFFF', fontFamily: 'Inter_500Medium' },

  inputArea:       { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)', paddingHorizontal: 12, paddingVertical: 10, gap: 6, backgroundColor: '#0B0B0F' },
  inputRow:        { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 24, paddingHorizontal: 14, paddingVertical: 8, gap: 8, borderWidth: 1, borderColor: 'rgba(255,45,149,0.25)' },
  textInput:       { flex: 1, fontSize: 14, maxHeight: 80, lineHeight: 20, color: '#FFFFFF', fontFamily: 'Inter_400Regular' },
  sendBtnWrap:     { borderRadius: 17, overflow: 'hidden' as const },
  sendGrad:        { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  disclaimer:      { fontSize: 10, textAlign: 'center', color: MUTED, fontFamily: 'Inter_400Regular' },
});
