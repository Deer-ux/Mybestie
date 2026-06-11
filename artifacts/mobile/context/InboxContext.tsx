import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const MESSAGE_TTL_MS = 2 * 24 * 60 * 60 * 1000; // 48 h (kept for UI display only)

export type MessageCategory =
  | 'compliment' | 'question' | 'advice' | 'confession'
  | 'encouragement' | 'feedback' | 'other';

export type ModerationStatus = 'approved' | 'hidden';

export interface AnonymousMessage {
  id: string;
  recipientUserId: string;
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

function makeFingerprint() { return Math.random().toString(36).substr(2, 16); }

function apiBase(): string {
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin;
  return '';
}

// Normalize DB row → local AnonymousMessage shape
function fromDb(row: {
  id: string;
  recipientUserId: string;
  recipientSlug: string;
  category: string;
  content: string;
  senderFingerprint: string;
  moderationStatus: string;
  isRead: boolean;
  isSaved: boolean;
  isReported: boolean;
  publicReply?: string | null;
  createdAt: string;
}): AnonymousMessage {
  return {
    id:                row.id,
    recipientUserId:   row.recipientUserId,
    recipientSlug:     row.recipientSlug,
    category:          row.category as MessageCategory,
    content:           row.content,
    timestamp:         row.createdAt,
    senderFingerprint: row.senderFingerprint,
    moderationStatus:  row.moderationStatus as ModerationStatus,
    isRead:            row.isRead,
    isSaved:           row.isSaved,
    isReported:        row.isReported,
    publicReply:       row.publicReply ?? undefined,
  };
}

export function InboxProvider({
  children,
  userSlug,
  userId,
}: {
  children: ReactNode;
  userSlug?: string;
  userId?: string;
}) {
  const [messages, setMessages] = useState<AnonymousMessage[]>([]);
  const currentSlugRef   = useRef<string>('');
  const currentUserIdRef = useRef<string>('');

  const approved    = messages.filter(m => m.moderationStatus === 'approved' && !m.isReported);
  const unreadCount = approved.filter(m => !m.isRead).length;
  const totalCount  = messages.length;

  useEffect(() => {
    if (userId && userSlug) {
      currentSlugRef.current   = userSlug;
      currentUserIdRef.current = userId;
      loadFromApi(userId);
    } else {
      setMessages([]);
    }
  }, [userId, userSlug]);

  // ── Load from API (primary) with AsyncStorage cache fallback ─────────────
  async function loadFromApi(uid: string) {
    try {
      const resp = await fetch(`${apiBase()}/api/inbox/${uid}`);
      if (resp.ok) {
        const data = await resp.json() as { messages: Parameters<typeof fromDb>[0][] };
        const msgs = data.messages.map(fromDb);
        setMessages(msgs);
        // Persist cache for offline use
        await AsyncStorage.setItem(`@inbox_${uid}`, JSON.stringify(msgs));
        return;
      }
    } catch {}

    // Offline fallback: try the local cache
    try {
      const cached = await AsyncStorage.getItem(`@inbox_${uid}`);
      if (cached) {
        setMessages(JSON.parse(cached) as AnonymousMessage[]);
      }
    } catch {
      setMessages([]);
    }
  }

  async function loadMessagesForSlug(slug: string) {
    currentSlugRef.current = slug;
    if (currentUserIdRef.current) {
      await loadFromApi(currentUserIdRef.current);
    }
  }

  async function refreshInbox() {
    if (currentUserIdRef.current) {
      await loadFromApi(currentUserIdRef.current);
    }
  }

  // Optimistic update helper — patches local state then syncs to API
  async function patchMessage(
    id: string,
    patch: Partial<Pick<AnonymousMessage, 'isRead' | 'isSaved' | 'isReported' | 'publicReply'>>,
    optimistic: (m: AnonymousMessage) => AnonymousMessage,
  ) {
    const uid = currentUserIdRef.current;
    setMessages(prev => prev.map(m => m.id === id ? optimistic(m) : m));
    if (!uid) return;
    try {
      await fetch(`${apiBase()}/api/inbox/${uid}/messages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
    } catch {}
  }

  function markAsRead(id: string) {
    patchMessage(id, { isRead: true }, m => ({ ...m, isRead: true }));
  }

  function saveMessage(id: string) {
    setMessages(prev => {
      const updated = prev.map(m => m.id === id ? { ...m, isSaved: !m.isSaved } : m);
      const uid = currentUserIdRef.current;
      if (uid) {
        const msg = updated.find(m => m.id === id);
        if (msg) {
          fetch(`${apiBase()}/api/inbox/${uid}/messages/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isSaved: msg.isSaved }),
          }).catch(() => {});
        }
      }
      return updated;
    });
  }

  async function deleteMessage(id: string) {
    const uid = currentUserIdRef.current;
    setMessages(prev => prev.filter(m => m.id !== id));
    if (!uid) return;
    try {
      await fetch(`${apiBase()}/api/inbox/${uid}/messages/${id}`, { method: 'DELETE' });
    } catch {}
  }

  function reportMessage(id: string) {
    patchMessage(id, { isReported: true }, m => ({ ...m, isReported: true }));
  }

  function replyToMessage(id: string, reply: string) {
    patchMessage(id, { publicReply: reply, isRead: true }, m => ({ ...m, publicReply: reply, isRead: true }));
  }

  async function sendMessage(
    recipientSlug: string,
    category: MessageCategory,
    content: string,
  ): Promise<{ success: boolean; blocked?: boolean }> {
    if (!content.trim() || content.trim().length < 2) return { success: false };

    try {
      const resp = await fetch(`${apiBase()}/api/inbox/${recipientSlug}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          content,
          senderFingerprint: makeFingerprint(),
        }),
      });
      if (!resp.ok) return { success: false };
      const data = await resp.json() as { blocked?: boolean };
      return { success: true, blocked: data.blocked };
    } catch {
      return { success: false };
    }
  }

  return (
    <InboxContext.Provider value={{
      messages, unreadCount, totalCount,
      sendMessage, markAsRead, saveMessage, deleteMessage,
      reportMessage, replyToMessage, loadMessagesForSlug, refreshInbox,
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
