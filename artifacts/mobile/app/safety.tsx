import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Linking } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';
import GlassCard from '@/components/GlassCard';
import BlobBackground from '@/components/BlobBackground';

const RULES = [
  { emoji: '🚫', title: 'Never share your real identity', desc: 'No real name, phone, email, address, or social media.' },
  { emoji: '📍', title: 'Never share your location', desc: 'Your physical location stays private at all times.' },
  { emoji: '📷', title: 'No photos or videos', desc: 'Do not send or request any visual content.' },
  { emoji: '💳', title: 'No financial transactions', desc: 'Never send money or financial information to anyone.' },
  { emoji: '🚪', title: 'End chats that feel wrong', desc: 'Trust your instincts. Leave safely anytime.' },
  { emoji: '🚩', title: 'Report harmful behavior', desc: 'Use the report button to flag dangerous content.' },
];

const CRISIS = [
  { emoji: '🚨', label: 'Emergency Services', sublabel: 'Call 911 or your local emergency number', action: 'tel:911' },
  { emoji: '💬', label: 'Crisis Text Line', sublabel: 'Text HOME to 741741 (US)', action: 'sms:741741' },
  { emoji: '🌐', label: 'International Crisis Support', sublabel: 'findahelpline.com', action: 'https://findahelpline.com' },
];

const MODERATION = [
  'Insults, harassment, and bullying',
  'Sexual exploitation or requests',
  'Hate speech of any kind',
  'Scam attempts or financial requests',
  'Requests for personal location or identity',
  'Self-harm encouragement or glorification',
];

export default function SafetyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <BlobBackground variant="green" />
      <LinearGradient colors={['#4CAF50', '#2E7D32']} style={[styles.header, { paddingTop: topPad + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: 'Poppins_700Bold' }]}>🛡️ Safety Center</Text>
        <Text style={[styles.headerSub, { fontFamily: 'Inter_400Regular' }]}>Your wellbeing is our highest priority</Text>
      </LinearGradient>

      <View style={styles.content}>
        <Animated.View entering={FadeInDown.delay(100)}>
          <View style={[styles.alertCard, { backgroundColor: colors.warningLight, borderRadius: colors.radius }]}>
            <Text style={{ fontSize: 20 }}>⚠️</Text>
            <Text style={[styles.alertText, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}>
              MindBridge is <Text style={{ fontFamily: 'Inter_600SemiBold' }}>not</Text> a therapy service, medical provider, or emergency crisis service. For emergencies, contact emergency services immediately.
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150)}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: 'Poppins_600SemiBold' }]}>Safety Rules</Text>
          <View style={styles.rulesList}>
            {RULES.map((rule, i) => (
              <GlassCard key={i} style={styles.ruleCard} padding={14}>
                <Text style={styles.ruleEmoji}>{rule.emoji}</Text>
                <View style={styles.ruleInfo}>
                  <Text style={[styles.ruleTitle, { color: colors.foreground, fontFamily: 'Poppins_500Medium' }]}>{rule.title}</Text>
                  <Text style={[styles.ruleDesc, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>{rule.desc}</Text>
                </View>
              </GlassCard>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(250)}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: 'Poppins_600SemiBold' }]}>Crisis Support Resources</Text>
          <View style={[styles.crisisNote, { backgroundColor: '#FFF0F0', borderRadius: colors.radius }]}>
            <Text style={{ fontSize: 20 }}>❤️</Text>
            <Text style={[styles.crisisNoteText, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}>
              If you or someone you know is in immediate danger, please reach out to a crisis service or emergency services right away.
            </Text>
          </View>
          {CRISIS.map((contact, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => Linking.openURL(contact.action)}
              style={[styles.crisisCard, { backgroundColor: colors.glass, borderColor: colors.glassBorder, borderRadius: colors.radius }]}
            >
              <View style={[styles.crisisIconWrap, { backgroundColor: '#FFF0F0' }]}>
                <Text style={{ fontSize: 22 }}>{contact.emoji}</Text>
              </View>
              <View style={styles.crisisInfo}>
                <Text style={[styles.crisisLabel, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>{contact.label}</Text>
                <Text style={[styles.crisisSub, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>{contact.sublabel}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(350)}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: 'Poppins_600SemiBold' }]}>Moderation Policy</Text>
          <GlassCard>
            <Text style={[styles.modTitle, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>
              The following are strictly not allowed on MindBridge:
            </Text>
            {MODERATION.map((item, i) => (
              <View key={i} style={[styles.modRow, { borderBottomColor: colors.border }]}>
                <Text style={{ fontSize: 16 }}>🚫</Text>
                <Text style={[styles.modText, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}>{item}</Text>
              </View>
            ))}
            <Text style={[styles.modNote, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              Violations result in muting, restrictions, or permanent bans.
            </Text>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(450)}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { borderRadius: colors.radius }]}>
            <LinearGradient colors={['#1F6F8B', '#0B3C5D']} style={styles.backBtnGrad}>
              <Text style={[styles.backBtnText, { fontFamily: 'Inter_600SemiBold' }]}>Back to App</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 28, gap: 8 },
  back: { marginBottom: 10 },
  headerTitle: { color: '#FFFFFF', fontSize: 26 },
  headerSub: { color: 'rgba(255,255,255,0.78)', fontSize: 14 },
  content: { padding: 20, gap: 20 },
  alertCard: { flexDirection: 'row', padding: 14, gap: 10, alignItems: 'flex-start' },
  alertText: { flex: 1, fontSize: 13, lineHeight: 19 },
  sectionTitle: { fontSize: 18, marginBottom: 12 },
  rulesList: { gap: 8 },
  ruleCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  ruleEmoji: { fontSize: 22, width: 28, textAlign: 'center', marginTop: 2 },
  ruleInfo: { flex: 1 },
  ruleTitle: { fontSize: 14, marginBottom: 3 },
  ruleDesc: { fontSize: 13, lineHeight: 18 },
  crisisNote: { flexDirection: 'row', padding: 12, gap: 10, alignItems: 'flex-start', marginBottom: 10 },
  crisisNoteText: { flex: 1, fontSize: 13, lineHeight: 18 },
  crisisCard: {
    flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12,
    borderWidth: 1, marginBottom: 8,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  crisisIconWrap: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  crisisInfo: { flex: 1 },
  crisisLabel: { fontSize: 14 },
  crisisSub: { fontSize: 12, marginTop: 2 },
  modTitle: { fontSize: 13, lineHeight: 19, marginBottom: 10 },
  modRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  modText: { flex: 1, fontSize: 13, lineHeight: 18 },
  modNote: { fontSize: 12, marginTop: 10, lineHeight: 17 },
  backBtn: { overflow: 'hidden' as const },
  backBtnGrad: { paddingVertical: 15, alignItems: 'center' },
  backBtnText: { color: '#FFFFFF', fontSize: 15 },
});
