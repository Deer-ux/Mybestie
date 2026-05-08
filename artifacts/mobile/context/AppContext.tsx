import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateUsername, generateAvatarConfig } from '@/utils/helpers';
import { trackEvent } from '@/utils/analytics';

export interface UserProfile {
  id:              string;
  sessionToken:    string;
  role:            'user' | 'owner';
  username:        string;
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
  restoreSession:         () => Promise<boolean>;
  ownerLogin:             (code: string) => Promise<{ ok: boolean; error?: string }>;
  updateUser:             (updates: Partial<UserProfile>) => Promise<void>;
  completeOnboarding:     (profile: Partial<UserProfile>) => Promise<void>;
  addBadge:               (badgeId: string) => Promise<void>;
  incrementChats:         () => Promise<void>;
  resetUser:              () => Promise<void>;
  logout:                 () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const USER_STORAGE_KEY  = '@mindbridge_user_v3';
const ADMIN_SESSION_KEY = '@mindbridge_admin_session';
const ALL_STORAGE_PREFIXES = ['@mindbridge_', '@inbox_'];

function apiBase(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return '';
}

function makeId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function makeSessionToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 48; i++) token += chars.charAt(Math.floor(Math.random() * chars.length));
  return token;
}

function defaultUser(): UserProfile {
  const config = generateAvatarConfig();
  return {
    id:             makeId(),
    sessionToken:   makeSessionToken(),
    role:           'user',
    username:       generateUsername(),
    iconIndex:      config.iconIndex,
    colorIndex:     config.colorIndex,
    ageGroup:       '',
    mood:           '',
    goal:           '',
    interests:      [],
    personality:    '',
    temperament:    '',
    badges:         [],
    totalChats:     0,
    positiveStreak: 0,
    isOnboarded:    false,
    isAdmin:        false,
  };
}

function ownerUser(token: string): UserProfile {
  const config = generateAvatarConfig();
  return {
    id:             'owner',
    sessionToken:   token,
    role:           'owner',
    username:       'Owner',
    iconIndex:      config.iconIndex,
    colorIndex:     config.colorIndex,
    ageGroup:       'adult',
    mood:           '',
    goal:           '',
    interests:      [],
    personality:    '',
    temperament:    '',
    badges:         [],
    totalChats:     0,
    positiveStreak: 0,
    isOnboarded:    true,
    isAdmin:        true,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user,      setUser]      = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isTeenMode = user?.ageGroup === 'teen';

  useEffect(() => { loadUser(); }, []);

  async function loadUser() {
    try {
      // 1. Check for a saved owner/admin session first
      const adminSession = await AsyncStorage.getItem(ADMIN_SESSION_KEY);
      if (adminSession) {
        const { token } = JSON.parse(adminSession) as { token: string };
        try {
          const resp = await fetch(`${apiBase()}/api/auth/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
          });
          if (resp.ok) {
            const data = await resp.json() as { role: string };
            if (data.role === 'owner') {
              setUser(ownerUser(token));
              setIsLoading(false);
              return;
            }
          }
        } catch {
          // Server unreachable — restore locally to avoid login loop
          setUser(ownerUser(token));
          setIsLoading(false);
          return;
        }
        // Token invalid — clear it and fall through to normal user
        await AsyncStorage.removeItem(ADMIN_SESSION_KEY);
      }

      // 2. Restore normal user session (even if not yet onboarded — so they can resume)
      const stored = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as UserProfile;
        setUser(parsed);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function createAnonymousSession() {
    const fresh = defaultUser();
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(fresh));
    setUser(fresh);
    trackEvent('user_registered', fresh.id);
  }

  async function restoreSession(): Promise<boolean> {
    try {
      const stored = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as UserProfile;
        if (parsed.isOnboarded) { setUser(parsed); return true; }
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
      if (!resp.ok || !data.token) {
        return { ok: false, error: data.error ?? 'Login failed.' };
      }
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
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
  }

  async function completeOnboarding(profile: Partial<UserProfile>) {
    if (!user) return;
    const updated: UserProfile = { ...user, ...profile, badges: ['first_connection'], isOnboarded: true };
    setUser(updated);
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
    trackEvent('onboarding_completed', updated.id);
    trackEvent('anonymous_link_created', updated.id);
  }

  async function addBadge(badgeId: string) {
    if (!user || user.badges.includes(badgeId)) return;
    const updated = { ...user, badges: [...user.badges, badgeId] };
    setUser(updated);
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
  }

  async function incrementChats() {
    if (!user) return;
    const updated = { ...user, totalChats: user.totalChats + 1, positiveStreak: user.positiveStreak + 1 };
    setUser(updated);
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
    if (updated.totalChats === 1) await addBadge('first_connection');
    if (updated.totalChats >= 3) await addBadge('deep_thinker');
    if (updated.positiveStreak >= 7) await addBadge('positive_streak');
  }

  async function resetUser() {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const toRemove = allKeys.filter(k => ALL_STORAGE_PREFIXES.some(p => k.startsWith(p)));
      if (toRemove.length > 0) await AsyncStorage.multiRemove(toRemove);
    } catch {}
    setUser(null);
  }

  async function logout() {
    try {
      await AsyncStorage.removeItem(ADMIN_SESSION_KEY);
      const allKeys = await AsyncStorage.getAllKeys();
      const toRemove = allKeys.filter(k => ALL_STORAGE_PREFIXES.some(p => k.startsWith(p)));
      if (toRemove.length > 0) await AsyncStorage.multiRemove(toRemove);
    } catch {}
    setUser(null);
  }

  return (
    <AppContext.Provider value={{
      user, isLoading, isTeenMode,
      createAnonymousSession, restoreSession, ownerLogin,
      updateUser, completeOnboarding, addBadge, incrementChats, resetUser, logout,
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
