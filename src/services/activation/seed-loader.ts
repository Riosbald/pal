import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ActivationPackageSchema,
  type ActivationExpression,
  type ActivationPackage,
} from "@/core/schemas/activation";

const DEFAULT_SEED = join("data", "activation", "seed", "v0.1_balanced_ng.json");

export function loadActivationSeed(seedPath: string = DEFAULT_SEED): ActivationPackage {
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
