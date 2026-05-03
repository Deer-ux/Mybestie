import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { Message } from '@/context/ChatContext';

const REACTIONS = ['❤️', '🤝', '🙏', '💡', '😊'];

interface MessageBubbleProps {
  message: Message;
  onReact: (messageId: string, reaction: string) => void;
}

export default function MessageBubble({ message, onReact }: MessageBubbleProps) {
  const colors = useColors();
  const [showReactions, setShowReactions] = useState(false);
  const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const isGuide = !!message.isBridgeGuide;

  return (
    <View style={[styles.wrap, message.isMine ? styles.wrapRight : styles.wrapLeft]}>
      <TouchableOpacity
        onLongPress={() => setShowReactions(v => !v)}
        activeOpacity={0.88}
      >
        {message.isMine ? (
          <LinearGradient
            colors={['#1F6F8B', '#0B3C5D']}
            style={[styles.bubble, styles.myBubble]}
          >
            <Text style={[styles.text, { color: '#FFFFFF', fontFamily: 'Inter_400Regular' }]}>{message.text}</Text>
          </LinearGradient>
        ) : isGuide ? (
          <LinearGradient
            colors={['#6C63FF', '#A29BFE']}
            style={[styles.bubble, styles.guideBubble]}
          >
            <Text style={[styles.guideLabel, { fontFamily: 'Inter_600SemiBold' }]}>✨ BridgeGuide</Text>
            <Text style={[styles.text, { color: '#FFFFFF', fontFamily: 'Inter_400Regular' }]}>{message.text}</Text>
          </LinearGradient>
        ) : (
          <View style={[styles.bubble, styles.theirBubble, {
            backgroundColor: colors.card,
            borderColor: colors.border,
            shadowColor: colors.primary,
          }]}>
            <Text style={[styles.text, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}>{message.text}</Text>
          </View>
        )}
      </TouchableOpacity>

      {showReactions && (
        <View style={[styles.reactRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {REACTIONS.map(r => (
            <TouchableOpacity
              key={r}
              onPress={() => { onReact(message.id, r); setShowReactions(false); }}
              style={styles.reactBtn}
            >
              <Text style={styles.reactText}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={[styles.meta, message.isMine ? styles.metaRight : styles.metaLeft]}>
        {message.reaction && <Text style={styles.appliedReaction}>{message.reaction}</Text>}
        <Text style={[styles.time, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>{time}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginVertical: 4, paddingHorizontal: 16 },
  wrapRight: { alignItems: 'flex-end' },
  wrapLeft: { alignItems: 'flex-start' },
  bubble: { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  myBubble: { borderBottomRightRadius: 4 },
  guideBubble: { borderBottomLeftRadius: 4, paddingTop: 8 },
  theirBubble: {
    borderBottomLeftRadius: 4, borderWidth: 1,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  guideLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginBottom: 4, letterSpacing: 0.4 },
  text: { fontSize: 15, lineHeight: 21 },
  reactRow: {
    flexDirection: 'row', borderRadius: 20, paddingHorizontal: 8,
    paddingVertical: 5, marginTop: 4, borderWidth: 1, gap: 4,
  },
  reactBtn: { padding: 3 },
  reactText: { fontSize: 20 },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 4 },
  metaRight: { justifyContent: 'flex-end' },
  metaLeft: { justifyContent: 'flex-start' },
  time: { fontSize: 11 },
  appliedReaction: { fontSize: 14 },
});
