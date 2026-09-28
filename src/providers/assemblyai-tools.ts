/**
 * AssemblyAI Voice Agent tool definitions for MÍMO activation.
 * Format: flat function tools for session.tools / agent config
 */

export type AssemblyAIFunctionTool = {
  type: "function";
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
  execution_mode?: "interactive" | "hold";
  timeout_seconds?: number;
  http?: {
    url: string;
    method: "POST" | "GET";
    headers?: Array<{ name: string; value: string }>;
    body?: string;
  };
};

export function getMimoActivationFunctionTools(): AssemblyAIFunctionTool[] {
  return [
    {
      type: "function",
      name: "analyze_expression",
      description:
        "Analyze a spoken or proverbial expression for cultural meaning risk. " +
        "Call this when the user uses a proverb, idiom, or local-language phrase, " +
        "or when meaning may be culturally specific. Returns UNDERSTOOD, " +
        "POSSIBLE_MEANING_LOSS, or INSUFFICIENT_KNOWLEDGE. Never invent cultural meaning.",
      parameters: {
        type: "object",
        properties: {
          expression: {
            type: "string",
            description: "The expression or phrase to analyze (transcript snippet).",
          },
          language: {
            type: "string",
            description: "Optional language code: pcm, yor, ibo, hau, en, or auto.",
            enum: ["pcm", "yor", "ibo", "hau", "en", "auto"],
          },
          context: {
            type: "string",
            description: "Optional surrounding conversation context.",
          },
          conversation_id: {
            type: "string",
            description: "Optional session/conversation id for evidence logging.",
          },
        },
        required: ["expression"],
      },
      execution_mode: "interactive",
      timeout_seconds: 30,
    },
    {
      type: "function",
      name: "save_correction",
      description:
        "Record a human explanation of an expression when the user teaches the correct meaning. " +
        "Stores session-scoped acceptance only — not permanent community truth.",
      parameters: {
        type: "object",
        properties: {
          expression: {
            type: "string",
            description: "The original expression.",
          },
          corrected_meaning: {
            type: "string",
            description: "What the user said it means.",
          },
          context: {
            type: "string",
            description: "Optional context for the correction.",
          },
          conversation_id: {
            type: "string",
            description: "Optional session id.",
          },
        },
        required: ["expression", "corrected_meaning"],
      },
      execution_mode: "interactive",
      timeout_seconds: 30,
    },
  ];
}

export function getMimoActivationHttpTools(baseUrl: string): AssemblyAIFunctionTool[] {
  const root = baseUrl.replace(/\/$/, "");
  return [
    {
      type: "function",
      name: "analyze_expression",
      description:
        "Analyze a spoken or proverbial expression for cultural meaning risk. " +
        "Returns UNDERSTOOD, POSSIBLE_MEANING_LOSS, or INSUFFICIENT_KNOWLEDGE. " +
        "Never invent cultural meaning if insufficient.",
      parameters: {
        type: "object",
        properties: {
          expression: { type: "string", description: "Expression to analyze." },
          language: {
            type: "string",
            enum: ["pcm", "yor", "ibo", "hau", "en", "auto"],
          },
          context: { type: "string" },
          conversation_id: { type: "string" },
        },
        required: ["expression"],
      },
      execution_mode: "interactive",
      timeout_seconds: 30,
      http: {
        url: `${root}/api/activation/analyze`,
        method: "POST",
        headers: [{ name: "Content-Type", value: "application/json" }],
      },
    },
  ];
}

export const MIMO_ASSEMBLYAI_SYSTEM_PROMPT = `You are MÍMO, a culturally careful voice assistant for Nigerian and West African speakers.

Core rules:
1. Prefer understanding over fluent guessing.
2. When the user uses a proverb, idiom, or local-language phrase, call analyze_expression before asserting its meaning.
3. If demo_state is POSSIBLE_MEANING_LOSS: offer the cultural reading briefly and ask if that is what they meant.
4. If demo_state is INSUFFICIENT_KNOWLEDGE: say you are not sure and ask them to explain. Do not invent meaning.
5. When the user explains a meaning, call save_correction with their explanation.
6. Keep spoken replies short (1–2 sentences). No exclamation marks.
7. Never claim permanent cultural authority. Corrections are session-scoped until reviewed.
8. Do not trigger external business actions (payments, CRM writes) from this agent.`;
