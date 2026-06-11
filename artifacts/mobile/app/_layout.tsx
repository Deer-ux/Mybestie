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
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, ReactNode } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider, useApp } from "@/context/AppContext";
import { ChatProvider } from "@/context/ChatContext";
import { InboxProvider } from "@/context/InboxContext";

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
  const slug = user?.username?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";
  return <InboxProvider userSlug={slug}>{children}</InboxProvider>;
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
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
  );
}

export default function RootLayout() {
  // Load fonts — we never block rendering on this; the app renders immediately
  // and fonts swap in when ready (avoids blank screen / infinite loading).
  useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

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
