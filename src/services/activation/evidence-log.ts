import { createId } from "@/lib/utils/ids";
import {
  ActivationEvidenceLogSchema,
  type ActivationEvidenceLog,
  type AnalyzeExpressionResult,
  type DemoState,
} from "@/core/schemas/activation";

export type EvidenceLogStore = {
  append: (entry: ActivationEvidenceLog) => void;
  list: (conversationId?: string) => ActivationEvidenceLog[];
};

function decisionFromState(state: DemoState): ActivationEvidenceLog["decision"] {
  switch (state) {
    case "UNDERSTOOD":
      return "ANSWER";
    case "POSSIBLE_MEANING_LOSS":
      return "CLARIFY";
    case "INSUFFICIENT_KNOWLEDGE":
      return "ABSTAIN";
    default:
      return "ABSTAIN";
  }
}

export function createEvidenceLogEntry(input: {
  analysis: AnalyzeExpressionResult;
  conversation_id?: string;
  stt_provider?: string;
  decision?: ActivationEvidenceLog["decision"];
}): ActivationEvidenceLog {
  const decision = input.decision ?? decisionFromState(input.analysis.demo_state);
  return ActivationEvidenceLogSchema.parse({
    id: createId("trace"),
    ...(input.conversation_id !== undefined ? { conversation_id: input.conversation_id } : {}),
    input_expression: input.analysis.input_expression,
    demo_state: input.analysis.demo_state,
    representation_risk: input.analysis.representation_risk,
    match_expression_id: input.analysis.match?.expression_id ?? null,
    decision,
    ...(input.stt_provider !== undefined ? { stt_provider: input.stt_provider } : {}),
    created_at: new Date().toISOString(),
    analysis: input.analysis,
  });
}

export function createInMemoryEvidenceLogStore(): EvidenceLogStore {
  const rows: ActivationEvidenceLog[] = [];
  return {
    append(entry) {
      rows.push(entry);
    },
    list(conversationId) {
      if (!conversationId) return [...rows];
      return rows.filter((r) => r.conversation_id === conversationId);
    },
  };
}
