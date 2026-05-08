import { ConversationMessage } from './bridgeGuide';

export interface BridgeGuideRequest {
  message: string;
  conversationHistory: { role: 'user' | 'assistant'; content: string }[];
  userMood?: string;
  userInterests?: string[];
  userPersonality?: string;
  userTemperament?: string;
}

export interface BridgeGuideResponse {
  reply: string;
}

function getApiBase(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) return `https://${domain}`;
  return '';
}

export async function callBridgeGuideApi(
  request: BridgeGuideRequest,
  timeoutMs = 20000,
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${getApiBase()}/api/bridgeguide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    if (!res.ok) {
      let errMsg = `Request failed (${res.status})`;
      try {
        const body = await res.json() as { error?: string };
        if (body.error) errMsg = body.error;
      } catch {
        // ignore parse failure
      }
      throw new Error(errMsg);
    }

    const data = await res.json() as BridgeGuideResponse;
    if (!data.reply) throw new Error('Empty response from AI');
    return data.reply;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Bestie AI took too long to respond. Please try again.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export function buildHistoryForApi(
  messages: ConversationMessage[],
): { role: 'user' | 'assistant'; content: string }[] {
  return messages
    .filter(m => m.text.trim().length > 0)
    .map(m => ({
      role: m.isUser ? ('user' as const) : ('assistant' as const),
      content: m.text,
    }));
}
