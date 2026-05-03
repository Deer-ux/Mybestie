import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  TextInput, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import * as Haptics from 'expo-haptics';
import { useChat } from '@/context/ChatContext';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import AvatarDisplay from '@/components/AvatarDisplay';
import MessageBubble from '@/components/MessageBubble';
import SafetyModal from '@/components/SafetyModal';
import BridgeGuidePanel from '@/components/BridgeGuidePanel';

export default function ConversationScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { session, isMatching, safetyAlert, sendMessage, reactToMessage, endChat, reportUser, dismissSafetyAlert } = useChat();
  const { user, incrementChats, addBadge } = useApp();

  const [text, setText] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const listRef = useRef<FlatList>(null);

  const sessionSeconds = useRef(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      sessionSeconds.current += 1;
      setElapsed(sessionSeconds.current);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || !session) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    sendMessage(trimmed);
    setText('');
    inputRef.current?.focus();
  }

  async function handleEndChat() {
    Alert.alert('End Conversation', 'Are you sure you want to end this conversation?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Chat', style: 'destructive', onPress: async () => {
          endChat();
          await incrementChats();
          if (session && session.messages.length > 5) await addBadge('good_listener');
          router.replace('/feedback');
        },
      },
    ]);
  }

  async function handleReport() {
    Alert.alert('Report User', 'Why are you reporting this user?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Inappropriate content', onPress: () => { reportUser('Inappropriate content', session?.partner.username ?? ''); Alert.alert('Reported', 'Thank you. This conversation has been flagged for review.'); } },
      { text: 'Harassment', onPress: () => { reportUser('Harassment', session?.partner.username ?? ''); Alert.alert('Reported', 'Thank you. This conversation has been flagged for review.'); } },
      { text: 'Sharing personal info', onPress: () => { reportUser('Sharing personal info', session?.partner.username ?? ''); Alert.alert('Reported', 'Thank you. This conversation has been flagged for review.'); } },
    ]);
  }

  if (isMatching && !session) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.foreground }]}>Finding your match...</Text>
      </View>
    );
  }

  if (!session) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.foreground }]}>No active session.</Text>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/home')} style={[styles.backBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}>
          <Text style={styles.backBtnText}>Go Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { partner } = session;
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior="padding" keyboardVerticalOffset={0}>
      <View style={[styles.header, { paddingTop: topPad + 10, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <AvatarDisplay iconIndex={partner.iconIndex} colorIndex={partner.colorIndex} size={40} />
          <View>
            <Text style={[styles.partnerName, { color: colors.foreground }]}>{partner.username}</Text>
            <View style={styles.tagRow}>
              <View style={[styles.miniTag, { backgroundColor: colors.blueLight }]}>
                <Text style={[styles.miniTagText, { color: colors.primary }]}>{partner.mood}</Text>
              </View>
              <View style={[styles.miniTag, { backgroundColor: colors.purpleLight }]}>
                <Text style={[styles.miniTagText, { color: colors.purple }]}>{partner.personality}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.headerRight}>
          <View style={[styles.timer, { backgroundColor: colors.muted }]}>
            <Ionicons name="time-outline" size={12} color={colors.mutedForeground} />
            <Text style={[styles.timerText, { color: colors.mutedForeground }]}>{formatTime(elapsed)}</Text>
          </View>
          <View style={[styles.scoreBadge, { backgroundColor: colors.greenLight }]}>
            <Text style={[styles.scoreText, { color: colors.accent }]}>{partner.compatibilityScore}%</Text>
          </View>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={[...session.messages].reverse()}
        keyExtractor={item => item.id}
        inverted
        renderItem={({ item }) => (
          <MessageBubble message={item} onReact={(id, r) => reactToMessage(id, r)} />
        )}
        contentContainerStyle={{ paddingVertical: 12, paddingBottom: 8 }}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />

      {showGuide && (
        <BridgeGuidePanel
          isVisible={showGuide}
          onClose={() => setShowGuide(false)}
          onUseSuggestion={(s) => { setText(s); setShowGuide(false); inputRef.current?.focus(); }}
          messageCount={session.messages.length}
        />
      )}

      <View style={[styles.inputArea, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.actionBar}>
          <TouchableOpacity onPress={() => setShowGuide(!showGuide)} style={[styles.actionBarBtn, { backgroundColor: showGuide ? colors.blueLight : 'transparent' }]}>
            <Ionicons name="bulb-outline" size={20} color={showGuide ? colors.primary : colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleReport} style={styles.actionBarBtn}>
            <Ionicons name="flag-outline" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleEndChat} style={[styles.endBtn, { backgroundColor: '#FFF0F0', borderRadius: colors.radius }]}>
            <Ionicons name="exit-outline" size={16} color={colors.destructive} />
            <Text style={[styles.endBtnText, { color: colors.destructive }]}>End</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.inputRow, { backgroundColor: colors.muted, borderRadius: colors.radius }]}>
          <TextInput
            ref={inputRef}
            style={[styles.textInput, { color: colors.foreground }]}
            value={text}
            onChangeText={setText}
            placeholder="Type a message..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            maxLength={500}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!text.trim()}
            style={[styles.sendBtn, { backgroundColor: text.trim() ? colors.primary : colors.border, borderRadius: 18 }]}
          >
            <Ionicons name="send" size={18} color={text.trim() ? '#FFFFFF' : colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>

      <SafetyModal
        visible={safetyAlert !== 'none'}
        level={safetyAlert === 'crisis' ? 'crisis' : 'distress'}
        onDismiss={dismissSafetyAlert}
        onLeaveChat={() => { dismissSafetyAlert(); handleEndChat(); }}
        onTalkToAI={() => { dismissSafetyAlert(); setText("I need some support right now."); }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText: { fontSize: 16 },
  backBtn: { paddingHorizontal: 24, paddingVertical: 12 },
  backBtnText: { color: '#FFFFFF', fontWeight: '600' as const },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  partnerName: { fontSize: 15, fontWeight: '700' as const, marginBottom: 3 },
  tagRow: { flexDirection: 'row', gap: 6 },
  miniTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  miniTagText: { fontSize: 11, fontWeight: '600' as const },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timer: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  timerText: { fontSize: 12 },
  scoreBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  scoreText: { fontSize: 12, fontWeight: '700' as const },
  inputArea: { borderTopWidth: 1, paddingTop: 8, paddingHorizontal: 12 },
  actionBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 4 },
  actionBarBtn: { padding: 8, borderRadius: 20 },
  endBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, gap: 4, marginLeft: 'auto' },
  endBtnText: { fontSize: 13, fontWeight: '600' as const },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  textInput: { flex: 1, fontSize: 15, maxHeight: 100, lineHeight: 20 },
  sendBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
});
