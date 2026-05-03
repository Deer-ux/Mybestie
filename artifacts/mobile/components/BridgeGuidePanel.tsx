import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getBridgeSuggestion } from '@/utils/helpers';
import colors from '@/constants/colors';

const PINK  = '#FF2D95';
const CYAN  = '#00D4FF';
const MUTED = 'rgba(255,255,255,0.50)';

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
  const [suggestions] = useState([
    getBridgeSuggestion('starter'),
    getBridgeSuggestion('starter'),
    getBridgeSuggestion(messageCount > 3 ? 'silence' : 'reply'),
  ]);

  if (!isVisible) return null;

  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <LinearGradient
          colors={colors.gradPrimary}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.aiPill}
        >
          <Text style={styles.aiPillText}>✨ BridgeGuide AI</Text>
        </LinearGradient>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close-circle" size={24} color={MUTED} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll} contentContainerStyle={{ paddingBottom: 8 }}>
        <Text style={styles.sectionLabel}>CONVERSATION STARTERS</Text>
        {suggestions.map((s, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => onUseSuggestion(s.replace(/^[^:'"]+[:']\s*'?/, '').replace(/'?\s*$/, ''))}
            style={styles.suggCard}
            activeOpacity={0.75}
          >
            <Text style={{ fontSize: 16 }}>💬</Text>
            <Text style={styles.suggText}>{s}</Text>
          </TouchableOpacity>
        ))}

        <Text style={[styles.sectionLabel, { marginTop: 12 }]}>SAFETY REMINDERS</Text>
        {SAFETY_TIPS.map((tip, i) => (
          <View key={i} style={styles.tipRow}>
            <Text style={{ fontSize: 15 }}>{tip.emoji}</Text>
            <Text style={styles.tipText}>{tip.text}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: '#0B0B0F',
    borderTopWidth: 1, borderTopColor: 'rgba(255,45,149,0.30)',
    maxHeight: 290, paddingTop: 12,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10 },
  aiPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  aiPillText: { color: '#FFFFFF', fontSize: 13, fontFamily: 'SpaceGrotesk_700Bold' },
  scroll: { paddingHorizontal: 16 },
  sectionLabel: { color: MUTED, fontSize: 11, letterSpacing: 1.8, marginBottom: 8, fontFamily: 'SpaceGrotesk_600SemiBold' },
  suggCard: {
    flexDirection: 'row', alignItems: 'flex-start', padding: 11, marginBottom: 8, gap: 8,
    backgroundColor: 'rgba(255,45,149,0.08)', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,45,149,0.20)',
  },
  suggText: { flex: 1, fontSize: 13, lineHeight: 18, color: PINK, fontFamily: 'Inter_500Medium' },
  tipRow: {
    flexDirection: 'row', gap: 8, paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.07)',
    alignItems: 'flex-start',
  },
  tipText: { flex: 1, fontSize: 13, lineHeight: 18, color: MUTED, fontFamily: 'Inter_400Regular' },
});
