import { describe, expect, it } from "vitest";
import { analyzeHealthIntent, quarantineHealthData } from "@/services/mobile/health-data-isolation";
import type { MeaningState } from "@/core/schemas/meaning-state";

const mockHealth = (): MeaningState => ({
  id: "health_1",
  speechEventId: "speech_1",
  intent: { type: "other", summary: "Log my sleep and exercise for today", confidence: 0.85 },
  entities: [
    { name: "sleep_hours", value: "7", type: "other", confidence: 0.9 },
    { name: "exercise_minutes", value: "30", type: "other", confidence: 0.85 },
  ],
  constraints: [],
  temporalRelations: [{ type: "at", value: "today", confidence: 0.95 }],
  ambiguities: [],
  evidenceRefs: [],
  confidence: { overall: 0.87, fields: {} },
  contextSufficiency: "sufficient",
  model: { provider: "sahara", model: "semantic", version: "1.0" },
});

describe("Health Data Isolation", () => {
  it("detects health-related intents", () => {
    const analysis = analyzeHealthIntent(mockHealth());
    expect(analysis.metrics.length).toBeGreaterThan(0);
    expect(analysis.warnings).toContain(
      "All health data is confidential. Review before sharing.",
    );
  });

  it("marks all health metrics as requiring user consent", () => {
    const analysis = analyzeHealthIntent(mockHealth());
    expect(analysis.requiresUserConsent).toBe(true);
    expect(analysis.metrics[0]?.sensitivity).toBe("personal");
  });

  it("quarantines health data and blocks propagation", () => {
    const analysis = analyzeHealthIntent(mockHealth());
    const quarantine = quarantineHealthData(analysis);
    expect(quarantine.approved).toBe(false);
    expect(quarantine.reason).toContain("explicit user consent");
  });

  it("allows non-health workflows to proceed normally", () => {
    const nonHealth: MeaningState = {
      ...mockHealth(),
      intent: { type: "payment_reminder", summary: "Remind customer to pay", confidence: 0.9 },
    };
    const analysis = analyzeHealthIntent(nonHealth);
    const quarantine = quarantineHealthData(analysis);
    expect(quarantine.approved).toBe(true);
  });
});
