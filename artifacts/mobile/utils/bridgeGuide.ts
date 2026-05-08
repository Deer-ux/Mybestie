export type BridgeIntent =
  | 'skills_career'
  | 'education'
  | 'job_opportunity'
  | 'habits_growth'
  | 'culture_history'
  | 'chat_suggestion'
  | 'emotional_support'
  | 'crisis'
  | 'casual_chat'
  | 'short_unclear'
  | 'app_help'
  | 'general';

export interface ConversationMessage {
  text: string;
  isUser: boolean;
}

export interface BridgeResponse {
  intent: BridgeIntent;
  response: string;
}

export interface UserContext {
  mood?: string;
  goal?: string;
  personality?: string;
  temperament?: string;
  interests?: string[];
  ageGroup?: string;
  username?: string;
  history?: ConversationMessage[];
}

// ─── Keyword lists ────────────────────────────────────────────────────────────

const CRISIS_KEYWORDS = [
  'kill myself', 'suicide', 'end my life', 'want to die', 'self harm',
  'hurt myself', 'cut myself', 'not worth living', 'better off dead',
  'no reason to live', 'take my life', 'overdose', 'harming myself',
  'end it all', 'wish i was dead', 'wanna die',
];

const EMOTIONAL_KEYWORDS = [
  'i feel lonely', "i'm lonely", 'so sad', 'really sad', 'i feel sad',
  'i am depressed', "i'm depressed", 'very anxious', 'so stressed', 'overwhelmed',
  'hopeless', 'worthless', 'hate myself', 'giving up', 'i\'ve been crying',
  'feel lost', 'feel empty', 'heartbroken', 'i\'m scared', 'nothing matters',
  'all alone', 'nobody cares', "can't cope", 'feel terrible', 'feel awful',
  'breaking down', 'i\'m struggling', 'hard time', 'having a tough',
];

const SKILLS_KEYWORDS = [
  'what skill', 'which skill', 'learn to code', 'learn coding', 'learn design',
  'learn programming', 'career advice', 'career guidance', 'freelance', 'portfolio',
  'soft skill', 'digital skill', 'improve myself', 'professional skill',
  'what should i learn', 'how to be better at', 'skill to learn', 'improve my skills',
];

const JOB_KEYWORDS = [
  'find a job', 'get a job', 'job search', 'apply for job', 'job application',
  'internship', 'job interview', 'interview tips', 'how to get hired', 'cv advice',
  'resume tips', 'salary negotiation', 'remote job', 'work from home', 'linkedin',
  'employment', 'job opportunity', 'looking for work',
];

const EDUCATION_KEYWORDS = [
  'how to study', 'study tips', 'exam prep', 'preparing for exam', 'university',
  'college', 'scholarship', 'degree', 'pass my exam', 'academic performance',
  'study schedule', 'how to focus', 'memory tips', 'learn faster',
];

const HABITS_KEYWORDS = [
  'build a habit', 'morning routine', 'daily routine', 'productivity tip',
  'stop procrastinating', 'stay motivated', 'discipline', 'self improvement',
  'personal growth', 'how to be consistent', 'habit tracker', 'time management',
  'focus better', 'mindset', 'goals',
];

const CULTURE_KEYWORDS = [
  'history of', 'culture of', 'tradition of', 'about this country', 'what language',
  'what religion', 'cultural difference', 'world history', 'ancient civilization',
  'interesting fact', 'tell me about', 'heritage',
];

const CHAT_KEYWORDS = [
  'what should i say', 'how do i start', 'conversation starter', 'how to break ice',
  'suggest something to say', 'what to talk about', 'how to reply', 'good topic',
  'what to ask', 'start a conversation',
];

const APP_KEYWORDS = [
  'how does this app work', 'what is mindbridge', 'how do i', 'how to use',
  'anonymous link', 'what can you do', 'what are you', 'who are you',
  'what is bridgeguide', 'app help',
];

const GREETING_EXACT = new Set([
  'hi', 'hello', 'hey', 'heyy', 'heyyy', 'sup', "what's up", "what's good",
  'howdy', 'yo', 'hiya', 'hi there', 'hello there', 'good morning',
  'good afternoon', 'good evening', 'morning', 'evening',
]);

const HOW_ARE_YOU_PHRASES = [
  'how are you', 'how r u', 'how are u', 'hows it going', 'how\'s it going',
  "how're you", 'how do you do', 'how have you been', 'you okay', 'you good',
];

// ─── Intent detection ─────────────────────────────────────────────────────────

export function detectIntent(text: string): BridgeIntent {
  const lower = text.toLowerCase().trim();
  const words = lower.split(/\s+/).filter(Boolean);

  // Crisis always wins
  if (CRISIS_KEYWORDS.some(kw => lower.includes(kw))) return 'crisis';

  // Greeting exact match
  if (GREETING_EXACT.has(lower) || HOW_ARE_YOU_PHRASES.some(p => lower.includes(p))) return 'casual_chat';

  // Emotional support — only on explicit emotional phrases (not generic short messages)
  if (EMOTIONAL_KEYWORDS.some(kw => lower.includes(kw))) return 'emotional_support';

  // Specific topic detection
  if (SKILLS_KEYWORDS.some(kw => lower.includes(kw))) return 'skills_career';
  if (JOB_KEYWORDS.some(kw => lower.includes(kw))) return 'job_opportunity';
  if (EDUCATION_KEYWORDS.some(kw => lower.includes(kw))) return 'education';
  if (HABITS_KEYWORDS.some(kw => lower.includes(kw))) return 'habits_growth';
  if (CULTURE_KEYWORDS.some(kw => lower.includes(kw))) return 'culture_history';
  if (CHAT_KEYWORDS.some(kw => lower.includes(kw))) return 'chat_suggestion';
  if (APP_KEYWORDS.some(kw => lower.includes(kw))) return 'app_help';

  // Broader fallback matching
  if (lower.includes('skill') || lower.includes('career')) return 'skills_career';
  if (lower.includes('learn') && words.length > 3) return 'skills_career';
  if (lower.includes('job') || lower.includes('interview') || lower.includes('hire')) return 'job_opportunity';
  if (lower.includes('school') || lower.includes('exam') || lower.includes('study')) return 'education';
  if (lower.includes('habit') || lower.includes('routine') || lower.includes('productive')) return 'habits_growth';
  if (lower.includes('culture') || lower.includes('history') || lower.includes('country')) return 'culture_history';

  // Short or ambiguous messages → handle with context
  if (words.length <= 5) return 'short_unclear';

  // Longer messages that don't match a topic
  return 'general';
}

// ─── Short/unclear message handler ───────────────────────────────────────────

function getShortUnclearResponse(text: string, lastAIMessage: string | null): string {
  const lower = text.toLowerCase().trim();

  // Negative or partial denial
  if (['not really', 'not quite', 'not exactly', 'not particularly'].some(p => lower.includes(p))) {
    return "That's okay. We can keep it light. Want to talk about life, school, work, or something random?";
  }

  // Uncertainty
  if (['idk', "i don't know", "i dont know", "dunno", 'not sure', "i'm not sure", 'i have no idea'].some(p => lower.includes(p))) {
    return "No worries — not knowing what to talk about is completely fine. Is there something on your mind, or just passing time?";
  }

  // Passive acceptance
  if (['maybe', 'i guess', 'sort of', 'kinda', 'kind of', 'i suppose', 'possibly'].some(p => lower.includes(p))) {
    return "That's valid. What's been going on with you lately?";
  }

  // Nothing much
  if (['nothing', 'nothing much', 'not much', 'nm', 'nada'].some(p => lower === p)) {
    return "Nothing? Fair enough. Want to talk about something light — or is there something on your mind?";
  }

  // Passive inaction
  if (['not do anything', 'do nothing', "won't do anything", "not doing anything", 'just leave it', 'just ignore'].some(p => lower.includes(p))) {
    return "Fair enough. Sometimes doing nothing for a moment is okay. What made you feel that way?";
  }

  // Simple affirmatives
  if (['yes', 'yeah', 'yep', 'yup', 'definitely', 'absolutely', 'of course', 'sure', 'yes please'].some(p => lower === p || lower === p + '.')) {
    return "Great. Tell me more — what did you have in mind?";
  }

  // Simple negatives
  if (['no', 'nope', 'nah', 'not at all', 'not really no'].some(p => lower === p || lower === p + '.')) {
    return "Alright. Is there something else you'd like to talk about?";
  }

  // Simple acknowledgements
  if (['ok', 'okay', 'fine', 'alright', 'got it', 'i see', 'hmm', 'hm', 'ah', 'oh', 'oh ok', 'oh okay'].some(p => lower === p || lower === p + '.')) {
    if (lastAIMessage) {
      return "I'm here if you want to continue. What's on your mind?";
    }
    return "Got it. What would you like to talk about today?";
  }

  // Thanks
  if (['thanks', 'thank you', 'thank u', 'ty', 'thx', 'cheers'].some(p => lower.includes(p))) {
    return "You're welcome. Anything else on your mind?";
  }

  // Default — no context assumed
  const defaults = [
    "Can you tell me a bit more about that?",
    "I'm listening. What's been on your mind lately?",
    "What would you like to explore today?",
    "Feel free to share more — I'm here.",
  ];
  return defaults[Math.floor(Math.random() * defaults.length)];
}

// ─── Topic response pools ─────────────────────────────────────────────────────

const RESPONSES: Record<BridgeIntent, string[]> = {
  skills_career: [
    "Start with practical digital skills: communication, Canva/design, AI tools, basic coding, data analysis, and content creation. Which one interests you most?",
    "Top skills right now:\n\n• AI tool literacy (ChatGPT, Midjourney)\n• Video editing (CapCut, Premiere)\n• Copywriting\n• No-code tools (Glide, Bubble)\n• Digital marketing\n\nMany are free on YouTube or Coursera. What's your background?",
    "For career growth, focus on remote-friendly skills: copywriting, UI/UX design, data entry, virtual assistance, or coding basics. Platforms like Coursera, LinkedIn Learning, and freeCodeCamp are solid starting points.\n\nWhat field are you aiming for?",
  ],
  job_opportunity: [
    "Here's a job search approach that works:\n\n1. Tailor your CV for each role\n2. Build a strong LinkedIn profile\n3. Apply on LinkedIn, Indeed, Glassdoor\n4. Network — most jobs come through referrals\n5. Follow up 5–7 days after applying\n\nWhat field are you targeting?",
    "For interviews:\n\n• Research the company thoroughly\n• Prepare STAR stories (Situation, Task, Action, Result)\n• Ask thoughtful questions at the end\n• Follow up with a thank-you message\n\nWhat type of role are you going for?",
    "Remote opportunities:\n• Remote.co, We Work Remotely, FlexJobs\n• LinkedIn with 'remote' filter\n• Upwork, Fiverr for freelance\n\nWhat are your strongest skills right now?",
  ],
  education: [
    "Study smarter:\n\n• Pomodoro — 25 min focus, 5 min break\n• Spaced repetition — review at increasing intervals\n• Active recall — test yourself, don't just re-read\n• Teach it to someone else\n\nWhat subject are you working on?",
    "For exam prep:\n\n• Start 2–3 weeks before\n• Make concise summary notes\n• Use mind maps for complex topics\n• Do past papers under timed conditions\n• Don't skip sleep — memory consolidates overnight\n\nWhat exam are you preparing for?",
    "For scholarships:\n• Scholarshipportal.com, Fastweb, Chevening\n• Write strong personal statements — be specific and genuine\n• Keep your GPA and extracurriculars documented\n\nWhat level are you studying at?",
  ],
  habits_growth: [
    "Building habits that stick:\n\n• Habit stacking — attach new habit to an existing one\n• Start tiny — just 2 minutes daily\n• Track your progress visually\n• Shift your identity: 'I am someone who...'\n\nWhat habit are you trying to build?",
    "To beat procrastination:\n\n• 2-minute rule — if it takes under 2 minutes, do it now\n• Eliminate distractions before starting\n• Break tasks into micro-steps\n• Start with your highest-priority task\n\nWhat are you putting off?",
    "A simple morning routine:\n\n• Same wake time daily\n• Hydrate first thing\n• 5 min journaling or mindfulness\n• Light movement\n• Review your 3 most important goals\n\nEven 20 intentional minutes changes the day.",
  ],
  culture_history: [
    "History and culture are fascinating. There's so much richness — ancient Egypt, the Silk Road, the Ottoman Empire, African kingdoms, Asian dynasties...\n\nWhat area or time period are you curious about?",
    "Did you know coffee originated in Ethiopia, pizza evolved from Italian flatbreads with Middle Eastern roots, and yoga comes from ancient India?\n\nWhat culture or region would you like to explore?",
    "Learning about other cultures builds empathy. Want to explore cultural etiquette, history, famous figures, or languages? Just pick a direction — I find this genuinely interesting.",
  ],
  chat_suggestion: [
    "Conversation starters that actually work:\n\n• 'What's something you've been thinking about lately?'\n• 'What's one thing you'd change about your day?'\n• 'What's a skill you wish you had?'\n• 'What made you smile recently?'\n\nOpen questions invite real answers.",
    "To break the ice naturally:\n\n• Find common ground first\n• Ask about their experience, not just facts\n• Share something small about yourself\n• Listen more than you speak at the start\n\nPeople connect with someone who seems genuinely curious about them.",
    "Kind ways to respond:\n\n• 'That makes a lot of sense — tell me more'\n• 'I really appreciate you sharing that'\n• 'What would your ideal outcome look like?'\n\nValidation before advice goes a long way.",
  ],
  emotional_support: [
    "I'm sorry you're feeling that way. I'm here with you. Do you want to talk about what happened today?",
    "That sounds really hard, and you don't have to go through it alone. A lot of people hit difficult patches — reaching out is already a step.\n\nWhat's been weighing on you most?",
    "I hear you. It's okay to not be okay sometimes. You don't have to have everything figured out right now.\n\nWhat's been going on?",
  ],
  crisis: [
    "I'm really concerned about what you've shared. Your life has value, and you deserve real support right now.\n\nPlease reach out immediately:\n• Emergency: 911 (or your local number)\n• Crisis text line: Text HOME to 741741\n• International: findahelpline.com\n\nAre you safe right now?",
    "What you're describing sounds serious. Please contact a crisis line or a trusted person right now — not tomorrow.\n\n• Crisis Text Line: Text HOME to 741741\n• Suicide & Crisis Lifeline: 988 (US)\n• International: findahelpline.com\n\nI'm here with you. Please don't be alone with this.",
  ],
  casual_chat: [
    "Hey! Good to have you here. What's on your mind today?",
    "Hi! I'm Bestie AI — here to chat, give advice, or just listen. How are you doing?",
    "Hey! How's your day going?",
    "Good to see you. Anything on your mind, or just stopping by?",
  ],
  short_unclear: [],
  app_help: [
    "I'm Bestie AI — your AI companion on MyBestie. I can help with career and skills, study tips, habits, culture and history, conversation starters, and emotional support.\n\nJust ask me anything — no topic is off limits.",
    "MyBestie is an anonymous chat app where you connect with people based on mood, goal, and personality. Your anonymous inbox lets people send you messages through a private link.\n\nI'm Bestie AI — think of me as your personal guide on the app. What can I help you with?",
  ],
  general: [
    "I'm here. What's on your mind?",
    "That's interesting. Can you tell me more?",
    "I can help you think through it. What specifically are you looking for — practical steps, information, or just someone to talk to?",
  ],
};

// ─── How-are-you responses ────────────────────────────────────────────────────

const HOW_ARE_YOU_RESPONSES = [
  "I'm an AI, so I'm always ready. 😊 How are you doing though?",
  "Doing great, thanks for asking! How about you — how's your day going?",
  "Always here and ready to help! More importantly, how are you feeling today?",
];

// ─── Main API ─────────────────────────────────────────────────────────────────

export function getBridgeResponse(
  text: string,
  ctx?: UserContext,
  history: ConversationMessage[] = [],
): BridgeResponse {
  const lower = text.toLowerCase().trim();
  const intent = detectIntent(text);

  // Handle "how are you" as a special case inside casual_chat
  if (intent === 'casual_chat' && HOW_ARE_YOU_PHRASES.some(p => lower.includes(p))) {
    const r = HOW_ARE_YOU_RESPONSES[Math.floor(Math.random() * HOW_ARE_YOU_RESPONSES.length)];
    return { intent: 'casual_chat', response: r };
  }

  // Crisis — no personalization, direct response
  if (intent === 'crisis') {
    const r = RESPONSES.crisis[Math.floor(Math.random() * RESPONSES.crisis.length)];
    return { intent: 'crisis', response: r };
  }

  // Short/unclear — context-aware
  if (intent === 'short_unclear') {
    const lastAI = [...history].reverse().find(m => !m.isUser)?.text ?? null;
    const r = getShortUnclearResponse(text, lastAI);
    return { intent: 'short_unclear', response: r };
  }

  // All other intents — pick from pool
  const pool = RESPONSES[intent];
  const base = pool[Math.floor(Math.random() * pool.length)];
  return { intent, response: base };
}

// ─── Utility exports ──────────────────────────────────────────────────────────

export function getIntentLabel(intent: BridgeIntent): string {
  const labels: Record<BridgeIntent, string> = {
    skills_career: 'Skills & Career',
    education: 'Education',
    job_opportunity: 'Job Opportunities',
    habits_growth: 'Habits & Growth',
    culture_history: 'Culture & History',
    chat_suggestion: 'Chat Suggestion',
    emotional_support: 'Emotional Support',
    crisis: 'Crisis Support',
    casual_chat: 'Casual Chat',
    short_unclear: 'Chat',
    app_help: 'App Help',
    general: 'General',
  };
  return labels[intent];
}

export function getIntentEmoji(intent: BridgeIntent): string {
  const emojis: Record<BridgeIntent, string> = {
    skills_career: '💼',
    education: '🎓',
    job_opportunity: '🌟',
    habits_growth: '🚀',
    culture_history: '🌍',
    chat_suggestion: '💬',
    emotional_support: '❤️',
    crisis: '🛡️',
    casual_chat: '👋',
    short_unclear: '💬',
    app_help: '✨',
    general: '✨',
  };
  return emojis[intent];
}

export interface QuickAction {
  label: string;
  text: string;
  emoji: string;
}

export const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Learn a skill',   text: 'What skills should I learn today?',                  emoji: '💡' },
  { label: 'Find a job',      text: 'How do I find a good job?',                          emoji: '💼' },
  { label: 'Study tips',      text: 'How do I study more effectively?',                   emoji: '🎓' },
  { label: 'Build habits',    text: 'How do I build better daily habits?',                emoji: '🚀' },
  { label: 'Chat starters',   text: 'What are some good conversation starters?',          emoji: '💬' },
  { label: 'Culture facts',   text: 'Tell me something interesting about world cultures', emoji: '🌍' },
];

// Keep HOW_ARE_YOU_PHRASES exported for re-use
export { HOW_ARE_YOU_PHRASES };
