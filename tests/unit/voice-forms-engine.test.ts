import { describe, expect, it } from "vitest";
import { compileVoiceToForm, proposeFormSubmission } from "@/services/mobile/voice-forms-engine";
import type { MeaningState } from "@/core/schemas/meaning-state";

const mockFieldOps = (): MeaningState => ({
  id: "field_ops_1",
  speechEventId: "speech_1",
  intent: { type: "other", summary: "Record field visit to customer location", confidence: 0.88 },
  entities: [
    { name: "location", value: "Nairobi downtown office", type: "location", confidence: 0.9 },
    { name: "inventory", value: "50 units in stock", type: "other", confidence: 0.85 },
  ],
  constraints: [{ type: "timeframe", value: "Must complete by EOD", confidence: 0.8 }],
  temporalRelations: [{ type: "at", value: "2026-09-28T15:00", confidence: 0.85 }],
  ambiguities: [],
  evidenceRefs: [],
  confidence: { overall: 0.87, fields: {} },
  contextSufficiency: "sufficient",
  model: { provider: "sahara", model: "semantic", version: "1.0" },
});

describe("Voice Forms Engine", () => {
  it("compiles voice input into structured form with fields", () => {
    const form = compileVoiceToForm(mockFieldOps(), "visit");
    expect(form.formType).toBe("visit");
    expect(form.fields.length).toBeGreaterThan(0);
    expect(form.completenessScore).toBeGreaterThan(0);
  });

  it("marks high-confidence entities as required", () => {
    const form = compileVoiceToForm(mockFieldOps(), "visit");
    const highConfidence = form.fields.filter((f) => f.confidence > 0.85);
    expect(highConfidence.some((f) => f.required)).toBe(true);
  });

  it("generates form submission proposal (draft, approval-gated)", () => {
    const ops = mockFieldOps();
    const form = compileVoiceToForm(ops, "visit");
    const proposal = proposeFormSubmission(ops, form);

    expect(proposal.requiresApproval).toBe(true);
    expect(proposal.sideEffectClass).toBe("draft");
    expect(proposal.steps[0]?.type).toBe("draft");
  });
});
