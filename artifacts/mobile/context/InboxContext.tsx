import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type MessageCategory =
  | 'compliment' | 'question' | 'advice' | 'confession'
  | 'encouragement' | 'feedback' | 'other';

export type ModerationStatus = 'approved' | 'hidden';

export const MESSAGE_TTL_MS = 2 * 24 * 60 * 60 * 1000; // 48 hours

export interface AnonymousMessage {
  id: string;
  recipientSlug: string;
  category: MessageCategory;
  content: string;
  timestamp: string;
  senderFingerprint: string;
  moderationStatus: ModerationStatus;
  isRead: boolean;
  isSaved: boolean;
  isReported: boolean;
  publicReply?: string;
}

interface InboxContextType {
  messages: AnonymousMessage[];
  unreadCount: number;
  totalCount: number;
  sendMessage: (recipientSlug: string, category: MessageCategory, content: string) => Promise<{ success: boolean; blocked?: boolean }>;
  markAsRead: (id: string) => void;
  saveMessage: (id: string) => void;
  deleteMessage: (id: string) => void;
  reportMessage: (id: string) => void;
  replyToMessage: (id: string, reply: string) => void;
  loadMessagesForSlug: (slug: string) => Promise<void>;
  refreshInbox: () => Promise<void>;
}

const InboxContext = createContext<InboxContextType | undefined>(undefined);

function makeId() { return Date.now().toString() + Math.random().toString(36).substr(2, 9); }
function makeFingerprint() { return Math.random().toString(36).substr(2, 16); }

// Remove messages older than MESSAGE_TTL_MS, unless the user saved them
function purgeExpired(msgs: AnonymousMessage[]): { kept: AnonymousMessage[]; removed: number } {
  const cutoff = Date.now() - MESSAGE_TTL_MS;
  const kept = msgs.filter(m => {
    if (m.isSaved) return true; // saved messages never expire
    return new Date(m.timestamp).getTime() > cutoff;
  });
  return { kept, removed: msgs.length - kept.length };
}

const EXTREME_BLOCKED = [
  'kill yourself', 'kys', 'go kill yourself', 'i will kill you', 'i will find you',
  'i know where you live', 'come to your house', 'show up at your',
  'send nudes', 'send me nudes', 'nude pic', 'sex with me', 'rape you', 'molest',
  'cut yourself', 'harm yourself', 'end your life', 'end it all', 'you should die',
  'bomb', 'shooting', 'stab you',
  'doxx', 'your real name is', 'your address is', 'your phone is',
  'bit.ly', 'tinyurl', 'click here for free', 'free money transfer', 'send $', 'bitcoin scam',
  '@gmail.com', '@yahoo.com', '@hotmail', 'telegram me at', 'whatsapp me at',
];

function moderateContent(content: string): ModerationStatus {
  const lower = content.toLowerCase();
  if (EXTREME_BLOCKED.some(p => lower.includes(p))) return 'hidden';
  return 'approved';
}

export function InboxProvider({ children, userSlug }: { children: ReactNode; userSlug?: string }) {
  const [messages, setMessages] = useState<AnonymousMessage[]>([]);
  const currentSlugRef = useRef<string>('');

  const approved = messages.filter(m => m.moderationStatus === 'approved' && !m.isReported);
  const unreadCount = approved.filter(m => !m.isRead).length;
  const totalCount = messages.length;

  useEffect(() => {
    if (userSlug) {
      currentSlugRef.current = userSlug;
      loadMessagesForSlug(userSlug);
    } else {
      setMessages([]);
    }
  }, [userSlug]);

  async function loadMessagesForSlug(slug: string) {
    if (!slug) { setMessages([]); return; }
    currentSlugRef.current = slug;
    try {
      const stored = await AsyncStorage.getItem(`@inbox_${slug}`);
      const raw: AnonymousMessage[] = stored ? JSON.parse(stored) : [];
      const { kept, removed } = purgeExpired(raw);
      // Persist the purged list if any messages were expired
      if (removed > 0) {
        await AsyncStorage.setItem(`@inbox_${slug}`, JSON.stringify(kept));
      }
      setMessages(kept);
    } catch {
      setMessages([]);
    }
  }

  async function refreshInbox() {
    if (currentSlugRef.current) {
      await loadMessagesForSlug(currentSlugRef.current);
    }
  }

  async function persist(updated: AnonymousMessage[]) {
    // Always purge on write too — ensures saved state is consistent
    const { kept } = purgeExpired(updated);
    setMessages(kept);
    const slug = currentSlugRef.current;
    if (slug) {
      await AsyncStorage.setItem(`@inbox_${slug}`, JSON.stringify(kept));
    }
  }

  async function sendMessage(recipientSlug: string, category: MessageCategory, content: string) {
    if (!content.trim() || content.trim().length < 2) return { success: false };

    const status = moderateContent(content);
    const newMsg: AnonymousMessage = {
      id: makeId(),
      recipientSlug,
      category,
      content: content.trim(),
      timestamp: new Date().toISOString(),
      senderFingerprint: makeFingerprint(),
      moderationStatus: status,
      isRead: false,
      isSaved: false,
      isReported: false,
    };

    try {
      const stored = await AsyncStorage.getItem(`@inbox_${recipientSlug}`);
      const existing: AnonymousMessage[] = stored ? JSON.parse(stored) : [];
      const { kept } = purgeExpired(existing);
      const updated = [newMsg, ...kept];
      await AsyncStorage.setItem(`@inbox_${recipientSlug}`, JSON.stringify(updated));
      if (currentSlugRef.current === recipientSlug) {
        setMessages(updated);
      }
      return { success: true, blocked: status === 'hidden' };
    } catch {
      return { success: false };
    }
  }

  function markAsRead(id: string)   { persist(messages.map(m => m.id === id ? { ...m, isRead: true } : m)); }
  function saveMessage(id: string)  { persist(messages.map(m => m.id === id ? { ...m, isSaved: !m.isSaved } : m)); }
  function deleteMessage(id: string){ persist(messages.filter(m => m.id !== id)); }
  function reportMessage(id: string){ persist(messages.map(m => m.id === id ? { ...m, isReported: true } : m)); }
  function replyToMessage(id: string, reply: string) {
    persist(messages.map(m => m.id === id ? { ...m, publicReply: reply, isRead: true } : m));
  }

  return (
    <InboxContext.Provider value={{
      messages, unreadCount, totalCount, sendMessage,
      markAsRead, saveMessage, deleteMessage, reportMessage, replyToMessage,
      loadMessagesForSlug, refreshInbox,
    }}>
      {children}
    </InboxContext.Provider>
  );
}

export function useInbox() {
  const ctx = useContext(InboxContext);
  if (!ctx) throw new Error('useInbox must be used within InboxProvider');
  return ctx;
}
