export const MOODS = [
  { id: 'happy', label: 'Happy', icon: 'sunny-outline' },
  { id: 'calm', label: 'Calm', icon: 'water-outline' },
  { id: 'stressed', label: 'Stressed', icon: 'thunderstorm-outline' },
  { id: 'lonely', label: 'Lonely', icon: 'moon-outline' },
  { id: 'confused', label: 'Confused', icon: 'help-circle-outline' },
  { id: 'sad', label: 'Sad', icon: 'rainy-outline' },
  { id: 'anxious', label: 'Anxious', icon: 'pulse-outline' },
  { id: 'motivated', label: 'Motivated', icon: 'flash-outline' },
  { id: 'curious', label: 'Curious', icon: 'search-outline' },
  { id: 'talkative', label: 'Just want to talk', icon: 'chatbubble-outline' },
];

export const GOALS = [
  { id: 'advice', label: 'I need advice', icon: 'bulb-outline' },
  { id: 'listen', label: 'I want to listen', icon: 'ear-outline' },
  { id: 'learn', label: 'I want to learn', icon: 'book-outline' },
  { id: 'share', label: 'I want to share', icon: 'share-outline' },
  { id: 'support', label: 'I want emotional support', icon: 'heart-outline' },
  { id: 'career', label: 'I want career guidance', icon: 'briefcase-outline' },
  { id: 'casual', label: 'I want casual chat', icon: 'happy-outline' },
];

export const INTERESTS = [
  { id: 'life', label: 'Life' },
  { id: 'school', label: 'School' },
  { id: 'education', label: 'Education' },
  { id: 'jobs', label: 'Jobs' },
  { id: 'opportunities', label: 'Opportunities' },
  { id: 'habits', label: 'Habits' },
  { id: 'growth', label: 'Self-Growth' },
  { id: 'culture', label: 'Culture' },
  { id: 'tradition', label: 'Tradition' },
  { id: 'history', label: 'History' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'business', label: 'Business' },
  { id: 'technology', label: 'Technology' },
  { id: 'encouragement', label: 'Encouragement' },
  { id: 'skills', label: 'Skills' },
  { id: 'experiences', label: 'Experiences' },
];

export const PERSONALITIES = [
  { id: 'talkative', label: 'Talkative', icon: 'chatbubbles-outline' },
  { id: 'quiet', label: 'Quiet', icon: 'volume-mute-outline' },
  { id: 'deep', label: 'Deep Thinker', icon: 'telescope-outline' },
  { id: 'practical', label: 'Practical', icon: 'construct-outline' },
  { id: 'emotional', label: 'Emotional', icon: 'heart-outline' },
  { id: 'funny', label: 'Funny', icon: 'happy-outline' },
  { id: 'calm', label: 'Calm', icon: 'leaf-outline' },
  { id: 'curious', label: 'Curious', icon: 'telescope-outline' },
];

export const TEMPERAMENTS = [
  { id: 'calm_patient', label: 'Calm & Patient', icon: 'timer-outline' },
  { id: 'friendly_expressive', label: 'Friendly & Expressive', icon: 'sunny-outline' },
  { id: 'direct_action', label: 'Direct & Action-Focused', icon: 'arrow-forward-outline' },
  { id: 'deep_thoughtful', label: 'Deep & Thoughtful', icon: 'planet-outline' },
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
  '#1B3A6B', '#7C5CBF', '#27AE60', '#E67E22', '#E74C3C',
  '#2980B9', '#8E44AD', '#16A085', '#C0392B', '#D35400',
  '#1A7A4A', '#2C5282', '#702459', '#744210', '#22543D',
];

export function generateAvatarConfig(): { iconIndex: number; colorIndex: number } {
  return {
    iconIndex: Math.floor(Math.random() * AVATAR_ICON_NAMES.length),
    colorIndex: Math.floor(Math.random() * AVATAR_COLOR_OPTIONS.length),
  };
}

function makeId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}
export { makeId };

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
      return { blocked: true, reason: 'This message may contain personal information. Please keep conversations safe and anonymous.' };
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
}

export function generateSimulatedPartner(userMood: string, userGoal: string, userInterests: string[], userPersonality: string): SimulatedPartner {
  const config = generateAvatarConfig();

  const partnerGoalMap: Record<string, string> = {
    'advice': 'listen',
    'listen': 'share',
    'learn': 'share',
    'share': 'listen',
    'support': 'listen',
    'career': 'casual',
    'casual': 'casual',
  };

  const partnerPersonality = userPersonality === 'quiet' ? 'talkative' : userPersonality === 'talkative' ? 'calm' : 'deep';
  const partnerGoal = partnerGoalMap[userGoal] || 'listen';
  const calmMoods = ['calm', 'happy', 'motivated'];
  const distressMoods = ['sad', 'lonely', 'anxious', 'stressed'];
  let partnerMood = calmMoods[Math.floor(Math.random() * calmMoods.length)];
  if (distressMoods.includes(userMood)) {
    partnerMood = calmMoods[Math.floor(Math.random() * calmMoods.length)];
  }

  let score = 60;
  if (distressMoods.includes(userMood) && calmMoods.includes(partnerMood)) score += 20;
  if (userGoal === 'advice' && partnerGoal === 'listen') score += 15;
  const sharedCount = Math.floor(Math.random() * 3) + 1;
  score += sharedCount * 4;
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
  };
}

const BRIDGE_STARTERS = [
  "What made you choose this topic today?",
  "Do you want advice, or do you just want someone to listen?",
  "What is one thing you wish people understood about you?",
  "What habit are you trying to improve?",
  "What is one tradition from your culture that people should know?",
  "What's one small win from your week?",
  "What's been on your mind lately?",
  "What's something you're working toward right now?",
  "What does a good day look like for you?",
  "What's a question you've been thinking about?",
];

const BRIDGE_SILENCE_PROMPTS = [
  "The conversation has gone quiet. Try asking: 'What's something you find hard to explain to others?'",
  "Want to keep the conversation flowing? Ask: 'What's one thing you're really proud of?'",
  "Not sure what to say? Try: 'What's a challenge you're currently working through?'",
  "Break the silence with: 'What's something that made you smile recently?'",
];

const BRIDGE_REPLIES = [
  "That was thoughtful. You could follow up with: 'How did that make you feel?'",
  "Great response! Try asking: 'What do you think the next step would be?'",
  "You're doing great. A kind reply: 'I hear you. That sounds really tough.'",
  "Nice engagement. Keep it going: 'Can you tell me more about that?'",
];

export function getBridgeSuggestion(type: 'starter' | 'silence' | 'reply'): string {
  const pool = type === 'starter' ? BRIDGE_STARTERS : type === 'silence' ? BRIDGE_SILENCE_PROMPTS : BRIDGE_REPLIES;
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
  "You make a really good point. I appreciate you sharing.",
  "What would your ideal outcome look like?",
  "That's worth thinking about more deeply.",
  "How long have you felt this way?",
  "That makes a lot of sense actually.",
  "I admire your perspective on this.",
  "What would you tell a friend going through the same thing?",
  "That's a really mature way of looking at things.",
];

const PARTNER_OPENERS = [
  "Hey! I'm glad we matched. What's on your mind today?",
  "Hi there! Nice to connect with you. What would you like to talk about?",
  "Hello! I'm here and ready to listen. What's going on with you?",
  "Hey, good to meet you! Where would you like to start?",
];

export function getPartnerOpener(): string {
  return PARTNER_OPENERS[Math.floor(Math.random() * PARTNER_OPENERS.length)];
}

export function getPartnerResponse(messageCount: number): string {
  if (messageCount === 0) return getPartnerOpener();
  return PARTNER_RESPONSES[Math.floor(Math.random() * PARTNER_RESPONSES.length)];
}

export const BADGES = [
  { id: 'good_listener', label: 'Good Listener', icon: 'ear-outline', color: '#2980B9', description: 'Listened attentively in 3+ conversations' },
  { id: 'kind_soul', label: 'Kind Soul', icon: 'heart-outline', color: '#E74C3C', description: 'Received 5+ positive feedback ratings' },
  { id: 'culture_sharer', label: 'Culture Sharer', icon: 'earth-outline', color: '#27AE60', description: 'Discussed culture or tradition topics' },
  { id: 'career_helper', label: 'Career Helper', icon: 'briefcase-outline', color: '#E67E22', description: 'Provided career guidance to others' },
  { id: 'deep_thinker', label: 'Deep Thinker', icon: 'telescope-outline', color: '#7C5CBF', description: 'Engaged in 5+ deep conversations' },
  { id: 'positive_streak', label: 'Positive Streak', icon: 'flash-outline', color: '#F39C12', description: 'Completed 7 conversations in a row' },
  { id: 'daily_reflection', label: 'Daily Reflection', icon: 'journal-outline', color: '#16A085', description: 'Reflected on a conversation every day this week' },
  { id: 'first_connection', label: 'First Connection', icon: 'link-outline', color: '#1B3A6B', description: 'Completed your first MindBridge conversation' },
];
