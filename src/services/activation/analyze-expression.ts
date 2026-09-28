/**
 * analyze_expression — deterministic PAL Activation lookup. No cultural invention.
 */

import {
  AnalyzeExpressionInputSchema,
  type ActivationExpression,
  type AnalyzeExpressionInput,
  type AnalyzeExpressionResult,
  type DemoState,
} from "@/core/schemas/activation";
import {
  indexExpressionsByText,
  loadActivationSeed,
  normalizeExpressionText,
} from "@/services/activation/seed-loader";

export type AnalyzeExpressionDeps = {
  expressions?: ActivationExpression[];
};

export function analyzeExpression(
  input: Partial<AnalyzeExpressionInput> & { expression: string },
  deps: AnalyzeExpressionDeps = {},
): AnalyzeExpressionResult {
  const parsed = AnalyzeExpressionInputSchema.parse(input);
  const expressions = deps.expressions ?? loadActivationSeed().expressions;
  const index = indexExpressionsByText(expressions);
  const matched = index.get(normalizeExpressionText(parsed.expression));

  if (!matched) {
    return insufficient(parsed.expression);
  }

  const lang = parsed.language ?? "auto";
  if (lang !== "auto" && matched.language !== lang) {
    return insufficient(parsed.expression, {
      audit_note: `Text matched but language filter ${lang} ≠ ${matched.language}.`,
    });
  }

  return fromMatch(parsed.expression, matched);
}

function fromMatch(input: string, expr: ActivationExpression): AnalyzeExpressionResult {
  const literal = expr.interpretations.find((i) => i.type === "literal");
  const cultural = expr.interpretations.filter(
    (i) => i.type === "cultural" || i.type === "pragmatic" || i.type === "alternative",
  );
  const hintState = expr.representation_hints?.demo_state_if_unknown;
  const divergence = expr.representation_hints?.literal_cultural_divergence === true;

  let demo_state: DemoState;
  if (hintState === "INSUFFICIENT_KNOWLEDGE" || cultural.length === 0) {
    demo_state = "INSUFFICIENT_KNOWLEDGE";
  } else if (hintState === "UNDERSTOOD" || (!divergence && cultural.length > 0)) {
    demo_state = "UNDERSTOOD";
  } else if (hintState === "POSSIBLE_MEANING_LOSS" || divergence) {
    demo_state = "POSSIBLE_MEANING_LOSS";
  } else {
    demo_state = "UNDERSTOOD";
  }

  const representation_risk =
    demo_state === "INSUFFICIENT_KNOWLEDGE"
      ? "high"
      : demo_state === "POSSIBLE_MEANING_LOSS"
        ? "medium"
        : "low";

  return {
    input_expression: input,
    match: {
      expression_id: expr.id,
      source_text: expr.source_text,
      language: expr.language,
      similarity: "normalized",
    },
    literal_meaning: literal?.content ?? null,
    cultural_interpretations: cultural.map((c) => ({
      content: c.content,
      status: c.status,
      ...(c.notes !== undefined ? { notes: c.notes } : {}),
    })),
    demo_state,
    representation_risk,
    needs_clarification:
      demo_state === "POSSIBLE_MEANING_LOSS" || demo_state === "INSUFFICIENT_KNOWLEDGE",
    alternatives: cultural.map((c) => c.content),
    provenance_refs: [
      {
        source_name: expr.provenance.source_name,
        source_url_or_ref: expr.provenance.source_url_or_ref,
        status: (cultural[0]?.status ??
          literal?.status ??
          "P1_source_derived") as AnalyzeExpressionResult["provenance_refs"][0]["status"],
      },
    ],
    audit_note:
      demo_state === "UNDERSTOOD"
        ? "Literal and cultural candidates align sufficiently for this seed entry."
        : demo_state === "POSSIBLE_MEANING_LOSS"
          ? "Literal reading may not capture the cultural proposition; clarification recommended."
          : "No adequate cultural evidence in activation store; do not invent meaning — ask or abstain.",
  };
}

function insufficient(
  input: string,
  opts?: { audit_note?: string },
): AnalyzeExpressionResult {
  return {
    input_expression: input,
    match: null,
    literal_meaning: null,
    cultural_interpretations: [],
    demo_state: "INSUFFICIENT_KNOWLEDGE",
    representation_risk: "high",
    needs_clarification: true,
    alternatives: [],
    provenance_refs: [],
    audit_note:
      opts?.audit_note ??
      "No matching expression in activation seed; system must not invent cultural meaning.",
  };
}
