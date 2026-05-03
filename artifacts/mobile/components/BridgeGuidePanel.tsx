import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { getBridgeSuggestion } from '@/utils/helpers';

interface BridgeGuidePanelProps {
  onUseSuggestion: (text: string) => void;
  isVisible: boolean;
  onClose: () => void;
  messageCount: number;
}

const SAFETY_TIPS = [
  { emoji: '🔒', text: 'Never share your real name, phone, or location.' },
  { emoji: '❤️', text: 'Be kind — everyone here is looking for connection.' },
  { emoji: '👂', text: 'Listen actively. Sometimes people just need to feel heard.' },
  { emoji: '🚪', text: 'If uncomfortable, you can always end the chat safely.' },
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
    <View style={[styles.panel, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
      <View style={styles.header}>
        <LinearGradient colors={['#6C63FF', '#A29BFE']} style={styles.aiPill}>
          <Text style={styles.aiPillText}>✨ BridgeGuide AI</Text>
        </LinearGradient>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close-circle" size={24} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll} contentContainerStyle={{ paddingBottom: 8 }}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold' }]}>
          CONVERSATION STARTERS
        </Text>
        {suggestions.map((s, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => onUseSuggestion(s.replace(/^[^:'"]+[:']\s*'?/, '').replace(/'?\s*$/, ''))}
            style={[styles.suggCard, { backgroundColor: colors.lavenderLight, borderRadius: colors.radius - 4 }]}
            activeOpacity={0.75}
          >
            <Text style={{ fontSize: 16 }}>💬</Text>
            <Text style={[styles.suggText, { color: colors.accent, fontFamily: 'Inter_500Medium' }]}>{s}</Text>
          </TouchableOpacity>
        ))}

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold', marginTop: 12 }]}>
          SAFETY REMINDERS
        </Text>
        {SAFETY_TIPS.map((tip, i) => (
          <View key={i} style={[styles.tipRow, { borderBottomColor: colors.border }]}>
            <Text style={{ fontSize: 15 }}>{tip.emoji}</Text>
            <Text style={[styles.tipText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>{tip.text}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { borderTopWidth: 1, maxHeight: 290, paddingTop: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10 },
  aiPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  aiPillText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' as const },
  scroll: { paddingHorizontal: 16 },
  sectionLabel: { fontSize: 11, letterSpacing: 0.8, marginBottom: 8 },
  suggCard: { flexDirection: 'row', alignItems: 'flex-start', padding: 11, marginBottom: 8, gap: 8 },
  suggText: { flex: 1, fontSize: 13, lineHeight: 18 },
  tipRow: { flexDirection: 'row', gap: 8, paddingVertical: 7, borderBottomWidth: StyleSheet.hairlineWidth, alignItems: 'flex-start' },
  tipText: { flex: 1, fontSize: 13, lineHeight: 18 },
});
