import { z } from "zod";

export const AppModeSchema = z.enum([
  "quick_action",
  "meeting",
  "post_call",
  "pocket",
  "field_ops",
  "research",
  "health",
]);

export const ScreenStateSchema = z.enum(["locked", "unlocked", "off"]);
export const ConnectivitySchema = z.enum(["wifi", "cellular", "none"]);
export const DeviceOsSchema = z.enum(["ios", "android", "web", "other"]);

export const MobileContextSchema = z.object({
  sessionId: z.string().trim().min(1),
  workspaceId: z.string().trim().min(1),
  appMode: AppModeSchema,
  screenState: ScreenStateSchema,
  connectivity: ConnectivitySchema,
  deviceOs: DeviceOsSchema,
  appVersion: z.string().trim().min(1),
  riskBaseline: z.number().finite().min(0).max(5),
  capturedAt: z.string().datetime(),
});

export type AppMode = z.infer<typeof AppModeSchema>;
export type MobileContext = z.infer<typeof MobileContextSchema>;
export type MobileRoute = {
  agent: "workflow" | "crm" | "receivable" | "market_intel" | "operations" | "rag" | "health";
  priority: "rapid" | "batch" | "urgent" | "transactional" | "interactive" | "passive";
  riskBaseline: number;
  requiresApprovalByDefault: boolean;
  capabilities: string[];
};

export function createMobileContext(input: Omit<MobileContext, "capturedAt"> & { capturedAt?: string }): MobileContext {
  return MobileContextSchema.parse({
    ...input,
    capturedAt: input.capturedAt ?? new Date().toISOString(),
  });
}
