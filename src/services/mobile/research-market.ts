import type { MeaningState } from "@/core/schemas/meaning-state";
export type ResearchResult = { query: string; sources: Array<{ id: string; excerpt: string; relevance: number }>; answer?: string };
export function buildResearchQuery(meaning: MeaningState): string { return [meaning.intent.summary, ...meaning.entities.map((e) => e.value), ...meaning.constraints.map((c) => c.value)].join(" ").trim(); }
export function createReadOnlyResearchResult(meaning: MeaningState, sources: ResearchResult["sources"] = []): ResearchResult { return { query: buildResearchQuery(meaning), sources }; }
export function speechResponseText(result: ResearchResult): string { return result.answer ?? (result.sources[0]?.excerpt ?? "No verified result was found."); }
export type MarketSignal = { transcript: string; tags: string[]; publicOnly: true; evidenceRefs: MeaningState["evidenceRefs"] };
export function classifyMarketSignal(meaning: MeaningState): MarketSignal { return { transcript: meaning.intent.summary, tags: ["PriceSignal"], publicOnly: true, evidenceRefs: meaning.evidenceRefs }; }
