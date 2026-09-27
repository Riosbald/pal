import type { MeaningState } from "@/core/schemas/meaning-state";
import type { ActionPlan } from "@/core/schemas/action-plan";
import type { MobileRoute } from "@/core/schemas/mobile-context";
import { createActionPlan } from "@/core/schemas/action-plan";
import { createId } from "@/lib/utils/ids";

export type WorkflowDraft = { plan: ActionPlan; route?: MobileRoute };

/** Creates a draft only. Policy, approval, execution, and verification remain downstream. */
export function compileVoiceWorkflowDraft(
  meaningState: MeaningState,
  route?: MobileRoute,
): WorkflowDraft {
  const capabilities = route?.capabilities ?? ["workflow.draft"];
  const steps = capabilities.map((capability, index) => ({
    id: `step_${index + 1}`,
    type: "draft" as const,
    capability,
    description: `Draft capability ${capability}`,
    parameters: { intent: meaningState.intent.summary },
    requiresApproval: true,
    dependsOn: index === 0 ? [] : [`step_${index}`],
  }));

  const plan = createActionPlan({
    id: createId("plan"),
    meaningStateId: meaningState.id,
    workflowIR: {
      version: "1.0",
      nodes: [
        { id: "trigger", type: "trigger" },
        ...steps.map((step) => ({ id: step.id, type: "action" as const, capability: step.capability })),
        { id: "approval", type: "approval" },
      ],
      edges: [
        { from: "trigger", to: steps[0]!.id },
        ...steps.slice(1).map((step, index) => ({ from: steps[index]!.id, to: step.id })),
        { from: steps.at(-1)!.id, to: "approval" },
      ],
    },
    steps,
    sideEffectClass: "draft",
    requiresApproval: true,
    evidenceRefs: meaningState.evidenceRefs,
    rationaleSummary: `Voice workflow draft: ${meaningState.intent.summary}`,
    generatedBy: { agent: "instant-on-workflow-compiler", model: meaningState.model.model, version: "1.0.0" },
  });
  return { plan, ...(route ? { route } : {}) };
}
