import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Platform, ActivityIndicator,
  TextInput, Modal, Pressable,
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
const GREEN = '#00FF88';
const MUTED = 'rgba(255,255,255,0.50)';

const CHIPS = [
  { emoji: '💬', label: 'Chat' },
  { emoji: '🧠', label: 'AI Guide' },
  { emoji: '🌍', label: 'Global' },
  { emoji: '🔒', label: 'Anonymous' },
];

const FEATURES = [
  { emoji: '🔒', title: 'Anonymous Identity',  desc: 'No real name, no phone. Always private.' },
  { emoji: '🧠', title: 'Smart Matching',       desc: 'Matched by mood, goal, and personality.' },
  { emoji: '❤️', title: 'Emotional Support',    desc: 'A safe space to share and be heard.' },
  { emoji: '✨', title: 'Bestie AI',             desc: 'Your personal AI conversation guide.' },
  { emoji: '🛡️', title: 'Teen Safety',          desc: 'Separate moderated spaces for all ages.' },
  { emoji: '🤝', title: 'Real Reactions',       desc: 'Express yourself with emoji reactions.' },
];

type ReturnState = 'idle' | 'loading' | 'not_found';

export default function LandingScreen() {
  const insets = useSafeAreaInsets();
  const { createAnonymousSession, restoreSession } = useApp();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [startingUp,   setStartingUp]   = useState(false);
  const [returnState,  setReturnState]  = useState<ReturnState>('idle');
  const [showCode,     setShowCode]     = useState(false);
  const [code,         setCode]         = useState('');
  const [codeLoading,  setCodeLoading]  = useState(false);
  const [showOwner,    setShowOwner]    = useState(false);
  const [ownerTaps,    setOwnerTaps]    = useState(0);

  // No auto-redirect: logged-in users who visit "/" see this landing page.
  // They must tap "Return to My Profile" to go to the dashboard.

  // ── Action handlers ────────────────────────────────────────────────────────

  async function handleStartConnecting() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStartingUp(true);
    try {
      await createAnonymousSession();
      router.replace('/onboarding');
    } finally {
      setStartingUp(false);
    }
  }

  async function handleReturnProfile() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setReturnState('loading');
    const found = await restoreSession();
    if (found) {
      router.replace('/(tabs)/home');
    } else {
      setReturnState('not_found');
    }
  }

  function handleCodeExpand() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setReturnState('idle');
    setShowCode(s => !s);
    setCode('');
  }

  async function handleCodeSubmit() {
    if (!code.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCodeLoading(true);
    // No real backend yet — navigate to matching with the code param
    setTimeout(() => {
      setCodeLoading(false);
      setShowCode(false);
      router.push({ pathname: '/matching', params: { code: code.trim() } });
    }, 800);
  }

  // Hidden owner login — revealed after 5 taps on footer tap zone
  function handleVersionTap() {
    const n = ownerTaps + 1;
    setOwnerTaps(n);
    if (n >= 5) { setOwnerTaps(0); setShowOwner(true); }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <View style={styles.container}>
        <BlobBackground variant="default" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: topPad + 36,
            paddingBottom: botPad + 60,
            paddingHorizontal: 24,
            alignItems: 'center',
            gap: 28,
          }}
        >
          {/* ── Hero ── */}
          <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.hero}>
            <View style={styles.titleWrap}>
              <Text style={styles.titleGlow} accessibilityLabel="MyBestie">MYBESTIE</Text>
              <Text style={styles.title}>MYBESTIE</Text>
            </View>
            <Text style={styles.subtitle}>
              ANONYMOUS CONVERSATIONS{'\n'}FOR REAL SUPPORT
            </Text>
            <View style={styles.chipRow}>
              {CHIPS.map(c => (
                <View key={c.label} style={styles.chip}>
                  <Text style={{ fontSize: 14 }}>{c.emoji}</Text>
                  <Text style={styles.chipText}>{c.label}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* ── Auth actions ── */}
          <Animated.View entering={FadeInDown.delay(180).springify()} style={styles.actionsBlock}>

            {/* 1. Start Connecting */}
            <TouchableOpacity
              onPress={handleStartConnecting}
              disabled={startingUp}
              style={[styles.primaryBtnWrap, startingUp && { opacity: 0.7 }]}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={colors.gradPrimary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryBtn}
              >
                {startingUp
                  ? <ActivityIndicator color="#FFFFFF" />
                  : <Text style={styles.primaryBtnText}>✨  Start Connecting</Text>
                }
              </LinearGradient>
              <Text style={styles.btnSub}>Create a new anonymous identity</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* 2. Return to My Profile */}
            <View style={styles.secondaryGroup}>
              <TouchableOpacity
                onPress={handleReturnProfile}
                disabled={returnState === 'loading'}
                style={styles.secondaryBtn}
                activeOpacity={0.85}
              >
                {returnState === 'loading'
                  ? <ActivityIndicator color={CYAN} size="small" />
                  : (
                    <>
                      <Ionicons name="person-circle-outline" size={20} color={CYAN} />
                      <Text style={styles.secondaryBtnText}>Return to My Profile</Text>
                    </>
                  )
                }
              </TouchableOpacity>
              <Text style={styles.btnSub}>Continue your anonymous session on this device</Text>

              {/* No-profile-found error */}
              {returnState === 'not_found' && (
                <Animated.View entering={FadeInDown.springify()} style={styles.notFoundCard}>
                  <Text style={{ fontSize: 18 }}>🔍</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.notFoundTitle}>No profile found on this device</Text>
                    <Text style={styles.notFoundBody}>
                      Your session may have been cleared. Start fresh with a new anonymous profile.
                    </Text>
                    <TouchableOpacity
                      onPress={handleStartConnecting}
                      style={styles.notFoundAction}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.notFoundActionText}>✨ Create new profile</Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              )}
            </View>

            {/* 3. Have a code? (small link → expandable input) */}
            <TouchableOpacity onPress={handleCodeExpand} style={styles.codeLink} activeOpacity={0.75}>
              <Ionicons name={showCode ? 'chevron-up' : 'link-outline'} size={15} color={MUTED} />
              <Text style={styles.codeLinkText}>
                {showCode ? 'Hide invite code' : 'Have a code? Rejoin conversation'}
              </Text>
            </TouchableOpacity>

            {showCode && (
              <Animated.View entering={FadeInDown.springify()} style={styles.codeInputWrap}>
                <View style={styles.codeInputRow}>
                  <TextInput
                    style={styles.codeInput}
                    placeholder="Enter invite code…"
                    placeholderTextColor={MUTED}
                    value={code}
                    onChangeText={setCode}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="go"
                    onSubmitEditing={handleCodeSubmit}
                  />
                  <TouchableOpacity
                    onPress={handleCodeSubmit}
                    disabled={!code.trim() || codeLoading}
                    style={[styles.codeSubmitBtn, (!code.trim() || codeLoading) && { opacity: 0.45 }]}
                    activeOpacity={0.85}
                  >
                    {codeLoading
                      ? <ActivityIndicator color="#FFFFFF" size="small" />
                      : <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                    }
                  </TouchableOpacity>
                </View>
                <Text style={styles.codeHint}>Ask your conversation partner for their invite code.</Text>
              </Animated.View>
            )}
          </Animated.View>

          {/* ── Feature grid ── */}
          <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.featureSection}>
            <Text style={styles.sectionLabel}>WHY MYBESTIE?</Text>
            <View style={styles.featureGrid}>
              {FEATURES.map((f, i) => (
                <View key={i} style={styles.featureCard}>
                  <Text style={styles.featureEmoji}>{f.emoji}</Text>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureDesc}>{f.desc}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* ── Disclaimer ── */}
          <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.disclaimer}>
            <Text style={{ fontSize: 14 }}>⚠️</Text>
            <Text style={styles.disclaimerText}>
              MyBestie is not a therapy or crisis service. If you're in immediate danger, please contact emergency services.
            </Text>
          </Animated.View>

          {/* ── Hidden owner login tap zone ── */}
          <TouchableOpacity onPress={handleVersionTap} style={styles.versionZone} activeOpacity={1}>
            <Text style={styles.versionText}>MyBestie v1.0.0 · Anonymous-first</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* ── Owner Login Modal ── */}
      <Modal visible={showOwner} transparent animationType="fade" onRequestClose={() => setShowOwner(false)}>
        <Pressable style={styles.ownerBackdrop} onPress={() => setShowOwner(false)}>
          <Pressable style={styles.ownerCard} onPress={() => {}}>
            <View style={styles.ownerIconWrap}>
              <Text style={{ fontSize: 30 }}>🔐</Text>
            </View>
            <Text style={styles.ownerTitle}>Owner Login</Text>
            <Text style={styles.ownerBody}>
              This area is for the app owner only. Regular users do not need a password — your MyBestie account is fully anonymous.
            </Text>
            <TouchableOpacity
              onPress={() => { setShowOwner(false); router.push('/owner-login'); }}
              style={styles.ownerBtn}
              activeOpacity={0.88}
            >
              <LinearGradient colors={['#6C0FBF', '#2D0B6B']} style={styles.ownerBtnGrad}>
                <Text style={styles.ownerBtnText}>Owner Login</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowOwner(false)} style={styles.ownerCancelBtn}>
              <Text style={styles.ownerCancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#050505' },
  loadingScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#050505' },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero:      { alignItems: 'center', gap: 14, width: '100%' },
  titleWrap: { alignItems: 'center', justifyContent: 'center' },
  titleGlow: {
    position: 'absolute', fontSize: 52, fontFamily: 'SpaceGrotesk_700Bold',
    color: PINK, letterSpacing: 3,
    textShadowColor: 'rgba(255,45,149,0.80)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 30,
    opacity: 0.55,
  },
  title: {
    fontSize: 52, fontFamily: 'SpaceGrotesk_700Bold', color: '#FFFFFF', letterSpacing: 3,
    textShadowColor: 'rgba(255,45,149,0.45)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 16,
  },
  subtitle: {
    fontSize: 13, fontFamily: 'SpaceGrotesk_600SemiBold', color: MUTED,
    letterSpacing: 2.5, textAlign: 'center', lineHeight: 22,
  },
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  chipText: { color: '#FFFFFF', fontSize: 13, fontFamily: 'SpaceGrotesk_500Medium' },

  // ── Auth actions ──────────────────────────────────────────────────────────
  actionsBlock:    { width: '100%', gap: 16 },
  primaryBtnWrap:  { width: '100%', gap: 7 },
  primaryBtn: {
    height: 64, alignItems: 'center', justifyContent: 'center',
    borderRadius: 20,
    shadowColor: PINK, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.55, shadowRadius: 22, elevation: 12,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 17, fontFamily: 'SpaceGrotesk_700Bold', letterSpacing: 0.5 },
  btnSub: { color: MUTED, fontSize: 12, textAlign: 'center', fontFamily: 'Inter_400Regular' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.12)' },
  dividerText: { color: MUTED, fontSize: 12, fontFamily: 'Inter_500Medium', letterSpacing: 1.5 },

  secondaryGroup: { gap: 7 },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 58, borderRadius: 20, borderWidth: 1.5, borderColor: CYAN,
    backgroundColor: 'rgba(0,212,255,0.06)',
  },
  secondaryBtnText: { color: CYAN, fontSize: 16, fontFamily: 'SpaceGrotesk_600SemiBold' },

  notFoundCard: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    backgroundColor: 'rgba(255,176,32,0.08)', borderRadius: 16,
    padding: 14, borderWidth: 1, borderColor: 'rgba(255,176,32,0.20)',
    marginTop: 4,
  },
  notFoundTitle:      { color: '#FFFFFF', fontSize: 14, fontFamily: 'SpaceGrotesk_600SemiBold', marginBottom: 4 },
  notFoundBody:       { color: MUTED, fontSize: 12, lineHeight: 18, fontFamily: 'Inter_400Regular' },
  notFoundAction:     { marginTop: 10, alignSelf: 'flex-start' },
  notFoundActionText: { color: PINK, fontSize: 13, fontFamily: 'SpaceGrotesk_600SemiBold' },

  codeLink: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 4,
  },
  codeLinkText: { color: MUTED, fontSize: 13, fontFamily: 'Inter_500Medium' },

  codeInputWrap: { gap: 8 },
  codeInputRow:  {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)',
    paddingLeft: 16, paddingRight: 6, paddingVertical: 6,
  },
  codeInput:     { flex: 1, fontSize: 15, color: '#FFFFFF', fontFamily: 'Inter_400Regular', paddingVertical: 8 },
  codeSubmitBtn: {
    width: 42, height: 42, borderRadius: 13,
    backgroundColor: PINK, alignItems: 'center', justifyContent: 'center',
  },
  codeHint: { color: MUTED, fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center' },

  // ── Feature grid ──────────────────────────────────────────────────────────
  featureSection: { width: '100%', gap: 14 },
  sectionLabel: {
    color: MUTED, fontSize: 11, fontFamily: 'SpaceGrotesk_600SemiBold',
    letterSpacing: 2.5, textAlign: 'center',
  },
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  featureCard: {
    width: '47%', flexGrow: 1, padding: 16, gap: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  featureEmoji: { fontSize: 26 },
  featureTitle: { color: '#FFFFFF', fontSize: 13, fontFamily: 'SpaceGrotesk_600SemiBold' },
  featureDesc:  { color: MUTED, fontSize: 12, lineHeight: 17, fontFamily: 'Inter_400Regular' },

  // ── Disclaimer ────────────────────────────────────────────────────────────
  disclaimer: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: 'rgba(255,176,32,0.10)', borderRadius: 16,
    padding: 14, width: '100%', borderWidth: 1, borderColor: 'rgba(255,176,32,0.20)',
  },
  disclaimerText: {
    flex: 1, color: 'rgba(255,176,32,0.90)', fontSize: 12, lineHeight: 18, fontFamily: 'Inter_400Regular',
  },

  // ── Version / hidden owner tap zone ──────────────────────────────────────
  versionZone:  { alignItems: 'center', paddingVertical: 12 },
  versionText:  { color: 'rgba(255,255,255,0.18)', fontSize: 11, fontFamily: 'Inter_400Regular' },

  // ── Owner Login Modal ─────────────────────────────────────────────────────
  ownerBackdrop: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)', paddingHorizontal: 28,
  },
  ownerCard: {
    width: '100%', maxWidth: 360,
    backgroundColor: '#131318', borderRadius: 24,
    padding: 28, alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: 'rgba(108,15,191,0.45)',
  },
  ownerIconWrap:   {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: 'rgba(108,15,191,0.18)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  ownerTitle:       { color: '#FFFFFF', fontSize: 20, fontFamily: 'SpaceGrotesk_700Bold' },
  ownerBody:        { color: MUTED, fontSize: 13, lineHeight: 20, textAlign: 'center', fontFamily: 'Inter_400Regular' },
  ownerBtn:         { width: '100%', borderRadius: 16, overflow: 'hidden', marginTop: 4 },
  ownerBtnGrad:     { paddingVertical: 15, alignItems: 'center' },
  ownerBtnText:     { color: '#FFFFFF', fontSize: 15, fontFamily: 'SpaceGrotesk_700Bold' },
  ownerCancelBtn:   { paddingVertical: 10 },
  ownerCancelText:  { color: MUTED, fontSize: 14, fontFamily: 'Inter_500Medium' },
});
