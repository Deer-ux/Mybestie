import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type MessageCategory =
  | 'compliment' | 'honest_opinion' | 'confession' | 'advice'
  | 'question' | 'encouragement' | 'feedback' | 'secret' | 'joke' | 'other';

export type ModerationStatus = 'approved' | 'hidden';

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
}

const InboxContext = createContext<InboxContextType | undefined>(undefined);

function makeId() { return Date.now().toString() + Math.random().toString(36).substr(2, 9); }
function makeFingerprint() { return Math.random().toString(36).substr(2, 16); }

// Only block genuinely extreme content — normal criticism, jokes, confessions,
// honest opinions, and emotional messages are allowed through.
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

const DEMO_MESSAGES: AnonymousMessage[] = [
  {
    id: 'demo1', recipientSlug: '', category: 'compliment',
    content: 'You seem like a genuinely kind and thoughtful person. Your anonymous profile has such a calm energy 😊',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    senderFingerprint: 'demo-a', moderationStatus: 'approved',
    isRead: false, isSaved: false, isReported: false,
  },
  {
    id: 'demo2', recipientSlug: '', category: 'honest_opinion',
    content: 'Honestly? I think you\'re harder on yourself than you need to be. From the outside looking in, you\'re doing better than you think.',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    senderFingerprint: 'demo-b', moderationStatus: 'approved',
    isRead: false, isSaved: false, isReported: false,
  },
  {
    id: 'demo3', recipientSlug: '', category: 'confession',
    content: 'I\'ve always wanted to tell you that you inspired me to start being more open about my feelings. I never said it out loud before.',
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    senderFingerprint: 'demo-c', moderationStatus: 'approved',
    isRead: false, isSaved: true, isReported: false,
  },
  {
    id: 'demo4', recipientSlug: '', category: 'encouragement',
    content: 'Whatever you\'re going through right now — keep going. You\'re closer than you think. ✨',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    senderFingerprint: 'demo-d', moderationStatus: 'approved',
    isRead: true, isSaved: false, isReported: false,
  },
  {
    id: 'demo5', recipientSlug: '', category: 'joke',
    content: 'Why do anonymous messages feel so powerful? Because they\'re basically thoughts that got brave enough to leave the brain 😂',
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    senderFingerprint: 'demo-e', moderationStatus: 'approved',
    isRead: true, isSaved: false, isReported: false,
  },
];

export function InboxProvider({ children, userSlug }: { children: ReactNode; userSlug?: string }) {
  const [messages, setMessages] = useState<AnonymousMessage[]>([]);

  const approved = messages.filter(m => m.moderationStatus === 'approved' && !m.isReported);
  const unreadCount = approved.filter(m => !m.isRead).length;
  const totalCount = messages.length;

  useEffect(() => {
    if (userSlug) loadMessagesForSlug(userSlug);
  }, [userSlug]);

  async function loadMessagesForSlug(slug: string) {
    try {
      const stored = await AsyncStorage.getItem(`@inbox_${slug}`);
      if (stored) {
        setMessages(JSON.parse(stored));
      } else {
        const initial = DEMO_MESSAGES.map(m => ({ ...m, recipientSlug: slug }));
        await AsyncStorage.setItem(`@inbox_${slug}`, JSON.stringify(initial));
        setMessages(initial);
      }
    } catch {
      setMessages([]);
    }
  }

  async function persist(updated: AnonymousMessage[]) {
    setMessages(updated);
    if (updated.length > 0) {
      const slug = updated[0].recipientSlug;
      await AsyncStorage.setItem(`@inbox_${slug}`, JSON.stringify(updated));
    }
  }

  async function sendMessage(recipientSlug: string, category: MessageCategory, content: string) {
    if (!content.trim() || content.trim().length < 2) return { success: false };

    const status = moderateContent(content);
    const newMsg: AnonymousMessage = {
      id: makeId(), recipientSlug, category,
      content: content.trim(),
      timestamp: new Date().toISOString(),
      senderFingerprint: makeFingerprint(),
      moderationStatus: status,
      isRead: false, isSaved: false, isReported: false,
    };

    try {
      const stored = await AsyncStorage.getItem(`@inbox_${recipientSlug}`);
      const existing: AnonymousMessage[] = stored ? JSON.parse(stored) : [];
      const updated = [newMsg, ...existing];
      await AsyncStorage.setItem(`@inbox_${recipientSlug}`, JSON.stringify(updated));
      if (messages.length > 0 && messages[0].recipientSlug === recipientSlug) {
        setMessages(updated);
      }
      return { success: true, blocked: status === 'hidden' };
    } catch {
      return { success: false };
    }
  }

  function markAsRead(id: string) { persist(messages.map(m => m.id === id ? { ...m, isRead: true } : m)); }
  function saveMessage(id: string) { persist(messages.map(m => m.id === id ? { ...m, isSaved: !m.isSaved } : m)); }
  function deleteMessage(id: string) { persist(messages.filter(m => m.id !== id)); }
  function reportMessage(id: string) { persist(messages.map(m => m.id === id ? { ...m, isReported: true } : m)); }
  function replyToMessage(id: string, reply: string) {
    persist(messages.map(m => m.id === id ? { ...m, publicReply: reply, isRead: true } : m));
  }

  return (
    <InboxContext.Provider value={{
      messages, unreadCount, totalCount, sendMessage,
      markAsRead, saveMessage, deleteMessage, reportMessage, replyToMessage,
      loadMessagesForSlug,
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
