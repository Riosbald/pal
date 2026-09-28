"use client";

import { useCallback, useMemo, useState } from "react";
import { ThinkingOrb } from "thinking-orbs";

type DemoState = "UNDERSTOOD" | "POSSIBLE_MEANING_LOSS" | "INSUFFICIENT_KNOWLEDGE";

type AnalysisPayload = {
  ok?: boolean;
  demo_state?: DemoState;
  representation_risk?: "low" | "medium" | "high";
  needs_clarification?: boolean;
  literal_meaning?: string | null;
  cultural_interpretations?: Array<{ content: string; status: string }>;
  alternatives?: string[];
  audit_note?: string;
  decision?: string;
  evidence_id?: string;
  match_expression_id?: string | null;
  speak_guidance?: string;
  error?: string;
};

type OrbState =
  | "listening"
  | "searching"
  | "solving"
  | "working"
  | "weaving"
  | "shaping"
  | "breathing"
  | "composing";

const PRESETS = [
  {
    label: "Yoruba · pigeon / house",
    expression: "A kì í fi ẹyẹlé sọ ilé.",
    language: "yor" as const,
  },
  {
    label: "PCM · hustle",
    expression: "No be who hustle pass na him go get money.",
    language: "pcm" as const,
  },
  {
    label: "PCM · wahala (aligned)",
    expression: "Small wahala fit give you big stress.",
    language: "pcm" as const,
  },
  {
    label: "Yoruba · pot / pepper",
    expression: "Ìkòkò tí yóò jẹ ata, ìdí rẹ̀ á gbóná.",
    language: "yor" as const,
  },
  {
    label: "Hausa · elephant trunk",
    expression: "Giwa ba ta da cizo, hannun nan a ke tsoro.",
    language: "hau" as const,
  },
  {
    label: "Gap fixture · unknown cultural",
    expression: "Water wey pass gari, e don pass gari.",
    language: "pcm" as const,
  },
  {
    label: "Unknown (no seed)",
    expression: "Completely unknown purple goat proverb.",
    language: "auto" as const,
  },
];

function stateStyles(state: DemoState | null): {
  badge: string;
  border: string;
  title: string;
} {
  switch (state) {
    case "UNDERSTOOD":
      return {
        badge: "bg-emerald-500/20 text-emerald-300 ring-emerald-500/40",
        border: "border-emerald-500/30",
        title: "Understood",
      };
    case "POSSIBLE_MEANING_LOSS":
      return {
        badge: "bg-amber-500/20 text-amber-200 ring-amber-500/40",
        border: "border-amber-500/30",
        title: "Possible meaning loss",
      };
    case "INSUFFICIENT_KNOWLEDGE":
      return {
        badge: "bg-rose-500/20 text-rose-200 ring-rose-500/40",
        border: "border-rose-500/30",
        title: "Insufficient knowledge",
      };
    default:
      return {
        badge: "bg-neutral-700/40 text-neutral-300 ring-neutral-600/40",
        border: "border-neutral-700",
        title: "Idle",
      };
  }
}

function orbFor(
  phase: "idle" | "analyzing" | "done",
  demo: DemoState | null,
): OrbState {
  if (phase === "analyzing") return "searching";
  if (phase === "idle") return "listening";
  if (demo === "UNDERSTOOD") return "breathing";
  if (demo === "POSSIBLE_MEANING_LOSS") return "weaving";
  if (demo === "INSUFFICIENT_KNOWLEDGE") return "shaping";
  return "listening";
}

export function ActivationDemo() {
  const [expression, setExpression] = useState(PRESETS[0]!.expression);
  const [language, setLanguage] = useState<string>("auto");
  const [phase, setPhase] = useState<"idle" | "analyzing" | "done">("idle");
  const [result, setResult] = useState<AnalysisPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [correction, setCorrection] = useState("");
  const [correctionNote, setCorrectionNote] = useState<string | null>(null);

  const demoState = result?.demo_state ?? null;
  const styles = useMemo(() => stateStyles(demoState), [demoState]);
  const orbState = orbFor(phase, demoState);

  const runAnalyze = useCallback(async () => {
    setError(null);
    setCorrectionNote(null);
    setPhase("analyzing");
    setResult(null);
    try {
      const res = await fetch("/api/activation/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expression,
          language: language === "auto" ? "auto" : language,
        }),
      });
      const data = (await res.json()) as AnalysisPayload;
      if (!res.ok || data.ok === false) {
        throw new Error(data.error ?? "Analysis failed");
      }
      setResult(data);
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
      setPhase("idle");
    }
  }, [expression, language]);

  const runCorrection = useCallback(async () => {
    if (!correction.trim()) return;
    setCorrectionNote(null);
    try {
      const res = await fetch("/api/activation/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "save_correction",
          arguments: {
            expression,
            corrected_meaning: correction.trim(),
          },
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        result?: { epistemic_status?: string; note?: string; contribution_id?: string };
        error?: string;
      };
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Correction failed");
      }
      setCorrectionNote(
        `Saved as ${data.result?.epistemic_status ?? "session_accepted"} (${data.result?.contribution_id ?? "ok"}). Not P3 truth.`,
      );
      setCorrection("");
    } catch (e) {
      setCorrectionNote(e instanceof Error ? e.message : "Correction failed");
    }
  }, [correction, expression]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
            MÍMO · Activation demo
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-50">
            Representation gap, not just translation
          </h1>
          <p className="mt-2 max-w-xl text-sm text-neutral-400">
            Three states only: understood, possible meaning loss, or insufficient
            knowledge. The system must not invent culture.
          </p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <ThinkingOrb state={orbState} size={64} theme="dark" />
          <span className="text-xs text-neutral-500">{orbState}</span>
        </div>
      </header>

      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-xl shadow-black/20">
        <label className="text-xs font-medium text-neutral-400">Expression</label>
        <textarea
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          rows={3}
          className="mt-2 w-full resize-y rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none ring-0 focus:border-neutral-500"
          placeholder="Paste a proverb or local phrase…"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                setExpression(p.expression);
                setLanguage(p.language);
                setResult(null);
                setPhase("idle");
                setError(null);
              }}
              className="rounded-full border border-neutral-700 bg-neutral-950 px-3 py-1 text-xs text-neutral-300 transition hover:border-neutral-500 hover:text-neutral-100"
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="rounded-lg border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-xs text-neutral-200"
          >
            <option value="auto">language: auto</option>
            <option value="pcm">pcm</option>
            <option value="yor">yor</option>
            <option value="ibo">ibo</option>
            <option value="hau">hau</option>
            <option value="en">en</option>
          </select>
          <button
            type="button"
            onClick={() => void runAnalyze()}
            disabled={phase === "analyzing" || !expression.trim()}
            className="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 transition hover:bg-white disabled:opacity-40"
          >
            {phase === "analyzing" ? "Analysing…" : "Analyze expression"}
          </button>
        </div>
        {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
      </section>

      <section className={`rounded-2xl border bg-neutral-900/40 p-5 ${styles.border}`}>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ${styles.badge}`}
          >
            {styles.title}
          </span>
          {result?.decision ? (
            <span className="text-xs text-neutral-500">decision · {result.decision}</span>
          ) : null}
          {result?.representation_risk ? (
            <span className="text-xs text-neutral-500">risk · {result.representation_risk}</span>
          ) : null}
        </div>

        {!result && phase !== "analyzing" ? (
          <p className="mt-4 text-sm text-neutral-500">
            Run an analysis to see UNDERSTOOD / POSSIBLE_MEANING_LOSS /
            INSUFFICIENT_KNOWLEDGE.
          </p>
        ) : null}

        {phase === "analyzing" ? (
          <div className="mt-6 flex items-center gap-3 text-sm text-neutral-400">
            <ThinkingOrb state="searching" size={20} theme="dark" />
            Looking up activation seed — no cultural invention…
          </div>
        ) : null}

        {result ? (
          <div className="mt-5 space-y-4 text-sm">
            {result.literal_meaning ? (
              <div>
                <p className="text-xs uppercase tracking-wide text-neutral-500">Literal</p>
                <p className="mt-1 text-neutral-200">{result.literal_meaning}</p>
              </div>
            ) : null}
            {result.cultural_interpretations && result.cultural_interpretations.length > 0 ? (
              <div>
                <p className="text-xs uppercase tracking-wide text-neutral-500">
                  Cultural candidates (P1)
                </p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-neutral-200">
                  {result.cultural_interpretations.map((c) => (
                    <li key={c.content}>
                      {c.content}{" "}
                      <span className="text-neutral-500">({c.status})</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-neutral-400">No cultural candidate in seed — abstain and ask.</p>
            )}
            {result.audit_note ? (
              <p className="rounded-lg border border-neutral-800 bg-neutral-950/80 px-3 py-2 text-neutral-400">
                {result.audit_note}
              </p>
            ) : null}
            {result.speak_guidance ? (
              <p className="text-xs text-neutral-500">Speak guidance: {result.speak_guidance}</p>
            ) : null}
            {result.evidence_id ? (
              <p className="font-mono text-[11px] text-neutral-600">
                evidence {result.evidence_id}
                {result.match_expression_id ? ` · match ${result.match_expression_id}` : ""}
              </p>
            ) : null}
          </div>
        ) : null}
      </section>

      {(demoState === "POSSIBLE_MEANING_LOSS" || demoState === "INSUFFICIENT_KNOWLEDGE") && (
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
          <h2 className="text-sm font-medium text-neutral-200">Teach MÍMO (session only)</h2>
          <p className="mt-1 text-xs text-neutral-500">
            Corrections stay session_accepted — never auto-promoted to community truth.
          </p>
          <textarea
            value={correction}
            onChange={(e) => setCorrection(e.target.value)}
            rows={2}
            className="mt-3 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
            placeholder="What does this expression mean to you?"
          />
          <button
            type="button"
            onClick={() => void runCorrection()}
            disabled={!correction.trim()}
            className="mt-3 rounded-lg border border-neutral-600 px-3 py-1.5 text-xs text-neutral-200 hover:border-neutral-400 disabled:opacity-40"
          >
            Save correction
          </button>
          {correctionNote ? (
            <p className="mt-2 text-xs text-neutral-400">{correctionNote}</p>
          ) : null}
        </section>
      )}

      <footer className="border-t border-neutral-900 pt-4 text-xs text-neutral-600">
        Live voice WebSocket harness (AssemblyAI) is deferred — remind later.
        Activation seed is local P1 data; STT remains swappable.
      </footer>
    </div>
  );
}
