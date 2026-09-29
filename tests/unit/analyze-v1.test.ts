import { describe, expect, it } from "vitest";
import { analyzeV1 } from "@/services/activation/analyze-v1";
import { AnalyzeV1ResponseSchema } from "@/core/schemas/analyze-v1";

describe("analyzeV1", () => {
  it("blocks action on hustle proverb POSSIBLE_MEANING_LOSS", () => {
    const r = analyzeV1({
      expression: "No be who hustle pass na him go get money.",
      language: "pcm",
      intended_action: { target_tool: "execute_financial_transfer", draft_parameters: {} },
    });
    const parsed = AnalyzeV1ResponseSchema.parse(r);
    expect(parsed.epistemic_state).toBe("POSSIBLE_MEANING_LOSS");
    expect(parsed.action_readiness.authorized).toBe(false);
    expect(parsed.coverage_audit.search_adequacy).toBe("INCOMPLETE");
    expect(parsed.clarification_protocol.should_ask).toBe(true);
  });

  it("marks gap fixture INSUFFICIENT", () => {
    const r = analyzeV1({
      expression: "Water wey pass gari, e don pass gari.",
      language: "pcm",
    });
    expect(r.epistemic_state).toBe("INSUFFICIENT");
    expect(r.action_readiness.authorized).toBe(false);
  });

  it("CONTEXT_DEPENDENT when tool params missing on clear speech", () => {
    const r = analyzeV1({
      expression: "Small wahala fit give you big stress.",
      language: "pcm",
      intended_action: { target_tool: "create_task", draft_parameters: {} },
    });
    expect(["UNDERSTOOD", "CONTEXT_DEPENDENT"]).toContain(r.epistemic_state);
    if (r.epistemic_state === "CONTEXT_DEPENDENT") {
      expect(r.action_readiness.authorized).toBe(false);
    }
  });
});
