import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

export default function LandingScreen() {
  const insets = useSafeAreaInsets();
  const { user, isLoading } = useApp();
  const colors = useColors();

  useEffect(() => {
    if (!isLoading && user) {
      if (user.isOnboarded) {
        router.replace('/(tabs)/home');
      }
    }
  }, [isLoading, user]);

  if (isLoading) {
    return (
      <LinearGradient colors={['#1B3A6B', '#7C5CBF']} style={styles.loadingContainer}>
        <ActivityIndicator color="#FFFFFF" size="large" />
      </LinearGradient>
    );
  }

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <LinearGradient colors={['#0D1B33', '#1B3A6B', '#2E1B5A']} style={styles.container}>
      <View style={[styles.content, { paddingTop: topPad + 20, paddingBottom: insets.bottom + 24 }]}>
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.heroSection}>
          <View style={styles.logoRing}>
            <LinearGradient colors={['#4A90D9', '#9B7FD4']} style={styles.logoGradient}>
              <Ionicons name="infinite" size={40} color="#FFFFFF" />
            </LinearGradient>
          </View>
          <Text style={styles.appName}>MindBridge</Text>
          <Text style={styles.tagline}>Anonymous. Safe. Meaningful.</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.featuresSection}>
          {[
            { icon: 'shield-checkmark-outline', text: 'Fully anonymous — no real name needed' },
            { icon: 'people-outline', text: 'Smart matching based on your mood & interests' },
            { icon: 'chatbubbles-outline', text: 'Real conversations, real human connection' },
            { icon: 'heart-outline', text: 'BridgeGuide AI keeps conversations safe & kind' },
          ].map((feature, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureIconWrap}>
                <Ionicons name={feature.icon as keyof typeof Ionicons.glyphMap} size={18} color="#9B7FD4" />
              </View>
              <Text style={styles.featureText}>{feature.text}</Text>
            </View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(600).springify()} style={styles.ctaSection}>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => router.push('/onboarding')}
            activeOpacity={0.85}
          >
            <LinearGradient colors={['#4A90D9', '#7C5CBF']} style={styles.ctaGradient}>
              <Text style={styles.ctaText}>{"Get Started — It's Free"}</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>

          <View style={[styles.disclaimerBox, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
            <Ionicons name="information-circle-outline" size={14} color="rgba(255,255,255,0.5)" />
            <Text style={styles.disclaimerText}>
              Not a therapy service or emergency crisis service. For emergencies, call your local services.
            </Text>
          </View>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 20,
  },
  logoRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    padding: 4,
    marginBottom: 20,
  },
  logoGradient: {
    flex: 1,
    borderRadius: 41,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 38,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 0.5,
  },
  featuresSection: {
    gap: 14,
    paddingVertical: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(155,127,212,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    flex: 1,
    lineHeight: 20,
  },
  ctaSection: {
    gap: 16,
  },
  ctaButton: {
    borderRadius: 16,
    overflow: 'hidden' as const,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700' as const,
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 12,
  },
  disclaimerText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    flex: 1,
    lineHeight: 17,
  },
});
