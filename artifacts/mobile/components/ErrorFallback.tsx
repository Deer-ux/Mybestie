import { Feather } from "@expo/vector-icons";
import { reloadAppAsync } from "expo";
import React, { useState } from "react";
import {
  Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PINK = '#FF2D95';
const MUTED = 'rgba(255,255,255,0.50)';

export type ErrorFallbackProps = {
  error: Error;
  resetError: () => void;
};

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const insets = useSafeAreaInsets();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleRestart = async () => {
    try {
      await reloadAppAsync();
    } catch {
      resetError();
    }
  };

  const formatErrorDetails = (): string => {
    let details = `Error: ${error.message}\n\n`;
    if (error.stack) details += `Stack Trace:\n${error.stack}`;
    return details;
  };

  const monoFont = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });

  return (
    <View style={styles.container}>
      {__DEV__ ? (
        <Pressable
          onPress={() => setIsModalVisible(true)}
          accessibilityLabel="View error details"
          accessibilityRole="button"
          style={({ pressed }) => [styles.topButton, { top: insets.top + 16, opacity: pressed ? 0.8 : 1 }]}
        >
          <Feather name="alert-circle" size={20} color="#FFFFFF" />
        </Pressable>
      ) : null}

      <View style={styles.content}>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.message}>Please reload the app to continue.</Text>
        <Pressable
          onPress={handleRestart}
          style={({ pressed }) => [styles.button, { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
        >
          <Text style={styles.buttonText}>Try Again</Text>
        </Pressable>
      </View>

      {__DEV__ ? (
        <Modal visible={isModalVisible} animationType="slide" transparent onRequestClose={() => setIsModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Error Details</Text>
                <Pressable
                  onPress={() => setIsModalVisible(false)}
                  accessibilityLabel="Close error details"
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.closeButton, { opacity: pressed ? 0.6 : 1 }]}
                >
                  <Feather name="x" size={24} color="#FFFFFF" />
                </Pressable>
              </View>
              <ScrollView
                style={styles.modalScrollView}
                contentContainerStyle={[styles.modalScrollContent, { paddingBottom: insets.bottom + 16 }]}
                showsVerticalScrollIndicator
              >
                <View style={styles.errorContainer}>
                  <Text style={[styles.errorText, { fontFamily: monoFont }]} selectable>
                    {formatErrorDetails()}
                  </Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: "100%", height: "100%", justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: '#050505' },
  content: { alignItems: "center", justifyContent: "center", gap: 16, width: "100%", maxWidth: 600 },
  title: { fontSize: 28, fontWeight: "700", textAlign: "center", lineHeight: 40, color: '#FFFFFF', fontFamily: 'SpaceGrotesk_700Bold' },
  message: { fontSize: 16, textAlign: "center", lineHeight: 24, color: MUTED, fontFamily: 'Inter_400Regular' },
  topButton: {
    position: "absolute", right: 16, width: 44, height: 44, borderRadius: 8,
    flexDirection: "row", alignItems: "center", justifyContent: "center", zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  button: {
    paddingVertical: 16, borderRadius: 20, paddingHorizontal: 24, minWidth: 200,
    backgroundColor: PINK,
  },
  buttonText: { fontWeight: "600", textAlign: "center", fontSize: 16, color: '#FFFFFF', fontFamily: 'SpaceGrotesk_600SemiBold' },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.70)", justifyContent: "flex-end" },
  modalContainer: {
    width: "100%", height: "90%", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    backgroundColor: '#0B0B0F', borderTopWidth: 1, borderTopColor: 'rgba(255,45,149,0.30)',
  },
  modalHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  modalTitle: { fontSize: 20, fontWeight: "600", color: '#FFFFFF', fontFamily: 'SpaceGrotesk_700Bold' },
  closeButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  modalScrollView: { flex: 1 },
  modalScrollContent: { padding: 16 },
  errorContainer: { width: "100%", borderRadius: 12, overflow: "hidden", padding: 16, backgroundColor: 'rgba(255,255,255,0.05)' },
  errorText: { fontSize: 12, lineHeight: 18, width: "100%", color: '#FFFFFF' },
});
