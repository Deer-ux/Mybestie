export type BridgeIntent =
  | 'skills_career'
  | 'education'
  | 'job_opportunity'
  | 'habits_growth'
  | 'culture_history'
  | 'chat_suggestion'
  | 'emotional_support'
  | 'crisis'
  | 'general';

export interface BridgeResponse {
  intent: BridgeIntent;
  response: string;
  followUp?: string;
}

export interface UserContext {
  mood?: string;
  goal?: string;
  personality?: string;
  temperament?: string;
  interests?: string[];
  ageGroup?: string;
  username?: string;
  messageHistory?: string[];
}

// ─── Intent detection ────────────────────────────────────────────────────────

const CRISIS_KEYWORDS    = ['kill myself','suicide','end my life','want to die','self harm','hurt myself','cut myself','not worth living','better off dead','no reason to live','take my life','overdose','harming myself','end it all','wish i was dead'];
const EMOTIONAL_KEYWORDS = ['lonely','so sad','really sad','i feel sad','depressed','very anxious','so stressed','overwhelmed','hopeless','worthless','hate myself','giving up','crying','feel lost','feel empty','heartbroken','scared','nothing matters','all alone','nobody cares','can\'t cope','feel terrible','feel awful','breaking down'];
const SKILLS_KEYWORDS    = ['what skill','which skill','learn to code','learn coding','learn design','learn programming','career advice','career guidance','freelance','portfolio','soft skill','digital skill','improve myself','professional skill','what should i learn','how to be better at','skill to learn'];
const JOB_KEYWORDS       = ['find a job','get a job','job search','apply for job','job application','internship','job interview','interview tips','how to get hired','cv advice','resume tips','salary negotiation','remote job','work from home','linkedin','employment','job opportunity'];
const EDUCATION_KEYWORDS = ['how to study','study tips','exam prep','preparing for exam','university','college','scholarship','degree','pass my exam','academic performance','study schedule','how to focus','memory tips','learn faster'];
const HABITS_KEYWORDS    = ['build a habit','morning routine','daily routine','productivity tip','stop procrastinating','stay motivated','discipline','self improvement','personal growth','how to be consistent','habit tracker','time management','focus better','mindset','goals'];
const CULTURE_KEYWORDS   = ['history of','culture of','tradition of','about this country','what language','what religion','cultural difference','world history','ancient civilization','interesting fact','tell me about','heritage'];
const CHAT_KEYWORDS      = ['what should i say','how do i start','conversation starter','how to break ice','suggest something to say','what to talk about','how to reply','good topic','what to ask','start a conversation'];

export function detectIntent(text: string): BridgeIntent {
  const lower = text.toLowerCase();
  if (CRISIS_KEYWORDS.some(kw => lower.includes(kw)))    return 'crisis';
  if (EMOTIONAL_KEYWORDS.some(kw => lower.includes(kw))) return 'emotional_support';
  if (SKILLS_KEYWORDS.some(kw => lower.includes(kw)))    return 'skills_career';
  if (JOB_KEYWORDS.some(kw => lower.includes(kw)))       return 'job_opportunity';
  if (EDUCATION_KEYWORDS.some(kw => lower.includes(kw))) return 'education';
  if (HABITS_KEYWORDS.some(kw => lower.includes(kw)))    return 'habits_growth';
  if (CULTURE_KEYWORDS.some(kw => lower.includes(kw)))   return 'culture_history';
  if (CHAT_KEYWORDS.some(kw => lower.includes(kw)))      return 'chat_suggestion';
  if (lower.includes('skill') || lower.includes('learn') || lower.includes('career')) return 'skills_career';
  if (lower.includes('job') || lower.includes('interview') || lower.includes('hire')) return 'job_opportunity';
  if (lower.includes('school') || lower.includes('exam') || lower.includes('study')) return 'education';
  if (lower.includes('habit') || lower.includes('routine') || lower.includes('productive')) return 'habits_growth';
  if (lower.includes('culture') || lower.includes('history') || lower.includes('country')) return 'culture_history';
  return 'general';
}

// ─── Personalisation helpers ─────────────────────────────────────────────────

function personalPrefix(ctx?: UserContext): string {
  if (!ctx) return '';
  const parts: string[] = [];
  if (ctx.username) parts.push(`Hey ${ctx.username}! 👋`);
  if (ctx.mood && ctx.mood !== 'neutral') {
    const moodGreet: Record<string, string> = {
      happy: "You're in a great headspace right now — let's make the most of it.",
      sad: 'I can tell things feel heavy. You reached out, and that matters.',
      anxious: 'Take a breath — you\'ve got this. Let me help you think through it.',
      excited: 'Love the energy! Let\'s channel that.',
      bored: 'Let\'s find something interesting to explore.',
      curious: 'Curiosity is a superpower. Let\'s dig in.',
    };
    const g = moodGreet[ctx.mood];
    if (g) parts.push(g);
  }
  return parts.length ? parts.join(' ') + '\n\n' : '';
}

function interestSuffix(intent: BridgeIntent, ctx?: UserContext): string {
  if (!ctx?.interests?.length) return '';
  const intMap: Record<BridgeIntent, string[]> = {
    skills_career:    ['tech', 'design', 'writing', 'business', 'coding', 'art'],
    education:        ['science', 'math', 'history', 'languages', 'literature'],
    job_opportunity:  ['entrepreneurship', 'business', 'networking', 'tech'],
    habits_growth:    ['fitness', 'reading', 'journaling', 'mindfulness', 'wellness'],
    culture_history:  ['travel', 'history', 'music', 'art', 'food', 'language'],
    chat_suggestion:  ['social', 'communication', 'relationships', 'teamwork'],
    emotional_support:['mental health', 'wellness', 'relationships', 'gratitude'],
    crisis:           [],
    general:          [],
  };
  const relevant = ctx.interests.filter(i => intMap[intent]?.some(k => i.toLowerCase().includes(k)));
  if (!relevant.length) return '';
  return `\n\nBased on your interest in **${relevant.slice(0, 2).join(' & ')}**, I think this direction will resonate with you.`;
}

// ─── Response pool ───────────────────────────────────────────────────────────

const RESPONSES: Record<BridgeIntent, string[]> = {
  skills_career: [
    "Great question! 💡 Valuable skills to develop right now:\n\n🖥️ Digital skills — Canva, AI tools, basic coding\n📊 Data skills — Excel, analytics\n💬 Communication & presentation\n🎨 Content creation & social media\n🔧 Problem-solving & critical thinking\n\nWhich area interests you most?",
    "Top skills for today's world:\n\n1. AI tool literacy (ChatGPT, Midjourney)\n2. Video editing (CapCut, Premiere)\n3. Copywriting\n4. No-code app building (Glide, Bubble)\n5. Digital marketing\n\nMany of these are free on YouTube or Coursera. What's your background?",
    "For career growth, focus on remote-friendly skills: copywriting, UI/UX design, data entry, virtual assistance, or programming basics. Platforms like Coursera, LinkedIn Learning, and freeCodeCamp are excellent starting points. 🚀",
  ],
  job_opportunity: [
    "Here's a job search strategy that works:\n\n1️⃣ Tailor your CV for each role\n2️⃣ Build a strong LinkedIn profile\n3️⃣ Apply on LinkedIn, Indeed, Glassdoor\n4️⃣ Network — most jobs are filled through referrals\n5️⃣ Follow up 5–7 days after applying\n\nWhat field are you targeting?",
    "For interview success:\n\n📝 Research the company thoroughly\n💬 Prepare STAR stories (Situation, Task, Action, Result)\n🤝 Ask thoughtful questions at the end\n📱 Follow up with a thank-you email\n\nWhat type of role are you going for?",
    "Remote work opportunities:\n🌐 Remote.co, We Work Remotely, FlexJobs\n💼 LinkedIn with 'remote' filter\n🖥️ Upwork, Fiverr for freelance\n\nYour skill set determines the best platform. What are your strengths?",
  ],
  education: [
    "Study smarter:\n\n⏱️ Pomodoro — 25 min focus, 5 min break\n🔄 Spaced repetition — review at increasing intervals\n✍️ Active recall — test yourself, don't just re-read\n👥 Teach it to someone else\n📅 Consistent schedule beats marathon cramming\n\nWhat subject are you working on?",
    "For exam prep:\n\n📚 Start 2–3 weeks before the exam\n📝 Make concise summary notes\n🧠 Use mind maps for complex topics\n❓ Do past papers under timed conditions\n😴 Don't skip sleep — memory consolidates overnight\n\nWhat exam are you preparing for?",
    "For scholarships:\n\n🔍 Scholarshipportal.com, Fastweb, Chevening\n✉️ Write strong personal statements — be specific\n📊 Keep your GPA and extracurriculars documented\n\nWhat level are you studying at?",
  ],
  habits_growth: [
    "Building lasting habits:\n\n🔗 Habit stacking — attach new habit to an existing one\n📏 Start tiny — just 2 minutes daily\n🏆 Track your progress visually\n🔄 Identity shift — 'I am someone who...' not 'I'm trying to...'\n\nWhat habit are you building?",
    "To beat procrastination:\n\n⏰ 2-minute rule — if it takes <2 min, do it now\n🔕 Eliminate distractions first\n🎯 Break tasks into micro-steps\n🧠 Start with your highest-priority task\n\nWhat are you putting off?",
    "A powerful morning routine:\n\n🌅 Same wake time daily\n💧 Hydrate first thing\n🧘 5 min mindfulness or journaling\n🏃 Light movement\n📋 Review your 3 most important goals\n\nEven 20 intentional minutes changes everything. 🌟",
  ],
  culture_history: [
    "History and culture are fascinating! 🌍 There's so much richness in human civilization — from ancient Egypt, the Silk Road, the Ottoman Empire, to modern movements.\n\nWhat area or time period are you curious about?",
    "Cultural curiosity is wonderful! 🏛️ Did you know coffee originated in Ethiopia, pizza evolved from Italian flatbreads with Middle Eastern roots, and yoga comes from ancient India?\n\nWhat culture or region would you like to explore?",
    "Learning about other cultures builds empathy. 🌐 Want to explore cultural etiquette, history, famous figures, or languages? Just ask — I find this genuinely fascinating!",
  ],
  chat_suggestion: [
    "Conversation starters that work:\n\n💬 'What's something you've been thinking about a lot lately?'\n💬 'What's one thing you'd change about your day?'\n💬 'What's a skill you wish you had?'\n💬 'What made you smile recently?'\n\nOpen questions invite real answers. 😊",
    "To break the ice naturally:\n\n🎯 Find common ground first\n❓ Ask about their experience, not just facts\n💡 Share something small about yourself\n👂 Listen more than you speak at the start\n\nPeople love talking to someone who seems genuinely interested.",
    "Kind reply suggestions:\n\n✨ 'That makes a lot of sense — tell me more'\n✨ 'I really appreciate you sharing that'\n✨ 'What would your ideal outcome look like?'\n✨ 'That takes courage to say'\n\nValidation before advice goes a long way. 🤝",
  ],
  emotional_support: [
    "I hear you, and I'm genuinely glad you said something. 💛 Whatever you're feeling right now is valid — you don't need to have everything figured out.\n\nWould you like to just talk? Sometimes expressing it is the first step to feeling a little lighter.",
    "That sounds really hard, and I want you to know you're not alone in this. 🤝 A lot of people go through difficult seasons — reaching out takes courage.\n\nTake it one breath at a time. What's been going on?",
    "I'm here, and I'm listening. 💙 It's okay to not be okay sometimes. What's been weighing on you most? You don't have to share everything — just what feels manageable.",
  ],
  crisis: [
    "🛡️ I'm really concerned about what you've shared. Your life has value, and you deserve real support right now.\n\n📞 Please reach out immediately:\n• Emergency services: 911 (or your local number)\n• Crisis text line: Text HOME to 741741\n• International: findahelpline.com\n\nYou don't have to face this alone. Are you safe right now?",
    "🚨 What you're describing sounds serious. Please contact a crisis line or trusted person right now — not tomorrow, now.\n\n💬 Crisis Text Line: Text HOME to 741741\n📞 National Suicide Hotline: 988 (US)\n🌐 International: findahelpline.com\n\nI'm here with you. Please don't be alone with this.",
  ],
  general: [
    "Hello! 👋 I'm BridgeGuide — your AI companion on MindBridge. I can help with:\n\n💼 Career & skill building\n🎓 Study and education\n💡 Habits & personal growth\n🌍 Culture and history\n💬 Conversation starters\n❤️ Emotional support\n\nWhat's on your mind today?",
    "Great question! Whether it's career guidance, study tips, habits, or just a thoughtful conversation — I'm your AI companion on MindBridge. What would you like to explore? 🌟",
    "I can help you think through it. Could you tell me a bit more about what you're looking for — practical steps, information, or just space to think out loud? 😊",
  ],
};

// ─── Main API ─────────────────────────────────────────────────────────────────

export function getBridgeResponse(text: string, ctx?: UserContext): BridgeResponse {
  const intent = detectIntent(text);
  const pool = RESPONSES[intent];
  const base = pool[Math.floor(Math.random() * pool.length)];
  const prefix = personalPrefix(ctx);
  const suffix = interestSuffix(intent, ctx);
  const response = prefix + base + suffix;
  return { intent, response };
}

export function getIntentLabel(intent: BridgeIntent): string {
  const labels: Record<BridgeIntent, string> = {
    skills_career: 'Skills & Career', education: 'Education', job_opportunity: 'Job Opportunities',
    habits_growth: 'Habits & Growth', culture_history: 'Culture & History', chat_suggestion: 'Chat Suggestion',
    emotional_support: 'Emotional Support', crisis: 'Crisis Support', general: 'General',
  };
  return labels[intent];
}

export function getIntentEmoji(intent: BridgeIntent): string {
  const emojis: Record<BridgeIntent, string> = {
    skills_career: '💼', education: '🎓', job_opportunity: '🌟', habits_growth: '🚀',
    culture_history: '🌍', chat_suggestion: '💬', emotional_support: '❤️', crisis: '🛡️', general: '✨',
  };
  return emojis[intent];
}

export interface QuickAction { label: string; text: string; emoji: string; }

export const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Learn a skill',  text: 'What skills should I learn today?',                    emoji: '💡' },
  { label: 'Find a job',     text: 'How do I find a good job?',                            emoji: '💼' },
  { label: 'Study tips',     text: 'How do I study more effectively?',                    emoji: '🎓' },
  { label: 'Build habits',   text: 'How do I build better daily habits?',                  emoji: '🚀' },
  { label: 'Chat starters',  text: 'What are some good conversation starters?',            emoji: '💬' },
  { label: 'Culture facts',  text: 'Tell me something interesting about world cultures',   emoji: '🌍' },
];
