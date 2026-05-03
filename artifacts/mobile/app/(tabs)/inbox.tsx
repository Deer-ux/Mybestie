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
import { trackEvent } from '@/utils/analytics';
import { useEffect } from 'react';
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
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const { messages, unreadCount, totalCount, markAsRead, saveMessage, deleteMessage, reportMessage, replyToMessage } = useInbox();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [replyModal, setReplyModal] = useState<{ id: string; open: boolean }>({ id: '', open: false });
  const [replyText, setReplyText] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => { trackEvent('inbox_opened', user?.id); }, []);

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
    trackEvent('link_shared', user?.id);
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
    <View style={styles.container}>
      <BlobBackground variant="purple" />

      <LinearGradient colors={['#0B0B0F', '#1A0B2E']} style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>📬 Anonymous Inbox</Text>
            <Text style={styles.headerSub}>
              {unreadCount > 0 ? `${unreadCount} new · ${approvedCount} total` : `${approvedCount} messages received`}
            </Text>
          </View>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        <GlassCard style={styles.linkCard} padding={14}>
          <View style={styles.linkRow}>
            <View style={styles.linkIcon}>
              <Text style={{ fontSize: 20 }}>🔗</Text>
            </View>
            <View style={styles.linkInfo}>
              <Text style={styles.linkLabel}>Your anonymous link</Text>
              <Text style={styles.linkSlug} numberOfLines={1}>{shareLink}</Text>
            </View>
          </View>
          <View style={styles.linkBtns}>
            <TouchableOpacity
              onPress={handleCopy}
              style={[styles.linkBtn, { backgroundColor: copied ? 'rgba(0,255,136,0.12)' : 'rgba(255,255,255,0.07)', borderRadius: 10 }]}
            >
              <Text style={{ fontSize: 15 }}>{copied ? '✅' : '📋'}</Text>
              <Text style={[styles.linkBtnText, { color: copied ? '#00FF88' : '#FFFFFF' }]}>
                {copied ? 'Copied!' : 'Copy'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleShare}
              style={[styles.linkBtnShare, { flex: 1.5, borderRadius: 10 }]}
            >
              <LinearGradient colors={['#FF2D95', '#7B2CFF']} style={styles.linkBtnShareGrad}>
                <Text style={{ fontSize: 15 }}>📤</Text>
                <Text style={styles.linkBtnShareText}>Share on WhatsApp / Status</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/send-message', params: { slug } })}
            style={styles.previewBtn}
          >
            <Text style={{ fontSize: 14 }}>👁️</Text>
            <Text style={styles.previewBtnText}>Preview your public page</Text>
          </TouchableOpacity>
        </GlassCard>
      </LinearGradient>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
        contentContainerStyle={{ paddingHorizontal: 8 }}
      >
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab(tab.id); }}
            style={[styles.tab, {
              borderBottomWidth: activeTab === tab.id ? 2.5 : 0,
              borderBottomColor: '#FF2D95',
            }]}
          >
            <Text style={{ fontSize: 14 }}>{tab.emoji}</Text>
            <Text style={[styles.tabText, {
              color: activeTab === tab.id ? '#FF2D95' : 'rgba(255,255,255,0.45)',
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
            <Text style={styles.emptyTitle}>
              {activeTab === 'hidden' ? 'No hidden messages' : 'No messages here yet'}
            </Text>
            <Text style={styles.emptySub}>
              {activeTab === 'hidden'
                ? 'Messages that violate our safety rules appear here.'
                : 'Share your link on WhatsApp status, Instagram bio, or anywhere to start receiving messages.'}
            </Text>
            {activeTab === 'all' && (
              <TouchableOpacity
                onPress={handleShare}
                style={styles.emptyShareBtn}
              >
                <LinearGradient colors={['#FF2D95', '#7B2CFF']} style={styles.emptyShareGrad}>
                  <Text style={styles.emptyShareText}>📤 Share Your Link Now</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        ) : visible.map((msg, i) => (
          <Animated.View key={msg.id} entering={FadeInDown.delay(i * 50)}>
            <TouchableOpacity onPress={() => handleViewMessage(msg)} activeOpacity={0.9}>
              <GlassCard
                style={[styles.msgCard, !msg.isRead && msg.moderationStatus === 'approved' && { borderLeftWidth: 3, borderLeftColor: CAT_COLORS[msg.category] ?? '#00D4FF' }]}
                padding={14}
              >
                {msg.moderationStatus === 'hidden' ? (
                  <View style={styles.hiddenMsg}>
                    <Text style={{ fontSize: 18 }}>🔒</Text>
                    <Text style={styles.hiddenText}>This message was hidden because it may be unsafe.</Text>
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
                      <Text style={styles.msgTime}>{formatTime(msg.timestamp)}</Text>
                    </View>

                    <Text style={styles.msgContent}>{msg.content}</Text>

                    {msg.isSaved && (
                      <View style={styles.savedBadge}>
                        <Text style={{ fontSize: 11 }}>🔖</Text>
                        <Text style={styles.savedText}>Saved</Text>
                      </View>
                    )}

                    {msg.publicReply && (
                      <View style={styles.replyWrap}>
                        <Text style={{ fontSize: 12 }}>✨</Text>
                        <Text style={styles.replyText} numberOfLines={2}>
                          Your reply: {msg.publicReply}
                        </Text>
                      </View>
                    )}

                    <View style={styles.msgActions}>
                      <TouchableOpacity
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); saveMessage(msg.id); }}
                        style={[styles.actionBtn, { backgroundColor: msg.isSaved ? 'rgba(255,45,149,0.12)' : 'rgba(255,255,255,0.07)' }]}
                      >
                        <Text style={{ fontSize: 13 }}>🔖</Text>
                        <Text style={[styles.actionText, { color: msg.isSaved ? '#FF2D95' : 'rgba(255,255,255,0.50)' }]}>
                          {msg.isSaved ? 'Saved' : 'Save'}
                        </Text>
                      </TouchableOpacity>
                      {!msg.publicReply ? (
                        <TouchableOpacity
                          onPress={() => handleReply(msg.id)}
                          style={[styles.actionBtn, { backgroundColor: 'rgba(0,255,136,0.10)' }]}
                        >
                          <Text style={{ fontSize: 13 }}>💬</Text>
                          <Text style={[styles.actionText, { color: '#00FF88' }]}>Reply</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          onPress={() => handleReply(msg.id)}
                          style={[styles.actionBtn, { backgroundColor: 'rgba(255,255,255,0.07)' }]}
                        >
                          <Text style={{ fontSize: 13 }}>✏️</Text>
                          <Text style={[styles.actionText, { color: 'rgba(255,255,255,0.50)' }]}>Edit Reply</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        onPress={() => confirmDelete(msg.id)}
                        style={[styles.actionBtn, { backgroundColor: 'rgba(255,68,85,0.10)' }]}
                      >
                        <Text style={{ fontSize: 13 }}>🗑️</Text>
                        <Text style={[styles.actionText, { color: '#FF4455' }]}>Delete</Text>
                      </TouchableOpacity>
                      {!msg.isReported && (
                        <TouchableOpacity
                          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); reportMessage(msg.id); }}
                          style={[styles.actionBtn, { backgroundColor: 'rgba(255,255,255,0.07)' }]}
                        >
                          <Ionicons name="flag-outline" size={13} color="rgba(255,255,255,0.50)" />
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
          <View style={[styles.modalSheet, { paddingBottom: botPad + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reply Publicly ✨</Text>
              <TouchableOpacity onPress={() => setReplyModal({ id: '', open: false })}>
                <Ionicons name="close" size={22} color="rgba(255,255,255,0.50)" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalNote}>
              Your reply is posted anonymously. The sender remains unknown to you.
            </Text>
            <View style={styles.replyInput}>
              <TextInput
                style={styles.replyInputText}
                value={replyText}
                onChangeText={setReplyText}
                placeholder="Write your public reply..."
                placeholderTextColor="rgba(255,255,255,0.30)"
                multiline maxLength={300} autoFocus
              />
            </View>
            <TouchableOpacity
              onPress={submitReply}
              disabled={!replyText.trim()}
              style={[styles.replySubmitBtn, { opacity: replyText.trim() ? 1 : 0.4 }]}
            >
              <LinearGradient colors={['#FF2D95', '#7B2CFF']} style={styles.replySubmitGrad}>
                <Text style={styles.replySubmitText}>Post Reply</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const PINK  = '#FF2D95';
const CYAN  = '#00D4FF';
const MUTED = 'rgba(255,255,255,0.50)';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  header: { paddingHorizontal: 18, paddingBottom: 18, gap: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  headerTitle: { color: '#FFFFFF', fontSize: 21, fontFamily: 'SpaceGrotesk_700Bold' },
  headerSub: { color: MUTED, fontSize: 13, marginTop: 3, fontFamily: 'Inter_400Regular' },
  badge: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginTop: 4, backgroundColor: PINK },
  badgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' as const },
  linkCard: { gap: 10 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  linkIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,212,255,0.10)' },
  linkInfo: { flex: 1 },
  linkLabel: { fontSize: 11, marginBottom: 2, color: MUTED, fontFamily: 'Inter_400Regular' },
  linkSlug: { fontSize: 13, color: CYAN, fontFamily: 'Inter_600SemiBold' },
  linkBtns: { flexDirection: 'row', gap: 8 },
  linkBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 5, borderRadius: 10 },
  linkBtnText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  linkBtnShare: { overflow: 'hidden' as const },
  linkBtnShareGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 5, borderRadius: 10 },
  linkBtnShareText: { color: '#FFFFFF', fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  previewBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 9, gap: 7,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', borderRadius: 10,
  },
  previewBtnText: { fontSize: 13, color: MUTED, fontFamily: 'Inter_500Medium' },
  tabBar: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)', maxHeight: 52, backgroundColor: '#0B0B0F' },
  tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 13, gap: 5 },
  tabText: { fontSize: 12 },
  list: { flex: 1 },
  emptyWrap: { alignItems: 'center', paddingTop: 52, gap: 12, paddingHorizontal: 20 },
  emptyEmoji: { fontSize: 58 },
  emptyTitle: { fontSize: 18, textAlign: 'center', color: '#FFFFFF', fontFamily: 'SpaceGrotesk_600SemiBold' },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 21, color: MUTED, fontFamily: 'Inter_400Regular' },
  emptyShareBtn: { marginTop: 6, borderRadius: 20, overflow: 'hidden' as const },
  emptyShareGrad: { paddingHorizontal: 22, paddingVertical: 13 },
  emptyShareText: { color: '#FFFFFF', fontSize: 15, fontFamily: 'SpaceGrotesk_600SemiBold' },
  msgCard: { gap: 10 },
  hiddenMsg: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  hiddenText: { flex: 1, fontSize: 13, lineHeight: 19, fontStyle: 'italic' as const, color: MUTED, fontFamily: 'Inter_400Regular' },
  msgTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  catBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  catText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  msgTime: { fontSize: 11, color: MUTED, fontFamily: 'Inter_400Regular' },
  msgContent: { fontSize: 14, lineHeight: 22, color: '#FFFFFF', fontFamily: 'Inter_400Regular' },
  savedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
    backgroundColor: 'rgba(255,45,149,0.12)',
  },
  savedText: { fontSize: 12, color: PINK, fontFamily: 'Inter_500Medium' },
  replyWrap: {
    flexDirection: 'row', alignItems: 'flex-start', padding: 8, gap: 6,
    backgroundColor: 'rgba(0,255,136,0.08)', borderRadius: 8,
  },
  replyText: { flex: 1, fontSize: 12, lineHeight: 17, color: '#00FF88', fontFamily: 'Inter_400Regular' },
  msgActions: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 7, gap: 4, borderRadius: 8 },
  actionText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.60)' },
  modalSheet: { backgroundColor: '#0B0B0F', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,45,149,0.30)' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { fontSize: 17, color: '#FFFFFF', fontFamily: 'SpaceGrotesk_700Bold' },
  modalNote: { fontSize: 13, lineHeight: 19, color: MUTED, fontFamily: 'Inter_400Regular' },
  replyInput: { borderWidth: 1, borderColor: 'rgba(255,45,149,0.30)', padding: 12, minHeight: 80, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)' },
  replyInputText: { fontSize: 14, lineHeight: 21, color: '#FFFFFF', fontFamily: 'Inter_400Regular' },
  replySubmitBtn: { borderRadius: 20, overflow: 'hidden' as const },
  replySubmitGrad: { paddingVertical: 14, alignItems: 'center' },
  replySubmitText: { color: '#FFFFFF', fontSize: 15, fontFamily: 'SpaceGrotesk_600SemiBold' },
});
