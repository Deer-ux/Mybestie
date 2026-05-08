import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MUTED = 'rgba(255,255,255,0.50)';

interface SafetyModalProps {
  visible: boolean;
  level: 'distress' | 'crisis';
  isTeenMode?: boolean;
  onDismiss: () => void;
  onLeaveChat: () => void;
  onTalkToAI: () => void;
}

export default function SafetyModal({ visible, level, isTeenMode = false, onDismiss, onLeaveChat, onTalkToAI }: SafetyModalProps) {
  const insets = useSafeAreaInsets();
  const isCrisis = level === 'crisis';
  const gradColors: [string, string] = isCrisis ? ['#FF2D95', '#7B2CFF'] : ['#F59E0B', '#FF6B35'];

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
          <LinearGradient colors={gradColors} style={styles.sheetHeader}>
            <Text style={styles.headerEmoji}>{isCrisis ? '🛡️' : '💛'}</Text>
            <Text style={styles.headerTitle} numberOfLines={2}>
              {isCrisis ? 'You Matter — Please Read' : "We're Here For You"}
            </Text>
          </LinearGradient>

          <View style={styles.body}>
            <Text style={styles.message}>
              {isCrisis
                ? 'If you feel at risk, please reach out to emergency services or someone you trust immediately.'
                : "It sounds like you may be going through a hard time. That's okay — support is here."}
            </Text>

            {isTeenMode && (
              <View style={styles.teenAlert}>
                <Text style={{ fontSize: 18 }}>🌱</Text>
                <Text style={styles.teenAlertText}>
                  Teen Mode: Consider talking to a trusted adult — a parent, teacher, or school counsellor.
                </Text>
              </View>
            )}

            <View style={styles.disclaimer}>
              <Ionicons name="information-circle-outline" size={15} color={MUTED} />
              <Text style={styles.disclaimerText}>
                MyBestie is not a therapy service, medical provider, or crisis hotline.
              </Text>
            </View>

            <TouchableOpacity style={[styles.btn, { backgroundColor: '#FF4455' }]} onPress={() => Linking.openURL('tel:911')}>
              <Text style={styles.btnEmoji}>🚨</Text>
              <Text style={styles.btnText}>Call Emergency Services</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btn, { backgroundColor: '#00D4FF' }]} onPress={onTalkToAI}>
              <Text style={styles.btnEmoji}>✨</Text>
              <Text style={styles.btnText}>Talk to BridgeGuide AI Support</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btn, { backgroundColor: '#00FF88' }]} onPress={onLeaveChat}>
              <Text style={styles.btnEmoji}>🚪</Text>
              <Text style={[styles.btnText, { color: '#050505' }]}>Leave Chat Safely</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss}>
              <Text style={styles.dismissText}>I'm okay — continue chat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.65)' },
  sheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' as const,
    backgroundColor: '#0B0B0F', borderTopWidth: 1, borderTopColor: 'rgba(255,45,149,0.30)',
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 12 },
  headerEmoji: { fontSize: 28 },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' as const, flex: 1, fontFamily: 'SpaceGrotesk_700Bold' },
  body: { padding: 20, gap: 12 },
  message: { fontSize: 15, lineHeight: 22, color: '#FFFFFF', fontFamily: 'SpaceGrotesk_600SemiBold' },
  teenAlert: {
    flexDirection: 'row', padding: 12, gap: 10, alignItems: 'flex-start',
    backgroundColor: 'rgba(123,44,255,0.15)', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(123,44,255,0.30)',
  },
  teenAlertText: { flex: 1, fontSize: 13, lineHeight: 19, color: '#00D4FF', fontFamily: 'Inter_500Medium' },
  disclaimer: {
    flexDirection: 'row', padding: 10, gap: 8, alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12,
  },
  disclaimerText: { flex: 1, fontSize: 12, lineHeight: 17, color: MUTED, fontFamily: 'Inter_400Regular' },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 10, borderRadius: 18 },
  btnEmoji: { fontSize: 18 },
  btnText: { color: '#FFFFFF', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  dismissBtn: { alignItems: 'center', paddingVertical: 8 },
  dismissText: { fontSize: 14, color: MUTED, fontFamily: 'Inter_400Regular' },
});
