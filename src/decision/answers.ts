import type { Answers, ChoiceAnswer, NoulAnswer, ScoreAnswer } from "./types";
import { BUCKETS, DOMAINS } from "./types";

export function noulAnswer(value: number): NoulAnswer {
  return { type: "noul", noul: clamp01(value) };
}

export function choiceAnswer(
  choice: string,
  options: readonly string[],
  confidence = 0.82,
): ChoiceAnswer {
  const remaining = Math.max(0, 1 - confidence);
  const others = options.filter((option) => option !== choice);
  const share = others.length === 0 ? 0 : remaining / others.length;
  const probabilities: Record<string, number> = {};
  for (const option of options) {
    probabilities[option] = option === choice ? confidence : share;
  }
  return { type: "choice", choice, probabilities, confidence };
}

export function scoreAnswer(
  score: number,
  legend: Record<string, string>,
  confidence = 0.8,
): ScoreAnswer {
  const levels = Object.keys(legend).map(Number);
  const probabilities: Record<string, number> = {};
  const peak = Math.round(clamp(score, 0, Math.max(...levels)));
  const remaining = Math.max(0, 1 - confidence);
  const others = levels.filter((level) => level !== peak);
  const share = others.length === 0 ? 0 : remaining / others.length;
  for (const level of levels) {
    probabilities[String(level)] = level === peak ? confidence : share;
  }
  return { type: "score", score, legend, probabilities, confidence };
}

export const STAKES_LEGEND = {
  "0": "Reversible and low harm if ignored or misfiled.",
  "1": "Moderate cost or awkwardness if handled late or wrongly.",
  "2": "Hard to undo: money, legal, health, or a relationship.",
};

export const URGENCY_LEGEND = {
  "0": "Can wait; no timing pressure.",
  "1": "This week, or a soft deadline.",
  "2": "Today, overdue, or an explicit ASAP.",
};

export function answersFromPartial(partial: {
  bucket: (typeof BUCKETS)[number];
  domain: (typeof DOMAINS)[number];
  needs_my_decision: number;
  needs_reply: number;
  is_time_sensitive: number;
  waiting_on_other: number;
  safe_to_auto_file: number;
  stakes: number;
  urgency: number;
  bucketConfidence?: number;
  domainConfidence?: number;
  stakesConfidence?: number;
  urgencyConfidence?: number;
}): Answers {
  return {
    bucket: choiceAnswer(
      partial.bucket,
      BUCKETS,
      partial.bucketConfidence ?? 0.84,
    ),
    needs_my_decision: noulAnswer(partial.needs_my_decision),
    needs_reply: noulAnswer(partial.needs_reply),
    is_time_sensitive: noulAnswer(partial.is_time_sensitive),
    waiting_on_other: noulAnswer(partial.waiting_on_other),
    safe_to_auto_file: noulAnswer(partial.safe_to_auto_file),
    domain: choiceAnswer(
      partial.domain,
      DOMAINS,
      partial.domainConfidence ?? 0.8,
    ),
    stakes: scoreAnswer(
      partial.stakes,
      STAKES_LEGEND,
      partial.stakesConfidence ?? 0.82,
    ),
    urgency: scoreAnswer(
      partial.urgency,
      URGENCY_LEGEND,
      partial.urgencyConfidence ?? 0.8,
    ),
  };
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
