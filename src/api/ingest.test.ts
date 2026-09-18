import { describe, expect, it } from "vitest";
import { ingestItem } from "./ingest";
import { DEFAULT_THRESHOLDS } from "../decision/thresholds";

describe("ingestItem", () => {
  it("falls back to the fixture evaluator when /api/evaluate is unreachable", async () => {
    const evaluation = await ingestItem(
      {
        source: "paste",
        title: "Weekly newsletter — unsubscribe inside",
        body: "Five links from our digest. This is promotional mail from noreply@example.com.",
      },
      DEFAULT_THRESHOLDS,
    );
    expect(evaluation.mode).toBe("fixture");
    expect(evaluation.policy.queue).toBe("filed");
    expect(evaluation.answers.bucket.choice).toBe("noise");
  });
});
