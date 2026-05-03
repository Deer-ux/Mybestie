import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

interface SafetyModalProps {
  visible: boolean;
  level: 'distress' | 'crisis';
  isTeenMode?: boolean;
  onDismiss: () => void;
  onLeaveChat: () => void;
  onTalkToAI: () => void;
}

export default function SafetyModal({ visible, level, isTeenMode = false, onDismiss, onLeaveChat, onTalkToAI }: SafetyModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const isCrisis = level === 'crisis';
  const gradColors: [string, string] = isCrisis ? ['#E57373', '#C62828'] : ['#F59E0B', '#D97706'];

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 20 }]}>
          <LinearGradient colors={gradColors} style={styles.sheetHeader}>
            <Text style={styles.headerEmoji}>{isCrisis ? '🛡️' : '💛'}</Text>
            <Text style={styles.headerTitle} numberOfLines={2}>
              {isCrisis ? 'You Matter — Please Read' : "We're Here For You"}
            </Text>
          </LinearGradient>

          <View style={styles.body}>
            <Text style={[styles.message, { color: colors.foreground, fontFamily: 'Poppins_600SemiBold' }]}>
              {isCrisis
                ? 'If you feel at risk, please reach out to emergency services or someone you trust immediately.'
                : 'It sounds like you may be going through a hard time. That\'s okay — support is here.'}
            </Text>

            {isTeenMode && (
              <View style={[styles.teenAlert, { backgroundColor: colors.lavenderLight, borderRadius: colors.radius }]}>
                <Text style={{ fontSize: 18 }}>🌱</Text>
                <Text style={[styles.teenAlertText, { color: colors.accent, fontFamily: 'Inter_500Medium' }]}>
                  Teen Mode: Consider talking to a trusted adult — a parent, teacher, or school counsellor.
                </Text>
              </View>
            )}

            <View style={[styles.disclaimer, { backgroundColor: colors.muted, borderRadius: colors.radius - 4 }]}>
              <Ionicons name="information-circle-outline" size={15} color={colors.mutedForeground} />
              <Text style={[styles.disclaimerText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                MindBridge is not a therapy service, medical provider, or crisis hotline.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.destructive, borderRadius: colors.radius }]}
              onPress={() => Linking.openURL('tel:911')}
            >
              <Text style={styles.btnEmoji}>🚨</Text>
              <Text style={[styles.btnText, { fontFamily: 'Inter_600SemiBold' }]}>Call Emergency Services</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.accent, borderRadius: colors.radius }]}
              onPress={onTalkToAI}
            >
              <Text style={styles.btnEmoji}>✨</Text>
              <Text style={[styles.btnText, { fontFamily: 'Inter_600SemiBold' }]}>Talk to BridgeGuide AI Support</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.safeGreen, borderRadius: colors.radius }]}
              onPress={onLeaveChat}
            >
              <Text style={styles.btnEmoji}>🚪</Text>
              <Text style={[styles.btnText, { fontFamily: 'Inter_600SemiBold' }]}>Leave Chat Safely</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss}>
              <Text style={[styles.dismissText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                {"I'm okay — continue chat"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' as const },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 12 },
  headerEmoji: { fontSize: 28 },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' as const, flex: 1 },
  body: { padding: 20, gap: 12 },
  message: { fontSize: 15, lineHeight: 22 },
  teenAlert: { flexDirection: 'row', padding: 12, gap: 10, alignItems: 'flex-start' },
  teenAlertText: { flex: 1, fontSize: 13, lineHeight: 19 },
  disclaimer: { flexDirection: 'row', padding: 10, gap: 8, alignItems: 'flex-start' },
  disclaimerText: { flex: 1, fontSize: 12, lineHeight: 17 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 10 },
  btnEmoji: { fontSize: 18 },
  btnText: { color: '#FFFFFF', fontSize: 15 },
  dismissBtn: { alignItems: 'center', paddingVertical: 8 },
  dismissText: { fontSize: 14 },
});
