/**
 * Dispatch AssemblyAI (or any) tool.call names to activation services.
 * Returns plain JSON-serializable results for tool.result.
 */

import { z } from "zod";
import { analyzeExpression } from "@/services/activation/analyze-expression";
import { saveCorrection } from "@/services/activation/save-correction";
import { createEvidenceLogEntry } from "@/services/activation/evidence-log";

export const ToolCallSchema = z.object({
  name: z.string().trim().min(1),
  arguments: z.record(z.string(), z.unknown()).default({}),
  call_id: z.string().optional(),
});

export type ToolCall = z.infer<typeof ToolCallSchema>;

export type ToolHandlerResult = {
  ok: boolean;
  tool: string;
  call_id?: string;
  result: Record<string, unknown>;
};

/**
 * Execute a single tool call by name.
 */
export function handleActivationToolCall(raw: unknown): ToolHandlerResult {
  const call = ToolCallSchema.parse(raw);
  const args = call.arguments;

  if (call.name === "analyze_expression") {
    const expression = String(args["expression"] ?? "").trim();
    if (!expression) {
      return {
        ok: false,
        tool: call.name,
        ...(call.call_id !== undefined ? { call_id: call.call_id } : {}),
        result: { error: "expression is required" },
      };
    }
    const language = args["language"] !== undefined ? String(args["language"]) : "auto";
    const context = args["context"] !== undefined ? String(args["context"]) : undefined;
    const conversation_id =
      args["conversation_id"] !== undefined ? String(args["conversation_id"]) : undefined;

    const analysis = analyzeExpression({
      expression,
      language: language as "auto" | "pcm" | "yor" | "ibo" | "hau" | "en",
      ...(context !== undefined ? { context } : {}),
      ...(conversation_id !== undefined ? { conversation_id } : {}),
    });

    const evidence = createEvidenceLogEntry({
      analysis,
      ...(conversation_id !== undefined ? { conversation_id } : {}),
      stt_provider: "assemblyai",
    });

    return {
      ok: true,
      tool: call.name,
      ...(call.call_id !== undefined ? { call_id: call.call_id } : {}),
      result: {
        demo_state: analysis.demo_state,
        representation_risk: analysis.representation_risk,
        needs_clarification: analysis.needs_clarification,
        literal_meaning: analysis.literal_meaning,
        cultural_interpretations: analysis.cultural_interpretations,
        alternatives: analysis.alternatives,
        audit_note: analysis.audit_note,
        decision: evidence.decision,
        evidence_id: evidence.id,
        match_expression_id: analysis.match?.expression_id ?? null,
        speak_guidance: speakGuidance(analysis.demo_state),
      },
    };
  }

  if (call.name === "save_correction") {
    const expression = String(args["expression"] ?? "").trim();
    const corrected_meaning = String(args["corrected_meaning"] ?? "").trim();
    if (!expression || !corrected_meaning) {
      return {
        ok: false,
        tool: call.name,
        ...(call.call_id !== undefined ? { call_id: call.call_id } : {}),
        result: { error: "expression and corrected_meaning are required" },
      };
    }
    const contribution = saveCorrection({
      expression,
      corrected_meaning,
      source: "user",
      ...(args["conversation_id"] !== undefined
        ? { conversation_id: String(args["conversation_id"]) }
        : {}),
      ...(args["context"] !== undefined ? { context: String(args["context"]) } : {}),
    });
    return {
      ok: true,
      tool: call.name,
      ...(call.call_id !== undefined ? { call_id: call.call_id } : {}),
      result: {
        contribution_id: contribution.id,
        epistemic_status: contribution.epistemic_status,
        note: contribution.note,
      },
    };
  }

  return {
    ok: false,
    tool: call.name,
    ...(call.call_id !== undefined ? { call_id: call.call_id } : {}),
    result: { error: `Unknown tool: ${call.name}` },
  };
}

function speakGuidance(state: string): string {
  switch (state) {
    case "UNDERSTOOD":
      return "You may answer using the cultural interpretation. Keep it short.";
    case "POSSIBLE_MEANING_LOSS":
      return "Do not assume the literal meaning is enough. Ask a brief clarifying question, or offer the cultural reading and invite confirmation.";
    case "INSUFFICIENT_KNOWLEDGE":
      return "Say you are not sure about the cultural meaning. Ask the speaker to explain. Do not invent a proverb meaning.";
    default:
      return "Prefer asking over inventing.";
  }
}
