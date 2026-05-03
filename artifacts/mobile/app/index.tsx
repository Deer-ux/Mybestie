import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Platform, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useApp } from '@/context/AppContext';
import BlobBackground from '@/components/BlobBackground';
import colors from '@/constants/colors';

const CHIPS = [
  { emoji: '💬', label: 'Chat' },
  { emoji: '🧠', label: 'AI Guide' },
  { emoji: '🌍', label: 'Global' },
  { emoji: '🔒', label: 'Anonymous' },
];

const FEATURES = [
  { emoji: '🔒', title: 'Anonymous Identity', desc: 'No real name, no phone. Always private.' },
  { emoji: '🧠', title: 'Smart Matching', desc: 'Matched by mood, goal, and personality.' },
  { emoji: '❤️', title: 'Emotional Support', desc: 'A safe space to share and be heard.' },
  { emoji: '✨', title: 'AI BridgeGuide', desc: 'Your personal AI conversation guide.' },
  { emoji: '🛡️', title: 'Teen Safety', desc: 'Separate moderated spaces for all ages.' },
  { emoji: '🤝', title: 'Real Reactions', desc: 'Express yourself with emoji reactions.' },
];

export default function LandingScreen() {
  const insets = useSafeAreaInsets();
  const { user, isLoading } = useApp();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  useEffect(() => {
    if (!isLoading && user?.isOnboarded) {
      router.replace('/(tabs)/home');
    }
  }, [isLoading, user]);

  if (isLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color="#FF2D95" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BlobBackground variant="default" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: topPad + 40,
          paddingBottom: botPad + 50,
          paddingHorizontal: 24,
          alignItems: 'center',
          gap: 32,
        }}
      >
        {/* ── Hero ──────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.hero}>
          {/* Title glow */}
          <View style={styles.titleWrap}>
            <Text style={styles.titleGlow} accessibilityLabel="MindBridge">MINDBRIDGE</Text>
            <Text style={styles.title}>MINDBRIDGE</Text>
          </View>

          <Text style={styles.subtitle}>
            ANONYMOUS CONVERSATIONS{'\n'}FOR REAL SUPPORT
          </Text>

          {/* Feature chips */}
          <View style={styles.chipRow}>
            {CHIPS.map(c => (
              <View key={c.label} style={styles.chip}>
                <Text style={{ fontSize: 14 }}>{c.emoji}</Text>
                <Text style={styles.chipText}>{c.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ── CTA buttons ───────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.ctaBlock}>
          <TouchableOpacity
            onPress={() => router.push('/onboarding')}
            style={styles.primaryBtnWrap}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={colors.gradPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtn}
            >
              <Text style={styles.primaryBtnText}>✨  Start Connecting</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/safety')}
            style={styles.secondaryBtn}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryBtnText}>↪  Rejoin Conversation</Text>
          </TouchableOpacity>

          <Text style={styles.helperText}>
            Already have a connection code? Tap Rejoin and enter your invite code.
          </Text>
        </Animated.View>

        {/* ── Feature grid ──────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(320).springify()} style={styles.featureSection}>
          <Text style={styles.sectionLabel}>WHY MINDBRIDGE?</Text>
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

        {/* ── Disclaimer ───────────────────────────── */}
        <Animated.View entering={FadeInUp.delay(420).springify()} style={styles.disclaimer}>
          <Text style={{ fontSize: 14 }}>⚠️</Text>
          <Text style={styles.disclaimerText}>
            MindBridge is not a therapy or crisis service. If you're in immediate danger, please contact emergency services.
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const PINK = '#FF2D95';
const CYAN = '#00D4FF';
const MUTED = 'rgba(255,255,255,0.50)';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  loadingScreen: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  hero: { alignItems: 'center', gap: 14, width: '100%' },
  titleWrap: { alignItems: 'center', justifyContent: 'center' },
  titleGlow: {
    position: 'absolute',
    fontSize: 52,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: PINK,
    letterSpacing: 3,
    textShadowColor: 'rgba(255,45,149,0.80)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
    opacity: 0.55,
  },
  title: {
    fontSize: 52,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: '#FFFFFF',
    letterSpacing: 3,
    textShadowColor: 'rgba(255,45,149,0.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'SpaceGrotesk_600SemiBold',
    color: MUTED,
    letterSpacing: 2.5,
    textAlign: 'center',
    lineHeight: 22,
  },
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  chipText: { color: '#FFFFFF', fontSize: 13, fontFamily: 'SpaceGrotesk_500Medium' },

  ctaBlock: { width: '100%', gap: 14 },
  primaryBtnWrap: {
    width: '100%', borderRadius: 20, overflow: 'hidden',
    shadowColor: PINK, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.55, shadowRadius: 22, elevation: 12,
  },
  primaryBtn: {
    height: 64, alignItems: 'center', justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF', fontSize: 17, fontFamily: 'SpaceGrotesk_700Bold', letterSpacing: 0.5,
  },
  secondaryBtn: {
    width: '100%', height: 58, alignItems: 'center', justifyContent: 'center',
    borderRadius: 20, borderWidth: 1.5, borderColor: CYAN,
    backgroundColor: 'rgba(0,212,255,0.06)',
  },
  secondaryBtnText: {
    color: CYAN, fontSize: 16, fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  helperText: {
    color: MUTED, fontSize: 12, textAlign: 'center', fontFamily: 'Inter_400Regular', lineHeight: 18,
  },

  featureSection: { width: '100%', gap: 14 },
  sectionLabel: {
    color: MUTED, fontSize: 11, fontFamily: 'SpaceGrotesk_600SemiBold', letterSpacing: 2.5, textAlign: 'center',
  },
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  featureCard: {
    width: '47%', flexGrow: 1, padding: 16, gap: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  featureEmoji: { fontSize: 26 },
  featureTitle: { color: '#FFFFFF', fontSize: 13, fontFamily: 'SpaceGrotesk_600SemiBold' },
  featureDesc: { color: MUTED, fontSize: 12, lineHeight: 17, fontFamily: 'Inter_400Regular' },

  disclaimer: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: 'rgba(255,176,32,0.10)', borderRadius: 16,
    padding: 14, width: '100%',
    borderWidth: 1, borderColor: 'rgba(255,176,32,0.20)',
  },
  disclaimerText: { flex: 1, color: 'rgba(255,176,32,0.90)', fontSize: 12, lineHeight: 18, fontFamily: 'Inter_400Regular' },
});
