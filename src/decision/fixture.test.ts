import { describe, expect, it } from "vitest";
import { DEMO_ITEMS } from "../data/demo-corpus";
import { fixtureAnswers } from "./fixture";
import { applyPolicy } from "./policy";
import { DEFAULT_THRESHOLDS } from "./thresholds";

describe("fixtureAnswers", () => {
  it("returns labeled answers for every demo id", () => {
    for (const item of DEMO_ITEMS) {
      const answers = fixtureAnswers(item.state);
      expect(answers.bucket.choice).toBe(item.fixture.bucket.choice);
      expect(answers.needs_my_decision.noul).toBe(
        item.fixture.needs_my_decision.noul,
      );
    }
  });

  it("puts the demo corpus into all four queues", () => {
    const queues = new Set(
      DEMO_ITEMS.map((item) => applyPolicy(item.fixture, DEFAULT_THRESHOLDS).queue),
    );
    expect(queues).toEqual(new Set(["decide", "confirm", "waiting", "filed"]));
  });

  it("treats newsletters as noise", () => {
    const answers = fixtureAnswers({
      source: "paste",
      title: "Weekly newsletter — unsubscribe inside",
      body: "Five links from our digest. This is promotional mail from noreply@example.com.",
    });
    expect(answers.bucket.choice).toBe("noise");
    expect(applyPolicy(answers, DEFAULT_THRESHOLDS).queue).toBe("filed");
  });

  it("treats approval language as a decision", () => {
    const answers = fixtureAnswers({
      source: "paste",
      title: "Please approve the invoice today",
      body: "Need you to approve this $4,000 invoice before the Friday deadline.",
    });
    expect(answers.bucket.choice).toBe("decide");
    expect(applyPolicy(answers, DEFAULT_THRESHOLDS).queue).toBe("decide");
  });

  it("treats pending language as waiting", () => {
    const answers = fixtureAnswers({
      source: "paste",
      title: "Still pending",
      body: "Legal is still reviewing. I'll send the redline when it lands.",
    });
    expect(answers.bucket.choice).toBe("waiting");
    expect(applyPolicy(answers, DEFAULT_THRESHOLDS).queue).toBe("waiting");
  });
});
