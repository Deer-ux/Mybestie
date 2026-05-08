import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Linking } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import GlassCard from '@/components/GlassCard';
import BlobBackground from '@/components/BlobBackground';
import colors from '@/constants/colors';

const PINK  = '#FF2D95';
const GREEN = '#00FF88';
const MUTED = 'rgba(255,255,255,0.50)';

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
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <BlobBackground variant="green" />
      <LinearGradient colors={['#003320', '#050505']} style={[styles.header, { paddingTop: topPad + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🛡️ Safety Center</Text>
        <Text style={styles.headerSub}>Your wellbeing is our highest priority</Text>
      </LinearGradient>

      <View style={styles.content}>
        <Animated.View entering={FadeInDown.delay(100)}>
          <View style={styles.alertCard}>
            <Text style={{ fontSize: 20 }}>⚠️</Text>
            <Text style={styles.alertText}>
              MyBestie is <Text style={{ fontFamily: 'Inter_600SemiBold', color: '#FFFFFF' }}>not</Text> a therapy service, medical provider, or emergency crisis service. For emergencies, contact emergency services immediately.
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150)}>
          <Text style={styles.sectionTitle}>Safety Rules</Text>
          <View style={styles.rulesList}>
            {RULES.map((rule, i) => (
              <GlassCard key={i} style={styles.ruleCard} padding={14}>
                <Text style={styles.ruleEmoji}>{rule.emoji}</Text>
                <View style={styles.ruleInfo}>
                  <Text style={styles.ruleTitle}>{rule.title}</Text>
                  <Text style={styles.ruleDesc}>{rule.desc}</Text>
                </View>
              </GlassCard>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(250)}>
          <Text style={styles.sectionTitle}>Crisis Support Resources</Text>
          <View style={styles.crisisNote}>
            <Text style={{ fontSize: 20 }}>❤️</Text>
            <Text style={styles.crisisNoteText}>
              If you or someone you know is in immediate danger, please reach out to a crisis service or emergency services right away.
            </Text>
          </View>
          {CRISIS.map((contact, i) => (
            <TouchableOpacity key={i} onPress={() => Linking.openURL(contact.action)} style={styles.crisisCard}>
              <View style={styles.crisisIconWrap}>
                <Text style={{ fontSize: 22 }}>{contact.emoji}</Text>
              </View>
              <View style={styles.crisisInfo}>
                <Text style={styles.crisisLabel}>{contact.label}</Text>
                <Text style={styles.crisisSub}>{contact.sublabel}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={MUTED} />
            </TouchableOpacity>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(350)}>
          <Text style={styles.sectionTitle}>Moderation Policy</Text>
          <GlassCard>
            <Text style={styles.modTitle}>The following are strictly not allowed on MyBestie:</Text>
            {MODERATION.map((item, i) => (
              <View key={i} style={[styles.modRow, i < MODERATION.length - 1 && styles.modDivider]}>
                <Text style={{ fontSize: 16 }}>🚫</Text>
                <Text style={styles.modText}>{item}</Text>
              </View>
            ))}
            <Text style={styles.modNote}>Violations result in muting, restrictions, or permanent bans.</Text>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(450)}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <LinearGradient colors={colors.gradPrimary} style={styles.backBtnGrad}>
              <Text style={styles.backBtnText}>Back to App</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  header: { paddingHorizontal: 20, paddingBottom: 28, gap: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(0,255,136,0.12)' },
  back: { marginBottom: 10 },
  headerTitle: { color: '#FFFFFF', fontSize: 26, fontFamily: 'SpaceGrotesk_700Bold' },
  headerSub: { color: 'rgba(255,255,255,0.70)', fontSize: 14, fontFamily: 'Inter_400Regular' },
  content: { padding: 20, gap: 20 },
  alertCard: {
    flexDirection: 'row', padding: 14, gap: 10, alignItems: 'flex-start',
    backgroundColor: 'rgba(245,158,11,0.10)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)',
  },
  alertText: { flex: 1, fontSize: 13, lineHeight: 19, color: MUTED, fontFamily: 'Inter_400Regular' },
  sectionTitle: { fontSize: 18, marginBottom: 12, color: '#FFFFFF', fontFamily: 'SpaceGrotesk_700Bold' },
  rulesList: { gap: 8 },
  ruleCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  ruleEmoji: { fontSize: 22, width: 28, textAlign: 'center', marginTop: 2 },
  ruleInfo: { flex: 1 },
  ruleTitle: { fontSize: 14, marginBottom: 3, color: '#FFFFFF', fontFamily: 'Inter_600SemiBold' },
  ruleDesc: { fontSize: 13, lineHeight: 18, color: MUTED, fontFamily: 'Inter_400Regular' },
  crisisNote: {
    flexDirection: 'row', padding: 12, gap: 10, alignItems: 'flex-start', marginBottom: 10,
    backgroundColor: 'rgba(255,45,149,0.08)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,45,149,0.20)',
  },
  crisisNoteText: { flex: 1, fontSize: 13, lineHeight: 18, color: MUTED, fontFamily: 'Inter_400Regular' },
  crisisCard: {
    flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  crisisIconWrap: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,45,149,0.12)' },
  crisisInfo: { flex: 1 },
  crisisLabel: { fontSize: 14, color: '#FFFFFF', fontFamily: 'Inter_600SemiBold' },
  crisisSub: { fontSize: 12, marginTop: 2, color: MUTED, fontFamily: 'Inter_400Regular' },
  modTitle: { fontSize: 13, lineHeight: 19, marginBottom: 10, color: MUTED, fontFamily: 'Inter_500Medium' },
  modRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  modDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.07)' },
  modText: { flex: 1, fontSize: 13, lineHeight: 18, color: '#FFFFFF', fontFamily: 'Inter_400Regular' },
  modNote: { fontSize: 12, marginTop: 10, lineHeight: 17, color: MUTED, fontFamily: 'Inter_400Regular' },
  backBtn: { borderRadius: 20, overflow: 'hidden' as const },
  backBtnGrad: { paddingVertical: 15, alignItems: 'center' },
  backBtnText: { color: '#FFFFFF', fontSize: 15, fontFamily: 'SpaceGrotesk_600SemiBold' },
});
