import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/auth/session";
import { createPalServerClient } from "@/lib/db/server";
import { getServerEnv } from "@/lib/env";
import { SaharaVoicePipeline, SaharaAudioConfig } from "@/providers/sahara";
import { SaharaWebSocketAdapter } from "@/providers/sahara-websocket-adapter";
import { VoiceDbService } from "@/services/voice/db";
import { createId } from "@/lib/utils/ids";
import { AppModeSchema, ConnectivitySchema, DeviceOsSchema, ScreenStateSchema } from "@/core/schemas/mobile-context";

const CreateSessionSchema = z.object({
  workspaceId: z.string().uuid(),
  traceId: z.string().trim().min(1).optional(),
  appMode: AppModeSchema.default("quick_action"),
  screenState: ScreenStateSchema.default("unlocked"),
  connectivity: ConnectivitySchema.default("wifi"),
  deviceOs: DeviceOsSchema.default("other"),
  appVersion: z.string().trim().min(1).max(50).default("unknown"),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const validation = CreateSessionSchema.safeParse(await request.json());
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid request", issues: validation.error.issues }, { status: 400 });
    }

    const { workspaceId, traceId, appMode, screenState, connectivity, deviceOs, appVersion } = validation.data;
    const finalTraceId = traceId ?? createId("trace");
    const supabase = await createPalServerClient();

    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: "Workspace not found or access denied" }, { status: 403 });
    }

    const env = getServerEnv();
    const adapter = new SaharaWebSocketAdapter({
      endpoint: env.SAHARA_WS_ENDPOINT,
      apiSecret: env.SAHARA_API_SECRET,
      sampleRate: SaharaAudioConfig.sampleRate,
      channels: SaharaAudioConfig.channels,
      bitDepth: SaharaAudioConfig.bitDepth,
      logger: {
        info: (msg, meta) => console.log(`[voice] ${msg}`, meta),
        warn: (msg, meta) => console.warn(`[voice] ${msg}`, meta),
        error: (msg, meta) => console.error(`[voice] ${msg}`, meta),
      },
    });

    const pipeline = new SaharaVoicePipeline({
      provider: adapter,
      logger: {
        info: (msg, meta) => console.log(`[pipeline] ${msg}`, meta),
        warn: (msg, meta) => console.warn(`[pipeline] ${msg}`, meta),
        error: (msg, meta) => console.error(`[pipeline] ${msg}`, meta),
      },
    });

    const session = await pipeline.startSession({ traceId: finalTraceId, workspaceId });
    await new VoiceDbService(supabase).createSession(session);

    const { error: contextError } = await supabase.from("mobile_contexts").insert({
      session_id: session.sessionId,
      workspace_id: workspaceId,
      app_mode: appMode,
      screen_state: screenState,
      connectivity,
      device_os: deviceOs,
      app_version: appVersion,
      risk_baseline: appMode === "field_ops" ? 4 : appMode === "research" || appMode === "health" ? 0 : appMode === "pocket" ? 1 : appMode === "meeting" ? 2 : 3,
    });

    if (contextError) {
      console.error("[voice] Mobile context persistence failed:", contextError);
      return NextResponse.json({ error: "Failed to persist mobile session context" }, { status: 500 });
    }

    return NextResponse.json({
      sessionId: session.sessionId,
      traceId: session.traceId,
      status: session.state,
      transport: { mode: "server_provider_bridge", audioEndpoint: "/api/voice/audio", commitEndpoint: "/api/voice/commit" },
      appMode,
      config: {
        sampleRate: SaharaAudioConfig.sampleRate,
        channels: SaharaAudioConfig.channels,
        bitDepth: SaharaAudioConfig.bitDepth,
        maxChunkBytes: SaharaAudioConfig.maxChunkBytes,
      },
    });
  } catch (error) {
    console.error("[voice] Session creation failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Failed to create voice session", details: message }, { status: 500 });
  }
}
