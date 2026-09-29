/**
 * MVP-1 analyze response — Source of Truth v0.3
 * No fabricated coverage %; action_readiness may audit tool payloads.
 */

import { z } from "zod";

export const EpistemicStateV1Schema = z.enum([
  "UNDERSTOOD",
  "CONTEXT_DEPENDENT",
  "CONTESTED",
  "POSSIBLE_MEANING_LOSS",
  "INSUFFICIENT",
]);

export const SearchAdequacySchema = z.enum(["COMPLETE", "INCOMPLETE", "NOT_RUN"]);

export const CoverageAuditSchema = z.object({
  search_routes_attempted: z.array(z.string()),
  search_routes_skipped: z.array(z.string()).default([]),
  novel_candidates_found: z.number().int().nonnegative(),
  unresolved_residuals: z.number().int().nonnegative(),
  ontology_challenges: z.number().int().nonnegative(),
  search_adequacy: SearchAdequacySchema,
});

export const RepresentationGapChallengeSchema = z.object({
  primary_frame: z.string(),
  alternative_frames: z.array(z.string()).default([]),
  source_native_signals: z.array(z.string()).default([]),
  counterexamples_found: z.array(z.string()).default([]),
});

export const InterpretationV1Schema = z.object({
  frame: z.string(),
  meaning: z.string(),
  evidence_status: z.string(),
  plausibility: z.enum(["HIGH", "MEDIUM", "LOW", "UNKNOWN"]),
});

export const ToolPayloadAuditSchema = z.object({
  target_tool: z.string().optional(),
  parameter_risk: z.enum(["NONE", "LOW", "MEDIUM", "HIGH"]).default("NONE"),
  risk_detail: z.string().optional(),
});

export const ActionReadinessSchema = z.object({
  authorized: z.boolean(),
  blocking_reason: z.string().optional(),
  tool_payload_audit: ToolPayloadAuditSchema.optional(),
});

export const ClarificationProtocolSchema = z.object({
  should_ask: z.boolean(),
  target_variable: z.string().optional(),
  question: z.string().optional(),
  expected_value_of_information: z.enum(["HIGH", "MEDIUM", "LOW", "NONE"]).default("NONE"),
});

export const AnalyzeV1RequestSchema = z.object({
  expression: z.string().trim().min(1).max(2000),
  language: z.enum(["pcm", "yor", "ibo", "hau", "en", "auto"]).optional().default("auto"),
  context: z.string().trim().max(2000).optional(),
  conversation_id: z.string().trim().min(1).optional(),
  intended_action: z
    .object({
      target_tool: z.string().optional(),
      draft_parameters: z.record(z.string(), z.unknown()).optional(),
    })
    .optional(),
});

export const AnalyzeV1ResponseSchema = z.object({
  request_id: z.string(),
  timestamp: z.string(),
  epistemic_state: EpistemicStateV1Schema,
  /** Confidence in best-supported interpretation only — not completeness */
  answer_confidence: z.number().min(0).max(1).optional(),
  coverage_audit: CoverageAuditSchema,
  representation_gap_challenge: RepresentationGapChallengeSchema,
  interpretations: z.array(InterpretationV1Schema),
  action_readiness: ActionReadinessSchema,
  clarification_protocol: ClarificationProtocolSchema,
  /** Legacy demo bridge */
  match_expression_id: z.string().nullable().optional(),
});

export type AnalyzeV1Request = z.infer<typeof AnalyzeV1RequestSchema>;
export type AnalyzeV1Response = z.infer<typeof AnalyzeV1ResponseSchema>;
export type EpistemicStateV1 = z.infer<typeof EpistemicStateV1Schema>;
