/**
 * POST /api/activation/analyze
 * Tool-callable (AssemblyAI HTTP tool or client). Deterministic seed lookup.
 */

import { NextRequest, NextResponse } from "next/server";
import { AnalyzeExpressionInputSchema } from "@/core/schemas/activation";
import {
  analyzeExpression,
  createEvidenceLogEntry,
} from "@/services/activation";

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const input = AnalyzeExpressionInputSchema.parse(body);
    const analysis = analyzeExpression(input);
    const evidence = createEvidenceLogEntry({
      analysis,
      conversation_id: input.conversation_id,
      stt_provider: "assemblyai",
    });

    return NextResponse.json({
      ok: true,
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
      speak_guidance:
        analysis.demo_state === "UNDERSTOOD"
          ? "You may answer using the cultural interpretation. Keep it short."
          : analysis.demo_state === "POSSIBLE_MEANING_LOSS"
            ? "Ask a brief clarifying question or offer cultural reading for confirmation."
            : "Say you are not sure. Ask the speaker to explain. Do not invent meaning.",
      analysis,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
