import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Platform, Share, Alert, TextInput, Modal,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import { useInbox, AnonymousMessage, MessageCategory } from '@/context/InboxContext';
import { useColors } from '@/hooks/useColors';
import GlassCard from '@/components/GlassCard';
import BlobBackground from '@/components/BlobBackground';

type Tab = 'all' | MessageCategory;

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'all', label: 'All', emoji: '📬' },
  { id: 'compliment', label: 'Compliments', emoji: '❤️' },
  { id: 'question', label: 'Questions', emoji: '🤔' },
  { id: 'advice', label: 'Advice', emoji: '💡' },
  { id: 'encouragement', label: 'Encouragement', emoji: '✨' },
  { id: 'reported', label: 'Reported', emoji: '🚩' },
];

const CAT_COLORS: Record<string, string> = {
  compliment: '#E57373', advice: '#F59E0B', confession: '#6C63FF',
  question: '#1F6F8B', encouragement: '#4CAF50', feedback: '#A29BFE',
  secret: '#0B3C5D', other: '#6B7280',
};
const CAT_EMOJIS: Record<string, string> = {
  compliment: '❤️', advice: '💡', confession: '🤫',
  question: '🤔', encouragement: '✨', feedback: '📝',
  secret: '🔒', other: '💬',
};

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export default function InboxScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const { messages, unreadCount, markAsRead, saveMessage, deleteMessage, reportMessage, replyToMessage } = useInbox();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [replyModal, setReplyModal] = useState<{ id: string; open: boolean }>({ id: '', open: false });
  const [replyText, setReplyText] = useState('');

  const slug = user?.username?.toLowerCase().replace(/[^a-z0-9]/g, '') ?? 'mylink';
  const shareLink = `mindbridge.app/message/${slug}`;

  const filtered = messages.filter(m => {
    if (activeTab === 'reported') return m.isReported;
    if (activeTab === 'all') return !m.isReported && m.moderationStatus !== 'blocked';
    return m.category === activeTab && !m.isReported && m.moderationStatus !== 'blocked';
  });

  async function handleShare() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Share.share({ message: `Send me an anonymous message on MindBridge!\n${shareLink}`, url: `https://${shareLink}` });
  }

  function handleViewMessage(msg: AnonymousMessage) {
    markAsRead(msg.id);
  }

  function handleReply(id: string) {
    setReplyModal({ id, open: true });
    setReplyText('');
  }

  function submitReply() {
    if (!replyText.trim()) return;
    replyToMessage(replyModal.id, replyText.trim());
    setReplyModal({ id: '', open: false });
    setReplyText('');
  }

  function confirmDelete(id: string) {
    Alert.alert('Delete Message', 'Remove this message from your inbox?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMessage(id) },
    ]);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <BlobBackground variant="purple" />
      <LinearGradient colors={['#6C63FF', '#A29BFE']} style={[styles.header, { paddingTop: topPad + 20 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.headerTitle, { fontFamily: 'Poppins_700Bold' }]}>📬 Anonymous Inbox</Text>
            <Text style={[styles.headerSub, { fontFamily: 'Inter_400Regular' }]}>
              {unreadCount > 0 ? `${unreadCount} new message${unreadCount > 1 ? 's' : ''}` : 'You\'re all caught up ✨'}
            </Text>
          </View>
          {unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.destructive }]}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        <GlassCard style={styles.linkCard} padding={14}>
          <View style={styles.linkRow}>
            <Text style={{ fontSize: 18 }}>🔗</Text>
            <View style={styles.linkInfo}>
              <Text style={[styles.linkLabel, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>Your anonymous link</Text>
              <Text style={[styles.linkSlug, { color: colors.accent, fontFamily: 'Inter_600SemiBold' }]} numberOfLines={1}>{shareLink}</Text>
            </View>
          </View>
          <View style={styles.linkActions}>
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/send-message', params: { slug } })}
              style={[styles.linkBtn, { backgroundColor: colors.lavenderLight, borderRadius: 8 }]}
            >
              <Text style={{ fontSize: 14 }}>👁️</Text>
              <Text style={[styles.linkBtnText, { color: colors.accent, fontFamily: 'Inter_600SemiBold' }]}>Preview</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleShare}
              style={[styles.linkBtn, { backgroundColor: colors.accent, borderRadius: 8 }]}
            >
              <Text style={{ fontSize: 14 }}>📤</Text>
              <Text style={[styles.linkBtnText, { color: '#FFFFFF', fontFamily: 'Inter_600SemiBold' }]}>Share</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
      </LinearGradient>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.tabBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab(tab.id); }}
            style={[styles.tab, {
              borderBottomWidth: activeTab === tab.id ? 2 : 0,
              borderBottomColor: colors.accent,
            }]}
          >
            <Text style={{ fontSize: 14 }}>{tab.emoji}</Text>
            <Text style={[styles.tabText, {
              color: activeTab === tab.id ? colors.accent : colors.mutedForeground,
              fontFamily: activeTab === tab.id ? 'Inter_600SemiBold' : 'Inter_400Regular',
            }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.messageList} contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: 'Poppins_600SemiBold' }]}>No messages here yet</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              Share your anonymous link to receive messages from anyone.
            </Text>
            <TouchableOpacity
              onPress={handleShare}
              style={[styles.emptyShareBtn, { backgroundColor: colors.lavenderLight, borderRadius: colors.radius }]}
            >
              <Text style={[styles.emptyShareText, { color: colors.accent, fontFamily: 'Inter_600SemiBold' }]}>📤 Share Your Link</Text>
            </TouchableOpacity>
          </View>
        ) : filtered.map((msg, i) => (
          <Animated.View key={msg.id} entering={FadeInDown.delay(i * 60)}>
            <TouchableOpacity onPress={() => handleViewMessage(msg)} activeOpacity={0.92}>
              <GlassCard style={[styles.msgCard, !msg.isRead && { borderLeftWidth: 3, borderLeftColor: colors.accent }]} padding={14}>
                <View style={styles.msgTop}>
                  <View style={[styles.catBadge, { backgroundColor: (CAT_COLORS[msg.category] ?? '#6B7280') + '18', borderRadius: 10 }]}>
                    <Text style={{ fontSize: 13 }}>{CAT_EMOJIS[msg.category] ?? '💬'}</Text>
                    <Text style={[styles.catText, { color: CAT_COLORS[msg.category] ?? '#6B7280', fontFamily: 'Inter_600SemiBold' }]}>
                      {msg.category.charAt(0).toUpperCase() + msg.category.slice(1)}
                    </Text>
                  </View>
                  <Text style={[styles.msgTime, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                    {formatTime(msg.timestamp)}
                  </Text>
                </View>

                <Text style={[styles.msgContent, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]} numberOfLines={3}>
                  {msg.content}
                </Text>

                {msg.publicReply && (
                  <View style={[styles.replyWrap, { backgroundColor: colors.lavenderLight, borderRadius: 8 }]}>
                    <Text style={{ fontSize: 12 }}>✨</Text>
                    <Text style={[styles.replyText, { color: colors.accent, fontFamily: 'Inter_400Regular' }]} numberOfLines={2}>
                      You replied: {msg.publicReply}
                    </Text>
                  </View>
                )}

                <View style={styles.msgActions}>
                  <TouchableOpacity onPress={() => saveMessage(msg.id)} style={[styles.actionBtn, { backgroundColor: msg.isSaved ? colors.lavenderLight : colors.muted, borderRadius: 8 }]}>
                    <Text style={{ fontSize: 13 }}>{msg.isSaved ? '🔖' : '🔖'}</Text>
                    <Text style={[styles.actionText, { color: msg.isSaved ? colors.accent : colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
                      {msg.isSaved ? 'Saved' : 'Save'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleReply(msg.id)} style={[styles.actionBtn, { backgroundColor: colors.safeGreenLight, borderRadius: 8 }]}>
                    <Text style={{ fontSize: 13 }}>💬</Text>
                    <Text style={[styles.actionText, { color: colors.safeGreen, fontFamily: 'Inter_500Medium' }]}>Reply</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => confirmDelete(msg.id)} style={[styles.actionBtn, { backgroundColor: '#FFF0F0', borderRadius: 8 }]}>
                    <Text style={{ fontSize: 13 }}>🗑️</Text>
                    <Text style={[styles.actionText, { color: colors.destructive, fontFamily: 'Inter_500Medium' }]}>Delete</Text>
                  </TouchableOpacity>
                  {!msg.isReported && (
                    <TouchableOpacity onPress={() => reportMessage(msg.id)} style={[styles.actionBtn, { backgroundColor: colors.muted, borderRadius: 8 }]}>
                      <Ionicons name="flag-outline" size={13} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  )}
                </View>
              </GlassCard>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>

      <Modal visible={replyModal.open} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.background, paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: 'Poppins_600SemiBold' }]}>Reply Publicly</Text>
              <TouchableOpacity onPress={() => setReplyModal({ id: '', open: false })}>
                <Ionicons name="close" size={22} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalNote, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              Your reply will be shown as your public anonymous response. The sender may see it.
            </Text>
            <View style={[styles.replyInput, { borderColor: colors.border, borderRadius: colors.radius - 4 }]}>
              <TextInput
                style={[styles.replyInputText, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
                value={replyText}
                onChangeText={setReplyText}
                placeholder="Write your public reply..."
                placeholderTextColor={colors.mutedForeground}
                multiline
                maxLength={300}
                autoFocus
              />
            </View>
            <TouchableOpacity
              onPress={submitReply}
              disabled={!replyText.trim()}
              style={[styles.replySubmitBtn, { borderRadius: colors.radius, opacity: replyText.trim() ? 1 : 0.4 }]}
            >
              <LinearGradient colors={['#6C63FF', '#A29BFE']} style={styles.replySubmitGrad}>
                <Text style={[styles.replySubmitText, { fontFamily: 'Inter_600SemiBold' }]}>Post Reply</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20, gap: 16 },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  headerTitle: { color: '#FFFFFF', fontSize: 22 },
  headerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 4 },
  badge: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  badgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' as const },
  linkCard: { gap: 12 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  linkInfo: { flex: 1 },
  linkLabel: { fontSize: 11 },
  linkSlug: { fontSize: 14 },
  linkActions: { flexDirection: 'row', gap: 8 },
  linkBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 9, gap: 5 },
  linkBtnText: { fontSize: 13 },
  tabBar: { borderBottomWidth: 1, maxHeight: 50 },
  tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 5 },
  tabText: { fontSize: 13 },
  messageList: { flex: 1 },
  emptyWrap: { alignItems: 'center', paddingTop: 48, gap: 12 },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: 18 },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
  emptyShareBtn: { paddingHorizontal: 20, paddingVertical: 12, marginTop: 8 },
  emptyShareText: { fontSize: 14 },
  msgCard: { gap: 10 },
  msgTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  catBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3 },
  catText: { fontSize: 12 },
  msgTime: { fontSize: 11 },
  msgContent: { fontSize: 14, lineHeight: 21 },
  replyWrap: { flexDirection: 'row', alignItems: 'flex-start', padding: 8, gap: 6 },
  replyText: { flex: 1, fontSize: 12, lineHeight: 17 },
  msgActions: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, gap: 4 },
  actionText: { fontSize: 12 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 14 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { fontSize: 17 },
  modalNote: { fontSize: 13, lineHeight: 19 },
  replyInput: { borderWidth: 1, padding: 12, minHeight: 80 },
  replyInputText: { fontSize: 14, lineHeight: 21 },
  replySubmitBtn: { overflow: 'hidden' as const },
  replySubmitGrad: { paddingVertical: 14, alignItems: 'center' },
  replySubmitText: { color: '#FFFFFF', fontSize: 15 },
});
