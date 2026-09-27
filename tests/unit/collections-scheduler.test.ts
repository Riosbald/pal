import { describe, expect, it } from "vitest";
import { computeReminderTime, proposeScheduledReminder } from "@/services/mobile/collections-scheduler";
import type { MeaningState } from "@/core/schemas/meaning-state";

const mockPost = (): MeaningState => ({
  id: "post_call_1",
  speechEventId: "speech_1",
  intent: { type: "payment_reminder", summary: "Remind customer of payment due", confidence: 0.95 },
  entities: [],
  constraints: [],
  temporalRelations: [{ type: "at", value: "14:30", confidence: 0.9 }],
  ambiguities: [],
  evidenceRefs: [],
  confidence: { overall: 0.9, fields: {} },
  contextSufficiency: "sufficient",
  model: { provider: "sahara", model: "semantic", version: "1.0" },
});

describe("Collections Scheduler", () => {
  const quietHours = { startHour: 20, endHour: 8, timezone: "Africa/Nairobi" };

  it("allows reminders outside quiet hours", () => {
    const time = "2026-09-28T14:30:00Z";
    const schedule = computeReminderTime(time, quietHours);
    expect(schedule.quietHoursEnforced).toBe(false);
    expect(schedule.scheduledTime).toBe(time);
  });

  it("postpones reminders within quiet hours (overnight)", () => {
    const time = "2026-09-28T22:00:00Z";
    const schedule = computeReminderTime(time, quietHours);
    expect(schedule.quietHoursEnforced).toBe(true);
    expect(schedule.adjustedTime).toBeDefined();
  });

  it("generates reminder proposal with approval gate", () => {
    const post = mockPost();
    const schedule = computeReminderTime("2026-09-28T14:30:00Z", quietHours);
    const proposal = proposeScheduledReminder(post, schedule, quietHours);

    expect(proposal.requiresApproval).toBe(true);
    expect(proposal.sideEffectClass).toBe("draft");
    expect(proposal.steps[0]?.parameters.quietHours).toBeDefined();
  });
});
