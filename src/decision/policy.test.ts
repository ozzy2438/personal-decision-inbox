import { describe, expect, it } from "vitest";
import { answersFromPartial } from "./answers";
import { applyPolicy } from "./policy";
import { DEFAULT_THRESHOLDS } from "./thresholds";

const thresholds = DEFAULT_THRESHOLDS;

describe("applyPolicy", () => {
  it("auto-files high-safety noise with low stakes", () => {
    const result = applyPolicy(
      answersFromPartial({
        bucket: "noise",
        domain: "other",
        needs_my_decision: 0.05,
        needs_reply: 0.02,
        is_time_sensitive: 0.04,
        waiting_on_other: 0.01,
        safe_to_auto_file: 0.96,
        stakes: 0.1,
        urgency: 0.05,
        bucketConfidence: 0.93,
      }),
      thresholds,
    );
    expect(result.queue).toBe("filed");
    expect(result.reason).toMatch(/auto-filed/i);
  });

  it("auto-files low-stakes FYI with high file-safety", () => {
    const result = applyPolicy(
      answersFromPartial({
        bucket: "fyi",
        domain: "work",
        needs_my_decision: 0.12,
        needs_reply: 0.05,
        is_time_sensitive: 0.4,
        waiting_on_other: 0.02,
        safe_to_auto_file: 0.9,
        stakes: 0.25,
        urgency: 0.55,
        bucketConfidence: 0.86,
      }),
      thresholds,
    );
    expect(result.queue).toBe("filed");
  });

  it("never auto-files high-stakes items", () => {
    const result = applyPolicy(
      answersFromPartial({
        bucket: "noise",
        domain: "legal",
        needs_my_decision: 0.2,
        needs_reply: 0.1,
        is_time_sensitive: 0.2,
        waiting_on_other: 0.1,
        safe_to_auto_file: 0.95,
        stakes: 1.8,
        urgency: 0.4,
        bucketConfidence: 0.8,
      }),
      thresholds,
    );
    expect(result.queue).not.toBe("filed");
    expect(result.queue).toBe("confirm");
  });

  it("sends a confident decide bucket to Decide now", () => {
    const result = applyPolicy(
      answersFromPartial({
        bucket: "decide",
        domain: "work",
        needs_my_decision: 0.9,
        needs_reply: 0.8,
        is_time_sensitive: 0.9,
        waiting_on_other: 0.05,
        safe_to_auto_file: 0.04,
        stakes: 1.8,
        urgency: 1.8,
        bucketConfidence: 0.88,
      }),
      thresholds,
    );
    expect(result.queue).toBe("decide");
  });

  it("parks blocked work in Waiting", () => {
    const result = applyPolicy(
      answersFromPartial({
        bucket: "waiting",
        domain: "work",
        needs_my_decision: 0.14,
        needs_reply: 0.08,
        is_time_sensitive: 0.35,
        waiting_on_other: 0.91,
        safe_to_auto_file: 0.28,
        stakes: 0.65,
        urgency: 0.7,
        bucketConfidence: 0.86,
      }),
      thresholds,
    );
    expect(result.queue).toBe("waiting");
  });

  it("sends low-confidence or near-half noul items to Confirm", () => {
    const result = applyPolicy(
      answersFromPartial({
        bucket: "fyi",
        domain: "work",
        needs_my_decision: 0.49,
        needs_reply: 0.47,
        is_time_sensitive: 0.22,
        waiting_on_other: 0.15,
        safe_to_auto_file: 0.5,
        stakes: 0.45,
        urgency: 0.4,
        bucketConfidence: 0.44,
      }),
      thresholds,
    );
    expect(result.queue).toBe("confirm");
    expect(result.reason).toMatch(/0\.5|confidence/i);
  });

  it("prefers Decide now over Waiting when a personal call is required", () => {
    const result = applyPolicy(
      answersFromPartial({
        bucket: "waiting",
        domain: "work",
        needs_my_decision: 0.82,
        needs_reply: 0.6,
        is_time_sensitive: 0.5,
        waiting_on_other: 0.8,
        safe_to_auto_file: 0.1,
        stakes: 1.2,
        urgency: 1,
        bucketConfidence: 0.7,
      }),
      thresholds,
    );
    expect(result.queue).toBe("decide");
  });

  it("re-buckets when auto-file threshold rises without new answers", () => {
    const answers = answersFromPartial({
      bucket: "fyi",
      domain: "work",
      needs_my_decision: 0.12,
      needs_reply: 0.05,
      is_time_sensitive: 0.4,
      waiting_on_other: 0.02,
      safe_to_auto_file: 0.9,
      stakes: 0.25,
      urgency: 0.55,
      bucketConfidence: 0.86,
    });
    expect(applyPolicy(answers, thresholds).queue).toBe("filed");
    expect(
      applyPolicy(answers, { ...thresholds, autoFileNoul: 0.97 }).queue,
    ).toBe("confirm");
  });
});
