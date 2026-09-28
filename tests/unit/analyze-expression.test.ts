import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ActivationPackageSchema,
  type ActivationExpression,
} from "@/core/schemas/activation";
import {
  analyzeExpression,
  createEvidenceLogEntry,
  createInMemoryEvidenceLogStore,
  handleActivationToolCall,
  loadActivationSeed,
  saveCorrection,
} from "@/services/activation";
import { getMimoActivationFunctionTools } from "@/providers/assemblyai-tools";

function loadSeedExpressions(): ActivationExpression[] {
  const path = join(process.cwd(), "data/activation/seed/v0.1_balanced_ng.json");
  return ActivationPackageSchema.parse(JSON.parse(readFileSync(path, "utf8")) as unknown)
    .expressions;
}

describe("activation seed", () => {
  it("loads four languages", () => {
    const pkg = loadActivationSeed();
    const langs = new Set(pkg.expressions.map((e) => e.language));
    expect(langs.has("pcm")).toBe(true);
    expect(langs.has("yor")).toBe(true);
    expect(langs.has("ibo")).toBe(true);
    expect(langs.has("hau")).toBe(true);
  });
});

describe("analyzeExpression", () => {
  const expressions = loadSeedExpressions();

  it("Yoruba gap → POSSIBLE_MEANING_LOSS", () => {
    const r = analyzeExpression(
      { expression: "A kì í fi ẹyẹlé sọ ilé." },
      { expressions },
    );
    expect(r.demo_state).toBe("POSSIBLE_MEANING_LOSS");
  });

  it("unknown → INSUFFICIENT", () => {
    const r = analyzeExpression(
      { expression: "unknown purple goat proverb" },
      { expressions },
    );
    expect(r.demo_state).toBe("INSUFFICIENT_KNOWLEDGE");
    expect(r.cultural_interpretations).toHaveLength(0);
  });

  it("aligned PCM → UNDERSTOOD", () => {
    const r = analyzeExpression(
      { expression: "Small wahala fit give you big stress." },
      { expressions },
    );
    expect(r.demo_state).toBe("UNDERSTOOD");
  });
});

describe("handleActivationToolCall", () => {
  it("dispatches analyze_expression", () => {
    const out = handleActivationToolCall({
      name: "analyze_expression",
      arguments: { expression: "A kì í fi ẹyẹlé sọ ilé." },
      call_id: "call_1",
    });
    expect(out.ok).toBe(true);
    expect(out.result["demo_state"]).toBe("POSSIBLE_MEANING_LOSS");
    expect(out.result["speak_guidance"]).toBeTruthy();
    expect(out.call_id).toBe("call_1");
  });

  it("dispatches save_correction", () => {
    const out = handleActivationToolCall({
      name: "save_correction",
      arguments: {
        expression: "A kì í fi ẹyẹlé sọ ilé.",
        corrected_meaning: "Do not trust unreliable people with security.",
      },
    });
    expect(out.ok).toBe(true);
    expect(out.result["epistemic_status"]).toBe("session_accepted");
  });

  it("rejects unknown tools", () => {
    const out = handleActivationToolCall({
      name: "delete_everything",
      arguments: {},
    });
    expect(out.ok).toBe(false);
  });
});

describe("evidence log", () => {
  it("maps POSSIBLE_MEANING_LOSS to CLARIFY", () => {
    const analysis = analyzeExpression({
      expression: "A kì í fi ẹyẹlé sọ ilé.",
    });
    const entry = createEvidenceLogEntry({ analysis, stt_provider: "assemblyai" });
    expect(entry.decision).toBe("CLARIFY");
    const store = createInMemoryEvidenceLogStore();
    store.append(entry);
    expect(store.list()).toHaveLength(1);
  });
});

describe("AssemblyAI tool defs", () => {
  it("exports analyze_expression and save_correction", () => {
    const tools = getMimoActivationFunctionTools();
    const names = tools.map((t) => t.name);
    expect(names).toContain("analyze_expression");
    expect(names).toContain("save_correction");
  });
});

describe("saveCorrection", () => {
  it("stays session_accepted", () => {
    const c = saveCorrection({
      expression: "x",
      corrected_meaning: "y",
    });
    expect(c.epistemic_status).toBe("session_accepted");
  });
});
