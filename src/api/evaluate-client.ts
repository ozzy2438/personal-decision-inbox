import type { Evaluation } from "../decision/types";
import { fixtureAnswers } from "../decision/fixture";
import { applyPolicy } from "../decision/policy";
import { DEFAULT_THRESHOLDS, type Thresholds } from "../decision/thresholds";
import type { ItemState } from "../decision/types";

export async function classifyItem(
  state: ItemState,
  thresholds: Thresholds = DEFAULT_THRESHOLDS,
): Promise<Evaluation> {
  try {
    const response = await fetch("/api/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state }),
    });
    if (response.ok) {
      const payload = (await response.json()) as Omit<Evaluation, "policy"> & {
        policy?: Evaluation["policy"];
      };
      return {
        answers: payload.answers,
        mode: payload.mode,
        policy: applyPolicy(payload.answers, thresholds),
      };
    }
  } catch {
    // Fall through to the in-browser fixture so capture still works offline.
  }
  const answers = fixtureAnswers(state);
  return {
    answers,
    mode: "fixture",
    policy: applyPolicy(answers, thresholds),
  };
}
