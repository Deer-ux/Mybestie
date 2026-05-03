import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import {
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, ReactNode } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider, useApp } from "@/context/AppContext";
import { ChatProvider } from "@/context/ChatContext";
import { InboxProvider } from "@/context/InboxContext";

SplashScreen.preventAutoHideAsync();
const queryClient = new QueryClient();

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
    </Stack>
  );
}

export default function RootLayout() {
  const [, ] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => null);
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
