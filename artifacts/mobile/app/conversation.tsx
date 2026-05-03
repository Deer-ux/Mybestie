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
import { useColors } from '@/hooks/useColors';
import AvatarDisplay from '@/components/AvatarDisplay';
import MessageBubble from '@/components/MessageBubble';
import SafetyModal from '@/components/SafetyModal';
import BridgeGuidePanel from '@/components/BridgeGuidePanel';
import { MOODS } from '@/utils/helpers';

export default function ConversationScreen() {
  const colors = useColors();
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
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <Text style={{ fontSize: 48 }}>💬</Text>
        <Text style={[styles.emptyTitle, { color: colors.primary, fontFamily: 'Poppins_600SemiBold' }]}>No active conversation</Text>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/home')} style={[styles.homeBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}>
          <Text style={[styles.homeBtnText, { fontFamily: 'Inter_600SemiBold' }]}>Go Home</Text>
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
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior="padding">
      <LinearGradient colors={['#0B3C5D', '#1F6F8B']} style={[styles.header, { paddingTop: topPad + 10 }]}>
        <View style={styles.headerLeft}>
          <AvatarDisplay iconIndex={partner.iconIndex} colorIndex={partner.colorIndex} size={42} showRing />
          <View>
            <Text style={[styles.partnerName, { color: '#FFFFFF', fontFamily: 'Poppins_600SemiBold' }]}>{partner.username}</Text>
            <View style={styles.partnerMeta}>
              <Text style={styles.metaChip}>{partnerMoodEmoji} {partner.mood}</Text>
              <Text style={styles.metaDot}>·</Text>
              <View style={[styles.safetyDot, { backgroundColor: colors.safeGreen }]} />
              <Text style={styles.safetyLabel}>Safe</Text>
            </View>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.timerPill, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <Text style={styles.timerText}>{formatTime(elapsed)}</Text>
          </View>
          <View style={[styles.scorePill, { backgroundColor: colors.safeGreen }]}>
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

      <View style={[styles.inputArea, { backgroundColor: colors.glass, borderTopColor: colors.border, paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.actionRow}>
          <TouchableOpacity onPress={() => setShowGuide(v => !v)} style={[styles.iconBtn, { backgroundColor: showGuide ? colors.lavenderLight : colors.muted }]}>
            <Text style={{ fontSize: 18 }}>✨</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleReport} style={[styles.iconBtn, { backgroundColor: colors.muted }]}>
            <Ionicons name="flag-outline" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleEnd} style={[styles.endBtn, { backgroundColor: '#FFF0F0', borderRadius: colors.radius - 4 }]}>
            <Ionicons name="exit-outline" size={16} color={colors.destructive} />
            <Text style={[styles.endBtnText, { color: colors.destructive, fontFamily: 'Inter_600SemiBold' }]}>End</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.inputRow, { backgroundColor: colors.muted, borderRadius: colors.radius }]}>
          <TextInput
            ref={inputRef}
            style={[styles.textInput, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
            value={text}
            onChangeText={setText}
            placeholder="Type a message..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!text.trim()}
            style={[styles.sendBtn, { backgroundColor: text.trim() ? colors.primary : colors.border, borderRadius: 18 }]}
          >
            <Ionicons name="send" size={17} color={text.trim() ? '#FFFFFF' : colors.mutedForeground} />
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
  container: { flex: 1 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  emptyTitle: { fontSize: 18 },
  homeBtn: { paddingHorizontal: 28, paddingVertical: 14 },
  homeBtnText: { color: '#FFFFFF', fontSize: 15 },
  header: { paddingHorizontal: 16, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  partnerName: { fontSize: 15, marginBottom: 3 },
  partnerMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaChip: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  metaDot: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  safetyDot: { width: 6, height: 6, borderRadius: 3 },
  safetyLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 12 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timerPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  timerText: { color: '#FFFFFF', fontSize: 12 },
  scorePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  scoreText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' as const },
  inputArea: { borderTopWidth: 1, paddingTop: 8, paddingHorizontal: 12 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  endBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, gap: 5, marginLeft: 'auto' },
  endBtnText: { fontSize: 13 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  textInput: { flex: 1, fontSize: 15, maxHeight: 100, lineHeight: 20 },
  sendBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
});
