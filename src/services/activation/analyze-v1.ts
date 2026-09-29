/**
 * Map seed analyze → v0.3 AnalyzeV1Response.
 * Deterministic; does not invent cultural meaning.
 */

import { randomUUID } from "node:crypto";
import type {
  AnalyzeV1Request,
  AnalyzeV1Response,
  EpistemicStateV1,
} from "@/core/schemas/analyze-v1";
import { analyzeExpression } from "./analyze-expression";

function mapDemoToEpistemic(
  demo: "UNDERSTOOD" | "POSSIBLE_MEANING_LOSS" | "INSUFFICIENT_KNOWLEDGE",
  intendedAction?: AnalyzeV1Request["intended_action"],
): EpistemicStateV1 {
  if (demo === "UNDERSTOOD") {
    if (intendedAction?.target_tool && !hasSpecifiedParams(intendedAction)) {
      return "CONTEXT_DEPENDENT";
    }
    return "UNDERSTOOD";
  }
  if (demo === "POSSIBLE_MEANING_LOSS") return "POSSIBLE_MEANING_LOSS";
  return "INSUFFICIENT";
}

function hasSpecifiedParams(
  action: NonNullable<AnalyzeV1Request["intended_action"]>,
): boolean {
  const p = action.draft_parameters;
  if (!p) return false;
  return Object.keys(p).length > 0;
}

export function analyzeV1(input: AnalyzeV1Request): AnalyzeV1Response {
  const analysis = analyzeExpression({
    expression: input.expression,
    language: input.language ?? "auto",
    context: input.context,
    conversation_id: input.conversation_id,
  });

  const epistemic_state = mapDemoToEpistemic(
    analysis.demo_state,
    input.intended_action,
  );

  const interpretations = [
    ...(analysis.literal_meaning
      ? [
          {
            frame: "literal",
            meaning: analysis.literal_meaning,
            evidence_status: analysis.match ? "SOURCE_DERIVED" : "LEXICAL_MATCH",
            plausibility:
              analysis.demo_state === "UNDERSTOOD"
                ? ("HIGH" as const)
                : ("MEDIUM" as const),
          },
        ]
      : []),
    ...analysis.cultural_interpretations.map((c) => ({
      frame: "cultural_or_pragmatic",
      meaning: c,
      evidence_status: "SOURCE_DERIVED",
      plausibility: "HIGH" as const,
    })),
    ...analysis.alternatives.map((a) => ({
      frame: "alternative",
      meaning: a,
      evidence_status: "MODEL_HYPOTHESIS",
      plausibility: "LOW" as const,
    })),
  ];

  const routesAttempted = [
    "lexical_translation",
    "seed_activation_lookup",
    ...(analysis.match ? ["cultural_proverb_scan"] : []),
    "alternative_frame_generation",
  ];

  const authorized =
    epistemic_state === "UNDERSTOOD" &&
    (!input.intended_action?.target_tool ||
      hasSpecifiedParams(input.intended_action));

  const paramRisk =
    input.intended_action?.target_tool && !hasSpecifiedParams(input.intended_action)
      ? ("HIGH" as const)
      : epistemic_state === "POSSIBLE_MEANING_LOSS" ||
          epistemic_state === "INSUFFICIENT"
        ? ("HIGH" as const)
        : ("NONE" as const);

  const shouldAsk =
    epistemic_state === "POSSIBLE_MEANING_LOSS" ||
    epistemic_state === "INSUFFICIENT" ||
    epistemic_state === "CONTEXT_DEPENDENT" ||
    epistemic_state === "CONTESTED";

  return {
    request_id: randomUUID(),
    timestamp: new Date().toISOString(),
    epistemic_state,
    answer_confidence:
      epistemic_state === "UNDERSTOOD"
        ? 0.85
        : epistemic_state === "POSSIBLE_MEANING_LOSS"
          ? 0.55
          : 0.25,
    coverage_audit: {
      search_routes_attempted: routesAttempted,
      search_routes_skipped: ["human_challenge", "counterexample_corpus"],
      novel_candidates_found: analysis.cultural_interpretations.length,
      unresolved_residuals:
        epistemic_state === "UNDERSTOOD" ? 0 : analysis.match ? 1 : 1,
      ontology_challenges: 0,
      search_adequacy: analysis.match ? "INCOMPLETE" : "INCOMPLETE",
    },
    representation_gap_challenge: {
      primary_frame: analysis.literal_meaning
        ? `Literal: ${analysis.literal_meaning}`
        : `Surface: ${input.expression}`,
      alternative_frames: [
        ...analysis.cultural_interpretations.map((c) => `Cultural/pragmatic: ${c}`),
        ...analysis.alternatives,
      ],
      source_native_signals: analysis.match
        ? [`Seed match: ${analysis.match.expression_id}`]
        : [],
      counterexamples_found: [],
    },
    interpretations,
    action_readiness: {
      authorized,
      ...(authorized
        ? {}
        : {
            blocking_reason:
              epistemic_state !== "UNDERSTOOD"
                ? `Semantic sufficiency not met (${epistemic_state}).`
                : "Intended action parameters incomplete.",
          }),
      ...(input.intended_action?.target_tool
        ? {
            tool_payload_audit: {
              target_tool: input.intended_action.target_tool,
              parameter_risk: paramRisk,
              ...(paramRisk === "HIGH"
                ? {
                    risk_detail:
                      "Unsafe to bind tool parameters under current epistemic state or missing fields.",
                  }
                : {}),
            },
          }
        : {}),
    },
    clarification_protocol: {
      should_ask: shouldAsk,
      expected_value_of_information: shouldAsk ? ("HIGH" as const) : ("NONE" as const),
      ...(shouldAsk
        ? {
            target_variable: "speaker_intent",
            question:
              analysis.demo_state === "POSSIBLE_MEANING_LOSS"
                ? "Are you speaking literally, or making a broader point about how things work?"
                : "What exactly should happen, and who or what does it apply to?",
          }
        : {}),
    },
    match_expression_id: analysis.match?.expression_id ?? null,
  };
}
