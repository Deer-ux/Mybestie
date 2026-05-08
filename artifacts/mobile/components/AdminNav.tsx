import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { router, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';

const PINK   = '#FF2D95';
const CYAN   = '#00D4FF';
const MUTED  = 'rgba(255,255,255,0.45)';
const RED    = '#FF4455';

const NAV_ITEMS = [
  { icon: 'grid-outline',         label: 'Dashboard', route: '/owner-dashboard'  },
  { icon: 'bar-chart-outline',    label: 'Analytics',  route: '/analytics'        },
  { icon: 'shield-outline',       label: 'Moderation', route: '/admin'            },
  { icon: 'people-outline',       label: 'Users',      route: '/admin/users'      },
  { icon: 'chatbubble-outline',   label: 'Messages',   route: '/admin/messages'   },
  { icon: 'flag-outline',         label: 'Reports',    route: '/admin/reports'    },
  { icon: 'settings-outline',     label: 'Settings',   route: '/admin/settings'   },
] as const;

interface AdminNavProps {
  onLogout?: () => void;
}

export default function AdminNav({ onLogout }: AdminNavProps) {
  const pathname  = usePathname();
  const { logout } = useApp();

  async function handleLogout() {
    if (onLogout) { onLogout(); return; }
    router.replace('/');
    await logout();
  }

  function isActive(route: string) {
    if (route === '/owner-dashboard') return pathname === '/owner-dashboard';
    if (route === '/admin') return pathname === '/admin';
    return pathname.startsWith(route);
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {NAV_ITEMS.map(item => {
          const active = isActive(item.route);
          return (
            <TouchableOpacity
              key={item.route}
              onPress={() => router.push(item.route as never)}
              style={[styles.tab, active && styles.tabActive]}
              activeOpacity={0.75}
            >
              <Ionicons
                name={item.icon as any}
                size={16}
                color={active ? PINK : MUTED}
              />
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity onPress={handleLogout} style={styles.logoutTab} activeOpacity={0.75}>
          <Ionicons name="log-out-outline" size={16} color={RED} />
          <Text style={styles.logoutLabel}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
    backgroundColor: '#0B0B0F',
  },
  scroll: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tabActive: {
    backgroundColor: 'rgba(255,45,149,0.12)',
    borderColor: 'rgba(255,45,149,0.35)',
  },
  tabLabel: {
    fontSize: 12,
    color: MUTED,
    fontFamily: 'Inter_500Medium',
  },
  tabLabelActive: {
    color: PINK,
    fontFamily: 'Inter_600SemiBold',
  },
  logoutTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255,68,85,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,68,85,0.22)',
    marginLeft: 4,
  },
  logoutLabel: {
    fontSize: 12,
    color: RED,
    fontFamily: 'Inter_500Medium',
  },
});
