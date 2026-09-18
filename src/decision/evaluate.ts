import { TypeSafeClient } from "@typesafe-ai/sdk";
import { fixtureAnswers } from "./fixture";
import { applyPolicy } from "./policy";
import { buildSdkQuestions } from "./questions";
import { DEFAULT_THRESHOLDS, type Thresholds } from "./thresholds";
import type {
  Answers,
  ChoiceAnswer,
  Evaluation,
  ItemState,
  NoulAnswer,
  ScoreAnswer,
} from "./types";

export async function evaluateState(
  state: ItemState,
  options: { apiKey?: string; thresholds?: Thresholds } = {},
): Promise<Evaluation> {
  const thresholds = options.thresholds ?? DEFAULT_THRESHOLDS;
  const apiKey = options.apiKey?.trim();
  if (apiKey) {
    const answers = await liveAnswers(state, apiKey);
    return {
      answers,
      policy: applyPolicy(answers, thresholds),
      mode: "live",
    };
  }
  const answers = fixtureAnswers(state);
  return {
    answers,
    policy: applyPolicy(answers, thresholds),
    mode: "fixture",
  };
}

async function liveAnswers(state: ItemState, apiKey: string): Promise<Answers> {
  const client = new TypeSafeClient({ apiKey });
  const result = await client.systemOne({
    state,
    model: "jev-latest",
    questions: buildSdkQuestions(),
  });
  return normalizeAnswers(result.answers as Record<string, unknown>);
}

function normalizeAnswers(raw: Record<string, unknown>): Answers {
  return {
    bucket: asChoice(raw.bucket),
    needs_my_decision: asNoul(raw.needs_my_decision),
    needs_reply: asNoul(raw.needs_reply),
    is_time_sensitive: asNoul(raw.is_time_sensitive),
    waiting_on_other: asNoul(raw.waiting_on_other),
    safe_to_auto_file: asNoul(raw.safe_to_auto_file),
    domain: asChoice(raw.domain),
    stakes: asScore(raw.stakes),
    urgency: asScore(raw.urgency),
  };
}

function asChoice(value: unknown): ChoiceAnswer {
  const record = asRecord(value);
  const probabilities = asNumberMap(record.probabilities);
  return {
    type: "choice",
    choice: String(record.choice ?? ""),
    probabilities,
    confidence: numberOr(record.confidence, 0),
  };
}

function asNoul(value: unknown): NoulAnswer {
  const record = asRecord(value);
  return { type: "noul", noul: numberOr(record.noul, 0) };
}

function asScore(value: unknown): ScoreAnswer {
  const record = asRecord(value);
  return {
    type: "score",
    score: numberOr(record.score, 0),
    legend: asStringMap(record.legend),
    probabilities: asNumberMap(record.probabilities),
    confidence: numberOr(record.confidence, 0),
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object") return value as Record<string, unknown>;
  throw new Error("Malformed TypeSafe answer");
}

function asNumberMap(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object") return {};
  const out: Record<string, number> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    out[key] = numberOr(entry, 0);
  }
  return out;
}

function asStringMap(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") return {};
  const out: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    out[key] = String(entry);
  }
  return out;
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

