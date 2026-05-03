import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import AvatarDisplay from '@/components/AvatarDisplay';
import GlassCard from '@/components/GlassCard';
import BlobBackground from '@/components/BlobBackground';
import { MOODS, GOALS, PERSONALITIES, TEMPERAMENTS, AVATAR_ICON_NAMES, AVATAR_COLOR_OPTIONS } from '@/utils/helpers';

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, updateUser, resetUser, isTeenMode } = useApp();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const [adminTaps, setAdminTaps] = useState(0);

  function moodEmoji(id: string) { return MOODS.find(m => m.id === id)?.emoji ?? ''; }
  function moodLabel(id: string) { return MOODS.find(m => m.id === id)?.label ?? id; }
  function goalEmoji(id: string) { return GOALS.find(g => g.id === id)?.emoji ?? ''; }
  function goalLabel(id: string) { return GOALS.find(g => g.id === id)?.label ?? id; }
  function personalityEmoji(id: string) { return PERSONALITIES.find(p => p.id === id)?.emoji ?? ''; }
  function personalityLabel(id: string) { return PERSONALITIES.find(p => p.id === id)?.label ?? id; }
  function temperamentEmoji(id: string) { return TEMPERAMENTS.find(t => t.id === id)?.emoji ?? ''; }
  function temperamentLabel(id: string) { return TEMPERAMENTS.find(t => t.id === id)?.label ?? id; }

  function handleAdminTap() {
    const n = adminTaps + 1;
    setAdminTaps(n);
    if (n >= 5) { setAdminTaps(0); router.push('/admin'); }
  }

  async function cycleAvatar() {
    if (!user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateUser({
      iconIndex: (user.iconIndex + 1) % AVATAR_ICON_NAMES.length,
      colorIndex: (user.colorIndex + 1) % AVATAR_COLOR_OPTIONS.length,
    });
  }

  async function handleReset() {
    Alert.alert('Reset Profile', 'This will erase your profile and start fresh. Cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: async () => { await resetUser(); router.replace('/'); } },
    ]);
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      <BlobBackground />
      <LinearGradient colors={['#0B3C5D', '#1F6F8B']} style={[styles.header, { paddingTop: topPad + 24 }]}>
        <TouchableOpacity onPress={cycleAvatar} activeOpacity={0.85} style={styles.avatarWrap}>
          {user && <AvatarDisplay iconIndex={user.iconIndex} colorIndex={user.colorIndex} size={84} showRing />}
          <View style={[styles.editBadge, { backgroundColor: colors.accent }]}>
            <Ionicons name="refresh" size={12} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
        <Text style={[styles.username, { fontFamily: 'Poppins_700Bold' }]}>{user?.username}</Text>
        <View style={styles.badgesRow}>
          <View style={[styles.anonPill, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <Text style={styles.anonText}>🔒 Anonymous</Text>
          </View>
          {isTeenMode && (
            <View style={[styles.anonPill, { backgroundColor: 'rgba(76,175,80,0.25)' }]}>
              <Text style={styles.anonText}>🌱 Teen Mode</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <GlassCard style={styles.statsCard}>
          {[
            { label: 'Conversations', value: user?.totalChats ?? 0, emoji: '💬' },
            { label: 'Badges', value: user?.badges.length ?? 0, emoji: '🌟' },
            { label: 'Streak', value: user?.positiveStreak ?? 0, emoji: '✨' },
          ].map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 && <View style={[styles.statDiv, { backgroundColor: colors.border }]} />}
              <View style={styles.statItem}>
                <Text style={{ fontSize: 20 }}>{s.emoji}</Text>
                <Text style={[styles.statValue, { color: colors.primary, fontFamily: 'Poppins_700Bold' }]}>{s.value}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>{s.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </GlassCard>

        <GlassCard>
          <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: 'Poppins_600SemiBold' }]}>Your Profile</Text>
          <View style={styles.rows}>
            {[
              { emoji: moodEmoji(user?.mood ?? ''), label: 'Mood', value: moodLabel(user?.mood ?? '') },
              { emoji: goalEmoji(user?.goal ?? ''), label: 'Goal', value: goalLabel(user?.goal ?? '') },
              { emoji: personalityEmoji(user?.personality ?? ''), label: 'Personality', value: personalityLabel(user?.personality ?? '') },
              { emoji: temperamentEmoji(user?.temperament ?? ''), label: 'Temperament', value: temperamentLabel(user?.temperament ?? '') },
            ].map((row, i) => (
              <View key={i} style={[styles.row, { borderBottomColor: colors.border }]}>
                <Text style={styles.rowEmoji}>{row.emoji}</Text>
                <View style={styles.rowInfo}>
                  <Text style={[styles.rowLabel, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>{row.label}</Text>
                  <Text style={[styles.rowValue, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>{row.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </GlassCard>

        <GlassCard>
          <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: 'Poppins_600SemiBold' }]}>Your Interests</Text>
          <View style={styles.tagsWrap}>
            {(user?.interests ?? []).map(id => (
              <View key={id} style={[styles.tag, { backgroundColor: colors.lavenderLight, borderRadius: 14 }]}>
                <Text style={[styles.tagText, { color: colors.accent, fontFamily: 'Inter_500Medium' }]}>{id}</Text>
              </View>
            ))}
          </View>
        </GlassCard>

        {[
          { emoji: '🛡️', label: 'Safety Center', color: colors.safeGreenLight, textColor: colors.safeGreen, onPress: () => router.push('/safety') },
          { emoji: '🌟', label: 'View All Badges', color: colors.lavenderLight, textColor: colors.accent, onPress: () => router.push('/(tabs)/badges') },
          { emoji: '🔄', label: 'Reset Profile', color: '#FFF0F0', textColor: colors.destructive, onPress: handleReset },
        ].map((action, i) => (
          <TouchableOpacity key={i} onPress={action.onPress} style={[styles.actionBtn, { backgroundColor: action.color, borderRadius: colors.radius }]}>
            <Text style={{ fontSize: 18 }}>{action.emoji}</Text>
            <Text style={[styles.actionText, { color: action.textColor, fontFamily: 'Inter_600SemiBold' }]}>{action.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={action.textColor} />
          </TouchableOpacity>
        ))}

        <TouchableOpacity onPress={handleAdminTap} style={styles.versionRow}>
          <Text style={[styles.version, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>MindBridge v1.0.0</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 28, alignItems: 'center', gap: 10 },
  avatarWrap: { position: 'relative' },
  editBadge: { position: 'absolute', bottom: 2, right: 2, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  username: { color: '#FFFFFF', fontSize: 22 },
  badgesRow: { flexDirection: 'row', gap: 8 },
  anonPill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  anonText: { color: 'rgba(255,255,255,0.85)', fontSize: 12 },
  content: { padding: 20, gap: 12 },
  statsCard: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 6 },
  statDiv: { width: 1, height: 40 },
  statValue: { fontSize: 24 },
  statLabel: { fontSize: 11 },
  cardTitle: { fontSize: 15, marginBottom: 10 },
  rows: { gap: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  rowEmoji: { fontSize: 20, width: 28, textAlign: 'center' },
  rowInfo: { flex: 1 },
  rowLabel: { fontSize: 11, marginBottom: 2 },
  rowValue: { fontSize: 14 },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  tag: { paddingHorizontal: 12, paddingVertical: 6 },
  tagText: { fontSize: 13 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  actionText: { flex: 1, fontSize: 14 },
  versionRow: { alignItems: 'center', paddingVertical: 16 },
  version: { fontSize: 12 },
});
