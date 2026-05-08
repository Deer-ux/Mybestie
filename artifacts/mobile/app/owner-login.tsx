import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Platform, ActivityIndicator, KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import BlobBackground from '@/components/BlobBackground';

const CYAN  = '#00D4FF';
const MUTED = 'rgba(255,255,255,0.50)';
const PURPLE = '#6C0FBF';

export default function OwnerLoginScreen() {
  const insets = useSafeAreaInsets();
  const { ownerLogin } = useApp();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [code,     setCode]     = useState('');
  const [showCode, setShowCode] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const canSubmit = code.trim().length > 0 && !loading;

  async function handleLogin() {
    if (!canSubmit) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setError('');
    const result = await ownerLogin(code);
    setLoading(false);
    if (result.ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/owner-dashboard');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(result.error ?? 'Login failed. Please check your owner code.');
      setCode('');
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
        <BlobBackground variant="purple" />

        <LinearGradient
          colors={['#1A0B2E', '#050505']}
          style={[styles.header, { paddingTop: topPad + 12 }]}
        >
          <TouchableOpacity onPress={() => router.replace('/')} style={styles.backBtn} activeOpacity={0.75}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <View style={styles.lockIcon}>
              <Text style={{ fontSize: 28 }}>🔐</Text>
            </View>
            <Text style={styles.headerTitle}>Owner Login</Text>
            <Text style={styles.headerSub}>Admin access only · Not for regular users</Text>
          </View>
        </LinearGradient>

        <ScrollView
          contentContainerStyle={[styles.body, { paddingBottom: botPad + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.card}>

            <View style={styles.noticeRow}>
              <Ionicons name="shield-checkmark-outline" size={16} color={CYAN} />
              <Text style={styles.noticeText}>
                This login is for the app owner only. Regular users sign in anonymously — no code needed.
              </Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>OWNER CODE</Text>
              <View style={[styles.inputWrap, error ? styles.inputError : null]}>
                <Ionicons name="key-outline" size={18} color={MUTED} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={code}
                  onChangeText={t => { setCode(t); setError(''); }}
                  placeholder="Enter your owner code"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  secureTextEntry={!showCode}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="go"
                  onSubmitEditing={handleLogin}
                  autoFocus
                />
                <TouchableOpacity onPress={() => setShowCode(s => !s)} style={styles.eyeBtn} activeOpacity={0.7}>
                  <Ionicons name={showCode ? 'eye-off-outline' : 'eye-outline'} size={18} color={MUTED} />
                </TouchableOpacity>
              </View>
            </View>

            {error !== '' && (
              <Animated.View entering={FadeInDown} style={styles.errorRow}>
                <Ionicons name="alert-circle-outline" size={16} color="#FF4455" />
                <Text style={styles.errorText}>{error}</Text>
              </Animated.View>
            )}

            <TouchableOpacity
              onPress={handleLogin}
              disabled={!canSubmit}
              style={[styles.loginBtnWrap, { opacity: canSubmit ? 1 : 0.4 }]}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={['#6C0FBF', '#2D0B6B']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.loginBtn}
              >
                {loading
                  ? <ActivityIndicator color="#FFFFFF" />
                  : (
                    <>
                      <Ionicons name="log-in-outline" size={20} color="#FFFFFF" />
                      <Text style={styles.loginBtnText}>Enter Owner Dashboard</Text>
                    </>
                  )
                }
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.replace('/')} style={styles.userLink} activeOpacity={0.75}>
              <Text style={styles.userLinkText}>← Back to landing page</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.secNote}>
            <Text style={{ fontSize: 13 }}>🔒</Text>
            <Text style={styles.secNoteText}>
              Your owner code is verified server-side. The session token is stored securely on this device and cleared on logout.
            </Text>
          </Animated.View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#050505' },
  header:       { paddingHorizontal: 20, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  backBtn:      { marginBottom: 16, alignSelf: 'flex-start' },
  headerCenter: { alignItems: 'center', gap: 10 },
  lockIcon: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: 'rgba(108,15,191,0.20)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(108,15,191,0.40)',
  },
  headerTitle:  { color: '#FFFFFF', fontSize: 22, fontFamily: 'SpaceGrotesk_700Bold' },
  headerSub:    { color: MUTED, fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center' },

  body: { paddingHorizontal: 20, paddingTop: 28, gap: 16 },

  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 24, padding: 22, gap: 18,
    borderWidth: 1, borderColor: 'rgba(108,15,191,0.25)',
  },
  noticeRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: 'rgba(0,212,255,0.08)', borderRadius: 12,
    padding: 12, borderWidth: 1, borderColor: 'rgba(0,212,255,0.18)',
  },
  noticeText: { flex: 1, color: CYAN, fontSize: 12, lineHeight: 18, fontFamily: 'Inter_400Regular' },

  fieldGroup:   { gap: 6 },
  fieldLabel:   { color: MUTED, fontSize: 11, fontFamily: 'SpaceGrotesk_600SemiBold', letterSpacing: 1.5 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 16, paddingRight: 12,
  },
  inputError:   { borderColor: '#FF4455' },
  inputIcon:    { paddingHorizontal: 14 },
  input:        { flex: 1, paddingVertical: 16, fontSize: 16, color: '#FFFFFF', fontFamily: 'Inter_400Regular' },
  eyeBtn:       { padding: 8 },

  errorRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,68,85,0.10)', borderRadius: 12,
    padding: 12, borderWidth: 1, borderColor: 'rgba(255,68,85,0.25)',
  },
  errorText: { flex: 1, color: '#FF4455', fontSize: 13, fontFamily: 'Inter_500Medium' },

  loginBtnWrap: { borderRadius: 16, overflow: 'hidden' },
  loginBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 17, gap: 10,
  },
  loginBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'SpaceGrotesk_700Bold' },

  userLink:     { alignItems: 'center', paddingVertical: 4 },
  userLinkText: { color: MUTED, fontSize: 13, fontFamily: 'Inter_500Medium' },

  secNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  secNoteText: { flex: 1, color: MUTED, fontSize: 12, lineHeight: 18, fontFamily: 'Inter_400Regular' },
});
