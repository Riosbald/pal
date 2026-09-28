/**
 * POST /api/activation/tools
 * Dispatch AssemblyAI tool.call payloads: { name, arguments, call_id? }
 */

import { NextRequest, NextResponse } from "next/server";
import { handleActivationToolCall } from "@/services/activation";

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const outcome = handleActivationToolCall(body);
    return NextResponse.json(outcome, { status: outcome.ok ? 200 : 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid tool call";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

/** GET returns tool definitions for agent registration. */
export async function GET() {
  const { getMimoActivationFunctionTools, MIMO_ASSEMBLYAI_SYSTEM_PROMPT } =
    await import("@/providers/assemblyai-tools");
  return NextResponse.json({
    tools: getMimoActivationFunctionTools(),
    system_prompt: MIMO_ASSEMBLYAI_SYSTEM_PROMPT,
    notes: {
      ws_url: "wss://agents.assemblyai.com/v1/ws",
      tool_call_args_field: "arguments",
      pattern: "Accumulate tool results; send on reply.done",
    },
  });
}
