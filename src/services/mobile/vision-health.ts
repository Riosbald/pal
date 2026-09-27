import type { MeaningState } from "@/core/schemas/meaning-state";
export type VisionCapture = { imageReference: string; description?: string; extractedItems: unknown[]; requiresApproval: true };
export function createVisionCapture(meaning: MeaningState, imageReference: string, extractedItems: unknown[] = []): VisionCapture { return { imageReference, description: meaning.intent.summary, extractedItems, requiresApproval: true }; }
export type HealthAnalysis = { metrics: Array<{ name: string; value: string }>; isolated: true; consentRequired: true };
export function isolateHealthAnalysis(meaning: MeaningState): HealthAnalysis { return { metrics: meaning.entities.map((e) => ({ name: e.name, value: e.value })), isolated: true, consentRequired: true }; }
