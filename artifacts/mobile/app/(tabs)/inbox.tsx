import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Platform, Share, Alert, TextInput, Modal, Clipboard,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import { useInbox, AnonymousMessage, MessageCategory } from '@/context/InboxContext';
import { trackEvent } from '@/utils/analytics';
import GlassCard from '@/components/GlassCard';
import BlobBackground from '@/components/BlobBackground';

const PINK  = '#FF2D95';
const CYAN  = '#00D4FF';
const MUTED = 'rgba(255,255,255,0.50)';

type FilterTab = 'all' | MessageCategory;

const TABS: { id: FilterTab; label: string; emoji: string }[] = [
  { id: 'all',           label: 'All',          emoji: '📬' },
  { id: 'compliment',    label: 'Compliments',   emoji: '❤️' },
  { id: 'question',      label: 'Questions',     emoji: '🤔' },
  { id: 'advice',        label: 'Advice',        emoji: '💡' },
  { id: 'confession',    label: 'Confessions',   emoji: '🤫' },
  { id: 'encouragement', label: 'Encouragement', emoji: '✨' },
  { id: 'feedback',      label: 'Feedback',      emoji: '📝' },
];

const CAT_COLORS: Record<string, string> = {
  compliment:    '#FF6B6B',
  question:      '#38BDF8',
  advice:        '#F59E0B',
  confession:    '#7B2CFF',
  encouragement: '#00FF88',
  feedback:      '#A29BFE',
  other:         '#9CA3AF',
};

const CAT_EMOJIS: Record<string, string> = {
  compliment:    '❤️',
  question:      '🤔',
  advice:        '💡',
  confession:    '🤫',
  encouragement: '✨',
  feedback:      '📝',
  other:         '💬',
};

function formatTime(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function catLabel(cat: string) {
  return cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

export default function InboxScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const { messages, unreadCount, markAsRead, saveMessage, deleteMessage, reportMessage, replyToMessage, refreshInbox } = useInbox();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [replyModal, setReplyModal] = useState<{ id: string; open: boolean }>({ id: '', open: false });
  const [replyText, setReplyText] = useState('');
  const [copied, setCopied] = useState(false);

  useFocusEffect(
    useCallback(() => {
      trackEvent('inbox_opened', user?.id);
      refreshInbox();
    }, [user?.id])
  );

  const slug = user?.username?.toLowerCase().replace(/[^a-z0-9]/g, '') ?? '';
  const shareUrl  = (Platform.OS === 'web' && typeof window !== 'undefined')
    ? `${window.location.origin}/message/${slug}`
    : `https://${process.env.EXPO_PUBLIC_DOMAIN ?? ''}/message/${slug}`;
  const shareLink = shareUrl.replace(/^https?:\/\//, '');

  const approvedMsgs = messages.filter(m => m.moderationStatus === 'approved' && !m.isReported);
  const approvedCount = approvedMsgs.length;

  const visible = approvedMsgs.filter(m => {
    if (activeTab === 'all') return true;
    return m.category === activeTab;
  });

  async function handleShare() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent('link_shared', user?.id);
    await Share.share({
      message: `Send me an anonymous message! Say anything — I won't know it's you 👀\n\n${shareUrl}`,
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
    const msg = messages.find(m => m.id === id);
    setReplyModal({ id, open: true });
    setReplyText(msg?.publicReply ?? '');
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

  function confirmReport(id: string) {
    Alert.alert('Report Message', 'Flag this message as inappropriate?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Report', style: 'destructive', onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          reportMessage(id);
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <BlobBackground variant="purple" />

      {/* ── Header ── */}
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

        {/* ── Share link card ── */}
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
                <Text style={styles.linkBtnShareText}>Share Link</Text>
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

      {/* ── Category tabs ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
        contentContainerStyle={{ paddingHorizontal: 8 }}
      >
        {TABS.map(tab => {
          const count = tab.id === 'all'
            ? approvedCount
            : approvedMsgs.filter(m => m.category === tab.id).length;
          const active = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab(tab.id); }}
              style={[styles.tab, { borderBottomWidth: active ? 2.5 : 0, borderBottomColor: PINK }]}
            >
              <Text style={{ fontSize: 14 }}>{tab.emoji}</Text>
              <Text style={[styles.tabText, {
                color: active ? PINK : MUTED,
                fontFamily: active ? 'Inter_600SemiBold' : 'Inter_400Regular',
              }]}>
                {tab.label}
              </Text>
              {count > 0 && (
                <View style={[styles.tabCount, { backgroundColor: active ? PINK : 'rgba(255,255,255,0.12)' }]}>
                  <Text style={[styles.tabCountText, { color: active ? '#FFF' : MUTED }]}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Message list ── */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: botPad + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {visible.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyTitle}>
              {activeTab === 'all' ? 'No messages yet' : `No ${TABS.find(t => t.id === activeTab)?.label ?? ''} yet`}
            </Text>
            <Text style={styles.emptySub}>
              {activeTab === 'all'
                ? 'Share your link on WhatsApp, Instagram bio, or anywhere to start receiving messages.'
                : 'Messages in this category will appear here once received.'}
            </Text>
            {activeTab === 'all' && (
              <TouchableOpacity onPress={handleShare} style={styles.emptyShareBtn}>
                <LinearGradient colors={['#FF2D95', '#7B2CFF']} style={styles.emptyShareGrad}>
                  <Text style={styles.emptyShareText}>📤 Share Your Link Now</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          visible.map((msg, i) => (
            <Animated.View key={msg.id} entering={FadeInDown.delay(i * 40)}>
              <TouchableOpacity onPress={() => handleViewMessage(msg)} activeOpacity={0.9}>
                <GlassCard
                  style={[
                    styles.msgCard,
                    !msg.isRead && { borderLeftWidth: 3, borderLeftColor: CAT_COLORS[msg.category] ?? CYAN },
                  ]}
                  padding={14}
                >
                  {/* Top row: category badge + time */}
                  <View style={styles.msgTop}>
                    <View style={[styles.catBadge, { backgroundColor: (CAT_COLORS[msg.category] ?? '#6B7280') + '18', borderRadius: 10 }]}>
                      <Text style={{ fontSize: 13 }}>{CAT_EMOJIS[msg.category] ?? '💬'}</Text>
                      <Text style={[styles.catText, { color: CAT_COLORS[msg.category] ?? '#6B7280' }]}>
                        {catLabel(msg.category)}
                      </Text>
                    </View>
                    <Text style={styles.msgTime}>{formatTime(msg.timestamp)}</Text>
                  </View>

                  {/* Message content */}
                  <Text style={styles.msgContent}>{msg.content}</Text>

                  {/* Saved badge */}
                  {msg.isSaved && (
                    <View style={styles.savedBadge}>
                      <Text style={{ fontSize: 11 }}>🔖</Text>
                      <Text style={styles.savedText}>Saved</Text>
                    </View>
                  )}

                  {/* Public reply */}
                  {msg.publicReply && (
                    <View style={styles.replyWrap}>
                      <Text style={{ fontSize: 12 }}>✨</Text>
                      <Text style={styles.replyText} numberOfLines={2}>
                        Your reply: {msg.publicReply}
                      </Text>
                    </View>
                  )}

                  {/* Actions: Save | Reply | Delete | Report */}
                  <View style={styles.msgActions}>
                    <TouchableOpacity
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); saveMessage(msg.id); }}
                      style={[styles.actionBtn, { backgroundColor: msg.isSaved ? 'rgba(255,45,149,0.14)' : 'rgba(255,255,255,0.07)' }]}
                    >
                      <Text style={{ fontSize: 13 }}>🔖</Text>
                      <Text style={[styles.actionText, { color: msg.isSaved ? PINK : MUTED }]}>
                        {msg.isSaved ? 'Saved' : 'Save'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleReply(msg.id)}
                      style={[styles.actionBtn, { backgroundColor: msg.publicReply ? 'rgba(255,255,255,0.07)' : 'rgba(0,255,136,0.10)' }]}
                    >
                      <Text style={{ fontSize: 13 }}>{msg.publicReply ? '✏️' : '💬'}</Text>
                      <Text style={[styles.actionText, { color: msg.publicReply ? MUTED : '#00FF88' }]}>
                        {msg.publicReply ? 'Edit Reply' : 'Reply'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => confirmDelete(msg.id)}
                      style={[styles.actionBtn, { backgroundColor: 'rgba(255,68,85,0.10)' }]}
                    >
                      <Text style={{ fontSize: 13 }}>🗑️</Text>
                      <Text style={[styles.actionText, { color: '#FF4455' }]}>Delete</Text>
                    </TouchableOpacity>

                    {!msg.isReported ? (
                      <TouchableOpacity
                        onPress={() => confirmReport(msg.id)}
                        style={[styles.actionBtn, { backgroundColor: 'rgba(255,255,255,0.07)' }]}
                      >
                        <Ionicons name="flag-outline" size={13} color={MUTED} />
                        <Text style={[styles.actionText, { color: MUTED }]}>Report</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={[styles.actionBtn, { backgroundColor: 'rgba(255,68,85,0.07)' }]}>
                        <Ionicons name="flag" size={13} color="#FF4455" />
                        <Text style={[styles.actionText, { color: '#FF4455' }]}>Reported</Text>
                      </View>
                    )}
                  </View>
                </GlassCard>
              </TouchableOpacity>
            </Animated.View>
          ))
        )}
      </ScrollView>

      {/* ── Reply modal ── */}
      <Modal visible={replyModal.open} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: botPad + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reply Publicly ✨</Text>
              <TouchableOpacity onPress={() => setReplyModal({ id: '', open: false })}>
                <Ionicons name="close" size={22} color={MUTED} />
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

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#050505' },
  header:         { paddingHorizontal: 18, paddingBottom: 18, gap: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  headerTop:      { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  headerTitle:    { color: '#FFFFFF', fontSize: 21, fontFamily: 'SpaceGrotesk_700Bold' },
  headerSub:      { color: MUTED, fontSize: 13, marginTop: 3, fontFamily: 'Inter_400Regular' },
  badge:          { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginTop: 4, backgroundColor: PINK },
  badgeText:      { color: '#FFFFFF', fontSize: 12, fontWeight: '700' as const },

  linkCard:        { gap: 10 },
  linkRow:         { flexDirection: 'row', alignItems: 'center', gap: 10 },
  linkIcon:        { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,212,255,0.10)' },
  linkInfo:        { flex: 1 },
  linkLabel:       { fontSize: 11, marginBottom: 2, color: MUTED, fontFamily: 'Inter_400Regular' },
  linkSlug:        { fontSize: 13, color: CYAN, fontFamily: 'Inter_600SemiBold' },
  linkBtns:        { flexDirection: 'row', gap: 8 },
  linkBtn:         { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 5 },
  linkBtnText:     { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  linkBtnShare:    { overflow: 'hidden' as const },
  linkBtnShareGrad:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 5, borderRadius: 10 },
  linkBtnShareText:{ color: '#FFFFFF', fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  previewBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 9, gap: 7, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', borderRadius: 10 },
  previewBtnText:  { fontSize: 13, color: MUTED, fontFamily: 'Inter_500Medium' },

  tabBar:          { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)', maxHeight: 52, backgroundColor: '#0B0B0F' },
  tab:             { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 13, gap: 5 },
  tabText:         { fontSize: 12 },
  tabCount:        { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  tabCountText:    { fontSize: 10, fontFamily: 'Inter_600SemiBold' },

  list:            { flex: 1 },
  emptyWrap:       { alignItems: 'center', paddingTop: 52, gap: 12, paddingHorizontal: 20 },
  emptyEmoji:      { fontSize: 58 },
  emptyTitle:      { fontSize: 18, textAlign: 'center', color: '#FFFFFF', fontFamily: 'SpaceGrotesk_600SemiBold' },
  emptySub:        { fontSize: 14, textAlign: 'center', lineHeight: 21, color: MUTED, fontFamily: 'Inter_400Regular' },
  emptyShareBtn:   { marginTop: 6, borderRadius: 20, overflow: 'hidden' as const },
  emptyShareGrad:  { paddingHorizontal: 22, paddingVertical: 13 },
  emptyShareText:  { color: '#FFFFFF', fontSize: 15, fontFamily: 'SpaceGrotesk_600SemiBold' },

  msgCard:         { gap: 10 },
  msgTop:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  catBadge:        { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4 },
  catText:         { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  msgTime:         { fontSize: 11, color: MUTED, fontFamily: 'Inter_400Regular' },
  msgContent:      { fontSize: 14, lineHeight: 22, color: '#FFFFFF', fontFamily: 'Inter_400Regular' },
  savedBadge:      { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: 'rgba(255,45,149,0.12)' },
  savedText:       { fontSize: 12, color: PINK, fontFamily: 'Inter_500Medium' },
  replyWrap:       { flexDirection: 'row', alignItems: 'flex-start', padding: 8, gap: 6, backgroundColor: 'rgba(0,255,136,0.08)', borderRadius: 8 },
  replyText:       { flex: 1, fontSize: 12, lineHeight: 17, color: '#00FF88', fontFamily: 'Inter_400Regular' },
  msgActions:      { flexDirection: 'row', gap: 6, flexWrap: 'wrap' as const },
  actionBtn:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 7, gap: 4, borderRadius: 8 },
  actionText:      { fontSize: 12, fontFamily: 'Inter_500Medium' },

  modalOverlay:    { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.60)' },
  modalSheet:      { backgroundColor: '#0B0B0F', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,45,149,0.30)' },
  modalHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle:      { fontSize: 17, color: '#FFFFFF', fontFamily: 'SpaceGrotesk_700Bold' },
  modalNote:       { fontSize: 13, lineHeight: 19, color: MUTED, fontFamily: 'Inter_400Regular' },
  replyInput:      { borderWidth: 1, borderColor: 'rgba(255,45,149,0.30)', padding: 12, minHeight: 80, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)' },
  replyInputText:  { fontSize: 14, lineHeight: 21, color: '#FFFFFF', fontFamily: 'Inter_400Regular' },
  replySubmitBtn:  { borderRadius: 20, overflow: 'hidden' as const },
  replySubmitGrad: { paddingVertical: 14, alignItems: 'center' },
  replySubmitText: { color: '#FFFFFF', fontSize: 15, fontFamily: 'SpaceGrotesk_600SemiBold' },
});
