import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { getBridgeSuggestion } from '@/utils/helpers';

interface BridgeGuidePanelProps {
  onUseSuggestion: (text: string) => void;
  isVisible: boolean;
  onClose: () => void;
  messageCount: number;
}

const TIPS = [
  { icon: 'shield-checkmark-outline', text: 'Never share your real name, phone number, or location.' },
  { icon: 'heart-outline', text: 'Be kind. Everyone here is looking for connection.' },
  { icon: 'ear-outline', text: 'Listen actively — sometimes people just need to feel heard.' },
  { icon: 'hand-left-outline', text: 'If uncomfortable, you can always end the chat safely.' },
];

export default function BridgeGuidePanel({ onUseSuggestion, isVisible, onClose, messageCount }: BridgeGuidePanelProps) {
  const colors = useColors();
  const [suggestions] = useState([
    getBridgeSuggestion('starter'),
    getBridgeSuggestion('starter'),
    getBridgeSuggestion(messageCount > 3 ? 'silence' : 'reply'),
  ]);

  if (!isVisible) return null;

  return (
    <View style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.panelHeader}>
        <View style={styles.panelTitleRow}>
          <View style={[styles.aiDot, { backgroundColor: colors.accent }]} />
          <Text style={[styles.panelTitle, { color: colors.foreground }]}>BridgeGuide</Text>
          <Text style={[styles.aiLabel, { color: colors.accent, backgroundColor: colors.greenLight }]}>AI</Text>
        </View>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={22} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CONVERSATION STARTERS</Text>
        {suggestions.map((s, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.suggestionCard, { backgroundColor: colors.blueLight, borderRadius: colors.radius }]}
            onPress={() => onUseSuggestion(s.replace(/^[^:]+:\s*'?/, '').replace(/'?\s*$/, ''))}
            activeOpacity={0.75}
          >
            <Ionicons name="chatbubble-outline" size={16} color={colors.primary} />
            <Text style={[styles.suggestionText, { color: colors.primary }]}>{s}</Text>
          </TouchableOpacity>
        ))}

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 16 }]}>SAFETY TIPS</Text>
        {TIPS.map((tip, i) => (
          <View key={i} style={[styles.tipRow, { borderBottomColor: colors.border }]}>
            <Ionicons name={tip.icon as keyof typeof Ionicons.glyphMap} size={16} color={colors.accent} />
            <Text style={[styles.tipText, { color: colors.mutedForeground }]}>{tip.text}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderTopWidth: 1,
    maxHeight: 280,
    paddingTop: 12,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  panelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  panelTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  aiLabel: {
    fontSize: 10,
    fontWeight: '700' as const,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden' as const,
  },
  scroll: {
    paddingHorizontal: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    marginBottom: 8,
    gap: 8,
  },
  suggestionText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
    fontWeight: '500' as const,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tipText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
});
