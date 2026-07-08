import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { generateUsername, generateAvatarConfig } from '@/utils/helpers';
import { trackEvent } from '@/utils/analytics';

// ── Storage keys ───────────────────────────────────────────────────────────────
// These two are NEVER removed on logout — they allow the user to reclaim their profile.
const USER_ID_KEY       = 'mybestie_user_id';
const RESTORE_TOKEN_KEY = 'mybestie_restore_token';
// Cached profile for offline/fast-restore
const PROFILE_CACHE_KEY = 'mybestie_cached_profile';
// Admin session — cleared on logout
const ADMIN_SESSION_KEY = '@mindbridge_admin_session';
// Legacy key — migrated on first load
const LEGACY_KEY        = '@mindbridge_user_v3';

export interface UserProfile {
  id:              string;
  role:            'user' | 'owner';
  sessionToken?:   string;  // only set for owner sessions
  username:        string;
  slug:            string;
  iconIndex:       number;
  colorIndex:      number;
  ageGroup:        string;
  mood:            string;
  goal:            string;
  interests:       string[];
  personality:     string;
  temperament:     string;
  badges:          string[];
  totalChats:      number;
  positiveStreak:  number;
  isOnboarded:     boolean;
  isAdmin:         boolean;
}

interface AppContextType {
  user:                   UserProfile | null;
  isLoading:              boolean;
  isTeenMode:             boolean;
  createAnonymousSession: () => Promise<void>;
  registerWithPassword:   (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  loginWithPassword:      (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  restoreSession:         () => Promise<boolean>;
  ownerLogin:             (code: string) => Promise<{ ok: boolean; error?: string }>;
  updateUser:             (updates: Partial<UserProfile>) => Promise<void>;
  completeOnboarding:     (profile: Partial<UserProfile>) => Promise<void>;
  addBadge:               (badgeId: string) => Promise<void>;
  incrementChats:         () => Promise<void>;
  resetUser:              () => Promise<void>;
  deleteAccount:          () => Promise<void>;
  logout:                 () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function apiBase(): string {
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin;
  return '';
}

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function makeRestoreToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let t = '';
  for (let i = 0; i < 64; i++) t += chars[Math.floor(Math.random() * chars.length)];
  return t;
}

function toSlug(username: string): string {
  return username.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function navigateToLanding() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.location.replace('/');
  } else {
    router.replace('/');
  }
}

// ── Owner helpers ──────────────────────────────────────────────────────────────

function ownerUser(token: string): UserProfile {
  const config = generateAvatarConfig();
  return {
    id: 'owner', role: 'owner', sessionToken: token, username: 'Owner',
    slug: 'owner',
    iconIndex: config.iconIndex, colorIndex: config.colorIndex,
    ageGroup: 'adult', mood: '', goal: '', interests: [],
    personality: '', temperament: '',
    badges: [], totalChats: 0, positiveStreak: 0,
    isOnboarded: true, isAdmin: true,
  };
}

// ── API helpers ────────────────────────────────────────────────────────────────

async function apiPost<T>(path: string, body: unknown): Promise<T | null> {
  try {
    const resp = await fetch(`${apiBase()}/api${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!resp.ok) return null;
    return await resp.json() as T;
  } catch {
    return null;
  }
}

async function apiPatch(path: string, body: unknown): Promise<boolean> {
  try {
    const resp = await fetch(`${apiBase()}/api${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return resp.ok;
  } catch {
    return false;
  }
}

async function apiDelete(path: string, body: unknown): Promise<boolean> {
  try {
    const resp = await fetch(`${apiBase()}/api${path}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return resp.ok;
  } catch {
    return false;
  }
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [user,      setUser]      = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isTeenMode = user?.ageGroup === 'teen';

  useEffect(() => { loadUser(); }, []);

  async function loadUser() {
    try {
      // 1. Check admin session
      const adminSession = await AsyncStorage.getItem(ADMIN_SESSION_KEY);
      if (adminSession) {
        const { token } = JSON.parse(adminSession) as { token: string };
        try {
          const ctrl = new AbortController();
          const timer = setTimeout(() => ctrl.abort(), 8000);
          const resp = await fetch(`${apiBase()}/api/auth/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
            signal: ctrl.signal,
          }).finally(() => clearTimeout(timer));
          if (resp.ok) {
            const data = await resp.json() as { role: string };
            if (data.role === 'owner') { setUser(ownerUser(token)); return; }
          }
        } catch {
          setUser(ownerUser(token)); return;
        }
        await AsyncStorage.removeItem(ADMIN_SESSION_KEY);
      }

      // 2. Try to restore via mybestie tokens
      const userId       = await AsyncStorage.getItem(USER_ID_KEY);
      const restoreToken = await AsyncStorage.getItem(RESTORE_TOKEN_KEY);

      if (userId && restoreToken) {
        const data = await apiPost<{ user: UserProfile & { restoreToken: string } }>(
          '/users/restore', { userId, restoreToken }
        );
        if (data?.user) {
          const profile = apiUserToProfile(data.user);
          setUser(profile);
          await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
          return;
        }

        // API failed — fall back to cached profile (offline mode)
        const cached = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
        if (cached) {
          setUser(JSON.parse(cached) as UserProfile);
          return;
        }

        // Tokens present but DB record gone — clear stale tokens
        await AsyncStorage.multiRemove([USER_ID_KEY, RESTORE_TOKEN_KEY, PROFILE_CACHE_KEY]);
        setUser(null);
        return;
      }

      // 3. Migrate legacy profile if present
      const legacy = await AsyncStorage.getItem(LEGACY_KEY);
      if (legacy) {
        const parsed = JSON.parse(legacy) as {
          id: string; username: string; iconIndex: number; colorIndex: number;
          ageGroup: string; mood: string; goal: string; interests: string[];
          personality: string; temperament: string; badges: string[];
          totalChats: number; positiveStreak: number; isOnboarded: boolean;
          isAdmin: boolean;
        };

        // Create a real DB record for this legacy user
        const data = await apiPost<{ user: UserProfile & { restoreToken: string } }>('/users', {
          username:   parsed.username,
          iconIndex:  parsed.iconIndex,
          colorIndex: parsed.colorIndex,
        });

        if (data?.user) {
          await AsyncStorage.setItem(USER_ID_KEY, data.user.id);
          await AsyncStorage.setItem(RESTORE_TOKEN_KEY, data.user.restoreToken);

          // Merge legacy profile data into the DB record
          const merged: UserProfile = {
            ...apiUserToProfile(data.user),
            ageGroup:       parsed.ageGroup,
            mood:           parsed.mood,
            goal:           parsed.goal,
            interests:      parsed.interests ?? [],
            personality:    parsed.personality,
            temperament:    parsed.temperament,
            badges:         parsed.badges ?? [],
            totalChats:     parsed.totalChats ?? 0,
            positiveStreak: parsed.positiveStreak ?? 0,
            isOnboarded:    parsed.isOnboarded,
            isAdmin:        parsed.isAdmin,
          };

          // Sync merged data to DB
          await apiPatch(`/users/${data.user.id}`, {
            ageGroup: merged.ageGroup, mood: merged.mood, goal: merged.goal,
            interests: merged.interests, personality: merged.personality,
            temperament: merged.temperament, totalChats: merged.totalChats,
            positiveStreak: merged.positiveStreak, isOnboarded: merged.isOnboarded,
          });
          for (const badgeId of merged.badges) {
            await apiPost(`/users/${data.user.id}/badges`, { badgeId });
          }

          await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(merged));
          await AsyncStorage.removeItem(LEGACY_KEY);
          setUser(merged);
          return;
        }

        // API unavailable — use legacy profile as-is (offline)
        const profile: UserProfile = {
          id: parsed.id, role: 'user',
          username: parsed.username,
          slug: toSlug(parsed.username),
          iconIndex: parsed.iconIndex, colorIndex: parsed.colorIndex,
          ageGroup: parsed.ageGroup, mood: parsed.mood, goal: parsed.goal,
          interests: parsed.interests ?? [],
          personality: parsed.personality, temperament: parsed.temperament,
          badges: parsed.badges ?? [],
          totalChats: parsed.totalChats ?? 0, positiveStreak: parsed.positiveStreak ?? 0,
          isOnboarded: parsed.isOnboarded, isAdmin: parsed.isAdmin,
        };
        setUser(profile);
        return;
      }

      setUser(null);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function createAnonymousSession() {
    const config = generateAvatarConfig();
    const username = generateUsername();
    const data = await apiPost<{ user: UserProfile & { restoreToken: string } }>('/users', {
      username,
      iconIndex:  config.iconIndex,
      colorIndex: config.colorIndex,
    });

    if (data?.user) {
      // DB-backed creation
      await AsyncStorage.setItem(USER_ID_KEY, data.user.id);
      await AsyncStorage.setItem(RESTORE_TOKEN_KEY, data.user.restoreToken);
      const profile = apiUserToProfile(data.user);
      await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
      setUser(profile);
      trackEvent('user_registered', data.user.id);
    } else {
      // Offline fallback — create locally, sync later
      const id = makeId();
      const restoreToken = makeRestoreToken();
      const profile: UserProfile = {
        id, role: 'user', username, slug: toSlug(username),
        iconIndex: config.iconIndex, colorIndex: config.colorIndex,
        ageGroup: '', mood: '', goal: '', interests: [],
        personality: '', temperament: '',
        badges: [], totalChats: 0, positiveStreak: 0,
        isOnboarded: false, isAdmin: false,
      };
      await AsyncStorage.setItem(USER_ID_KEY, id);
      await AsyncStorage.setItem(RESTORE_TOKEN_KEY, restoreToken);
      await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
      setUser(profile);
      trackEvent('user_registered', id);
    }
  }

  async function restoreSession(): Promise<boolean> {
    try {
      const userId       = await AsyncStorage.getItem(USER_ID_KEY);
      const restoreToken = await AsyncStorage.getItem(RESTORE_TOKEN_KEY);
      if (!userId || !restoreToken) return false;

      const data = await apiPost<{ user: UserProfile & { restoreToken: string } }>(
        '/users/restore', { userId, restoreToken }
      );
      if (data?.user) {
        const profile = apiUserToProfile(data.user);
        setUser(profile);
        await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
        return true;
      }

      // Offline: try cached profile
      const cached = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
      if (cached) {
        const profile = JSON.parse(cached) as UserProfile;
        if (profile.isOnboarded) { setUser(profile); return true; }
      }
    } catch {}
    return false;
  }

  async function ownerLogin(code: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const resp = await fetch(`${apiBase()}/api/auth/owner-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await resp.json() as { role?: string; token?: string; error?: string };
      if (!resp.ok || !data.token) return { ok: false, error: data.error ?? 'Login failed.' };
      await AsyncStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({ token: data.token }));
      setUser(ownerUser(data.token));
      return { ok: true };
    } catch {
      return { ok: false, error: 'Could not reach the server. Please try again.' };
    }
  }

  async function updateUser(updates: Partial<UserProfile>) {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(updated));
    if (user.role !== 'owner') {
      await apiPatch(`/users/${user.id}`, updates);
    }
  }

  async function completeOnboarding(profile: Partial<UserProfile>) {
    if (!user) return;
    const updated: UserProfile = { ...user, ...profile, badges: ['first_connection'], isOnboarded: true };
    setUser(updated);
    await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(updated));
    if (user.role !== 'owner') {
      await apiPatch(`/users/${user.id}`, {
        ageGroup: updated.ageGroup, mood: updated.mood, goal: updated.goal,
        interests: updated.interests, personality: updated.personality,
        temperament: updated.temperament, isOnboarded: true,
      });
      await apiPost(`/users/${user.id}/badges`, { badgeId: 'first_connection' });
    }
    trackEvent('onboarding_completed', updated.id);
    trackEvent('anonymous_link_created', updated.id);
  }

  async function addBadge(badgeId: string) {
    if (!user || user.badges.includes(badgeId)) return;
    const updated = { ...user, badges: [...user.badges, badgeId] };
    setUser(updated);
    await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(updated));
    if (user.role !== 'owner') {
      await apiPost(`/users/${user.id}/badges`, { badgeId });
    }
  }

  async function incrementChats() {
    if (!user) return;
    const updated = { ...user, totalChats: user.totalChats + 1, positiveStreak: user.positiveStreak + 1 };
    setUser(updated);
    await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(updated));
    if (user.role !== 'owner') {
      await apiPatch(`/users/${user.id}`, {
        totalChats: updated.totalChats,
        positiveStreak: updated.positiveStreak,
      });
    }
    if (updated.totalChats === 1) await addBadge('first_connection');
    if (updated.totalChats >= 3) await addBadge('deep_thinker');
    if (updated.positiveStreak >= 7) await addBadge('positive_streak');
  }

  // Resets onboarding preferences only — account, badges, and history remain
  async function resetUser() {
    if (!user) return;
    const patch = {
      ageGroup: '', mood: '', goal: '', interests: [] as string[],
      personality: '', temperament: '', isOnboarded: false,
    };
    const updated = { ...user, ...patch };
    setUser(updated);
    await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(updated));
    if (user.role !== 'owner') {
      await apiPatch(`/users/${user.id}`, patch);
    }
    navigateToLanding();
  }

  // Permanently deletes account, all data, and local tokens
  async function deleteAccount() {
    if (!user) return;
    const restoreToken = await AsyncStorage.getItem(RESTORE_TOKEN_KEY);
    if (user.role !== 'owner' && restoreToken) {
      await apiDelete(`/users/${user.id}`, { restoreToken });
    }
    await AsyncStorage.multiRemove([USER_ID_KEY, RESTORE_TOKEN_KEY, PROFILE_CACHE_KEY, ADMIN_SESSION_KEY]);
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const inbox = allKeys.filter(k => k.startsWith('@inbox_'));
      if (inbox.length > 0) await AsyncStorage.multiRemove(inbox);
    } catch {}
    setUser(null);
    navigateToLanding();
  }

  // Ends session only — profile and tokens are kept for Return to My Profile
  async function logout() {
    await AsyncStorage.removeItem(ADMIN_SESSION_KEY);
    // mybestie_user_id and mybestie_restore_token are intentionally preserved
    setUser(null);
    navigateToLanding();
  }

  async function registerWithPassword(username: string, password: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const resp = await fetch(`${apiBase()}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await resp.json() as { user?: UserProfile & { restoreToken: string }; error?: string };
      if (!resp.ok || !data.user) return { ok: false, error: data.error ?? 'Registration failed.' };

      await AsyncStorage.setItem(USER_ID_KEY, data.user.id);
      await AsyncStorage.setItem(RESTORE_TOKEN_KEY, data.user.restoreToken);
      const profile = apiUserToProfile(data.user);
      await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
      setUser(profile);
      trackEvent('user_registered', data.user.id);
      return { ok: true };
    } catch {
      return { ok: false, error: 'Could not reach the server. Please try again.' };
    }
  }

  async function loginWithPassword(username: string, password: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const resp = await fetch(`${apiBase()}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await resp.json() as { user?: UserProfile & { restoreToken: string }; error?: string };
      if (!resp.ok || !data.user) return { ok: false, error: data.error ?? 'Login failed.' };

      await AsyncStorage.setItem(USER_ID_KEY, data.user.id);
      await AsyncStorage.setItem(RESTORE_TOKEN_KEY, data.user.restoreToken);
      const profile = apiUserToProfile(data.user);
      await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
      setUser(profile);
      return { ok: true };
    } catch {
      return { ok: false, error: 'Could not reach the server. Please try again.' };
    }
  }

  return (
    <AppContext.Provider value={{
      user, isLoading, isTeenMode,
      createAnonymousSession, registerWithPassword, loginWithPassword,
      restoreSession, ownerLogin,
      updateUser, completeOnboarding, addBadge, incrementChats,
      resetUser, deleteAccount, logout,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

// Convert API user response to local UserProfile shape
function apiUserToProfile(apiUser: UserProfile & { restoreToken?: string }): UserProfile {
  return {
    id:             apiUser.id,
    role:           'user',
    username:       apiUser.username,
    slug:           (apiUser as { slug?: string }).slug ?? toSlug(apiUser.username),
    iconIndex:      apiUser.iconIndex,
    colorIndex:     apiUser.colorIndex,
    ageGroup:       apiUser.ageGroup,
    mood:           apiUser.mood,
    goal:           apiUser.goal,
    interests:      Array.isArray(apiUser.interests) ? apiUser.interests : [],
    personality:    apiUser.personality,
    temperament:    apiUser.temperament,
    badges:         Array.isArray(apiUser.badges) ? apiUser.badges : [],
    totalChats:     apiUser.totalChats,
    positiveStreak: apiUser.positiveStreak,
    isOnboarded:    apiUser.isOnboarded,
    isAdmin:        apiUser.isAdmin,
  };
}
