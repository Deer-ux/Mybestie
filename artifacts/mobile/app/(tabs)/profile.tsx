import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Platform, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import AvatarDisplay from '@/components/AvatarDisplay';
import {
  MOODS, GOALS, PERSONALITIES, TEMPERAMENTS,
  AVATAR_ICON_NAMES, AVATAR_COLOR_OPTIONS,
} from '@/utils/helpers';

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, updateUser, resetUser } = useApp();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const [adminTapCount, setAdminTapCount] = useState(0);

  function getMoodLabel(id: string) { return MOODS.find(m => m.id === id)?.label ?? id; }
  function getGoalLabel(id: string) { return GOALS.find(g => g.id === id)?.label ?? id; }
  function getPersonalityLabel(id: string) { return PERSONALITIES.find(p => p.id === id)?.label ?? id; }
  function getTemperamentLabel(id: string) { return TEMPERAMENTS.find(t => t.id === id)?.label ?? id; }

  function handleVersionTap() {
    const next = adminTapCount + 1;
    setAdminTapCount(next);
    if (next >= 5) {
      setAdminTapCount(0);
      router.push('/admin');
    }
  }

  async function handleResetProfile() {
    Alert.alert(
      'Reset Profile',
      'This will erase your profile and start fresh. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset', style: 'destructive', onPress: async () => {
            await resetUser();
            router.replace('/');
          },
        },
      ],
    );
  }

  async function cycleAvatar() {
    if (!user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nextIcon = (user.iconIndex + 1) % AVATAR_ICON_NAMES.length;
    const nextColor = (user.colorIndex + 1) % AVATAR_COLOR_OPTIONS.length;
    await updateUser({ iconIndex: nextIcon, colorIndex: nextColor });
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient colors={[colors.primary, colors.purple]} style={[styles.header, { paddingTop: topPad + 20 }]}>
        <TouchableOpacity onPress={cycleAvatar} activeOpacity={0.85} style={styles.avatarWrap}>
          {user && <AvatarDisplay iconIndex={user.iconIndex} colorIndex={user.colorIndex} size={80} showBorder />}
          <View style={[styles.editBadge, { backgroundColor: colors.accent }]}>
            <Ionicons name="refresh" size={12} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
        <Text style={styles.username}>{user?.username}</Text>
        <View style={[styles.anonBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
          <Ionicons name="shield-checkmark-outline" size={12} color="rgba(255,255,255,0.8)" />
          <Text style={styles.anonText}>Anonymous Identity</Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Stats</Text>
          <View style={styles.statsGrid}>
            {[
              { label: 'Conversations', value: user?.totalChats ?? 0 },
              { label: 'Badges', value: user?.badges.length ?? 0 },
              { label: 'Streak', value: user?.positiveStreak ?? 0 },
            ].map(stat => (
              <View key={stat.label} style={[styles.statBox, { backgroundColor: colors.muted, borderRadius: colors.radius - 4 }]}>
                <Text style={[styles.statValue, { color: colors.primary }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Your Profile</Text>
          {[
            { label: 'Mood', value: getMoodLabel(user?.mood ?? ''), icon: 'happy-outline' },
            { label: 'Goal', value: getGoalLabel(user?.goal ?? ''), icon: 'flag-outline' },
            { label: 'Personality', value: getPersonalityLabel(user?.personality ?? ''), icon: 'person-outline' },
            { label: 'Temperament', value: getTemperamentLabel(user?.temperament ?? ''), icon: 'heart-outline' },
          ].map(row => (
            <View key={row.label} style={[styles.profileRow, { borderBottomColor: colors.border }]}>
              <View style={[styles.rowIcon, { backgroundColor: colors.blueLight }]}>
                <Ionicons name={row.icon as keyof typeof Ionicons.glyphMap} size={16} color={colors.primary} />
              </View>
              <View style={styles.rowInfo}>
                <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>{row.label}</Text>
                <Text style={[styles.rowValue, { color: colors.foreground }]}>{row.value}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Your Interests</Text>
          <View style={styles.tagsWrap}>
            {(user?.interests ?? []).map(interest => (
              <View key={interest} style={[styles.tag, { backgroundColor: colors.blueLight, borderRadius: 12 }]}>
                <Text style={[styles.tagText, { color: colors.primary }]}>{interest}</Text>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/safety')}
          style={[styles.actionBtn, { backgroundColor: colors.greenLight, borderRadius: colors.radius }]}
        >
          <Ionicons name="shield-outline" size={20} color={colors.accent} />
          <Text style={[styles.actionText, { color: colors.accent }]}>Safety Center</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.accent} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(tabs)/badges')}
          style={[styles.actionBtn, { backgroundColor: colors.purpleLight, borderRadius: colors.radius }]}
        >
          <Ionicons name="ribbon-outline" size={20} color={colors.purple} />
          <Text style={[styles.actionText, { color: colors.purple }]}>View All Badges</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.purple} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleResetProfile}
          style={[styles.actionBtn, { backgroundColor: '#FFF0F0', borderRadius: colors.radius }]}
        >
          <Ionicons name="refresh-outline" size={20} color={colors.destructive} />
          <Text style={[styles.actionText, { color: colors.destructive }]}>Reset Profile</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.destructive} />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleVersionTap} style={styles.versionRow}>
          <Text style={[styles.version, { color: colors.mutedForeground }]}>MindBridge v1.0.0</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 28, alignItems: 'center', gap: 10 },
  avatarWrap: { position: 'relative', marginBottom: 4 },
  editBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  username: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' as const },
  anonBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  anonText: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  content: { padding: 20, gap: 12 },
  card: { borderWidth: 1, padding: 16, gap: 12 },
  cardTitle: { fontSize: 15, fontWeight: '700' as const },
  statsGrid: { flexDirection: 'row', gap: 8 },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  statValue: { fontSize: 24, fontWeight: '800' as const },
  statLabel: { fontSize: 11, marginTop: 2 },
  profileRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  rowInfo: { flex: 1 },
  rowLabel: { fontSize: 11, marginBottom: 2 },
  rowValue: { fontSize: 14, fontWeight: '500' as const },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 12, paddingVertical: 6 },
  tagText: { fontSize: 13, fontWeight: '500' as const },
  actionBtn: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  actionText: { flex: 1, fontSize: 14, fontWeight: '600' as const },
  versionRow: { alignItems: 'center', paddingVertical: 16 },
  version: { fontSize: 12 },
});
