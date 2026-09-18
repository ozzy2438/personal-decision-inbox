import type { Answers, PolicyResult } from "./types";
import type { Thresholds } from "./thresholds";

function nearHalf(noul: number, thresholds: Thresholds): boolean {
  return (
    noul >= thresholds.uncertainNoulLow && noul <= thresholds.uncertainNoulHigh
  );
}

function recommendedAction(queue: PolicyResult["queue"], answers: Answers): string {
  if (queue === "decide") {
    if (answers.needs_reply.noul >= 0.6) return "Choose a reply, then send it yourself.";
    if (answers.bucket.choice === "commitment") return "Name the next step you already promised.";
    return "Make the call. Nothing leaves this inbox on its own.";
  }
  if (queue === "waiting") {
    return "Park it. Chase only if the wait becomes the decision.";
  }
  if (queue === "filed") {
    return "File it. Undo from Filed if that was the wrong call.";
  }
  if (answers.bucket.choice === "fyi") {
    return "Skim once, then confirm filing.";
  }
  return "Confirm the proposed bucket before it moves.";
}

/**
 * Code owns composition. High stakes never auto-file.
 * Order: decide → waiting → auto-file → uncertain confirm.
 */
export function applyPolicy(answers: Answers, thresholds: Thresholds): PolicyResult {
  const highStakes = answers.stakes.score >= thresholds.highStakesMin;
  const decideSignal =
    answers.needs_my_decision.noul >= thresholds.needsDecisionNoul ||
    (answers.bucket.choice === "decide" &&
      answers.bucket.confidence >= thresholds.decideConfidence) ||
    (answers.bucket.choice === "commitment" &&
      answers.bucket.confidence >= thresholds.decideConfidence);

  if (decideSignal) {
    const reason = highStakes
      ? "Needs a personal call, and the stakes are high enough that auto-file is blocked."
      : "Needs a personal call (decision noul or a confident decide/commitment bucket).";
    const queue = "decide" as const;
    return { queue, recommendedAction: recommendedAction(queue, answers), reason };
  }

  const waitingSignal =
    answers.bucket.choice === "waiting" ||
    answers.waiting_on_other.noul >= thresholds.waitingNoul;

  if (waitingSignal) {
    const queue = "waiting" as const;
    return {
      queue,
      recommendedAction: recommendedAction(queue, answers),
      reason: "Progress is blocked on someone else, so this sits in Waiting.",
    };
  }

  const fileableBucket =
    answers.bucket.choice === "noise" || answers.bucket.choice === "fyi";
  const autoFile =
    !highStakes &&
    fileableBucket &&
    answers.safe_to_auto_file.noul >= thresholds.autoFileNoul &&
    answers.stakes.score < thresholds.highStakesMin;

  if (autoFile) {
    const queue = "filed" as const;
    return {
      queue,
      recommendedAction: recommendedAction(queue, answers),
      reason:
        answers.bucket.choice === "noise"
          ? "Noise with high file-safety and low stakes — auto-filed, reversible."
          : "Low-stakes FYI with high file-safety — auto-filed, reversible.",
    };
  }

  const uncertain =
    answers.bucket.confidence < thresholds.confirmConfidenceFloor ||
    nearHalf(answers.needs_my_decision.noul, thresholds) ||
    nearHalf(answers.safe_to_auto_file.noul, thresholds);

  if (uncertain || highStakes) {
    const queue = "confirm" as const;
    return {
      queue,
      recommendedAction: recommendedAction(queue, answers),
      reason: highStakes
        ? "Stakes are high and there is no clear personal decision — confirm before filing."
        : "Confidence is too low, or a noul sits near 0.5 — confirm before it moves.",
    };
  }

  const queue = "confirm" as const;
  return {
    queue,
    recommendedAction: recommendedAction(queue, answers),
    reason: "No auto-file or decide rule fired — confirm the proposed action.",
  };
}
