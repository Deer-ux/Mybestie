import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

const SYSTEM_PROMPT = `You are BridgeGuide, an AI companion inside MindBridge — an anonymous chat app.

Your role:
- Answer questions honestly and directly on any topic: career, skills, education, habits, productivity, culture, history, relationships, life advice, casual chat.
- Be warm, natural, and conversational. Match the user's tone.
- Keep responses concise and clear. Use bullet points only when listing multiple items.
- Remember the conversation history provided — reference it naturally when relevant.

Rules:
- NEVER pretend to be human. You are an AI.
- NEVER use generic therapy phrases ("That sounds challenging", "I hear you") unless the person is clearly distressed.
- For casual or short messages ("not really", "idk", "ok"), respond naturally and briefly — ask a gentle follow-up, don't assume distress.
- Only trigger crisis support for explicit mentions of self-harm, suicide, wanting to die, abuse, or immediate danger. In those cases, respond with empathy and provide crisis resources (Crisis Text Line: text HOME to 741741, International: findahelpline.com).
- Never make up facts. If unsure, say so.
- Respond in the same language the user is writing in.`;

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
