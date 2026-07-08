import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import * as Font from "expo-font";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, router, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, ReactNode } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider, useApp } from "@/context/AppContext";
import { ChatProvider } from "@/context/ChatContext";
import { InboxProvider } from "@/context/InboxContext";

// Routes that require a logged-in user. Any other path is public.
const PROTECTED_PREFIXES = [
  '/(tabs)',
  '/matching',
  '/conversation',
  '/chat',
  '/owner-dashboard',
  '/admin',
  '/analytics',
  '/bridge-guide',
  '/feedback',
  '/send-message',
];

function RouteGuard() {
  const { user, isLoading } = useApp();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (user) return; // logged in — nothing to do

    const isProtected = PROTECTED_PREFIXES.some(prefix => pathname.startsWith(prefix));
    if (!isProtected) return;

    console.log('[MyBestie] Logged-out user on protected route', pathname, '— redirecting to /');
    // Use hard redirect on web so all React state is fully reset
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.href = '/';
    } else {
      router.replace('/');
    }
  }, [user, isLoading, pathname]);

  return null;
}

// Prevent native splash screen from auto-hiding — we hide it immediately
// so the app never shows a blank white frame.
SplashScreen.preventAutoHideAsync().catch(() => null);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function InboxWrapper({ children }: { children: ReactNode }) {
  const { user } = useApp();
  const slug   = user?.slug ?? user?.username?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";
  const userId = user?.id ?? "";
  return <InboxProvider userSlug={slug} userId={userId}>{children}</InboxProvider>;
}

function RootLayoutNav() {
  return (
    <>
    <RouteGuard />
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="matching" />
      <Stack.Screen name="conversation" />
      <Stack.Screen name="feedback" options={{ gestureEnabled: false }} />
      <Stack.Screen name="safety" />
      <Stack.Screen name="admin" />
      <Stack.Screen name="bridge-guide" />
      <Stack.Screen name="send-message" />
      <Stack.Screen name="message/[username]" />
      <Stack.Screen name="owner-login" />
      <Stack.Screen name="owner-dashboard" />
      <Stack.Screen name="analytics" />
      <Stack.Screen name="admin/users" />
      <Stack.Screen name="admin/messages" />
      <Stack.Screen name="admin/reports" />
      <Stack.Screen name="admin/settings" />
      <Stack.Screen name="admin/matching-debug" />
      <Stack.Screen name="chat/[sessionId]" />
    </Stack>
    </>
  );
}

// ---------------------------------------------------------------------------
// Web font loading via CSS — no fontfaceobserver, no timeout errors.
// Fetches the Google Fonts CSS stylesheet, renames font-family values to
// match Expo's naming convention (e.g. "Inter" w:400 → "Inter_400Regular"),
// then injects the result as a <style> block.  Entirely fire-and-forget;
// any failure is silently swallowed so fonts never crash the app.
// ---------------------------------------------------------------------------
const EXPO_FONT_NAMES: Record<string, Record<string, string>> = {
  'Inter': {
    '400': 'Inter_400Regular',
    '500': 'Inter_500Medium',
    '600': 'Inter_600SemiBold',
    '700': 'Inter_700Bold',
  },
  'Space Grotesk': {
    '400': 'SpaceGrotesk_400Regular',
    '500': 'SpaceGrotesk_500Medium',
    '600': 'SpaceGrotesk_600SemiBold',
    '700': 'SpaceGrotesk_700Bold',
  },
};

function injectWebFonts(): void {
  if (typeof document === 'undefined') return;

  const GFONTS =
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700' +
    '&family=Space+Grotesk:wght@400;500;600;700&display=swap';

  fetch(GFONTS)
    .then(r => r.text())
    .then(css => {
      // Split into @font-face blocks and rename each one
      const renamed = css.replace(
        /@font-face\s*\{([^}]+)\}/g,
        (_block, body: string) => {
          const familyMatch = body.match(/font-family:\s*['"]([^'"]+)['"]/);
          const weightMatch = body.match(/font-weight:\s*(\d+)/);
          if (!familyMatch || !weightMatch) return `@font-face {${body}}`;

          const family = familyMatch[1];
          const weight = weightMatch[1];
          const alias  = EXPO_FONT_NAMES[family]?.[weight];
          if (!alias) return `@font-face {${body}}`;

          const newBody = body.replace(
            /font-family:\s*['"][^'"]+['"]/,
            `font-family: '${alias}'`,
          );
          return `@font-face {${newBody}}`;
        },
      );

      const style = document.createElement('style');
      style.setAttribute('data-fonts', 'mybestie');
      style.textContent = renamed;
      document.head.appendChild(style);
    })
    .catch(() => {
      // Font fetch failed — inject CSS fallback so the cascade still works
      if (typeof document === 'undefined') return;
      const style = document.createElement('style');
      style.setAttribute('data-fonts', 'mybestie-fallback');
      style.textContent = [
        "body, * { --mb-sans: 'Inter', 'Space Grotesk', system-ui, -apple-system,",
        "  BlinkMacSystemFont, 'Segoe UI', sans-serif; }",
      ].join(' ');
      document.head.appendChild(style);
    });
}

export default function RootLayout() {
  // ── Font loading ──────────────────────────────────────────────────────────
  // NEVER block the app render on font loading.
  // • Native (iOS/Android): Font.loadAsync uses the native font API — no
  //   fontfaceobserver, no timeout errors.  Fire-and-forget with .catch().
  // • Web: pure CSS via Google Fonts CDN with font-display: swap — zero JS
  //   font polling.  App renders immediately; fonts swap in when ready.
  useEffect(() => {
    if (Platform.OS !== 'web') {
      Font.loadAsync({
        Inter_400Regular,
        Inter_500Medium,
        Inter_600SemiBold,
        Inter_700Bold,
        SpaceGrotesk_400Regular,
        SpaceGrotesk_500Medium,
        SpaceGrotesk_600SemiBold,
        SpaceGrotesk_700Bold,
      }).catch(() => null);
    } else {
      injectWebFonts();
    }
  }, []);

  // Hide the splash screen immediately on first render — do not wait for fonts.
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => null);
  }, []);

  // Fix web background — prevent browser default white from showing at the
  // bottom of scroll containers or behind safe-area insets.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof document === 'undefined') return;
    const BG = '#050505';
    document.documentElement.style.backgroundColor = BG;
    document.documentElement.style.minHeight = '100%';
    document.body.style.backgroundColor = BG;
    document.body.style.minHeight = '100%';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflowX = 'hidden';
  }, []);

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AppProvider>
            <InboxWrapper>
              <ChatProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <KeyboardProvider>
                    <RootLayoutNav />
                  </KeyboardProvider>
                </GestureHandlerRootView>
              </ChatProvider>
            </InboxWrapper>
          </AppProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
