/**
 * Collections Scheduling Service — Post-call reminder automation with quiet hours
 * 
 * Generates reminder ActionProposal with quiet-hours enforcement.
 * No scheduling authority; subject to approval and execution policy.
 */

import type { MeaningState } from "@/core/schemas/meaning-state";
import { createActionPlan } from "@/core/schemas/action-plan";
import { createId } from "@/lib/utils/ids";

export interface QuietHours {
  startHour: number; // 0-23
  endHour: number;
  timezone: string;
}

export interface ReminderSchedule {
  scheduledTime: string; // ISO-8601
  adjustedTime?: string; // If within quiet hours
  reasonForAdjustment?: string;
  quietHoursEnforced: boolean;
}

/**
 * Determine optimal reminder time respecting quiet hours.
 * Returns ISO-8601 datetime. If within quiet hours, postpones to next available slot.
 */
export function computeReminderTime(desiredTime: string, quietHours: QuietHours): ReminderSchedule {
  const desired = new Date(desiredTime);
  const hour = desired.getHours();

  const isWithinQuietHours =
    quietHours.startHour < quietHours.endHour
      ? hour >= quietHours.startHour && hour < quietHours.endHour
      : hour >= quietHours.startHour || hour < quietHours.endHour;

  if (!isWithinQuietHours) {
    return {
      scheduledTime: desired.toISOString(),
      quietHoursEnforced: false,
    };
  }

  // Move to end of quiet hours
  const adjusted = new Date(desired);
  adjusted.setHours(quietHours.endHour, 0, 0, 0);

  if (adjusted <= desired) {
    adjusted.setDate(adjusted.getDate() + 1);
  }

  return {
    scheduledTime: desired.toISOString(),
    adjustedTime: adjusted.toISOString(),
    reasonForAdjustment: `Moved outside quiet hours (${quietHours.startHour}:00-${quietHours.endHour}:00 ${quietHours.timezone})`,
    quietHoursEnforced: true,
  };
}

/**
 * Generate ActionProposal for scheduled reminder with quiet-hours enforcement.
 * No execution authority.
 */
export function proposeScheduledReminder(
  meaningState: MeaningState,
  schedule: ReminderSchedule,
  quietHours: QuietHours,
) {
  const finalTime = schedule.adjustedTime ?? schedule.scheduledTime;

  return createActionPlan({
    id: createId("plan"),
    meaningStateId: meaningState.id,
    workflowIR: {
      version: "1.0",
      nodes: [
        { id: "trigger", type: "trigger" },
        { id: "schedule", type: "action", capability: "receivable.reminder.schedule" },
        { id: "approval", type: "approval" },
      ],
      edges: [
        { from: "trigger", to: "schedule" },
        { from: "schedule", to: "approval" },
      ],
    },
    steps: [
      {
        id: "schedule_reminder",
        type: "draft",
        capability: "receivable.reminder.schedule",
        description: `Schedule payment reminder for ${finalTime}`,
        parameters: {
          scheduledTime: finalTime,
          quietHoursEnforced: schedule.quietHoursEnforced,
          reasonForAdjustment: schedule.reasonForAdjustment,
          quietHours: { start: quietHours.startHour, end: quietHours.endHour, tz: quietHours.timezone },
        },
        requiresApproval: false,
        dependsOn: [],
      },
    ],
    sideEffectClass: "draft",
    requiresApproval: true,
    rationaleSummary: `Schedule reminder: ${meaningState.intent.summary} at ${finalTime}`,
    generatedBy: { agent: "collections-scheduler", model: "temporal", version: "1.0.0" },
  });
}
