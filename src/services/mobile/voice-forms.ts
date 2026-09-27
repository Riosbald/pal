import type { MeaningState } from "@/core/schemas/meaning-state";
import { createActionPlan } from "@/core/schemas/action-plan";
import { createId } from "@/lib/utils/ids";

export type VoiceForm = { formType: "inventory" | "visit" | "incident"; fields: Record<string, unknown>; confidence: Record<string, number> };
export function compileVoiceForm(meaning: MeaningState, formType: VoiceForm["formType"]): VoiceForm {
  const fields: Record<string, unknown> = {};
  const confidence: Record<string, number> = {};
  for (const entity of meaning.entities) { fields[entity.name] = entity.value; confidence[entity.name] = entity.confidence; }
  return { formType, fields, confidence };
}
export function proposeFieldOperation(meaning: MeaningState, form: VoiceForm) {
  return createActionPlan({
    id: createId("plan"), meaningStateId: meaning.id,
    workflowIR: { version: "1.0", nodes: [{ id: "form", type: "action", capability: "field.operation.draft" }, { id: "approval", type: "approval" }], edges: [{ from: "form", to: "approval" }] },
    steps: [{ id: "field_form", type: "draft", capability: "field.operation.draft", description: "Draft field operation form", parameters: form, requiresApproval: true, dependsOn: [] }],
    sideEffectClass: "draft", requiresApproval: true, evidenceRefs: meaning.evidenceRefs,
    rationaleSummary: `Draft ${form.formType} field operation`, generatedBy: { agent: "voice-forms", model: meaning.model.model, version: "1.0.0" },
  });
}
