import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Platform, ActivityIndicator, Image,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import BlobBackground from '@/components/BlobBackground';

const FEATURES = [
  { emoji: '🔒', title: 'Anonymous Identity', desc: 'No real name. No phone. Always private.' },
  { emoji: '🧠', title: 'Smart Matching', desc: 'Matched by mood, goal, personality, and interests.' },
  { emoji: '❤️', title: 'Emotional Support', desc: 'Safe space to share, listen, and connect.' },
  { emoji: '✨', title: 'AI BridgeGuide', desc: 'AI assistant to guide every conversation.' },
  { emoji: '🛡️', title: 'Teen & Adult Safety', desc: 'Separate spaces for teens and adults.' },
  { emoji: '🤝', title: 'Emoji Reactions', desc: 'Express yourself naturally with emoji reactions.' },
];

export default function LandingScreen() {
  const colors = useColors();
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
      <View style={[styles.loadingScreen, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <BlobBackground />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: topPad + 24, paddingBottom: botPad + 40, paddingHorizontal: 24, gap: 32 }}
      >
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.heroSection}>
          <View style={[styles.logoPill, { backgroundColor: colors.lavenderLight }]}>
            <Text style={styles.logoPillText}>✨ Anonymous • Safe • Meaningful</Text>
          </View>
          <Text style={[styles.appName, { color: colors.primary, fontFamily: 'Poppins_700Bold' }]}>
            MindBridge
          </Text>
          <Text style={[styles.tagline, { color: colors.foreground, fontFamily: 'Poppins_600SemiBold' }]}>
            {"Anonymous conversations.\nReal support. Safer connections."}
          </Text>
          <Text style={[styles.desc, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            MindBridge connects people anonymously through mood, interests, personality, and temperament — in a safe, moderated space.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.heroImageWrap}>
          <LinearGradient
            colors={['rgba(162,155,254,0.15)', 'rgba(31,111,139,0.10)']}
            style={styles.heroImageCard}
          >
            <Text style={styles.heroEmojis}>{"🌍  👥  💬  ❤️  🤝  ✨"}</Text>
            <Text style={[styles.heroQuote, { color: colors.primary, fontFamily: 'Poppins_500Medium' }]}>
              {"\"Real conversations,\nreal human connection.\""}
            </Text>
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.ctaRow}>
          <TouchableOpacity
            onPress={() => router.push('/onboarding')}
            style={[styles.primaryBtn, { borderRadius: colors.radius }]}
            activeOpacity={0.88}
          >
            <LinearGradient colors={['#1F6F8B', '#0B3C5D']} style={styles.primaryBtnGrad}>
              <Text style={[styles.primaryBtnText, { fontFamily: 'Inter_600SemiBold' }]}>Start Anonymously</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/safety')}
            style={[styles.secondaryBtn, { borderRadius: colors.radius, borderColor: colors.border }]}
            activeOpacity={0.85}
          >
            <Text style={[styles.secondaryBtnText, { color: colors.primary, fontFamily: 'Inter_600SemiBold' }]}>
              Learn How It Works
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <Text style={[styles.sectionLabel, { color: colors.foreground, fontFamily: 'Poppins_600SemiBold' }]}>
            Why MindBridge?
          </Text>
          <View style={styles.featureGrid}>
            {FEATURES.map((f, i) => (
              <View
                key={i}
                style={[styles.featureCard, {
                  backgroundColor: colors.glass,
                  borderColor: colors.glassBorder,
                  borderRadius: colors.radius,
                  shadowColor: colors.primary,
                }]}
              >
                <Text style={styles.featureEmoji}>{f.emoji}</Text>
                <Text style={[styles.featureTitle, { color: colors.foreground, fontFamily: 'Poppins_500Medium' }]}>{f.title}</Text>
                <Text style={[styles.featureDesc, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>{f.desc}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(500).springify()}>
          <View style={[styles.disclaimerCard, { backgroundColor: colors.warningLight, borderRadius: colors.radius }]}>
            <Text style={{ fontSize: 16 }}>⚠️</Text>
            <Text style={[styles.disclaimerText, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}>
              MindBridge is not a therapy service or emergency crisis service. If you are in immediate danger, contact emergency services or someone you trust.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingScreen: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heroSection: { gap: 12, alignItems: 'flex-start' },
  logoPill: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start',
  },
  logoPillText: { color: '#6C63FF', fontSize: 12, fontWeight: '600' as const },
  appName: { fontSize: 44, letterSpacing: -1 },
  tagline: { fontSize: 22, lineHeight: 32, color: '#1F2937' },
  desc: { fontSize: 15, lineHeight: 22, color: '#6B7280' },
  heroImageWrap: { borderRadius: 24, overflow: 'hidden' as const },
  heroImageCard: {
    padding: 32, alignItems: 'center', justifyContent: 'center', gap: 16, borderRadius: 24,
  },
  heroEmojis: { fontSize: 28, letterSpacing: 4 },
  heroQuote: { fontSize: 18, textAlign: 'center', lineHeight: 27 },
  ctaRow: { gap: 12 },
  primaryBtn: { overflow: 'hidden' as const },
  primaryBtnGrad: { paddingVertical: 17, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16 },
  secondaryBtn: {
    paddingVertical: 15, alignItems: 'center', borderWidth: 1.5,
  },
  secondaryBtnText: { fontSize: 16 },
  sectionLabel: { fontSize: 18, marginBottom: 14 },
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  featureCard: {
    width: '47%', flexGrow: 1, padding: 16, gap: 8,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
  featureEmoji: { fontSize: 26 },
  featureTitle: { fontSize: 14 },
  featureDesc: { fontSize: 12, lineHeight: 17 },
  disclaimerCard: { flexDirection: 'row', padding: 14, gap: 10, alignItems: 'flex-start' },
  disclaimerText: { flex: 1, fontSize: 13, lineHeight: 19 },
});
