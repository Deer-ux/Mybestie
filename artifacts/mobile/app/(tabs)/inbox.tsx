import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Platform, Share, Alert, TextInput, Modal, Clipboard,
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

type FilterTab = 'all' | MessageCategory | 'hidden';

const TABS: { id: FilterTab; label: string; emoji: string }[] = [
  { id: 'all',            label: 'All',           emoji: '📬' },
  { id: 'compliment',     label: 'Compliments',   emoji: '❤️' },
  { id: 'honest_opinion', label: 'Opinions',      emoji: '🎯' },
  { id: 'confession',     label: 'Confessions',   emoji: '🤫' },
  { id: 'question',       label: 'Questions',     emoji: '🤔' },
  { id: 'advice',         label: 'Advice',        emoji: '💡' },
  { id: 'encouragement',  label: 'Hype',          emoji: '✨' },
  { id: 'joke',           label: 'Jokes',         emoji: '😄' },
  { id: 'feedback',       label: 'Feedback',      emoji: '📝' },
  { id: 'secret',         label: 'Secrets',       emoji: '🔮' },
  { id: 'hidden',         label: 'Hidden',        emoji: '🔒' },
];

const CAT_COLORS: Record<string, string> = {
  compliment: '#E57373', honest_opinion: '#1F6F8B', confession: '#6C63FF',
  advice: '#F59E0B', question: '#0891B2', encouragement: '#4CAF50',
  feedback: '#A29BFE', secret: '#7C3AED', joke: '#F97316', other: '#6B7280',
};
const CAT_EMOJIS: Record<string, string> = {
  compliment: '❤️', honest_opinion: '🎯', confession: '🤫',
  advice: '💡', question: '🤔', encouragement: '✨',
  feedback: '📝', secret: '🔮', joke: '😄', other: '💬',
};

function formatTime(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export default function InboxScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const { messages, unreadCount, totalCount, markAsRead, saveMessage, deleteMessage, reportMessage, replyToMessage } = useInbox();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [replyModal, setReplyModal] = useState<{ id: string; open: boolean }>({ id: '', open: false });
  const [replyText, setReplyText] = useState('');
  const [copied, setCopied] = useState(false);

  const slug = user?.username?.toLowerCase().replace(/[^a-z0-9]/g, '') ?? '';
  const shareLink = `mindbridge.app/message/${slug}`;
  const shareUrl = `https://${shareLink}`;

  const visible = messages.filter(m => {
    if (activeTab === 'hidden') return m.moderationStatus === 'hidden' || m.isReported;
    if (activeTab === 'all') return m.moderationStatus === 'approved' && !m.isReported;
    return m.category === activeTab && m.moderationStatus === 'approved' && !m.isReported;
  });

  const approvedCount = messages.filter(m => m.moderationStatus === 'approved').length;

  async function handleShare() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Share.share({
      message: `Send me an anonymous message! You can say anything — I won't know it's you 👀\n\n${shareUrl}`,
      url: shareUrl,
    });
  }

  function handleCopy() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Clipboard.setString(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleViewMessage(msg: AnonymousMessage) { markAsRead(msg.id); }

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
    Alert.alert('Delete Message', 'Remove this message permanently?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMessage(id) },
    ]);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <BlobBackground variant="purple" />

      <LinearGradient colors={['#6C63FF', '#0B3C5D']} style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.headerTitle, { fontFamily: 'Poppins_700Bold' }]}>📬 Anonymous Status</Text>
            <Text style={[styles.headerSub, { fontFamily: 'Inter_400Regular' }]}>
              {unreadCount > 0 ? `${unreadCount} new · ${approvedCount} total` : `${approvedCount} messages received`}
            </Text>
          </View>
          {unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: '#E57373' }]}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        <GlassCard style={styles.linkCard} padding={14}>
          <View style={styles.linkRow}>
            <View style={[styles.linkIcon, { backgroundColor: 'rgba(108,99,255,0.15)' }]}>
              <Text style={{ fontSize: 20 }}>🔗</Text>
            </View>
            <View style={styles.linkInfo}>
              <Text style={[styles.linkLabel, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>Your anonymous link</Text>
              <Text style={[styles.linkSlug, { color: colors.accent, fontFamily: 'Inter_600SemiBold' }]} numberOfLines={1}>{shareLink}</Text>
            </View>
          </View>
          <View style={styles.linkBtns}>
            <TouchableOpacity
              onPress={handleCopy}
              style={[styles.linkBtn, { backgroundColor: copied ? colors.safeGreenLight : colors.muted, borderRadius: 10 }]}
            >
              <Text style={{ fontSize: 15 }}>{copied ? '✅' : '📋'}</Text>
              <Text style={[styles.linkBtnText, { color: copied ? colors.safeGreen : colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
                {copied ? 'Copied!' : 'Copy'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleShare}
              style={[styles.linkBtn, { backgroundColor: colors.accent, borderRadius: 10, flex: 1.5 }]}
            >
              <Text style={{ fontSize: 15 }}>📤</Text>
              <Text style={[styles.linkBtnText, { color: '#FFFFFF', fontFamily: 'Inter_600SemiBold' }]}>Share on WhatsApp / Status</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/send-message', params: { slug } })}
            style={[styles.previewBtn, { borderRadius: 10, borderColor: colors.border }]}
          >
            <Text style={{ fontSize: 14 }}>👁️</Text>
            <Text style={[styles.previewBtnText, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>Preview your public page</Text>
          </TouchableOpacity>
        </GlassCard>
      </LinearGradient>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}
        contentContainerStyle={{ paddingHorizontal: 8 }}
      >
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab(tab.id); }}
            style={[styles.tab, {
              borderBottomWidth: activeTab === tab.id ? 2.5 : 0,
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

      <ScrollView
        style={styles.list}
        contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: botPad + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {visible.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>{activeTab === 'hidden' ? '🔒' : '📭'}</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: 'Poppins_600SemiBold' }]}>
              {activeTab === 'hidden' ? 'No hidden messages' : 'No messages here yet'}
            </Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              {activeTab === 'hidden'
                ? 'Messages that violate our safety rules appear here.'
                : 'Share your link on WhatsApp status, Instagram bio, or anywhere to start receiving messages.'}
            </Text>
            {activeTab === 'all' && (
              <TouchableOpacity
                onPress={handleShare}
                style={[styles.emptyShareBtn, { backgroundColor: colors.accent, borderRadius: colors.radius }]}
              >
                <Text style={[styles.emptyShareText, { color: '#FFFFFF', fontFamily: 'Inter_600SemiBold' }]}>📤 Share Your Link Now</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : visible.map((msg, i) => (
          <Animated.View key={msg.id} entering={FadeInDown.delay(i * 50)}>
            <TouchableOpacity onPress={() => handleViewMessage(msg)} activeOpacity={0.9}>
              <GlassCard
                style={[styles.msgCard, !msg.isRead && msg.moderationStatus === 'approved' && { borderLeftWidth: 3, borderLeftColor: CAT_COLORS[msg.category] ?? colors.accent }]}
                padding={14}
              >
                {msg.moderationStatus === 'hidden' ? (
                  <View style={styles.hiddenMsg}>
                    <Text style={{ fontSize: 18 }}>🔒</Text>
                    <Text style={[styles.hiddenText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                      This message was hidden because it may be unsafe.
                    </Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.msgTop}>
                      <View style={[styles.catBadge, { backgroundColor: (CAT_COLORS[msg.category] ?? '#6B7280') + '18', borderRadius: 10 }]}>
                        <Text style={{ fontSize: 13 }}>{CAT_EMOJIS[msg.category] ?? '💬'}</Text>
                        <Text style={[styles.catText, { color: CAT_COLORS[msg.category] ?? '#6B7280', fontFamily: 'Inter_600SemiBold' }]}>
                          {msg.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Text>
                      </View>
                      <Text style={[styles.msgTime, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                        {formatTime(msg.timestamp)}
                      </Text>
                    </View>

                    <Text style={[styles.msgContent, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}>
                      {msg.content}
                    </Text>

                    {msg.isSaved && (
                      <View style={[styles.savedBadge, { backgroundColor: colors.lavenderLight }]}>
                        <Text style={{ fontSize: 11 }}>🔖</Text>
                        <Text style={[styles.savedText, { color: colors.accent, fontFamily: 'Inter_500Medium' }]}>Saved</Text>
                      </View>
                    )}

                    {msg.publicReply && (
                      <View style={[styles.replyWrap, { backgroundColor: colors.safeGreenLight, borderRadius: 8 }]}>
                        <Text style={{ fontSize: 12 }}>✨</Text>
                        <Text style={[styles.replyText, { color: colors.safeGreen, fontFamily: 'Inter_400Regular' }]} numberOfLines={2}>
                          Your reply: {msg.publicReply}
                        </Text>
                      </View>
                    )}

                    <View style={styles.msgActions}>
                      <TouchableOpacity
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); saveMessage(msg.id); }}
                        style={[styles.actionBtn, { backgroundColor: msg.isSaved ? colors.lavenderLight : colors.muted, borderRadius: 8 }]}
                      >
                        <Text style={{ fontSize: 13 }}>🔖</Text>
                        <Text style={[styles.actionText, { color: msg.isSaved ? colors.accent : colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
                          {msg.isSaved ? 'Saved' : 'Save'}
                        </Text>
                      </TouchableOpacity>
                      {!msg.publicReply ? (
                        <TouchableOpacity
                          onPress={() => handleReply(msg.id)}
                          style={[styles.actionBtn, { backgroundColor: colors.safeGreenLight, borderRadius: 8 }]}
                        >
                          <Text style={{ fontSize: 13 }}>💬</Text>
                          <Text style={[styles.actionText, { color: colors.safeGreen, fontFamily: 'Inter_500Medium' }]}>Reply</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          onPress={() => handleReply(msg.id)}
                          style={[styles.actionBtn, { backgroundColor: colors.muted, borderRadius: 8 }]}
                        >
                          <Text style={{ fontSize: 13 }}>✏️</Text>
                          <Text style={[styles.actionText, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>Edit Reply</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        onPress={() => confirmDelete(msg.id)}
                        style={[styles.actionBtn, { backgroundColor: '#FFF0F0', borderRadius: 8 }]}
                      >
                        <Text style={{ fontSize: 13 }}>🗑️</Text>
                        <Text style={[styles.actionText, { color: colors.destructive, fontFamily: 'Inter_500Medium' }]}>Delete</Text>
                      </TouchableOpacity>
                      {!msg.isReported && (
                        <TouchableOpacity
                          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); reportMessage(msg.id); }}
                          style={[styles.actionBtn, { backgroundColor: colors.muted, borderRadius: 8 }]}
                        >
                          <Ionicons name="flag-outline" size={13} color={colors.mutedForeground} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </>
                )}
              </GlassCard>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>

      <Modal visible={replyModal.open} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.background, paddingBottom: botPad + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: 'Poppins_600SemiBold' }]}>Reply Publicly ✨</Text>
              <TouchableOpacity onPress={() => setReplyModal({ id: '', open: false })}>
                <Ionicons name="close" size={22} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalNote, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              Your reply is posted anonymously. The sender remains unknown to you.
            </Text>
            <View style={[styles.replyInput, { borderColor: colors.border, borderRadius: colors.radius - 4 }]}>
              <TextInput
                style={[styles.replyInputText, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
                value={replyText}
                onChangeText={setReplyText}
                placeholder="Write your public reply..."
                placeholderTextColor={colors.mutedForeground}
                multiline maxLength={300} autoFocus
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
  header: { paddingHorizontal: 18, paddingBottom: 18, gap: 14 },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  headerTitle: { color: '#FFFFFF', fontSize: 21 },
  headerSub: { color: 'rgba(255,255,255,0.72)', fontSize: 13, marginTop: 3 },
  badge: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  badgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' as const },
  linkCard: { gap: 10 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  linkIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  linkInfo: { flex: 1 },
  linkLabel: { fontSize: 11, marginBottom: 2 },
  linkSlug: { fontSize: 13 },
  linkBtns: { flexDirection: 'row', gap: 8 },
  linkBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 5 },
  linkBtnText: { fontSize: 12 },
  previewBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 9, gap: 7, borderWidth: 1 },
  previewBtnText: { fontSize: 13 },
  tabBar: { borderBottomWidth: 1, maxHeight: 52 },
  tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 13, gap: 5 },
  tabText: { fontSize: 12 },
  list: { flex: 1 },
  emptyWrap: { alignItems: 'center', paddingTop: 52, gap: 12, paddingHorizontal: 20 },
  emptyEmoji: { fontSize: 58 },
  emptyTitle: { fontSize: 18, textAlign: 'center' },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 21 },
  emptyShareBtn: { paddingHorizontal: 22, paddingVertical: 13, marginTop: 6 },
  emptyShareText: { fontSize: 15 },
  msgCard: { gap: 10 },
  hiddenMsg: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  hiddenText: { flex: 1, fontSize: 13, lineHeight: 19, fontStyle: 'italic' as const },
  msgTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  catBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4 },
  catText: { fontSize: 12 },
  msgTime: { fontSize: 11 },
  msgContent: { fontSize: 14, lineHeight: 22 },
  savedBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  savedText: { fontSize: 12 },
  replyWrap: { flexDirection: 'row', alignItems: 'flex-start', padding: 8, gap: 6 },
  replyText: { flex: 1, fontSize: 12, lineHeight: 17 },
  msgActions: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 7, gap: 4 },
  actionText: { fontSize: 12 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
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
