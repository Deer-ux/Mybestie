import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  TextInput, Platform, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import * as Haptics from 'expo-haptics';
import { useChat } from '@/context/ChatContext';
import { useApp } from '@/context/AppContext';
import AvatarDisplay from '@/components/AvatarDisplay';
import MessageBubble from '@/components/MessageBubble';
import SafetyModal from '@/components/SafetyModal';
import BridgeGuidePanel from '@/components/BridgeGuidePanel';
import { MOODS } from '@/utils/helpers';

export default function ConversationScreen() {
  const insets = useSafeAreaInsets();
  const { session, safetyAlert, sendMessage, reactToMessage, endChat, reportUser, dismissSafetyAlert } = useChat();
  const { user, isTeenMode, incrementChats, addBadge } = useApp();

  const [text, setText] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const secondsRef = useRef(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => { secondsRef.current += 1; setElapsed(secondsRef.current); }, 1000);
    return () => clearInterval(t);
  }, []);

  if (!session) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={{ fontSize: 48 }}>💬</Text>
        <Text style={styles.emptyTitle}>No active conversation</Text>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/home')} style={styles.homeBtn}>
          <Text style={styles.homeBtnText}>Go Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { partner } = session;
  const partnerMoodEmoji = MOODS.find(m => m.id === partner.mood)?.emoji ?? '😊';
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  function formatTime(s: number) {
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  }

  function handleSend() {
    const t = text.trim();
    if (!t) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    sendMessage(t);
    setText('');
  }

  async function handleEnd() {
    Alert.alert('End Conversation', 'Are you sure you want to end this conversation?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Chat', style: 'destructive', onPress: async () => {
          endChat();
          await incrementChats();
          if (session.messages.length > 5) await addBadge('good_listener');
          router.replace('/feedback');
        },
      },
    ]);
  }

  function handleReport() {
    Alert.alert('Report', 'Why are you reporting this user?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Inappropriate content', onPress: () => reportUser('Inappropriate content', partner.username) },
      { text: 'Harassment', onPress: () => reportUser('Harassment', partner.username) },
      { text: 'Sharing personal info', onPress: () => reportUser('Sharing personal info', partner.username) },
    ]);
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <LinearGradient colors={['#0B0B0F', '#1A0B2E']} style={[styles.header, { paddingTop: topPad + 10 }]}>
        <View style={styles.headerLeft}>
          <AvatarDisplay iconIndex={partner.iconIndex} colorIndex={partner.colorIndex} size={42} showRing />
          <View>
            <Text style={styles.partnerName}>{partner.username}</Text>
            <View style={styles.partnerMeta}>
              <Text style={styles.metaChip}>{partnerMoodEmoji} {partner.mood}</Text>
              <Text style={styles.metaDot}>·</Text>
              <View style={[styles.safetyDot, { backgroundColor: '#00FF88' }]} />
              <Text style={styles.safetyLabel}>Safe</Text>
            </View>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.timerPill}>
            <Text style={styles.timerText}>{formatTime(elapsed)}</Text>
          </View>
          <View style={[styles.scorePill, { backgroundColor: '#FF2D95' }]}>
            <Text style={styles.scoreText}>{partner.compatibilityScore}%</Text>
          </View>
        </View>
      </LinearGradient>

      <FlatList
        data={[...session.messages].reverse()}
        keyExtractor={item => item.id}
        inverted
        renderItem={({ item }) => (
          <MessageBubble message={item} onReact={reactToMessage} />
        )}
        contentContainerStyle={{ paddingVertical: 12 }}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListFooterComponent={<View style={{ height: 8 }} />}
      />

      {showGuide && (
        <BridgeGuidePanel
          isVisible
          onClose={() => setShowGuide(false)}
          onUseSuggestion={s => { setText(s); setShowGuide(false); inputRef.current?.focus(); }}
          messageCount={session.messages.length}
        />
      )}

      <View style={[styles.inputArea, { paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.actionRow}>
          <TouchableOpacity onPress={() => setShowGuide(v => !v)} style={[styles.iconBtn, { backgroundColor: showGuide ? 'rgba(255,45,149,0.18)' : 'rgba(255,255,255,0.07)' }]}>
            <Text style={{ fontSize: 18 }}>✨</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleReport} style={[styles.iconBtn, { backgroundColor: 'rgba(255,255,255,0.07)' }]}>
            <Ionicons name="flag-outline" size={18} color="rgba(255,255,255,0.45)" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleEnd} style={styles.endBtn}>
            <Ionicons name="exit-outline" size={16} color="#FF4455" />
            <Text style={styles.endBtnText}>End</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.inputRow}>
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            value={text}
            onChangeText={setText}
            placeholder="Type a message..."
            placeholderTextColor="rgba(255,255,255,0.30)"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!text.trim()}
            style={[styles.sendBtn2, { opacity: text.trim() ? 1 : 0.3 }]}
          >
            <LinearGradient colors={['#FF2D95', '#7B2CFF']} style={styles.sendGrad}>
              <Ionicons name="send" size={17} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      <SafetyModal
        visible={safetyAlert !== 'none'}
        level={safetyAlert === 'crisis' ? 'crisis' : 'distress'}
        isTeenMode={isTeenMode}
        onDismiss={dismissSafetyAlert}
        onLeaveChat={() => { dismissSafetyAlert(); handleEnd(); }}
        onTalkToAI={() => { dismissSafetyAlert(); setText('I need some support right now.'); }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, backgroundColor: '#050505' },
  emptyTitle: { fontSize: 18, color: '#FFFFFF', fontFamily: 'SpaceGrotesk_600SemiBold' },
  homeBtn: { paddingHorizontal: 28, paddingVertical: 14, backgroundColor: '#FF2D95', borderRadius: 20 },
  homeBtnText: { color: '#FFFFFF', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  header: { paddingHorizontal: 16, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  partnerName: { color: '#FFFFFF', fontSize: 15, fontFamily: 'SpaceGrotesk_600SemiBold', marginBottom: 3 },
  partnerMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaChip: { color: 'rgba(255,255,255,0.65)', fontSize: 12, fontFamily: 'Inter_400Regular' },
  metaDot: { color: 'rgba(255,255,255,0.30)', fontSize: 12 },
  safetyDot: { width: 6, height: 6, borderRadius: 3 },
  safetyLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 12, fontFamily: 'Inter_400Regular' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timerPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.09)' },
  timerText: { color: '#FFFFFF', fontSize: 12, fontFamily: 'Inter_500Medium' },
  scorePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  scoreText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' as const },
  inputArea: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)', paddingTop: 8, paddingHorizontal: 12, backgroundColor: '#0B0B0F' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  endBtn: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, gap: 5, marginLeft: 'auto' as const,
    backgroundColor: 'rgba(255,68,85,0.12)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,68,85,0.25)',
  },
  endBtnText: { fontSize: 13, color: '#FF4455', fontFamily: 'Inter_600SemiBold' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 8, gap: 8,
    borderWidth: 1, borderColor: 'rgba(255,45,149,0.25)',
  },
  textInput: { flex: 1, fontSize: 15, maxHeight: 100, lineHeight: 20, color: '#FFFFFF', fontFamily: 'Inter_400Regular' },
  sendBtn2: { borderRadius: 18, overflow: 'hidden' as const },
  sendGrad: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
});
