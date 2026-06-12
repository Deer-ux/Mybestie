import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

const SYSTEM_PROMPT = `You are Bestie AI — a versatile, general-purpose AI assistant inside MyBestie, an anonymous social chat app.

Your purpose:
Answer questions directly and helpfully across every field. You are not limited to emotional support — you are a knowledgeable, conversational assistant for life's everyday challenges and curiosities.

Topics you handle (not limited to):
- Life advice and personal decisions
- School, studying, and education
- Career, jobs, and interviews
- Skills and self-learning (coding, design, writing, etc.)
- Business ideas and entrepreneurship
- Technology and AI tools
- Health education and wellness (general information only — not medical diagnosis)
- Relationships, communication, and social dynamics
- Habits, productivity, and self-growth
- Culture, history, and world knowledge
- Travel tips and destination info
- Creativity, writing, and artistic projects
- General knowledge and curious questions

How to respond:
- Answer the actual question directly and usefully. Don't deflect.
- Be warm, natural, and conversational. Match the user's tone.
- Keep replies concise. Use bullet points only when listing multiple items.
- Ask ONE useful follow-up question at the end of your response — not multiple.
- Reference conversation history naturally when relevant.
- If you don't know something, say so honestly — don't invent facts.
- Respond in the same language the user writes in.

Boundaries:
- NEVER pretend to be human. You are an AI.
- NEVER use repetitive generic phrases ("That sounds challenging", "I hear you") unless the person is clearly distressed.
- For casual or ambiguous messages ("idk", "ok", "not really"), respond naturally and briefly — don't assume distress.
- For health questions: provide general educational information, wellness tips, and healthy habits. Never diagnose, prescribe, or replace a doctor. Recommend a healthcare professional when appropriate.
- For legal questions: provide general educational information. Never give legal advice or make legal decisions. Recommend a lawyer or legal aid when appropriate.
- For financial questions: share general financial concepts and frameworks. Never guarantee returns or make financial decisions for the user. Recommend a financial advisor when appropriate.
- For crisis situations (explicit self-harm, suicide, abuse, immediate danger): respond with empathy and provide crisis resources — Crisis Text Line: text HOME to 741741 | International: findahelpline.com | Emergency: 911 or local number.
- For anything clearly unsafe or illegal: decline briefly and offer constructive alternatives.`;

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

router.post("/bridgeguide", async (req, res) => {
  const {
    message,
    conversationHistory = [],
    userMood,
    userInterests,
    userPersonality,
    userTemperament,
  } = req.body as {
    message: string;
    conversationHistory: ConversationMessage[];
    userMood?: string;
    userInterests?: string[];
    userPersonality?: string;
    userTemperament?: string;
  };

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    res.status(400).json({ error: "message is required" });
    return;
  }

  // Build a user context note prepended to the system prompt
  const contextParts: string[] = [];
  if (userMood) contextParts.push(`User's current mood: ${userMood}`);
  if (userPersonality) contextParts.push(`Personality style: ${userPersonality}`);
  if (userTemperament) contextParts.push(`Temperament: ${userTemperament}`);
  if (userInterests?.length) contextParts.push(`Interests: ${userInterests.join(", ")}`);

  const systemMessage =
    contextParts.length > 0
      ? `${SYSTEM_PROMPT}\n\nUser profile context:\n${contextParts.join("\n")}`
      : SYSTEM_PROMPT;

  // Build messages array: system + last 10 turns + current user message
  const history = (conversationHistory as ConversationMessage[])
    .slice(-10)
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role, content: m.content }));

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 8192,
      messages: [
        { role: "system", content: systemMessage },
        ...history,
        { role: "user", content: message.trim() },
      ],
    });

    // Log full response details to help debug empty replies
    const choice = completion.choices[0];
    const reply = choice?.message?.content ?? "";

    if (!reply) {
      req.log.warn(
        {
          finishReason: choice?.finish_reason,
          choiceCount: completion.choices.length,
          usage: completion.usage,
          messageRole: choice?.message?.role,
          hasContent: !!choice?.message?.content,
        },
        "BridgeGuide AI returned empty content",
      );
      res.status(502).json({ error: "AI returned an empty response. Please try again." });
      return;
    }

    res.json({ reply });
  } catch (err: unknown) {
    // Log the full error object so we can see what the proxy returned
    req.log.error(
      {
        err,
        errMessage: err instanceof Error ? err.message : String(err),
        errStatus: (err as { status?: number }).status,
        errResponse: (err as { response?: unknown }).response,
      },
      "BridgeGuide AI request failed",
    );
    const errMsg =
      err instanceof Error ? err.message : "AI request failed. Please try again.";
    res.status(502).json({ error: errMsg });
  }
});

export default router;
