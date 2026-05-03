import React, { createContext, useContext, useState, useRef, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SimulatedPartner,
  generateSimulatedPartner,
  getPartnerResponse,
  makeId,
  detectSafetyLevel,
  moderateMessage,
} from '@/utils/helpers';

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  reaction?: string;
  isMine: boolean;
  isBridgeGuide?: boolean;
}

export interface ChatSession {
  id: string;
  partner: SimulatedPartner;
  messages: Message[];
  startTime: Date;
  isActive: boolean;
  topic: string;
}

interface Report {
  id: string;
  reason: string;
  timestamp: string;
  partnerUsername: string;
}

interface ChatContextType {
  session: ChatSession | null;
  isMatching: boolean;
  safetyAlert: 'none' | 'distress' | 'crisis';
  reports: Report[];
  matchFound: SimulatedPartner | null;
  startMatching: (userMood: string, userGoal: string, userInterests: string[], userPersonality: string, userId: string, ageGroup: string) => Promise<void>;
  confirmMatch: () => void;
  sendMessage: (text: string) => void;
  reactToMessage: (messageId: string, reaction: string) => void;
  endChat: () => void;
  reportUser: (reason: string, partnerUsername: string) => Promise<void>;
  dismissSafetyAlert: () => void;
  clearSession: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [matchFound, setMatchFound] = useState<SimulatedPartner | null>(null);
  const [safetyAlert, setSafetyAlert] = useState<'none' | 'distress' | 'crisis'>('none');
  const [reports, setReports] = useState<Report[]>([]);
  const partnerMessageCount = useRef(0);

  async function startMatching(
    userMood: string, userGoal: string, userInterests: string[],
    userPersonality: string, _userId: string, ageGroup: string,
  ) {
    setIsMatching(true);
    setMatchFound(null);
    await new Promise(resolve => setTimeout(resolve, 3000));
    const partner = generateSimulatedPartner(userMood, userGoal, userInterests, userPersonality, ageGroup);
    setMatchFound(partner);
    setIsMatching(false);
  }

  function confirmMatch() {
    if (!matchFound) return;
    const partner = matchFound;
    const openerId = makeId();
    const newSession: ChatSession = {
      id: makeId(),
      partner,
      messages: [{
        id: openerId,
        senderId: partner.id,
        text: getPartnerResponse(0),
        timestamp: new Date(),
        isMine: false,
      }],
      startTime: new Date(),
      isActive: true,
      topic: partner.interests[0] ?? 'Life',
    };
    partnerMessageCount.current = 1;
    setSession(newSession);
    setMatchFound(null);
  }

  function sendMessage(text: string) {
    if (!session) return;
    const modResult = moderateMessage(text);
    if (modResult.blocked) return;
    const safetyLevel = detectSafetyLevel(text);
    if (safetyLevel !== 'safe') setSafetyAlert(safetyLevel);

    const myMsg: Message = {
      id: makeId(), senderId: 'me', text, timestamp: new Date(), isMine: true,
    };
    setSession(prev => prev ? { ...prev, messages: [...prev.messages, myMsg] } : prev);

    const delay = 1500 + Math.random() * 2000;
    setTimeout(() => {
      const partnerMsg: Message = {
        id: makeId(),
        senderId: session.partner.id,
        text: getPartnerResponse(partnerMessageCount.current),
        timestamp: new Date(),
        isMine: false,
      };
      partnerMessageCount.current += 1;
      setSession(prev => prev ? { ...prev, messages: [...prev.messages, partnerMsg] } : prev);
    }, delay);
  }

  function reactToMessage(messageId: string, reaction: string) {
    setSession(prev => prev ? {
      ...prev,
      messages: prev.messages.map(m => m.id === messageId ? { ...m, reaction } : m),
    } : prev);
  }

  function endChat() {
    setSession(prev => prev ? { ...prev, isActive: false } : null);
  }

  async function reportUser(reason: string, partnerUsername: string) {
    const report: Report = { id: makeId(), reason, timestamp: new Date().toISOString(), partnerUsername };
    const updated = [...reports, report];
    setReports(updated);
    await AsyncStorage.setItem('@mindbridge_reports', JSON.stringify(updated));
  }

  function dismissSafetyAlert() { setSafetyAlert('none'); }
  function clearSession() { setSession(null); setMatchFound(null); setIsMatching(false); }

  return (
    <ChatContext.Provider value={{
      session, isMatching, safetyAlert, reports, matchFound,
      startMatching, confirmMatch, sendMessage, reactToMessage,
      endChat, reportUser, dismissSafetyAlert, clearSession,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}
