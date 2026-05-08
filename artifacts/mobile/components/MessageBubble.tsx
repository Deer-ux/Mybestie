import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Message } from '@/context/ChatContext';
import colors from '@/constants/colors';

const MUTED = 'rgba(255,255,255,0.45)';
const REACTIONS = ['❤️', '🤝', '🙏', '💡', '😊'];

interface MessageBubbleProps {
  message: Message;
  onReact: (messageId: string, reaction: string) => void;
}

export default function MessageBubble({ message, onReact }: MessageBubbleProps) {
  const [showReactions, setShowReactions] = useState(false);
  const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isGuide = !!message.isBridgeGuide;

  return (
    <View style={[styles.wrap, message.isMine ? styles.wrapRight : styles.wrapLeft]}>
      <TouchableOpacity onLongPress={() => setShowReactions(v => !v)} activeOpacity={0.88}>
        {message.isMine ? (
          <LinearGradient
            colors={colors.gradPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.bubble, styles.myBubble]}
          >
            <Text style={styles.textWhite}>{message.text}</Text>
          </LinearGradient>
        ) : isGuide ? (
          <LinearGradient
            colors={['#7B2CFF', '#D633FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.bubble, styles.guideBubble]}
          >
            <Text style={styles.guideLabel}>✨ Bestie AI</Text>
            <Text style={styles.textWhite}>{message.text}</Text>
          </LinearGradient>
        ) : (
          <View style={[styles.bubble, styles.theirBubble]}>
            <Text style={styles.theirText}>{message.text}</Text>
          </View>
        )}
      </TouchableOpacity>

      {showReactions && (
        <View style={styles.reactRow}>
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
        <Text style={styles.time}>{time}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginVertical: 4, paddingHorizontal: 16 },
  wrapRight: { alignItems: 'flex-end' },
  wrapLeft: { alignItems: 'flex-start' },
  bubble: { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
  myBubble: { borderBottomRightRadius: 4 },
  guideBubble: { borderBottomLeftRadius: 4, paddingTop: 8 },
  theirBubble: {
    borderBottomLeftRadius: 4, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)', backgroundColor: 'rgba(255,255,255,0.07)',
  },
  guideLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginBottom: 4, letterSpacing: 0.5, fontFamily: 'Inter_600SemiBold' },
  textWhite: { fontSize: 15, lineHeight: 21, color: '#FFFFFF', fontFamily: 'Inter_400Regular' },
  theirText: { fontSize: 15, lineHeight: 21, color: '#FFFFFF', fontFamily: 'Inter_400Regular' },
  reactRow: {
    flexDirection: 'row', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 5,
    marginTop: 4, borderWidth: 1, gap: 4,
    backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)',
  },
  reactBtn: { padding: 3 },
  reactText: { fontSize: 20 },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 4 },
  metaRight: { justifyContent: 'flex-end' },
  metaLeft: { justifyContent: 'flex-start' },
  time: { fontSize: 11, color: MUTED, fontFamily: 'Inter_400Regular' },
  appliedReaction: { fontSize: 14 },
});
