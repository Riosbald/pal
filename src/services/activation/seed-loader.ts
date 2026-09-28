import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  ActivationPackageSchema,
  type ActivationExpression,
  type ActivationPackage,
} from "@/core/schemas/activation";

const SEED_V02 = join("data", "activation", "seed", "v0.2_balanced_ng.json");
const SEED_V01 = join("data", "activation", "seed", "v0.1_balanced_ng.json");

/** Prefer v0.2 (full balanced package); fall back to v0.1. */
export function resolveDefaultSeedPath(): string {
  if (existsSync(SEED_V02)) return SEED_V02;
  if (existsSync(SEED_V01)) return SEED_V01;
  return SEED_V02;
}

export function loadActivationSeed(seedPath: string = resolveDefaultSeedPath()): ActivationPackage {
  const raw = readFileSync(seedPath, "utf8");
  return ActivationPackageSchema.parse(JSON.parse(raw) as unknown);
}

export function indexExpressionsByText(
  expressions: ActivationExpression[],
): Map<string, ActivationExpression> {
  const map = new Map<string, ActivationExpression>();
  for (const expr of expressions) {
    map.set(normalizeExpressionText(expr.source_text), expr);
  }
  return map;
}

export function normalizeExpressionText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFC")
    .replace(/[.,!?;:'"\u201c\u201d\u2018\u2019]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
