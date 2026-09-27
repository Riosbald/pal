/**
 * CRM Extraction Service — Meeting mode semantic analysis
 * 
 * Converts MeaningState + context from meeting transcript into CRM interaction proposal.
 * Never writes to CRM directly; generates ActionProposal for approval.
 */

import type { MeaningState } from "@/core/schemas/meaning-state";
import { createActionPlan } from "@/core/schemas/action-plan";
import { createId } from "@/lib/utils/ids";

export interface CRMExtraction {
  interactionType: "call" | "email" | "meeting" | "note";
  participant: { name: string; confidence: number };
  summary: string;
  nextSteps?: string[];
  followUpDate?: string;
}

/**
 * Extract CRM-relevant entities from meeting-mode voice transcript.
 * Returns data suitable for creating a draft CRM interaction record.
 */
export function extractCRMData(meaningState: MeaningState): CRMExtraction {
  const participantEntity = meaningState.entities.find((e) => e.type === "person");
  const temporalNextStep = meaningState.temporalRelations.find(
    (tr) => tr.type === "before" || tr.type === "on",
  );

  return {
    interactionType: "call",
    participant: {
      name: participantEntity?.value ?? "Unknown",
      confidence: participantEntity?.confidence ?? 0.5,
    },
    summary: meaningState.intent.summary,
    nextSteps: meaningState.constraints.map((c) => c.value),
    followUpDate: temporalNextStep?.value,
  };
}

/**
 * Proposal draft for CRM interaction. No approval authority; subject to policy + user approval.
 */
export function proposeCRMInteraction(meaningState: MeaningState, extraction: CRMExtraction) {
  return createActionPlan({
    id: createId("plan"),
    meaningStateId: meaningState.id,
    workflowIR: {
      version: "1.0",
      nodes: [
        { id: "trigger", type: "trigger" },
        { id: "crm_draft", type: "action", capability: "crm.interaction.draft" },
        { id: "approval", type: "approval" },
      ],
      edges: [
        { from: "trigger", to: "crm_draft" },
        { from: "crm_draft", to: "approval" },
      ],
    },
    steps: [
      {
        id: "draft_interaction",
        type: "draft",
        capability: "crm.interaction.draft",
        description: `Draft CRM interaction record for ${extraction.participant.name}`,
        parameters: {
          type: extraction.interactionType,
          participant: extraction.participant,
          summary: extraction.summary,
          nextSteps: extraction.nextSteps,
          followUpDate: extraction.followUpDate,
        },
        requiresApproval: false,
        dependsOn: [],
      },
    ],
    sideEffectClass: "draft",
    requiresApproval: true,
    rationaleSummary: `Record meeting with ${extraction.participant.name}: ${extraction.summary}`,
    generatedBy: { agent: "crm-extractor", model: "semantic", version: "1.0.0" },
  });
}
