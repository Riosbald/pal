import { z } from "zod";
import { createId } from "@/lib/utils/ids";

export const SaveCorrectionInputSchema = z.object({
  expression: z.string().trim().min(1).max(2000),
  corrected_meaning: z.string().trim().min(1).max(2000),
  context: z.string().trim().max(2000).optional(),
  source: z.enum(["user", "validator", "session"]).default("user"),
  conversation_id: z.string().trim().min(1).optional(),
  language: z.enum(["pcm", "yor", "ibo", "hau", "en", "auto"]).optional(),
});

export const KnowledgeContributionSchema = z.object({
  id: z.string(),
  expression: z.string(),
  corrected_meaning: z.string(),
  context: z.string().optional(),
  source: z.enum(["user", "validator", "session"]),
  conversation_id: z.string().optional(),
  language: z.string().optional(),
  epistemic_status: z.literal("session_accepted"),
  created_at: z.string().datetime(),
  note: z.string(),
});

export type SaveCorrectionInput = z.infer<typeof SaveCorrectionInputSchema>;
export type KnowledgeContribution = z.infer<typeof KnowledgeContributionSchema>;

export function saveCorrection(input: SaveCorrectionInput): KnowledgeContribution {
  const parsed = SaveCorrectionInputSchema.parse(input);
  return KnowledgeContributionSchema.parse({
    id: createId("proposal"),
    expression: parsed.expression,
    corrected_meaning: parsed.corrected_meaning,
    ...(parsed.context !== undefined ? { context: parsed.context } : {}),
    source: parsed.source,
    ...(parsed.conversation_id !== undefined ? { conversation_id: parsed.conversation_id } : {}),
    ...(parsed.language !== undefined ? { language: parsed.language } : {}),
    epistemic_status: "session_accepted",
    created_at: new Date().toISOString(),
    note: "Session-scoped acceptance only. Not promoted to P3 community-validated knowledge.",
  });
}
