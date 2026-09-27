/**
 * Voice-to-Workflow Draft Compiler — MeaningState → ActionPlan (mobile mode)
 * 
 * Implements PAL_ARCHITECTURE.md §14, §20: Translate voice intent into validated
 * workflow draft with mode-specific capability constraints. Never executes.
 */

import type { MeaningState } from "@/core/schemas/meaning-state";
import type { ActionPlan } from "@/core/schemas/action-plan";
import type { MobileRoute } from "@/core/schemas/mobile-context";
import { WorkflowAgent } from "@/services/workflow/agent";
import type { OpenAIWorkflowGenerator } from "@/providers/openai-workflow";

export interface VoiceCompilerConfig {
  generator: OpenAIWorkflowGenerator;
  mobileRoute?: MobileRoute;
  businessContext?: string;
}

/**
 * Compiles voice transcription into a workflow draft that respects app mode constraints.
 * The compiled plan may be viewed, edited, or rejected before approval/execution.
 */
export class VoiceToWorkflowCompiler {
  private readonly agent: WorkflowAgent;
  private readonly mobileRoute: MobileRoute | undefined;

  constructor(config: VoiceCompilerConfig) {
    this.agent = new WorkflowAgent(
      {
        generator: config.generator,
        businessContext: config.businessContext,
      },
      {
        info: (msg, meta) => console.log(`[compiler] ${msg}`, meta),
        warn: (msg, meta) => console.warn(`[compiler] ${msg}`, meta),
        error: (msg, meta) => console.error(`[compiler] ${msg}`, meta),
      },
    );
    this.mobileRoute = config.mobileRoute;
  }

  async compile(meaningState: MeaningState): Promise<ActionPlan> {
    // 1. Generate base plan from semantic meaning
    const plan = await this.agent.generatePlan(meaningState);

    // 2. If mobile mode specified, constrain capabilities to mode's allowlist
    if (this.mobileRoute && this.mobileRoute.capabilities.length > 0) {
      const constrainedSteps = plan.steps.filter((step) =>
        this.mobileRoute!.capabilities.some((cap) => step.capability.startsWith(cap.split(".")[0]!)),
      );

      if (constrainedSteps.length === 0) {
        throw new Error(
          `Mobile mode ${this.mobileRoute.agent} has no applicable capabilities for this workflow`,
        );
      }

      // Return plan with filtered steps (never modify original)
      return {
        ...plan,
        steps: constrainedSteps,
      };
    }

    return plan;
  }
}
