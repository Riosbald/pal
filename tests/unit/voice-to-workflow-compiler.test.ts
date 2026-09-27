import { describe, expect, it, vi } from "vitest";
import { VoiceToWorkflowCompiler } from "@/services/mobile/voice-to-workflow-compiler";
import type { MeaningState } from "@/core/schemas/meaning-state";
import type { OpenAIWorkflowGenerator } from "@/providers/openai-workflow";
import type { ActionPlan } from "@/core/schemas/action-plan";

const mockMeaningState = (): MeaningState => ({
  id: "meaning_1",
  speechEventId: "speech_1",
  intent: { type: "payment_reminder", summary: "Send reminder", confidence: 0.9 },
  entities: [],
  constraints: [],
  temporalRelations: [],
  ambiguities: [],
  evidenceRefs: [],
  confidence: { overall: 0.9, fields: {} },
  contextSufficiency: "sufficient",
  model: { provider: "test", model: "mock", version: "1.0" },
});

const mockPlan = (): ActionPlan => ({
  id: "plan_1",
  meaningStateId: "meaning_1",
  workflowIR: { version: "1.0", nodes: [{ id: "n1", type: "trigger" }], edges: [] },
  steps: [
    { id: "s1", type: "read", capability: "customer.lookup", description: "Look up customer", parameters: {}, requiresApproval: false, dependsOn: [] },
    { id: "s2", type: "draft", capability: "message.draft", description: "Draft message", parameters: {}, requiresApproval: false, dependsOn: [] },
  ],
  sideEffectClass: "draft",
  requiresApproval: false,
  evidenceRefs: [],
  rationaleSummary: "Send payment reminder",
  generatedBy: { agent: "workflow-agent", model: "gpt-4o-mini", version: "1.0.0" },
});

describe("VoiceToWorkflowCompiler", () => {
  it("compiles meaningstate to actionplan without constraints", async () => {
    const generator = {
      generateWorkflow: vi.fn().mockResolvedValue({
        workflowIR: mockPlan().workflowIR,
        steps: mockPlan().steps,
        sideEffectClass: "draft",
        requiresApproval: false,
        rationaleSummary: "Send reminder",
      }),
    } as unknown as OpenAIWorkflowGenerator;

    const compiler = new VoiceToWorkflowCompiler({ generator });
    const plan = await compiler.compile(mockMeaningState());

    expect(plan.steps).toHaveLength(2);
    expect(plan.id).toBeDefined();
  });

  it("constrains plan to mobile mode capabilities", async () => {
    const generator = {
      generateWorkflow: vi.fn().mockResolvedValue({
        workflowIR: mockPlan().workflowIR,
        steps: mockPlan().steps,
        sideEffectClass: "draft",
        requiresApproval: false,
        rationaleSummary: "Send reminder",
      }),
    } as unknown as OpenAIWorkflowGenerator;

    const compiler = new VoiceToWorkflowCompiler({
      generator,
      mobileRoute: {
        agent: "crm",
        priority: "batch",
        riskBaseline: 2,
        requiresApprovalByDefault: true,
        capabilities: ["message.send"],
      },
    });

    const plan = await compiler.compile(mockMeaningState());
    expect(plan.steps.some((s) => s.capability.includes("message"))).toBe(true);
  });

  it("rejects compilation when no capabilities match mobile mode", async () => {
    const generator = {
      generateWorkflow: vi.fn().mockResolvedValue({
        workflowIR: mockPlan().workflowIR,
        steps: [{ id: "s1", type: "read", capability: "invoice.status", description: "Check invoice", parameters: {}, requiresApproval: false, dependsOn: [] }],
        sideEffectClass: "none",
        requiresApproval: false,
        rationaleSummary: "Check invoice",
      }),
    } as unknown as OpenAIWorkflowGenerator;

    const compiler = new VoiceToWorkflowCompiler({
      generator,
      mobileRoute: {
        agent: "receivable",
        priority: "urgent",
        riskBaseline: 3,
        requiresApprovalByDefault: true,
        capabilities: ["payment.record"],
      },
    });

    await expect(compiler.compile(mockMeaningState())).rejects.toThrow(
      /no applicable capabilities/i,
    );
  });
});
