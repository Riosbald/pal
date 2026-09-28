export {
  loadActivationSeed,
  indexExpressionsByText,
  normalizeExpressionText,
} from "@/services/activation/seed-loader";
export { analyzeExpression } from "@/services/activation/analyze-expression";
export type { AnalyzeExpressionDeps } from "@/services/activation/analyze-expression";
export { saveCorrection } from "@/services/activation/save-correction";
export type {
  SaveCorrectionInput,
  KnowledgeContribution,
} from "@/services/activation/save-correction";
export {
  createEvidenceLogEntry,
  createInMemoryEvidenceLogStore,
} from "@/services/activation/evidence-log";
export type { EvidenceLogStore } from "@/services/activation/evidence-log";
export { handleActivationToolCall } from "@/services/activation/tool-handler";
export type { ToolCall, ToolHandlerResult } from "@/services/activation/tool-handler";
