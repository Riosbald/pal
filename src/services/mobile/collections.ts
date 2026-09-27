import type { MeaningState } from "@/core/schemas/meaning-state";
import { createActionPlan } from "@/core/schemas/action-plan";
import { createId } from "@/lib/utils/ids";

export type QuietHours = { startHour: number; endHour: number; timezone: string };
export function enforceQuietHours(when: Date, quiet: QuietHours): Date {
  const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: quiet.timezone, hour: "numeric", hour12: false }).format(when));
  const active = quiet.startHour < quiet.endHour ? hour >= quiet.startHour && hour < quiet.endHour : hour >= quiet.startHour || hour < quiet.endHour;
  if (!active) return when;
  const next = new Date(when);
  next.setUTCHours(next.getUTCHours() + ((quiet.endHour - hour + 24) % 24 || 24), 0, 0, 0);
  return next;
}
export function proposeCollectionReminder(meaning: MeaningState, desired: Date, quiet: QuietHours) {
  const scheduledFor = enforceQuietHours(desired, quiet).toISOString();
  return createActionPlan({
    id: createId("plan"), meaningStateId: meaning.id,
    workflowIR: { version: "1.0", nodes: [{ id: "schedule", type: "action", capability: "receivable.reminder.schedule" }, { id: "approval", type: "approval" }], edges: [{ from: "schedule", to: "approval" }] },
    steps: [{ id: "reminder", type: "draft", capability: "receivable.reminder.schedule", description: "Draft collection reminder", parameters: { scheduledFor, timezone: quiet.timezone, quietHours: quiet }, requiresApproval: true, dependsOn: [] }],
    sideEffectClass: "draft", requiresApproval: true, evidenceRefs: meaning.evidenceRefs,
    rationaleSummary: `Draft collection reminder for ${scheduledFor}`,
    generatedBy: { agent: "collections-scheduler", model: meaning.model.model, version: "1.0.0" },
  });
}
