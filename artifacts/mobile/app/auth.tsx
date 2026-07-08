import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, ScrollView,
  Platform, KeyboardAvoidingView,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import BlobBackground from '@/components/BlobBackground';
import colors from '@/constants/colors';

const PINK  = '#FF2D95';
const CYAN  = '#00D4FF';
const MUTED = 'rgba(255,255,255,0.50)';
const CARD  = 'rgba(255,255,255,0.05)';
const CBORDER = 'rgba(255,255,255,0.12)';

type Mode = 'login' | 'register';

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { loginWithPassword, registerWithPassword } = useApp();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function switchMode(m: Mode) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMode(m);
    setError('');
    setUsername('');
    setPassword('');
  }

  async function handleSubmit() {
    if (!username.trim() || !password.trim()) {
      setError('Please fill in both fields.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setError('');

    let result: { ok: boolean; error?: string };

    if (mode === 'register') {
      result = await registerWithPassword(username.trim(), password.trim());
    } else {
      result = await loginWithPassword(username.trim(), password.trim());
    }

    setLoading(false);

    if (!result.ok) {
      setError(result.error ?? 'Something went wrong. Please try again.');
      return;
    }

    // New registrations go to onboarding; returning users go home
    if (mode === 'register') {
      router.replace('/onboarding');
    } else {
      router.replace('/(tabs)/home');
    }
  }

  const isRegister = mode === 'register';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <BlobBackground variant="default" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: topPad + 24,
            paddingBottom: botPad + 40,
            paddingHorizontal: 24,
            alignItems: 'center',
            gap: 28,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back */}
          <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.backRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backBtn}
              activeOpacity={0.75}
            >
              <Ionicons name="chevron-back" size={20} color={MUTED} />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Logo / title */}
          <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.hero}>
            <View style={styles.logoWrap}>
              <LinearGradient
                colors={colors.gradPrimary}
                style={styles.logoGrad}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              >
                <Text style={styles.logoEmoji}>✨</Text>
              </LinearGradient>
            </View>
            <Text style={styles.title}>MyBestie</Text>
            <Text style={styles.subtitle}>Your identity stays anonymous.</Text>
          </Animated.View>

          {/* Mode tabs */}
          <Animated.View entering={FadeInDown.delay(120).springify()} style={styles.tabRow}>
            <TouchableOpacity
              onPress={() => switchMode('login')}
              style={[styles.tab, mode === 'login' && styles.tabActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>Log In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => switchMode('register')}
              style={[styles.tab, mode === 'register' && styles.tabActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>Create Account</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Form card */}
          <Animated.View entering={FadeInDown.delay(180).springify()} style={styles.card}>
            <Text style={styles.cardTitle}>
              {isRegister ? '🌟 Create your account' : '👋 Welcome back'}
            </Text>
            <Text style={styles.cardSub}>
              {isRegister
                ? 'Pick a username — no real name or email needed.'
                : 'Log in to continue your anonymous journey.'}
            </Text>

            {/* Username */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>USERNAME</Text>
              <View style={styles.inputRow}>
                <Ionicons name="person-outline" size={18} color={MUTED} style={{ marginLeft: 14 }} />
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={v => { setUsername(v); setError(''); }}
                  placeholder="e.g. CosmicPanda42"
                  placeholderTextColor={MUTED}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>
              {isRegister && (
                <Text style={styles.fieldHint}>Letters, numbers, underscores only (3–24 chars)</Text>
              )}
            </View>

            {/* Password */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>PASSWORD</Text>
              <View style={styles.inputRow}>
                <Ionicons name="lock-closed-outline" size={18} color={MUTED} style={{ marginLeft: 14 }} />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={v => { setPassword(v); setError(''); }}
                  placeholder={isRegister ? 'At least 6 characters' : 'Your password'}
                  placeholderTextColor={MUTED}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="go"
                  onSubmitEditing={handleSubmit}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(s => !s)}
                  style={{ padding: 14 }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={MUTED}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Error */}
            {!!error && (
              <Animated.View entering={FadeInUp.springify()} style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={16} color="#FF4455" />
                <Text style={styles.errorText}>{error}</Text>
              </Animated.View>
            )}

            {/* Submit */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              style={[styles.submitWrap, loading && { opacity: 0.7 }]}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={colors.gradPrimary}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.submitBtn}
              >
                {loading
                  ? <ActivityIndicator color="#FFFFFF" />
                  : <Text style={styles.submitText}>
                      {isRegister ? '🚀  Create Account' : '✨  Log In'}
                    </Text>
                }
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Switch mode link */}
          <Animated.View entering={FadeInDown.delay(240).springify()} style={styles.switchRow}>
            <Text style={styles.switchText}>
              {isRegister ? 'Already have an account?' : "Don't have an account?"}
            </Text>
            <TouchableOpacity onPress={() => switchMode(isRegister ? 'login' : 'register')} activeOpacity={0.75}>
              <Text style={styles.switchLink}>
                {isRegister ? ' Log in' : ' Create one'}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Privacy note */}
          <Animated.View entering={FadeInDown.delay(280).springify()} style={styles.privacyNote}>
            <Ionicons name="shield-checkmark-outline" size={14} color="#00FF88" />
            <Text style={styles.privacyText}>
              No email, no phone number. Your real identity is never stored.
            </Text>
          </Animated.View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },

  backRow:  { width: '100%' },
  backBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  backText: { fontSize: 14, color: MUTED, fontFamily: 'Inter_500Medium' },

  hero:       { alignItems: 'center', gap: 10 },
  logoWrap:   { marginBottom: 4 },
  logoGrad:   {
    width: 72, height: 72, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: PINK, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 20, elevation: 10,
  },
  logoEmoji:  { fontSize: 34 },
  title:      {
    fontSize: 34, fontFamily: 'SpaceGrotesk_700Bold', color: '#FFFFFF', letterSpacing: 1,
    textShadowColor: 'rgba(255,45,149,0.4)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 14,
  },
  subtitle:   { fontSize: 14, color: MUTED, fontFamily: 'Inter_400Regular' },

  tabRow:      {
    flexDirection: 'row', width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16, padding: 4,
    borderWidth: 1, borderColor: CBORDER,
  },
  tab:         { flex: 1, paddingVertical: 11, alignItems: 'center', borderRadius: 13 },
  tabActive:   { backgroundColor: PINK },
  tabText:     { fontSize: 14, color: MUTED, fontFamily: 'SpaceGrotesk_600SemiBold' },
  tabTextActive: { color: '#FFFFFF' },

  card:       {
    width: '100%', backgroundColor: CARD,
    borderRadius: 24, borderWidth: 1, borderColor: CBORDER,
    padding: 24, gap: 18,
  },
  cardTitle:  { fontSize: 18, color: '#FFFFFF', fontFamily: 'SpaceGrotesk_700Bold' },
  cardSub:    { fontSize: 13, color: MUTED, fontFamily: 'Inter_400Regular', lineHeight: 19, marginTop: -8 },

  fieldWrap:  { gap: 8 },
  fieldLabel: { fontSize: 11, color: MUTED, fontFamily: 'SpaceGrotesk_600SemiBold', letterSpacing: 1.5 },
  fieldHint:  { fontSize: 11, color: 'rgba(255,255,255,0.30)', fontFamily: 'Inter_400Regular' },
  inputRow:   {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: CBORDER,
    borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.04)',
    overflow: 'hidden',
  },
  input:      {
    flex: 1, padding: 14, fontSize: 15,
    color: '#FFFFFF', fontFamily: 'Inter_400Regular',
  },

  errorBox:   {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,68,85,0.10)', borderRadius: 12,
    padding: 12, borderWidth: 1, borderColor: 'rgba(255,68,85,0.25)',
  },
  errorText:  { flex: 1, color: '#FF4455', fontSize: 13, fontFamily: 'Inter_500Medium', lineHeight: 18 },

  submitWrap: { borderRadius: 20, overflow: 'hidden' },
  submitBtn:  {
    height: 58, alignItems: 'center', justifyContent: 'center',
    shadowColor: PINK, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 18, elevation: 10,
  },
  submitText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'SpaceGrotesk_700Bold' },

  switchRow:  { flexDirection: 'row', alignItems: 'center' },
  switchText: { color: MUTED, fontSize: 14, fontFamily: 'Inter_400Regular' },
  switchLink: { color: CYAN, fontSize: 14, fontFamily: 'Inter_600SemiBold' },

  privacyNote: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(0,255,136,0.07)', borderRadius: 14,
    padding: 12, width: '100%',
    borderWidth: 1, borderColor: 'rgba(0,255,136,0.15)',
  },
  privacyText: { flex: 1, color: '#00FF88', fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
});
