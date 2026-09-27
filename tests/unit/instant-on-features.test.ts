import { describe, expect, it } from "vitest";
import { compileVoiceWorkflowDraft } from "@/services/mobile/voice-workflow-draft";
import { enforceQuietHours } from "@/services/mobile/collections";
import { buildResearchQuery, classifyMarketSignal } from "@/services/mobile/research-market";
import { isolateHealthAnalysis } from "@/services/mobile/vision-health";
import type { MeaningState } from "@/core/schemas/meaning-state";
const meaning = (): MeaningState => ({ id: "m1", speechEventId: "s1", intent: { type: "other", summary: "Record stock update", confidence: .9 }, entities: [{ name: "item", value: "cement", type: "other", confidence: .9 }], constraints: [], temporalRelations: [], ambiguities: [], evidenceRefs: [], confidence: { overall: .9, fields: {} }, contextSufficiency: "sufficient", model: { provider: "test", model: "test", version: "1" } });
describe("Instant-On feature foundations", () => {
 it("creates an approval-gated workflow draft", () => expect(compileVoiceWorkflowDraft(meaning()).plan.requiresApproval).toBe(true));
 it("keeps a reminder outside overnight quiet hours", () => expect(enforceQuietHours(new Date("2026-09-28T12:00:00Z"), { startHour: 21, endHour: 8, timezone: "Africa/Lagos" }).toISOString()).toBe("2026-09-28T12:00:00.000Z"));
 it("keeps research read-only and market data public-only", () => { expect(buildResearchQuery(meaning())).toContain("cement"); expect(classifyMarketSignal(meaning()).publicOnly).toBe(true); });
 it("isolates health analysis", () => { const result = isolateHealthAnalysis(meaning()); expect(result.isolated).toBe(true); expect(result.consentRequired).toBe(true); });
});
