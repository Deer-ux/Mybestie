import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Message } from '@/context/ChatContext';

const REACTIONS = ['❤️', '🤝', '🙏', '💡', '😊'];

interface MessageBubbleProps {
  message: Message;
  onReact: (messageId: string, reaction: string) => void;
}

export default function MessageBubble({ message, onReact }: MessageBubbleProps) {
  const colors = useColors();
  const [showReactions, setShowReactions] = React.useState(false);

  const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={[styles.container, message.isMine ? styles.myContainer : styles.theirContainer]}>
      <TouchableOpacity
        onLongPress={() => setShowReactions(!showReactions)}
        activeOpacity={0.85}
        style={[
          styles.bubble,
          message.isMine
            ? [styles.myBubble, { backgroundColor: colors.primary }]
            : [styles.theirBubble, { backgroundColor: colors.card, borderColor: colors.border }],
        ]}
      >
        <Text style={[styles.text, { color: message.isMine ? colors.primaryForeground : colors.foreground }]}>
          {message.text}
        </Text>
      </TouchableOpacity>

      {showReactions && (
        <View style={[styles.reactionsRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {REACTIONS.map(r => (
            <TouchableOpacity
              key={r}
              onPress={() => {
                onReact(message.id, r);
                setShowReactions(false);
              }}
              style={styles.reactionBtn}
            >
              <Text style={styles.reactionText}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={[styles.meta, message.isMine ? styles.myMeta : styles.theirMeta]}>
        {message.reaction && <Text style={styles.appliedReaction}>{message.reaction}</Text>}
        <Text style={[styles.time, { color: colors.mutedForeground }]}>{time}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  myContainer: {
    alignItems: 'flex-end',
  },
  theirContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  myBubble: {
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  text: {
    fontSize: 15,
    lineHeight: 21,
    fontFamily: Platform.OS === 'ios' ? 'Inter_400Regular' : undefined,
  },
  reactionsRow: {
    flexDirection: 'row',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 4,
    borderWidth: 1,
    gap: 4,
  },
  reactionBtn: {
    padding: 4,
  },
  reactionText: {
    fontSize: 20,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  myMeta: {
    justifyContent: 'flex-end',
  },
  theirMeta: {
    justifyContent: 'flex-start',
  },
  time: {
    fontSize: 11,
  },
  appliedReaction: {
    fontSize: 14,
  },
});
