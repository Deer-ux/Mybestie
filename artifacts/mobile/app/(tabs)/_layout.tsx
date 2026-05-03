import { BlurView } from "expo-blur";
import { Tabs, router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { Platform, StyleSheet, View } from "react-native";
import FloatingBridgeButton from "@/components/FloatingBridgeButton";
import { useApp } from "@/context/AppContext";

function AuthGuard() {
  const { user, isLoading } = useApp();

  useEffect(() => {
    if (!isLoading && (!user || !user.isOnboarded)) {
      router.replace('/onboarding');
    }
  }, [user, isLoading]);

  return null;
}

export default function TabLayout() {
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <View style={{ flex: 1 }}>
      <AuthGuard />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#FF2D95',
          tabBarInactiveTintColor: 'rgba(255,255,255,0.35)',
          headerShown: false,
          tabBarStyle: {
            position: "absolute",
            backgroundColor: isIOS ? "transparent" : '#0B0B0F',
            borderTopWidth: 1,
            borderTopColor: 'rgba(255,255,255,0.08)',
            elevation: 0,
            ...(isWeb ? { height: 84 } : {}),
          },
          tabBarBackground: () =>
            isIOS ? (
              <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
            ) : null,
          tabBarLabelStyle: {
            fontSize: 11,
            fontFamily: 'SpaceGrotesk_500Medium',
            marginBottom: 2,
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => <Feather name="home" size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="inbox"
          options={{
            title: "Inbox",
            tabBarIcon: ({ color }) => <Feather name="mail" size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="badges"
          options={{
            title: "Badges",
            tabBarIcon: ({ color }) => <Feather name="star" size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color }) => <Feather name="user" size={22} color={color} />,
          }}
        />
      </Tabs>
      <FloatingBridgeButton bottomOffset={90} />
    </View>
  );
}
