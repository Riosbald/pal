/**
 * Voice Forms Engine — Field operations form generation from voice
 * 
 * Converts voice intent into structured form proposal with field validation.
 * No execution; generates draft ActionProposal for approval.
 */

import type { MeaningState } from "@/core/schemas/meaning-state";
import { createActionPlan } from "@/core/schemas/action-plan";
import { createId } from "@/lib/utils/ids";

export interface FormField {
  name: string;
  type: "text" | "number" | "date" | "select" | "checkbox";
  value: unknown;
  confidence: number;
  required: boolean;
}

export interface VoiceForm {
  title: string;
  formType: "visit" | "inventory" | "survey" | "incident";
  fields: FormField[];
  completenessScore: number;
}

/**
 * Extract and structure voice input into form fields.
 * Returns partially-filled form proposal ready for user refinement.
 */
export function compileVoiceToForm(meaningState: MeaningState, formType: string): VoiceForm {
  const fields: FormField[] = [];

  // Map entities to form fields based on type
  for (const entity of meaningState.entities) {
    fields.push({
      name: entity.name,
      type:
        entity.type === "money"
          ? "number"
          : entity.type === "date"
            ? "date"
            : entity.type === "person"
              ? "text"
              : "text",
      value: entity.value,
      confidence: entity.confidence,
      required: entity.confidence > 0.85,
    });
  }

  // Add constraints as metadata
  for (const constraint of meaningState.constraints) {
    fields.push({
      name: constraint.type,
      type: "text",
      value: constraint.value,
      confidence: constraint.confidence,
      required: false,
    });
  }

  const completenessScore =
    fields.length > 0 ? fields.filter((f) => f.confidence > 0.85).length / fields.length : 0;

  return {
    title: meaningState.intent.summary,
    formType: (formType as "visit" | "inventory" | "survey" | "incident") || "survey",
    fields,
    completenessScore,
  };
}

/**
 * Propose form submission (draft only; never submits directly).
 */
export function proposeFormSubmission(meaningState: MeaningState, form: VoiceForm) {
  return createActionPlan({
    id: createId("plan"),
    meaningStateId: meaningState.id,
    workflowIR: {
      version: "1.0",
      nodes: [
        { id: "trigger", type: "trigger" },
        { id: "form_entry", type: "action", capability: "field.visit.draft" },
        { id: "approval", type: "approval" },
      ],
      edges: [
        { from: "trigger", to: "form_entry" },
        { from: "form_entry", to: "approval" },
      ],
    },
    steps: [
      {
        id: "submit_form",
        type: "draft",
        capability: "field.visit.draft",
        description: `Submit field form: ${form.title}`,
        parameters: {
          formType: form.formType,
          fields: form.fields,
          completenessScore: form.completenessScore,
        },
        requiresApproval: false,
        dependsOn: [],
      },
    ],
    sideEffectClass: "draft",
    requiresApproval: true,
    rationaleSummary: `Field operation form (${form.completenessScore * 100}% complete): ${form.title}`,
    generatedBy: { agent: "voice-forms-engine", model: "form-compiler", version: "1.0.0" },
  });
}
