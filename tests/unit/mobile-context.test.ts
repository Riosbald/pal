import { describe, expect, it } from "vitest";
import { createMobileContext, MobileContextSchema } from "@/core/schemas/mobile-context";
import { routeMobileContext } from "@/services/mobile/context-router";

describe("mobile context", () => {
  it("validates an Instant-On quick action context", () => {
    const context = createMobileContext({
      sessionId: "session_1",
      workspaceId: "workspace_1",
      appMode: "quick_action",
      screenState: "locked",
      connectivity: "cellular",
      deviceOs: "android",
      appVersion: "0.1.0",
      riskBaseline: 3,
    });

    expect(context.appMode).toBe("quick_action");
    expect(context.screenState).toBe("locked");
  });

  it("rejects an unknown app mode", () => {
    const result = MobileContextSchema.safeParse({
      sessionId: "session_1",
      workspaceId: "workspace_1",
      appMode: "ambient",
      screenState: "locked",
      connectivity: "none",
      deviceOs: "web",
      appVersion: "0.1.0",
      riskBaseline: 0,
      capturedAt: "2026-09-27T10:00:00.000Z",
    });

    expect(result.success).toBe(false);
  });

  it("routes each mode without granting execution authority", () => {
    const context = createMobileContext({
      sessionId: "session_2",
      workspaceId: "workspace_1",
      appMode: "research",
      screenState: "unlocked",
      connectivity: "wifi",
      deviceOs: "ios",
      appVersion: "0.1.0",
      riskBaseline: 0,
    });

    const route = routeMobileContext(context);
    expect(route.agent).toBe("rag");
    expect(route.capabilities).toContain("memory.search");
    expect(route).not.toHaveProperty("execute");
  });

  it("does not let client context lower the configured safety baseline", () => {
    const context = createMobileContext({
      sessionId: "session_3",
      workspaceId: "workspace_1",
      appMode: "field_ops",
      screenState: "off",
      connectivity: "none",
      deviceOs: "android",
      appVersion: "0.1.0",
      riskBaseline: 0,
    });

    expect(routeMobileContext(context).riskBaseline).toBe(4);
  });
});
