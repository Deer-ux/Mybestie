import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Linking } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';

const SAFETY_RULES = [
  { icon: 'person-remove-outline', title: 'Never share your real identity', desc: 'Do not share your real name, phone number, email, address, or social media.' },
  { icon: 'location-sharp', title: 'Never share your location', desc: 'Your physical location should always remain private.' },
  { icon: 'camera-off-outline', title: 'No photos or videos', desc: 'Do not send or request photos, videos, or any visual content.' },
  { icon: 'card-outline', title: 'No financial transactions', desc: 'Never send money, gift cards, or financial information to anyone.' },
  { icon: 'hand-left-outline', title: 'End chats that feel wrong', desc: 'Trust your instincts. If something feels uncomfortable, leave safely.' },
  { icon: 'flag-outline', title: 'Report harmful behavior', desc: 'Use the report button to flag any abusive, harassing, or dangerous content.' },
];

const CRISIS_CONTACTS = [
  { icon: 'call', label: 'Emergency Services', sublabel: 'Call 911 or your local emergency number', action: 'tel:911' },
  { icon: 'chatbubble-ellipses-outline', label: 'Crisis Text Line', sublabel: 'Text HOME to 741741 (US)', action: 'sms:741741' },
  { icon: 'globe-outline', label: 'International Crisis Support', sublabel: 'findahelpline.com', action: 'https://findahelpline.com' },
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
      <LinearGradient colors={[colors.accent, '#1A7A4A']} style={[styles.header, { paddingTop: topPad + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Ionicons name="shield-checkmark" size={36} color="#FFFFFF" />
          <Text style={styles.headerTitle}>Safety Center</Text>
          <Text style={styles.headerSub}>Your wellbeing is our highest priority</Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <Animated.View entering={FadeInDown.delay(100)} style={[styles.alertCard, { backgroundColor: colors.warningLight, borderRadius: colors.radius }]}>
          <Ionicons name="information-circle" size={20} color={colors.warning} />
          <Text style={[styles.alertText, { color: colors.foreground }]}>
            MindBridge is <Text style={{ fontWeight: '700' }}>not</Text> a therapy service, medical provider, or emergency crisis service. For emergencies, contact local services immediately.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200)}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Safety Rules</Text>
          <View style={styles.rulesList}>
            {SAFETY_RULES.map((rule, i) => (
              <View key={i} style={[styles.ruleCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
                <View style={[styles.ruleIcon, { backgroundColor: colors.greenLight }]}>
                  <Ionicons name={rule.icon as keyof typeof Ionicons.glyphMap} size={20} color={colors.accent} />
                </View>
                <View style={styles.ruleInfo}>
                  <Text style={[styles.ruleTitle, { color: colors.foreground }]}>{rule.title}</Text>
                  <Text style={[styles.ruleDesc, { color: colors.mutedForeground }]}>{rule.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400)}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Crisis Support Resources</Text>
          <View style={[styles.crisisNote, { backgroundColor: '#FFF0F0', borderRadius: colors.radius }]}>
            <Ionicons name="heart" size={16} color={colors.destructive} />
            <Text style={[styles.crisisNoteText, { color: colors.foreground }]}>
              If you or someone you know is in immediate danger, please reach out to a crisis service or emergency services right away.
            </Text>
          </View>
          {CRISIS_CONTACTS.map((contact, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => {
                if (contact.action.startsWith('http')) {
                  Linking.openURL(contact.action);
                } else {
                  Linking.openURL(contact.action);
                }
              }}
              style={[styles.crisisCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
            >
              <View style={[styles.crisisIcon, { backgroundColor: '#FFF0F0' }]}>
                <Ionicons name={contact.icon as keyof typeof Ionicons.glyphMap} size={22} color={colors.destructive} />
              </View>
              <View style={styles.crisisInfo}>
                <Text style={[styles.crisisLabel, { color: colors.foreground }]}>{contact.label}</Text>
                <Text style={[styles.crisisSub, { color: colors.mutedForeground }]}>{contact.sublabel}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600)}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Moderation Policy</Text>
          <View style={[styles.moderationCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
            {[
              'Insults, harassment, and bullying',
              'Sexual exploitation or requests',
              'Hate speech of any kind',
              'Scam attempts or financial requests',
              'Requests for personal location or identity',
              'Self-harm encouragement',
            ].map((item, i) => (
              <View key={i} style={[styles.moderationRow, { borderBottomColor: colors.border }]}>
                <Ionicons name="close-circle" size={16} color={colors.destructive} />
                <Text style={[styles.moderationText, { color: colors.foreground }]}>{item}</Text>
              </View>
            ))}
            <Text style={[styles.moderationNote, { color: colors.mutedForeground }]}>
              Users who violate these rules may be muted, restricted, or permanently banned.
            </Text>
          </View>
        </Animated.View>

        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn2, { backgroundColor: colors.primary, borderRadius: colors.radius }]}>
          <Text style={styles.backBtn2Text}>Back to App</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 28 },
  backBtn: { marginBottom: 16 },
  headerContent: { alignItems: 'center', gap: 8 },
  headerTitle: { color: '#FFFFFF', fontSize: 26, fontWeight: '800' as const },
  headerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 14 },
  content: { padding: 20, gap: 20 },
  alertCard: { flexDirection: 'row', padding: 14, gap: 10, alignItems: 'flex-start' },
  alertText: { flex: 1, fontSize: 13, lineHeight: 19 },
  sectionTitle: { fontSize: 16, fontWeight: '700' as const, marginBottom: 10 },
  rulesList: { gap: 8 },
  ruleCard: { flexDirection: 'row', padding: 14, borderWidth: 1, gap: 12, alignItems: 'flex-start' },
  ruleIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  ruleInfo: { flex: 1 },
  ruleTitle: { fontSize: 14, fontWeight: '600' as const, marginBottom: 3 },
  ruleDesc: { fontSize: 13, lineHeight: 18 },
  crisisNote: { flexDirection: 'row', padding: 12, gap: 8, alignItems: 'flex-start', marginBottom: 10 },
  crisisNoteText: { flex: 1, fontSize: 13, lineHeight: 18 },
  crisisCard: { flexDirection: 'row', padding: 14, borderWidth: 1, gap: 12, alignItems: 'center', marginBottom: 8 },
  crisisIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  crisisInfo: { flex: 1 },
  crisisLabel: { fontSize: 14, fontWeight: '600' as const },
  crisisSub: { fontSize: 12, marginTop: 2 },
  moderationCard: { borderWidth: 1, padding: 16, gap: 2 },
  moderationRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  moderationText: { fontSize: 13, flex: 1 },
  moderationNote: { fontSize: 12, marginTop: 8, lineHeight: 17 },
  backBtn2: { alignItems: 'center', paddingVertical: 14 },
  backBtn2Text: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' as const },
});
