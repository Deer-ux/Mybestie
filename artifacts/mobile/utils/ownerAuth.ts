import AsyncStorage from '@react-native-async-storage/async-storage';

export interface OwnerConfig {
  displayName: string;
  email: string;
  passwordHash: string; // simple hash
  createdAt: string;
}

const OWNER_KEY = '@mindbridge_owner_config';
const DEFAULT_PASSWORD = 'MindBridge2025';

// Very simple hash — not cryptographic, just obfuscation for local storage
function simpleHash(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h.toString(36) + str.length.toString(36);
}

export async function getOwnerConfig(): Promise<OwnerConfig | null> {
  try {
    const stored = await AsyncStorage.getItem(OWNER_KEY);
    if (stored) return JSON.parse(stored);
    // Create default owner on first call
    const defaultOwner: OwnerConfig = {
      displayName: 'MindBridge Owner',
      email: 'owner@mindbridge.app',
      passwordHash: simpleHash(DEFAULT_PASSWORD),
      createdAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(OWNER_KEY, JSON.stringify(defaultOwner));
    return defaultOwner;
  } catch {
    return null;
  }
}

export async function verifyOwner(password: string): Promise<boolean> {
  const config = await getOwnerConfig();
  if (!config) return false;
  return config.passwordHash === simpleHash(password);
}

export async function setupOwner(displayName: string, email: string, password: string): Promise<void> {
  const config: OwnerConfig = {
    displayName: displayName.trim() || 'MindBridge Owner',
    email: email.trim() || 'owner@mindbridge.app',
    passwordHash: simpleHash(password),
    createdAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(OWNER_KEY, JSON.stringify(config));
}

export function getDefaultPassword(): string {
  return DEFAULT_PASSWORD;
}
