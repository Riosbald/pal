import type { MeaningState } from "@/core/schemas/meaning-state";
import { createActionPlan } from "@/core/schemas/action-plan";
import { createId } from "@/lib/utils/ids";

export type CRMInteractionDraft = {
  participant?: string;
  summary: string;
  evidenceRefs: MeaningState["evidenceRefs"];
};

export function extractMeetingCRM(meaning: MeaningState): CRMInteractionDraft {
  return {
    participant: meaning.entities.find((entity) => entity.type === "person")?.value,
    summary: meaning.intent.summary,
    evidenceRefs: meaning.evidenceRefs,
  };
}

export function proposeMeetingCRM(meaning: MeaningState) {
  const draft = extractMeetingCRM(meaning);
  return createActionPlan({
    id: createId("plan"), meaningStateId: meaning.id,
    workflowIR: { version: "1.0", nodes: [{ id: "draft", type: "action", capability: "crm.interaction.draft" }, { id: "approval", type: "approval" }], edges: [{ from: "draft", to: "approval" }] },
    steps: [{ id: "crm_draft", type: "draft", capability: "crm.interaction.draft", description: "Draft meeting interaction", parameters: draft, requiresApproval: true, dependsOn: [] }],
    sideEffectClass: "draft", requiresApproval: true, evidenceRefs: meaning.evidenceRefs,
    rationaleSummary: `Draft CRM interaction: ${draft.summary}`,
    generatedBy: { agent: "meeting-mode-crm", model: meaning.model.model, version: "1.0.0" },
  });
}
