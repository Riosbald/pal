/**
 * Health Data Isolation — Privacy-preserving health metric analysis
 * 
 * Implements PAL_ARCHITECTURE.md §25 + GDPR/privacy compliance:
 * - No external transmission without explicit user approval
 * - Metrics analyzed locally when possible
 * - Never shared with policy/workflow/execution layers
 * - User retains full control over data
 */

import type { MeaningState } from "@/core/schemas/meaning-state";

export interface HealthMetric {
  name: string;
  value: number | string;
  unit: string;
  timestamp: string;
  sensitivity: "public" | "personal" | "confidential";
}

export interface HealthAnalysis {
  metrics: HealthMetric[];
  insights: string[];
  warnings: string[];
  shareableInsights: string[]; // Only these can leave the device
  requiresUserConsent: boolean;
}

/**
 * Extract health-related metrics from voice transcript.
 * Never automatically shares; all data marked for user review.
 */
export function analyzeHealthIntent(meaningState: MeaningState): HealthAnalysis {
  const healthKeywords = ["sleep", "exercise", "steps", "heart", "glucose", "blood pressure", "stress", "mood"];
  const isHealthRelated = meaningState.intent.summary
    .toLowerCase()
    .split(/\s+/)
    .some((word) => healthKeywords.includes(word));

  const metrics: HealthMetric[] = [];
  const insights: string[] = [];
  const warnings: string[] = [];
  const shareableInsights: string[] = [];

  if (isHealthRelated) {
    // Extract numeric entities as potential health metrics
    for (const entity of meaningState.entities) {
      if (entity.type === "other" || entity.type === "money") {
        // MVP: Classify as health metric
        metrics.push({
          name: entity.name,
          value: entity.value,
          unit: "unknown",
          timestamp: new Date().toISOString(),
          sensitivity: "personal",
        });
      }
    }

    insights.push(`Detected health intent: ${meaningState.intent.summary}`);
    warnings.push("All health data is confidential. Review before sharing.");
    shareableInsights.push("(User must approve before sharing any health data)");
  }

  return {
    metrics,
    insights,
    warnings,
    shareableInsights,
    requiresUserConsent: metrics.length > 0,
  };
}

/**
 * Ensure health data never leaves the approval boundary without user consent.
 * Returns analysis but blocks propagation to workflow/policy layers.
 */
export function quarantineHealthData(
  analysis: HealthAnalysis,
): { approved: boolean; reason: string } {
  if (analysis.requiresUserConsent && analysis.metrics.length > 0) {
    return {
      approved: false,
      reason: "Health data requires explicit user consent before processing beyond this point.",
    };
  }

  return { approved: true, reason: "No sensitive health data detected." };
}
