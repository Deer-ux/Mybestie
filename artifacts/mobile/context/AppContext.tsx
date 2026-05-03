import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateUsername, generateAvatarConfig } from '@/utils/helpers';
import { trackEvent } from '@/utils/analytics';

export interface UserProfile {
  id: string;
  username: string;
  iconIndex: number;
  colorIndex: number;
  ageGroup: string;
  mood: string;
  goal: string;
  interests: string[];
  personality: string;
  temperament: string;
  badges: string[];
  totalChats: number;
  positiveStreak: number;
  isOnboarded: boolean;
  isAdmin: boolean;
}

interface AppContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isTeenMode: boolean;
  updateUser: (updates: Partial<UserProfile>) => Promise<void>;
  completeOnboarding: (profile: Partial<UserProfile>) => Promise<void>;
  addBadge: (badgeId: string) => Promise<void>;
  incrementChats: () => Promise<void>;
  resetUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);
const STORAGE_KEY = '@mindbridge_user_v3';

function defaultUser(): UserProfile {
  const config = generateAvatarConfig();
  return {
    id: makeId(),
    username: generateUsername(),
    iconIndex: config.iconIndex,
    colorIndex: config.colorIndex,
    ageGroup: '',
    mood: '',
    goal: '',
    interests: [],
    personality: '',
    temperament: '',
    badges: [],
    totalChats: 0,
    positiveStreak: 0,
    isOnboarded: false,
    isAdmin: false,
  };
}

function makeId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isTeenMode = user?.ageGroup === 'teen';

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        const newUser = defaultUser();
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
        setUser(newUser);
        trackEvent('user_registered', newUser.id);
      }
    } catch {
      setUser(defaultUser());
    } finally {
      setIsLoading(false);
    }
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
      badges: ['first_connection'],
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

  async function resetUser() {
    const newUser = defaultUser();
    setUser(newUser);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
  }

  async function logout() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      const inboxKeys = await AsyncStorage.getAllKeys();
      const inboxToRemove = inboxKeys.filter(k => k.startsWith('@inbox_'));
      if (inboxToRemove.length > 0) {
        await AsyncStorage.multiRemove(inboxToRemove);
      }
    } catch {
    }
    setUser(null);
  }

  return (
    <AppContext.Provider value={{ user, isLoading, isTeenMode, updateUser, completeOnboarding, addBadge, incrementChats, resetUser, logout }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
