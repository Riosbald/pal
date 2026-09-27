/**
 * Research RAG Reader — Semantic search over knowledge base (passive, read-only)
 * 
 * Implements PAL_ARCHITECTURE.md §25: No side effects, highest trust threshold.
 * Pure read operations; never executes, never approves.
 */

import type { MeaningState } from "@/core/schemas/meaning-state";

export interface ResearchQuery {
  searchTerms: string[];
  intent: string;
  confidence: number;
}

export interface RAGResult {
  sources: Array<{ id: string; title: string; relevance: number; excerpt?: string }>;
  summary: string;
  confidence: number;
}

/**
 * Extract research query from voice intent. No external calls; returns structured query only.
 */
export function extractResearchQuery(meaningState: MeaningState): ResearchQuery {
  const searchTerms = [
    meaningState.intent.summary,
    ...meaningState.entities.map((e) => e.value),
    ...meaningState.constraints.map((c) => c.value),
  ].filter((term) => term && term.length > 0);

  return {
    searchTerms,
    intent: meaningState.intent.summary,
    confidence: meaningState.confidence.overall,
  };
}

/**
 * Simulate RAG retrieval (production: connect to vector DB).
 * Returns research result without approval gate or execution authority.
 */
export function retrieveRAGResults(query: ResearchQuery): RAGResult {
  // MVP: Return mock results. In production, query vector DB here.
  return {
    sources: [
      {
        id: "doc_1",
        title: "Knowledge Base Article",
        relevance: query.confidence,
        excerpt: `Results for: ${query.searchTerms.join(", ")}`,
      },
    ],
    summary: `Found ${1} results matching: ${query.intent}`,
    confidence: Math.min(query.confidence, 0.95),
  };
}
