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

const CRISIS_KEYWORDS = [
  'kill myself', 'suicide', 'end my life', 'want to die', 'self harm',
  'hurt myself', 'cut myself', 'not worth living', 'better off dead',
  'no reason to live', 'take my life', 'overdose', 'harming myself',
  'end it all', 'wish i was dead',
];

const EMOTIONAL_KEYWORDS = [
  'lonely', 'so sad', 'really sad', 'i feel sad', 'depressed', 'very anxious',
  'so stressed', 'overwhelmed', 'hopeless', 'worthless', 'hate myself',
  'giving up', 'crying', 'feel lost', 'feel empty', 'heartbroken', 'scared',
  'nothing matters', 'all alone', 'nobody cares', 'can\'t cope',
  'feel terrible', 'feel awful', 'breaking down',
];

const SKILLS_KEYWORDS = [
  'what skill', 'which skill', 'learn to code', 'learn coding', 'learn design',
  'learn programming', 'career advice', 'career guidance', 'freelance', 'portfolio',
  'soft skill', 'digital skill', 'improve myself', 'professional skill',
  'what should i learn', 'how to be better at', 'skill to learn',
];

const JOB_KEYWORDS = [
  'find a job', 'get a job', 'job search', 'apply for job', 'job application',
  'internship', 'job interview', 'interview tips', 'how to get hired', 'cv advice',
  'resume tips', 'salary negotiation', 'remote job', 'work from home',
  'linkedin', 'employment', 'job opportunity',
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
  'history of', 'culture of', 'tradition of', 'about this country',
  'what language', 'what religion', 'cultural difference', 'world history',
  'ancient civilization', 'interesting fact', 'tell me about', 'heritage',
];

const CHAT_KEYWORDS = [
  'what should i say', 'how do i start', 'conversation starter', 'how to break ice',
  'suggest something to say', 'what to talk about', 'how to reply',
  'good topic', 'what to ask', 'start a conversation',
];

export function detectIntent(text: string): BridgeIntent {
  const lower = text.toLowerCase();

  if (CRISIS_KEYWORDS.some(kw => lower.includes(kw))) return 'crisis';
  if (EMOTIONAL_KEYWORDS.some(kw => lower.includes(kw))) return 'emotional_support';
  if (SKILLS_KEYWORDS.some(kw => lower.includes(kw))) return 'skills_career';
  if (JOB_KEYWORDS.some(kw => lower.includes(kw))) return 'job_opportunity';
  if (EDUCATION_KEYWORDS.some(kw => lower.includes(kw))) return 'education';
  if (HABITS_KEYWORDS.some(kw => lower.includes(kw))) return 'habits_growth';
  if (CULTURE_KEYWORDS.some(kw => lower.includes(kw))) return 'culture_history';
  if (CHAT_KEYWORDS.some(kw => lower.includes(kw))) return 'chat_suggestion';

  const lower2 = lower;
  if (lower2.includes('skill') || lower2.includes('learn') || lower2.includes('career') || lower2.includes('job')) {
    if (lower2.includes('skill') || lower2.includes('learn')) return 'skills_career';
    return 'job_opportunity';
  }
  if (lower2.includes('school') || lower2.includes('exam') || lower2.includes('study') || lower2.includes('university')) return 'education';
  if (lower2.includes('habit') || lower2.includes('routine') || lower2.includes('productive') || lower2.includes('goal')) return 'habits_growth';
  if (lower2.includes('culture') || lower2.includes('history') || lower2.includes('country')) return 'culture_history';

  return 'general';
}

const RESPONSES: Record<BridgeIntent, string[]> = {
  skills_career: [
    "Great question! 💡 Here are valuable skills to develop right now:\n\n🖥️ Digital skills — Canva, AI tools, basic coding\n📊 Data skills — Excel, Google Sheets, analytics\n💬 Communication & presentation\n🎨 Content creation & social media\n🔧 Problem-solving & critical thinking\n\nWhich area interests you most?",
    "Top skills for today's world:\n\n1. AI tool literacy (ChatGPT, Midjourney)\n2. Video editing (CapCut, Premiere)\n3. Copywriting\n4. No-code app building (Glide, Bubble)\n5. Digital marketing\n\nMany of these can be learned free on YouTube or Coursera. What's your background?",
    "For career growth, focus on remote-friendly skills: copywriting, UI/UX design, data entry, virtual assistance, or programming basics. Platforms like Coursera, LinkedIn Learning, and freeCodeCamp are excellent starting points. 🚀",
  ],
  job_opportunity: [
    "Here's a job search strategy that works:\n\n1️⃣ Tailor your CV for each role\n2️⃣ Build a strong LinkedIn profile with a clear headline\n3️⃣ Apply on LinkedIn, Indeed, Glassdoor, and company websites\n4️⃣ Network — most jobs are filled through referrals\n5️⃣ Follow up 5–7 days after applying\n\nWhat field are you searching in?",
    "For interview success:\n\n📝 Research the company thoroughly\n💬 Prepare STAR stories (Situation, Task, Action, Result)\n🤝 Ask thoughtful questions at the end\n👔 Dress one level above the company culture\n📱 Follow up with a thank-you email\n\nWhat type of job are you applying for?",
    "To find remote work opportunities, check:\n🌐 Remote.co, We Work Remotely, FlexJobs\n💼 LinkedIn with 'remote' filter\n🖥️ Upwork, Fiverr for freelance\n🌍 Toptal for senior tech roles\n\nYour skill set determines the best platform. What are your strengths?",
  ],
  education: [
    "Study smarter with these techniques:\n\n⏱️ Pomodoro Method — 25 min study, 5 min break\n🔄 Spaced repetition — review material at increasing intervals\n✍️ Active recall — test yourself instead of just re-reading\n👥 Teach it to someone else — the best way to solidify knowledge\n📅 Consistent schedule beats marathon cramming\n\nWhat subject are you working on?",
    "For exam preparation:\n\n📚 Start reviewing 2–3 weeks before the exam\n📝 Make concise summary notes\n🧠 Use mind maps for complex topics\n❓ Do past papers under timed conditions\n😴 Don't skip sleep the night before — memory consolidates during sleep\n\nWhat's the exam you're preparing for?",
    "For scholarships and opportunities:\n\n🔍 Check Scholarshipportal.com, Fastweb, and Chevening\n✉️ Write strong personal statements — be specific and authentic\n📊 Keep your GPA and extracurriculars documented\n🌐 Look for country-specific scholarship programs\n\nWhat level are you studying at?",
  ],
  habits_growth: [
    "Building lasting habits:\n\n🔗 Habit stacking — attach new habit to an existing one\n📏 Start tiny — just 2 minutes daily to begin\n🏆 Track your progress visually\n🔄 Identity shift — say 'I am someone who...' not 'I'm trying to...'\n💪 Focus on consistency, not perfection\n\nWhat habit are you trying to build?",
    "To beat procrastination:\n\n⏰ Use the 2-minute rule — if it takes less than 2 min, do it now\n🔕 Eliminate distractions before starting\n🎯 Break tasks into micro-steps\n🧠 Start with your highest-priority task first\n🌊 Ride the motivation wave — act before the urge to avoid kicks in\n\nWhat are you putting off?",
    "For a powerful morning routine:\n\n🌅 Wake up at the same time daily\n💧 Hydrate first thing\n🧘 5 minutes of mindfulness or journaling\n🏃 Light movement or stretching\n📋 Review your 3 most important goals for the day\n\nEven 20 minutes of intentional morning time changes everything. 🌟",
  ],
  culture_history: [
    "History and culture are fascinating! 🌍 There's so much richness in human civilization — from ancient Egypt, the Silk Road, the Ottoman Empire, the Renaissance, to modern cultural movements.\n\nWhat area or time period are you curious about? I can dive into specific topics — art, food, language, religion, politics, or traditions.",
    "Cultural curiosity is wonderful! 🏛️ Did you know that many of today's words, foods, and traditions traveled across continents through trade and migration?\n\nFor example, coffee originated in Ethiopia, pizza evolved from Italian flatbreads with Middle Eastern roots, and yoga comes from ancient India.\n\nWhat culture or region would you like to explore?",
    "Learning about other cultures builds empathy and opens doors. 🌐 Want to learn about cultural etiquette, historical events, famous figures, languages, or something specific? Just ask — I find this stuff genuinely fascinating!",
  ],
  chat_suggestion: [
    "Here are conversation starters that work well:\n\n💬 'What's something you've been thinking about a lot lately?'\n💬 'What's one thing you'd change about your day today?'\n💬 'What's a skill you wish you had?'\n💬 'What made you smile recently?'\n\nOpen questions invite real answers. Avoid yes/no questions. 😊",
    "To break the ice naturally:\n\n🎯 Find common ground first (mood, interests from their profile)\n❓ Ask about their current experience, not just facts\n💡 Share something small about yourself to open up the conversation\n👂 Listen more than you speak at the start\n\nPeople love talking to someone who seems genuinely interested in them.",
    "Kind reply suggestions:\n\n✨ 'That makes a lot of sense — tell me more'\n✨ 'I really appreciate you sharing that'\n✨ 'What would your ideal outcome look like?'\n✨ 'That takes courage to say'\n✨ 'I haven't thought about it that way before'\n\nValidation before advice goes a long way. 🤝",
  ],
  emotional_support: [
    "I hear you, and I'm genuinely glad you said something. 💛 Whatever you're feeling right now is valid — you don't need to have everything figured out.\n\nWould you like to just talk about what's going on? Sometimes expressing it is the first step to feeling a little lighter.",
    "That sounds really hard, and I want you to know you're not alone in this. 🤝 A lot of people go through difficult seasons — and reaching out (even here) takes courage.\n\nTake it one breath at a time. Would it help to talk through what's on your mind?",
    "I'm here, and I'm listening. 💙 It's okay to not be okay sometimes. What's been weighing on you most? You don't have to share everything at once — just what feels manageable.",
  ],
  crisis: [
    "🛡️ I'm really concerned about what you've shared. Your life has value, and you deserve real support right now.\n\n📞 Please reach out immediately:\n• Emergency services: 911 (or your local number)\n• Crisis text line: Text HOME to 741741\n• International: findahelpline.com\n\nYou don't have to face this alone. Are you safe right now?",
    "🚨 What you're describing sounds serious, and I want to make sure you get the right help. Please contact a crisis line or trusted person right now — not tomorrow, now.\n\n💬 Crisis Text Line: Text HOME to 741741\n📞 National Suicide Hotline: 988 (US)\n🌐 International: findahelpline.com\n\nI'm here with you. Please don't be alone with this.",
  ],
  general: [
    "Hello! 👋 I'm BridgeGuide — your AI companion on MindBridge. I can help you with:\n\n💼 Career & skill building\n🎓 Study and education tips\n💡 Habits and personal growth\n🌍 Culture and history\n💬 Conversation starters for chats\n❤️ Emotional support (when you need it)\n\nWhat's on your mind today?",
    "Great question! I'm here to help. Whether it's advice on learning new skills, career guidance, study tips, or just a thoughtful conversation — I'm your AI companion on MindBridge. What would you like to explore? 🌟",
    "That's an interesting topic! I can help you think through it. Could you tell me a little more about what you're looking for — are you looking for practical steps, information, or just a space to think out loud? 😊",
  ],
};

export function getBridgeResponse(text: string): BridgeResponse {
  const intent = detectIntent(text);
  const pool = RESPONSES[intent];
  const response = pool[Math.floor(Math.random() * pool.length)];
  return { intent, response };
}

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
  { label: 'Learn a skill', text: 'What skills should I learn today?', emoji: '💡' },
  { label: 'Find a job', text: 'How do I find a good job?', emoji: '💼' },
  { label: 'Study tips', text: 'How do I study more effectively?', emoji: '🎓' },
  { label: 'Build habits', text: 'How do I build better daily habits?', emoji: '🚀' },
  { label: 'Talk to someone', text: 'What are some good conversation starters?', emoji: '💬' },
  { label: 'Culture facts', text: 'Tell me something interesting about world cultures', emoji: '🌍' },
];
