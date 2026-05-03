import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

interface SafetyModalProps {
  visible: boolean;
  level: 'distress' | 'crisis';
  onDismiss: () => void;
  onLeaveChat: () => void;
  onTalkToAI: () => void;
}

export default function SafetyModal({ visible, level, onDismiss, onLeaveChat, onTalkToAI }: SafetyModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 20 }]}>
          <View style={[styles.header, { backgroundColor: level === 'crisis' ? colors.destructive : colors.warning }]}>
            <Ionicons name="shield-checkmark" size={28} color="#FFFFFF" />
            <Text style={styles.headerTitle}>
              {level === 'crisis' ? 'You Matter — Please Read This' : 'We\'re Here For You'}
            </Text>
          </View>

          <View style={styles.body}>
            <Text style={[styles.message, { color: colors.foreground }]}>
              You are not alone. MindBridge is not an emergency service, but your safety matters deeply.
            </Text>
            <Text style={[styles.subMessage, { color: colors.mutedForeground }]}>
              {level === 'crisis'
                ? 'If you feel at risk, please contact emergency services or a trusted person near you immediately.'
                : 'It sounds like you may be going through a difficult time. Support is available.'}
            </Text>

            <View style={[styles.disclaimer, { backgroundColor: colors.muted, borderRadius: colors.radius }]}>
              <Ionicons name="information-circle-outline" size={16} color={colors.mutedForeground} />
              <Text style={[styles.disclaimerText, { color: colors.mutedForeground }]}>
                MindBridge is not a therapy service, medical provider, or crisis hotline.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.destructive, borderRadius: colors.radius }]}
              onPress={() => Linking.openURL('tel:911')}
            >
              <Ionicons name="call-outline" size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>Call Emergency Services</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
              onPress={onTalkToAI}
            >
              <Ionicons name="chatbubble-outline" size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>Talk to BridgeGuide AI Support</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.accent, borderRadius: colors.radius }]}
              onPress={onLeaveChat}
            >
              <Ionicons name="exit-outline" size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>Leave Chat Safely</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss}>
              <Text style={[styles.dismissText, { color: colors.mutedForeground }]}>{"I'm okay — continue chat"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 12,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700' as const,
    flex: 1,
  },
  body: {
    padding: 20,
    gap: 12,
  },
  message: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  subMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    gap: 8,
  },
  disclaimerText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600' as const,
  },
  dismissBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 4,
  },
  dismissText: {
    fontSize: 14,
  },
});
