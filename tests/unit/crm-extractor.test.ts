import { describe, expect, it } from "vitest";
import { extractCRMData, proposeCRMInteraction } from "@/services/mobile/crm-extractor";
import type { MeaningState } from "@/core/schemas/meaning-state";

const mockMeeting = (): MeaningState => ({
  id: "meeting_1",
  speechEventId: "speech_1",
  intent: { type: "send_message", summary: "Follow up on invoice with Mama Wanjiku", confidence: 0.92 },
  entities: [
    { name: "person", value: "Mama Wanjiku", type: "person", confidence: 0.95 },
    { name: "amount", value: "Ksh 50,000", type: "money", confidence: 0.88 },
  ],
  constraints: [{ type: "payment", value: "Payment due by month end", confidence: 0.85 }],
  temporalRelations: [{ type: "before", value: "2026-09-30", confidence: 0.9 }],
  ambiguities: [],
  evidenceRefs: [],
  confidence: { overall: 0.90, fields: { intent: 0.92, entities: 0.91 } },
  contextSufficiency: "sufficient",
  model: { provider: "sahara", model: "semantic-agent", version: "1.0.0" },
});

describe("CRM Extraction", () => {
  it("extracts participants and temporal data from meeting", () => {
    const extraction = extractCRMData(mockMeeting());
    expect(extraction.participant.name).toBe("Mama Wanjiku");
    expect(extraction.participant.confidence).toBe(0.95);
    expect(extraction.followUpDate).toBe("2026-09-30");
  });

  it("generates CRM interaction proposal as draft (non-executable)", () => {
    const meeting = mockMeeting();
    const extraction = extractCRMData(meeting);
    const proposal = proposeCRMInteraction(meeting, extraction);

    expect(proposal.sideEffectClass).toBe("draft");
    expect(proposal.steps[0]?.type).toBe("draft");
    expect(proposal.requiresApproval).toBe(true);
    expect(proposal.steps[0]?.parameters.type).toBe("call");
  });
});
