import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type MessageCategory = 'compliment' | 'advice' | 'confession' | 'question' | 'encouragement' | 'feedback' | 'secret' | 'other';
export type ModerationStatus = 'approved' | 'flagged' | 'blocked';

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
  sendMessage: (recipientSlug: string, category: MessageCategory, content: string) => Promise<{ success: boolean; reason?: string }>;
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

const BLOCKED_PATTERNS = [
  'hate you', 'kill yourself', 'go die', 'you\'re ugly', 'you are ugly', 'kys',
  'nude', 'send pic', 'phone number', 'whatsapp', 'address', 'where do you live',
  'suicide', 'i will find you', 'threat', 'bomb', 'rape', 'sexual',
];

const FLAGGED_PATTERNS = [
  'idiot', 'stupid', 'loser', 'worthless', 'dumb', 'pathetic', 'freak',
  'scam', 'click this link', 'free money', 'send $',
];

function moderateContent(content: string): ModerationStatus {
  const lower = content.toLowerCase();
  if (BLOCKED_PATTERNS.some(p => lower.includes(p))) return 'blocked';
  if (FLAGGED_PATTERNS.some(p => lower.includes(p))) return 'flagged';
  return 'approved';
}

const DEMO_MESSAGES: AnonymousMessage[] = [
  {
    id: 'demo1', recipientSlug: '', category: 'compliment',
    content: 'Your anonymous profile feels really calming and welcoming. You seem like a genuinely kind person. 😊',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    senderFingerprint: 'demo-a', moderationStatus: 'approved',
    isRead: false, isSaved: false, isReported: false,
  },
  {
    id: 'demo2', recipientSlug: '', category: 'encouragement',
    content: 'Keep going! Whatever you\'re working toward, you\'re doing better than you think. ✨',
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    senderFingerprint: 'demo-b', moderationStatus: 'approved',
    isRead: false, isSaved: true, isReported: false,
  },
  {
    id: 'demo3', recipientSlug: '', category: 'question',
    content: 'What advice would you give someone who feels stuck in life?',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    senderFingerprint: 'demo-c', moderationStatus: 'approved',
    isRead: true, isSaved: false, isReported: false,
  },
];

export function InboxProvider({ children, userSlug }: { children: ReactNode; userSlug?: string }) {
  const [messages, setMessages] = useState<AnonymousMessage[]>([]);

  const unreadCount = messages.filter(m => !m.isRead && m.moderationStatus === 'approved').length;

  useEffect(() => {
    if (userSlug) {
      loadMessagesForSlug(userSlug);
    }
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
    if (!content.trim()) return { success: false, reason: 'Message cannot be empty.' };
    if (content.length < 3) return { success: false, reason: 'Message is too short.' };

    const status = moderateContent(content);
    if (status === 'blocked') {
      return { success: false, reason: 'This message may violate MindBridge safety rules and was not delivered.' };
    }

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
      const updated = [newMsg, ...existing];
      await AsyncStorage.setItem(`@inbox_${recipientSlug}`, JSON.stringify(updated));

      if (messages.length > 0 && messages[0].recipientSlug === recipientSlug) {
        setMessages(updated);
      }
      return { success: true };
    } catch {
      return { success: false, reason: 'Failed to send. Please try again.' };
    }
  }

  function markAsRead(id: string) {
    const updated = messages.map(m => m.id === id ? { ...m, isRead: true } : m);
    persist(updated);
  }

  function saveMessage(id: string) {
    const updated = messages.map(m => m.id === id ? { ...m, isSaved: !m.isSaved } : m);
    persist(updated);
  }

  function deleteMessage(id: string) {
    const updated = messages.filter(m => m.id !== id);
    persist(updated);
  }

  function reportMessage(id: string) {
    const updated = messages.map(m => m.id === id ? { ...m, isReported: true } : m);
    persist(updated);
  }

  function replyToMessage(id: string, reply: string) {
    const updated = messages.map(m => m.id === id ? { ...m, publicReply: reply, isRead: true } : m);
    persist(updated);
  }

  return (
    <InboxContext.Provider value={{
      messages, unreadCount, sendMessage, markAsRead,
      saveMessage, deleteMessage, reportMessage, replyToMessage,
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
