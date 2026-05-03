import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateUsername, generateAvatarConfig } from '@/utils/helpers';
import { trackEvent } from '@/utils/analytics';

export interface UserProfile {
  id:              string;
  sessionToken:    string;
  role:            'user' | 'admin';
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
  updateUser:             (updates: Partial<UserProfile>) => Promise<void>;
  completeOnboarding:     (profile: Partial<UserProfile>) => Promise<void>;
  addBadge:               (badgeId: string) => Promise<void>;
  incrementChats:         () => Promise<void>;
  resetUser:              () => Promise<void>;
  logout:                 () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);
const STORAGE_KEY = '@mindbridge_user_v3';

const ALL_STORAGE_PREFIXES = ['@mindbridge_', '@inbox_'];

function makeId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function makeSessionToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 48; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
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

export function AppProvider({ children }: { children: ReactNode }) {
  const [user,      setUser]      = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isTeenMode = user?.ageGroup === 'teen';

  useEffect(() => { loadUser(); }, []);

  // On mount — restore only a fully-onboarded session.
  // Non-onboarded or missing sessions leave user = null so the landing page shows.
  async function loadUser() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as UserProfile;
        if (parsed.isOnboarded) {
          setUser(parsed);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  // Called when user taps "Start Connecting" — creates anonymous identity.
  async function createAnonymousSession() {
    const fresh = defaultUser();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    setUser(fresh);
    trackEvent('user_registered', fresh.id);
  }

  // Called when user taps "Return to My Profile" — reads storage directly.
  // Returns true if an onboarded session was found and restored.
  async function restoreSession(): Promise<boolean> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as UserProfile;
        if (parsed.isOnboarded) {
          setUser(parsed);
          return true;
        }
      }
    } catch {}
    return false;
  }

  async function updateUser(updates: Partial<UserProfile>) {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  async function completeOnboarding(profile: Partial<UserProfile>) {
    if (!user) return;
    const updated: UserProfile = {
      ...user,
      ...profile,
      badges:      ['first_connection'],
      isOnboarded: true,
    };
    setUser(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    trackEvent('onboarding_completed', updated.id);
    trackEvent('anonymous_link_created', updated.id);
  }

  async function addBadge(badgeId: string) {
    if (!user || user.badges.includes(badgeId)) return;
    const updated = { ...user, badges: [...user.badges, badgeId] };
    setUser(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  async function incrementChats() {
    if (!user) return;
    const updated = { ...user, totalChats: user.totalChats + 1, positiveStreak: user.positiveStreak + 1 };
    setUser(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (updated.totalChats === 1) await addBadge('first_connection');
    if (updated.totalChats >= 3) await addBadge('deep_thinker');
    if (updated.positiveStreak >= 7) await addBadge('positive_streak');
  }

  // Reset wipes everything and returns user to null → landing page.
  async function resetUser() {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const toRemove = allKeys.filter(k =>
        ALL_STORAGE_PREFIXES.some(prefix => k.startsWith(prefix))
      );
      if (toRemove.length > 0) await AsyncStorage.multiRemove(toRemove);
    } catch {}
    setUser(null);
  }

  // Logout clears the session and returns user to null → landing page.
  async function logout() {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const toRemove = allKeys.filter(k =>
        ALL_STORAGE_PREFIXES.some(prefix => k.startsWith(prefix))
      );
      if (toRemove.length > 0) await AsyncStorage.multiRemove(toRemove);
    } catch {}
    setUser(null);
  }

  return (
    <AppContext.Provider value={{
      user, isLoading, isTeenMode,
      createAnonymousSession, restoreSession,
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
