import { describe, expect, it } from "vitest";
import { extractResearchQuery, retrieveRAGResults } from "@/services/mobile/research-rag-reader";
import type { MeaningState } from "@/core/schemas/meaning-state";

const mockResearch = (): MeaningState => ({
  id: "research_1",
  speechEventId: "speech_1",
  intent: { type: "other", summary: "Search for market trends in East Africa", confidence: 0.92 },
  entities: [
    { name: "region", value: "East Africa", type: "location", confidence: 0.98 },
    { name: "industry", value: "fintech", type: "other", confidence: 0.85 },
  ],
  constraints: [],
  temporalRelations: [],
  ambiguities: [],
  evidenceRefs: [],
  confidence: { overall: 0.9, fields: {} },
  contextSufficiency: "sufficient",
  model: { provider: "sahara", model: "semantic", version: "1.0" },
});

describe("Research RAG Reader", () => {
  it("extracts search query from research intent", () => {
    const query = extractResearchQuery(mockResearch());
    expect(query.searchTerms).toContain("East Africa");
    expect(query.confidence).toBeGreaterThan(0.8);
  });

  it("retrieves RAG results without approval gate", () => {
    const query = extractResearchQuery(mockResearch());
    const results = retrieveRAGResults(query);
    expect(results.sources).toBeDefined();
    expect(results.summary).toBeDefined();
    expect(results.confidence).toBeLessThanOrEqual(1);
  });

  it("never requires approval for read-only research", () => {
    const query = extractResearchQuery(mockResearch());
    const results = retrieveRAGResults(query);
    expect(results).not.toHaveProperty("requiresApproval");
  });
});
