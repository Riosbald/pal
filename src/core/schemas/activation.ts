/**
 * PAL Activation schemas — representation-gap analysis for MÍMO.
 * Interpretations are candidates with provenance — never ground truth without P2/P3.
 */

import { z } from "zod";

export const InterpretationStatusSchema = z.enum([
  "P0_model_hypothesis",
  "P1_source_derived",
  "P2_human_reviewed",
  "P3_community_validated",
  "contested",
  "restricted",
]);

export const DemoStateSchema = z.enum([
  "UNDERSTOOD",
  "POSSIBLE_MEANING_LOSS",
  "INSUFFICIENT_KNOWLEDGE",
]);

export const InterpretationCandidateSchema = z.object({
  type: z.enum(["literal", "cultural", "pragmatic", "alternative"]),
  content: z.string().trim().min(1),
  status: InterpretationStatusSchema,
  notes: z.string().optional(),
});

export const ActivationExpressionSchema = z.object({
  id: z.string().trim().min(1),
  source_text: z.string().trim().min(1),
  language: z.enum(["pcm", "yor", "ibo", "hau", "en"]),
  register: z.enum(["proverbial", "idiomatic", "conversational", "formal", "mixed"]),
  script_notes: z.string().optional(),
  interpretations: z.array(InterpretationCandidateSchema).min(1),
  representation_hints: z
    .object({
      literal_cultural_divergence: z.boolean().optional(),
      likely_gap_if_literal_only: z.boolean().optional(),
      demo_state_if_unknown: DemoStateSchema.optional(),
    })
    .optional(),
  provenance: z.object({
    source_name: z.string().min(1),
    source_url_or_ref: z.string().min(1),
    license_note: z.string().min(1),
    curated_at: z.string().min(1),
    curator_note: z.string().optional(),
  }),
  status: z.enum(["seed", "evaluation", "restricted"]),
  tags: z.array(z.string()).default([]),
});

export const ActivationPackageSchema = z.object({
  package_id: z.string().min(1),
  version: z.string().min(1),
  description: z.string().optional(),
  languages: z.array(z.string()).default([]),
  curated_at: z.string().optional(),
  invariants: z.array(z.string()).default([]),
  expressions: z.array(ActivationExpressionSchema).min(1),
});

export const AnalyzeExpressionInputSchema = z.object({
  expression: z.string().trim().min(1).max(2000),
  language: z.enum(["pcm", "yor", "ibo", "hau", "en", "auto"]).optional().default("auto"),
  context: z.string().trim().max(2000).optional(),
  conversation_id: z.string().trim().min(1).optional(),
});

export const AnalyzeExpressionResultSchema = z.object({
  input_expression: z.string(),
  match: z
    .object({
      expression_id: z.string(),
      source_text: z.string(),
      language: z.string(),
      similarity: z.enum(["exact", "normalized", "none"]),
    })
    .nullable(),
  literal_meaning: z.string().nullable(),
  cultural_interpretations: z.array(
    z.object({
      content: z.string(),
      status: InterpretationStatusSchema,
      notes: z.string().optional(),
    }),
  ),
  demo_state: DemoStateSchema,
  representation_risk: z.enum(["low", "medium", "high"]),
  needs_clarification: z.boolean(),
  alternatives: z.array(z.string()).default([]),
  provenance_refs: z.array(
    z.object({
      source_name: z.string(),
      source_url_or_ref: z.string(),
      status: InterpretationStatusSchema,
    }),
  ),
  audit_note: z.string(),
});

export const ActivationEvidenceLogSchema = z.object({
  id: z.string(),
  conversation_id: z.string().optional(),
  input_expression: z.string(),
  demo_state: DemoStateSchema,
  representation_risk: z.enum(["low", "medium", "high"]),
  match_expression_id: z.string().nullable(),
  decision: z.enum(["ANSWER", "CLARIFY", "ALTERNATIVES", "ABSTAIN", "ACTION_DRAFT"]),
  stt_provider: z.string().optional(),
  created_at: z.string().datetime(),
  analysis: AnalyzeExpressionResultSchema,
});

export type InterpretationStatus = z.infer<typeof InterpretationStatusSchema>;
export type DemoState = z.infer<typeof DemoStateSchema>;
export type ActivationExpression = z.infer<typeof ActivationExpressionSchema>;
export type ActivationPackage = z.infer<typeof ActivationPackageSchema>;
export type AnalyzeExpressionInput = z.infer<typeof AnalyzeExpressionInputSchema>;
export type AnalyzeExpressionResult = z.infer<typeof AnalyzeExpressionResultSchema>;
export type ActivationEvidenceLog = z.infer<typeof ActivationEvidenceLogSchema>;
