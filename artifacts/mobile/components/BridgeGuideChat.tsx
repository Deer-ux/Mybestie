import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { getBridgeResponse, getIntentLabel, getIntentEmoji, QUICK_ACTIONS, BridgeIntent } from '@/utils/bridgeGuide';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  intent?: BridgeIntent;
  timestamp: Date;
}

const GREETING: ChatMessage = {
  id: 'welcome',
  isUser: false,
  text: "Hello! 👋 I'm BridgeGuide — your AI companion on MindBridge.\n\nI can help with career advice, study tips, habit building, culture facts, conversation starters, and more. Just ask me anything!",
  timestamp: new Date(),
};

function makeId() { return Date.now().toString() + Math.random().toString(36).substr(2, 9); }

interface Props {
  compact?: boolean;
  onClose?: () => void;
}

export default function BridgeGuideChat({ compact = false, onClose }: Props) {
  const colors = useColors();
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  function handleSend(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const userMsg: ChatMessage = { id: makeId(), text: msg, isUser: true, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const delay = 1000 + Math.random() * 800;
    setTimeout(() => {
      const { intent, response } = getBridgeResponse(msg);
      const aiMsg: ChatMessage = { id: makeId(), text: response, isUser: false, intent, timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }, delay);
  }

  const showQuickActions = messages.length <= 1;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {!compact && (
        <LinearGradient colors={['#6C63FF', '#A29BFE']} style={styles.chatHeader}>
          <View style={styles.aiAvatar}>
            <Text style={{ fontSize: 22 }}>✨</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={[styles.headerName, { fontFamily: 'Poppins_700Bold' }]}>BridgeGuide AI</Text>
            <Text style={[styles.headerStatus, { fontFamily: 'Inter_400Regular' }]}>Always here to help</Text>
          </View>
          {onClose && (
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
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
              <View style={[styles.aiDot, { backgroundColor: colors.lavenderLight }]}>
                <Text style={{ fontSize: 13 }}>✨</Text>
              </View>
            )}
            <View style={styles.msgContent}>
              {msg.intent && !msg.isUser && (
                <View style={[styles.intentBadge, { backgroundColor: colors.lavenderLight }]}>
                  <Text style={{ fontSize: 11 }}>{getIntentEmoji(msg.intent)}</Text>
                  <Text style={[styles.intentText, { color: colors.accent, fontFamily: 'Inter_600SemiBold' }]}>
                    {getIntentLabel(msg.intent)}
                  </Text>
                </View>
              )}
              {msg.isUser ? (
                <LinearGradient colors={['#1F6F8B', '#0B3C5D']} style={styles.userBubble}>
                  <Text style={[styles.bubbleText, { color: '#FFFFFF', fontFamily: 'Inter_400Regular' }]}>{msg.text}</Text>
                </LinearGradient>
              ) : (
                <View style={[styles.aiBubble, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
                  <Text style={[styles.bubbleText, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}>{msg.text}</Text>
                </View>
              )}
            </View>
          </View>
        ))}

        {isTyping && (
          <View style={[styles.msgRow, styles.msgRowLeft]}>
            <View style={[styles.aiDot, { backgroundColor: colors.lavenderLight }]}>
              <Text style={{ fontSize: 13 }}>✨</Text>
            </View>
            <View style={[styles.aiBubble, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
              <Text style={[styles.typingText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                BridgeGuide is thinking...
              </Text>
            </View>
          </View>
        )}

        {showQuickActions && (
          <View style={styles.quickSection}>
            <Text style={[styles.quickLabel, { color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold' }]}>QUICK QUESTIONS</Text>
            {QUICK_ACTIONS.map((action, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => handleSend(action.text)}
                style={[styles.quickBtn, { backgroundColor: colors.lavenderLight, borderRadius: colors.radius - 4 }]}
              >
                <Text style={{ fontSize: 16 }}>{action.emoji}</Text>
                <Text style={[styles.quickBtnText, { color: colors.accent, fontFamily: 'Inter_500Medium' }]}>{action.label}</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.accent} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={[styles.inputArea, { backgroundColor: colors.glass, borderTopColor: colors.border }]}>
        <View style={[styles.inputRow, { backgroundColor: colors.muted, borderRadius: 24 }]}>
          <TextInput
            style={[styles.textInput, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
            value={input}
            onChangeText={setInput}
            placeholder="Ask BridgeGuide anything..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            maxLength={500}
            onSubmitEditing={() => handleSend()}
          />
          <TouchableOpacity
            onPress={() => handleSend()}
            disabled={!input.trim() || isTyping}
            style={[styles.sendBtn, { backgroundColor: input.trim() ? colors.accent : colors.border }]}
          >
            <Ionicons name="send" size={16} color={input.trim() ? '#FFFFFF' : colors.mutedForeground} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.disclaimer, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
          BridgeGuide is AI-assisted, not a licensed counsellor.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  chatHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  aiAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  headerInfo: { flex: 1 },
  headerName: { color: '#FFFFFF', fontSize: 16 },
  headerStatus: { color: 'rgba(255,255,255,0.75)', fontSize: 12 },
  messageList: { flex: 1 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  msgRowRight: { flexDirection: 'row-reverse' },
  msgRowLeft: {},
  aiDot: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 4, flexShrink: 0 },
  msgContent: { flex: 1, gap: 4 },
  intentBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, gap: 4 },
  intentText: { fontSize: 11 },
  userBubble: { borderRadius: 16, borderBottomRightRadius: 4, paddingHorizontal: 14, paddingVertical: 10 },
  aiBubble: {
    borderRadius: 16, borderBottomLeftRadius: 4, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1,
  },
  bubbleText: { fontSize: 14, lineHeight: 21 },
  typingText: { fontSize: 14, fontStyle: 'italic' as const },
  quickSection: { gap: 8, marginTop: 8 },
  quickLabel: { fontSize: 11, letterSpacing: 0.8, marginBottom: 4 },
  quickBtn: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  quickBtnText: { flex: 1, fontSize: 14 },
  inputArea: { borderTopWidth: 1, paddingHorizontal: 12, paddingVertical: 10, gap: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 14, paddingVertical: 8, gap: 8 },
  textInput: { flex: 1, fontSize: 14, maxHeight: 80, lineHeight: 20 },
  sendBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  disclaimer: { fontSize: 10, textAlign: 'center' },
});
