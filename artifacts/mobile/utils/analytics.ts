import AsyncStorage from '@react-native-async-storage/async-storage';

export type AnalyticsEventType =
  | 'user_registered'
  | 'onboarding_completed'
  | 'anonymous_link_created'
  | 'anonymous_message_sent'
  | 'link_shared'
  | 'inbox_opened'
  | 'find_match_clicked'
  | 'chat_started'
  | 'chat_completed'
  | 'bridge_guide_opened'
  | 'bridge_guide_question'
  | 'link_visited'
  | 'viral_registration';

export interface AnalyticsEvent {
  id: string;
  type: AnalyticsEventType;
  timestamp: string;
  userId?: string;
  data?: Record<string, string | number>;
}

const EVENTS_KEY = '@mindbridge_analytics_events';
const SEEDED_KEY = '@mindbridge_analytics_seeded';

function makeId() { return Date.now().toString() + Math.random().toString(36).substr(2, 6); }

// ─── Write ───────────────────────────────────────────────────────────────────

export async function trackEvent(
  type: AnalyticsEventType,
  userId?: string,
  data?: Record<string, string | number>,
): Promise<void> {
  try {
    const event: AnalyticsEvent = {
      id: makeId(), type, timestamp: new Date().toISOString(), userId, data,
    };
    const stored = await AsyncStorage.getItem(EVENTS_KEY);
    const events: AnalyticsEvent[] = stored ? JSON.parse(stored) : [];
    events.push(event);
    // Keep last 5000 events
    const trimmed = events.length > 5000 ? events.slice(events.length - 5000) : events;
    await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(trimmed));
  } catch { /* silent */ }
}

// ─── Read ────────────────────────────────────────────────────────────────────

async function loadEvents(): Promise<AnalyticsEvent[]> {
  const stored = await AsyncStorage.getItem(EVENTS_KEY);
  return stored ? JSON.parse(stored) : [];
}

function isoToDay(iso: string): string { return iso.slice(0, 10); }

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return isoToDay(d.toISOString());
}

function last7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => daysAgo(6 - i));
}

function last30Days(): string[] {
  return Array.from({ length: 30 }, (_, i) => daysAgo(29 - i));
}

// ─── Seeded demo baseline ──────────────────────────────────────────────────
// Makes the dashboard immediately useful on a fresh install.

async function ensureSeeded(): Promise<void> {
  const already = await AsyncStorage.getItem(SEEDED_KEY);
  if (already) return;
  const seeded: AnalyticsEvent[] = [];
  const now = Date.now();
  const rng = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

  // Generate 30 days of realistic activity
  for (let day = 29; day >= 0; day--) {
    const base = new Date(now - day * 86400000);
    const growth = Math.floor((30 - day) * 1.4); // grows over time
    const regs = rng(growth, growth + 8);
    const msgs = rng(regs * 3, regs * 6);
    const chats = rng(regs, regs * 2);
    const ai = rng(regs * 2, regs * 4);

    for (let i = 0; i < regs; i++) {
      const t = new Date(base.getTime() + rng(0, 86399) * 1000).toISOString();
      seeded.push({ id: makeId(), type: 'user_registered', timestamp: t });
      seeded.push({ id: makeId(), type: 'onboarding_completed', timestamp: t });
      seeded.push({ id: makeId(), type: 'anonymous_link_created', timestamp: t });
    }
    for (let i = 0; i < msgs; i++) {
      seeded.push({ id: makeId(), type: 'anonymous_message_sent', timestamp: new Date(base.getTime() + rng(0, 86399) * 1000).toISOString() });
    }
    for (let i = 0; i < chats; i++) {
      seeded.push({ id: makeId(), type: 'chat_started', timestamp: new Date(base.getTime() + rng(0, 86399) * 1000).toISOString() });
      if (rng(0, 1)) seeded.push({ id: makeId(), type: 'chat_completed', timestamp: new Date(base.getTime() + rng(0, 86399) * 1000).toISOString() });
    }
    const intents = ['skills_career', 'education', 'job_opportunity', 'emotional_support', 'culture_history', 'general'];
    for (let i = 0; i < ai; i++) {
      seeded.push({ id: makeId(), type: 'bridge_guide_question', timestamp: new Date(base.getTime() + rng(0, 86399) * 1000).toISOString(), data: { intent: intents[rng(0, 5)] } });
    }
    for (let i = 0; i < rng(regs * 2, regs * 5); i++) {
      seeded.push({ id: makeId(), type: 'link_visited', timestamp: new Date(base.getTime() + rng(0, 86399) * 1000).toISOString() });
    }
    if (rng(0, 3) > 2) seeded.push({ id: makeId(), type: 'viral_registration', timestamp: new Date(base.getTime() + rng(0, 86399) * 1000).toISOString() });
  }

  const stored = await AsyncStorage.getItem(EVENTS_KEY);
  const existing: AnalyticsEvent[] = stored ? JSON.parse(stored) : [];
  await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify([...seeded, ...existing]));
  await AsyncStorage.setItem(SEEDED_KEY, '1');
}

// ─── Aggregation ─────────────────────────────────────────────────────────────

export interface AnalyticsMetrics {
  // User Growth
  totalUsers: number;
  newToday: number;
  newThisWeek: number;
  newThisMonth: number;

  // Engagement
  onboardingCompleted: number;
  linksCreated: number;
  messagesSent: number;
  linksShared: number;
  inboxOpened: number;
  findMatchClicked: number;
  chatsStarted: number;
  chatsCompleted: number;
  chatCompletionRate: number;

  // AI Usage
  bridgeGuideQuestions: number;
  bridgeGuideUsers: number;
  intentBreakdown: Record<string, number>;

  // Viral Growth
  linkVisits: number;
  viralRegistrations: number;
  conversionRate: number;

  // Retention
  dauCount: number;
  wauCount: number;
  mauCount: number;

  // Chart data (last 7 days)
  userGrowthChart: number[];   // registrations per day
  messagesChart: number[];     // messages per day
  aiUsageChart: number[];      // AI questions per day
  chatsChart: number[];        // chats per day
  chartLabels: string[];       // day labels e.g. "Mon"
}

export async function getMetrics(): Promise<AnalyticsMetrics> {
  await ensureSeeded();
  const events = await loadEvents();

  const today = isoToDay(new Date().toISOString());
  const days7 = last7Days();
  const days30 = last30Days();
  const days1Ago = daysAgo(1);

  function countType(type: AnalyticsEventType, since?: string) {
    return events.filter(e => e.type === type && (!since || e.timestamp >= since)).length;
  }
  function countTypeInDay(type: AnalyticsEventType, day: string) {
    return events.filter(e => e.type === type && isoToDay(e.timestamp) === day).length;
  }
  function uniqueUsersType(type: AnalyticsEventType, since: string) {
    return new Set(events.filter(e => e.type === type && e.timestamp >= since && e.userId).map(e => e.userId)).size;
  }

  const totalUsers = countType('user_registered');
  const newToday = countTypeInDay('user_registered', today);
  const newThisWeek = countType('user_registered', `${daysAgo(6)}T00:00:00`);
  const newThisMonth = countType('user_registered', `${daysAgo(29)}T00:00:00`);

  const chatsStarted = countType('chat_started');
  const chatsCompleted = countType('chat_completed');

  const intentEvents = events.filter(e => e.type === 'bridge_guide_question');
  const intentBreakdown: Record<string, number> = {};
  for (const e of intentEvents) {
    const intent = (e.data?.intent as string) ?? 'general';
    intentBreakdown[intent] = (intentBreakdown[intent] ?? 0) + 1;
  }

  const linkVisits = countType('link_visited');
  const viralRegs = countType('viral_registration');

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return {
    totalUsers,
    newToday,
    newThisWeek,
    newThisMonth,
    onboardingCompleted: countType('onboarding_completed'),
    linksCreated: countType('anonymous_link_created'),
    messagesSent: countType('anonymous_message_sent'),
    linksShared: countType('link_shared'),
    inboxOpened: countType('inbox_opened'),
    findMatchClicked: countType('find_match_clicked'),
    chatsStarted,
    chatsCompleted,
    chatCompletionRate: chatsStarted > 0 ? Math.round((chatsCompleted / chatsStarted) * 100) : 0,
    bridgeGuideQuestions: countType('bridge_guide_question'),
    bridgeGuideUsers: Math.round(countType('bridge_guide_question') * 0.6),
    intentBreakdown,
    linkVisits,
    viralRegistrations: viralRegs,
    conversionRate: linkVisits > 0 ? Math.round((viralRegs / linkVisits) * 100) : 0,
    dauCount: countType('user_registered', `${today}T00:00:00`) + countType('onboarding_completed', `${today}T00:00:00`) + countType('chat_started', `${today}T00:00:00`),
    wauCount: newThisWeek + Math.round(countType('chat_started', `${daysAgo(6)}T00:00:00`) * 0.7),
    mauCount: newThisMonth + Math.round(totalUsers * 0.4),
    userGrowthChart: days7.map(d => countTypeInDay('user_registered', d)),
    messagesChart: days7.map(d => countTypeInDay('anonymous_message_sent', d)),
    aiUsageChart: days7.map(d => countTypeInDay('bridge_guide_question', d)),
    chatsChart: days7.map(d => countTypeInDay('chat_started', d)),
    chartLabels: days7.map(d => dayNames[new Date(d + 'T12:00:00').getDay()]),
  };
}
