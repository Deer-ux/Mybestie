export const AGE_GROUPS = [
  { id: 'under13', label: 'Under 13', emoji: '🚫', blocked: true, description: 'Sorry, MindBridge is not available for users under 13.' },
  { id: 'teen', label: '13 – 17', emoji: '🌱', blocked: false, description: 'Teen Mode — safer conversations, strict moderation.' },
  { id: 'adult', label: '18+', emoji: '🌟', blocked: false, description: 'Adult Mode — open conversation topics.' },
];

export const MOODS = [
  { id: 'happy', label: 'Happy', emoji: '😊' },
  { id: 'calm', label: 'Calm', emoji: '😌' },
  { id: 'stressed', label: 'Stressed', emoji: '😤' },
  { id: 'lonely', label: 'Lonely', emoji: '😔' },
  { id: 'confused', label: 'Confused', emoji: '😕' },
  { id: 'sad', label: 'Sad', emoji: '😢' },
  { id: 'anxious', label: 'Anxious', emoji: '😰' },
  { id: 'motivated', label: 'Motivated', emoji: '💪' },
  { id: 'curious', label: 'Curious', emoji: '🧐' },
  { id: 'talkative', label: 'Just want to talk', emoji: '💬' },
];

export const GOALS = [
  { id: 'advice', label: 'I need advice', emoji: '💡' },
  { id: 'listen', label: 'I want to listen', emoji: '👂' },
  { id: 'learn', label: 'I want to learn', emoji: '📚' },
  { id: 'share', label: 'I want to share', emoji: '🗣️' },
  { id: 'support', label: 'Emotional support', emoji: '❤️' },
  { id: 'career', label: 'Career guidance', emoji: '💼' },
  { id: 'casual', label: 'Casual chat', emoji: '😊' },
];

export const ALL_INTERESTS = [
  { id: 'life', label: 'Life', emoji: '🌱', teenAllowed: true },
  { id: 'school', label: 'School', emoji: '🎓', teenAllowed: true },
  { id: 'education', label: 'Education', emoji: '📚', teenAllowed: true },
  { id: 'jobs', label: 'Jobs', emoji: '💼', teenAllowed: true },
  { id: 'opportunities', label: 'Opportunities', emoji: '🌟', teenAllowed: true },
  { id: 'habits', label: 'Habits', emoji: '🧠', teenAllowed: true },
  { id: 'growth', label: 'Self-Growth', emoji: '🚀', teenAllowed: true },
  { id: 'culture', label: 'Culture', emoji: '🌍', teenAllowed: true },
  { id: 'tradition', label: 'Tradition', emoji: '🏛️', teenAllowed: true },
  { id: 'history', label: 'History', emoji: '📖', teenAllowed: true },
  { id: 'relationships', label: 'Relationships', emoji: '❤️', teenAllowed: false },
  { id: 'business', label: 'Business', emoji: '📊', teenAllowed: true },
  { id: 'technology', label: 'Technology', emoji: '💻', teenAllowed: true },
  { id: 'encouragement', label: 'Encouragement', emoji: '✨', teenAllowed: true },
  { id: 'skills', label: 'Skills', emoji: '🛠️', teenAllowed: true },
  { id: 'experiences', label: 'Experiences', emoji: '🌈', teenAllowed: true },
];

export function getInterestsForAge(isTeenMode: boolean) {
  return isTeenMode ? ALL_INTERESTS.filter(i => i.teenAllowed) : ALL_INTERESTS;
}

export const PERSONALITIES = [
  { id: 'talkative', label: 'Talkative', emoji: '🗣️' },
  { id: 'quiet', label: 'Quiet Listener', emoji: '👂' },
  { id: 'deep', label: 'Deep Thinker', emoji: '🌊' },
  { id: 'practical', label: 'Practical', emoji: '⚡' },
  { id: 'emotional', label: 'Emotional', emoji: '❤️' },
  { id: 'funny', label: 'Funny', emoji: '😄' },
  { id: 'calm', label: 'Calm', emoji: '😌' },
  { id: 'curious', label: 'Curious', emoji: '🧠' },
];

export const TEMPERAMENTS = [
  { id: 'calm_patient', label: 'Calm & Patient', emoji: '😌' },
  { id: 'friendly_expressive', label: 'Friendly & Expressive', emoji: '✨' },
  { id: 'direct_action', label: 'Direct & Action-Focused', emoji: '🎯' },
  { id: 'deep_thoughtful', label: 'Deep & Thoughtful', emoji: '🌙' },
];

const ADJECTIVES = ['Calm', 'Bright', 'Quiet', 'Bold', 'Swift', 'Gentle', 'Deep', 'Wise', 'Kind', 'Strong', 'Clear', 'Warm', 'Free', 'Pure', 'Still', 'Brave', 'True', 'Real', 'Open', 'Soft'];
const NOUNS = ['Lion', 'River', 'Star', 'Ocean', 'Mountain', 'Forest', 'Eagle', 'Phoenix', 'Sage', 'Soul', 'Light', 'Moon', 'Wind', 'Stone', 'Leaf', 'Wave', 'Flame', 'Cloud', 'Dawn', 'Heart'];

export function generateUsername(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 900) + 10;
  return `${adj}${noun}_${num}`;
}

export const AVATAR_ICON_NAMES = [
  'person', 'happy', 'heart', 'star', 'moon', 'sunny', 'cloud', 'leaf',
  'flame', 'water', 'earth', 'planet', 'rose', 'paw', 'fish', 'bee',
  'flower', 'basketball', 'diamond', 'gift',
];

export const AVATAR_COLOR_OPTIONS = [
  '#0B3C5D', '#1F6F8B', '#6C63FF', '#A29BFE', '#4CAF50',
  '#E67E22', '#E74C3C', '#2980B9', '#8E44AD', '#16A085',
  '#C0392B', '#D35400', '#1A7A4A', '#2C5282', '#702459',
];

export function generateAvatarConfig(): { iconIndex: number; colorIndex: number } {
  return {
    iconIndex: Math.floor(Math.random() * AVATAR_ICON_NAMES.length),
    colorIndex: Math.floor(Math.random() * AVATAR_COLOR_OPTIONS.length),
  };
}

export function makeId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

const CRISIS_KEYWORDS = [
  'kill myself', 'suicide', 'end my life', 'want to die', 'self harm',
  'hurt myself', 'cut myself', 'not worth living', 'better off dead',
  'no reason to live', 'take my life',
];
const DISTRESS_KEYWORDS = [
  'desperate', 'hopeless', 'cant go on', "can't go on", 'give up',
  'nothing matters', 'nobody cares', 'all alone', 'completely alone',
];

export function detectSafetyLevel(text: string): 'safe' | 'distress' | 'crisis' {
  const lower = text.toLowerCase();
  if (CRISIS_KEYWORDS.some(kw => lower.includes(kw))) return 'crisis';
  if (DISTRESS_KEYWORDS.some(kw => lower.includes(kw))) return 'distress';
  return 'safe';
}

const BLOCKED_PATTERNS = [
  'phone number', 'whatsapp', 'instagram', 'snapchat', 'email address',
  'home address', 'where do you live', 'send me a pic', 'send photo',
  'meet up', 'meet in person',
];

export function moderateMessage(text: string): { blocked: boolean; reason?: string } {
  const lower = text.toLowerCase();
  for (const pattern of BLOCKED_PATTERNS) {
    if (lower.includes(pattern)) {
      return { blocked: true, reason: 'This message may contain personal information. Keep conversations safe.' };
    }
  }
  return { blocked: false };
}

export interface SimulatedPartner {
  id: string;
  username: string;
  iconIndex: number;
  colorIndex: number;
  mood: string;
  personality: string;
  temperament: string;
  goal: string;
  interests: string[];
  compatibilityScore: number;
  ageGroup: string;
}

export function generateSimulatedPartner(
  userMood: string,
  userGoal: string,
  userInterests: string[],
  userPersonality: string,
  ageGroup: string,
): SimulatedPartner {
  const config = generateAvatarConfig();
  const partnerGoalMap: Record<string, string> = {
    advice: 'listen', listen: 'share', learn: 'share',
    share: 'listen', support: 'listen', career: 'casual', casual: 'casual',
  };
  const partnerPersonality = userPersonality === 'quiet' ? 'talkative' : userPersonality === 'talkative' ? 'calm' : 'deep';
  const partnerGoal = partnerGoalMap[userGoal] || 'listen';
  const calmMoods = ['calm', 'happy', 'motivated'];
  const distressMoods = ['sad', 'lonely', 'anxious', 'stressed'];
  const partnerMood = distressMoods.includes(userMood)
    ? calmMoods[Math.floor(Math.random() * calmMoods.length)]
    : MOODS[Math.floor(Math.random() * MOODS.length)].id;

  let score = 60;
  if (distressMoods.includes(userMood) && calmMoods.includes(partnerMood)) score += 20;
  if (userGoal === 'advice' && partnerGoal === 'listen') score += 15;
  score += Math.floor(Math.random() * 3) * 4;
  score = Math.min(99, score);

  return {
    id: makeId(),
    username: generateUsername(),
    iconIndex: config.iconIndex,
    colorIndex: config.colorIndex,
    mood: partnerMood,
    personality: partnerPersonality,
    temperament: 'calm_patient',
    goal: partnerGoal,
    interests: userInterests.slice(0, Math.min(userInterests.length, 3)),
    compatibilityScore: score,
    ageGroup,
  };
}

const BRIDGE_STARTERS = [
  "What made you choose this topic today?",
  "Do you want advice, or do you just need someone to listen?",
  "What is one thing you wish people understood about you?",
  "What habit are you trying to improve this month?",
  "What's one small win from your week so far?",
  "What's been on your mind lately?",
  "What question have you been sitting with recently?",
];

const BRIDGE_SILENCE = [
  "Try asking: 'What's something you find hard to explain to others?'",
  "Break the silence: 'What's one thing you're really proud of?'",
  "Gentle prompt: 'What's a challenge you're working through right now?'",
  "Keep it going: 'What's something that made you smile recently?'",
];

const BRIDGE_REPLIES = [
  "That was thoughtful. Follow up with: 'How did that make you feel?'",
  "Nice response! Try: 'What do you think the next step would be?'",
  "Kind reply: 'I hear you. That sounds really tough.'",
  "Keep engaging: 'Can you tell me more about that?'",
];

export function getBridgeSuggestion(type: 'starter' | 'silence' | 'reply'): string {
  const pool = type === 'starter' ? BRIDGE_STARTERS : type === 'silence' ? BRIDGE_SILENCE : BRIDGE_REPLIES;
  return pool[Math.floor(Math.random() * pool.length)];
}

const PARTNER_RESPONSES = [
  "That's really interesting. Tell me more about that.",
  "I understand what you mean. I've felt that way before too.",
  "That takes courage to share. Thank you for being open.",
  "Hmm, I never thought about it that way before.",
  "What do you think you'll do about it?",
  "That sounds challenging. How are you coping with it?",
  "I can relate to that — it's not always easy.",
  "You make a really good point.",
  "What would your ideal outcome look like?",
  "That's worth thinking about more deeply.",
  "How long have you felt this way?",
  "That makes a lot of sense actually.",
  "I admire your perspective on this.",
  "What would you tell a friend going through the same thing?",
  "That's a really mature way of looking at things.",
];

const PARTNER_OPENERS = [
  "Hey! Glad we matched. What's on your mind today? 😊",
  "Hi there! Nice to connect. What would you like to talk about?",
  "Hello! I'm here and ready to listen. What's going on? 👂",
  "Hey, good to meet you! Where would you like to start?",
];

export function getPartnerOpener(): string {
  return PARTNER_OPENERS[Math.floor(Math.random() * PARTNER_OPENERS.length)];
}

export function getPartnerResponse(count: number): string {
  if (count === 0) return getPartnerOpener();
  return PARTNER_RESPONSES[Math.floor(Math.random() * PARTNER_RESPONSES.length)];
}

export const BADGES = [
  { id: 'first_connection', label: 'First Connection', emoji: '🌟', color: '#0B3C5D', description: 'Completed your first MindBridge conversation' },
  { id: 'good_listener', label: 'Good Listener', emoji: '🤝', color: '#1F6F8B', description: 'Listened attentively in 3+ conversations' },
  { id: 'kind_soul', label: 'Kind Soul', emoji: '❤️', color: '#E57373', description: 'Received 5+ positive feedback ratings' },
  { id: 'deep_thinker', label: 'Deep Thinker', emoji: '🌊', color: '#6C63FF', description: 'Engaged in 5+ meaningful conversations' },
  { id: 'culture_sharer', label: 'Culture Sharer', emoji: '🌍', color: '#4CAF50', description: 'Discussed culture or tradition topics' },
  { id: 'career_helper', label: 'Career Helper', emoji: '💼', color: '#F59E0B', description: 'Provided career guidance to others' },
  { id: 'positive_streak', label: 'Positive Streak', emoji: '✨', color: '#A29BFE', description: 'Completed 7 conversations in a row' },
  { id: 'daily_reflection', label: 'Daily Reflection', emoji: '🧠', color: '#16A085', description: 'Reflected on a conversation every day this week' },
];
