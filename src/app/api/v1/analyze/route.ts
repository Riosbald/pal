/**
 * POST /api/v1/analyze — MVP-1 epistemic audit (Source of Truth v0.3)
 */

import { NextRequest, NextResponse } from "next/server";
import { AnalyzeV1RequestSchema } from "@/core/schemas/analyze-v1";
import { analyzeV1 } from "@/services/activation/analyze-v1";
import { createEvidenceLogEntry } from "@/services/activation";
import { analyzeExpression } from "@/services/activation";

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const input = AnalyzeV1RequestSchema.parse(body);
    const result = analyzeV1(input);

    const legacy = analyzeExpression({
      expression: input.expression,
      language: input.language,
      context: input.context,
      conversation_id: input.conversation_id,
    });
    const evidence = createEvidenceLogEntry({
      analysis: legacy,
      conversation_id: input.conversation_id,
      stt_provider: "assemblyai",
    });

    return NextResponse.json({
      ok: true,
      ...result,
      evidence_id: evidence.id,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
