import { describe, expect, it } from "vitest";
import { handleEvaluateRequest } from "./http";

describe("handleEvaluateRequest", () => {
  it("rejects non-POST", async () => {
    const response = await handleEvaluateRequest(new Request("http://inbox.test/api/evaluate"));
    expect(response.status).toBe(405);
  });

  it("rejects malformed JSON", async () => {
    const response = await handleEvaluateRequest(
      new Request("http://inbox.test/api/evaluate", {
        method: "POST",
        body: "{",
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(response.status).toBe(400);
  });

  it("rejects a body without title and body", async () => {
    const response = await handleEvaluateRequest(
      new Request("http://inbox.test/api/evaluate", {
        method: "POST",
        body: JSON.stringify({ state: { title: "Only a title" } }),
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(response.status).toBe(400);
    const payload = (await response.json()) as { error: string };
    expect(payload.error).toMatch(/title.*body/i);
  });

  it("uses the fixture evaluator when no key is configured", async () => {
    const response = await handleEvaluateRequest(
      new Request("http://inbox.test/api/evaluate", {
        method: "POST",
        body: JSON.stringify({
          state: {
            demoId: "newsletter",
            title: "This week in ops tooling (unsubscribe below)",
            body: "Five links you might like.",
          },
        }),
        headers: { "Content-Type": "application/json" },
      }),
      { getApiKey: () => undefined },
    );
    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      mode: string;
      answers: { bucket: { choice: string } };
      policy: { queue: string };
    };
    expect(payload.mode).toBe("fixture");
    expect(payload.answers.bucket.choice).toBe("noise");
    expect(payload.policy.queue).toBe("filed");
    const serialized = JSON.stringify(payload);
    expect(serialized.toLowerCase()).not.toContain("sk-");
    expect(serialized.toLowerCase()).not.toContain("api_key");
    expect(serialized.toLowerCase()).not.toContain("typesafe_api_key");
  });

  it("does not echo secrets from the request environment", async () => {
    const response = await handleEvaluateRequest(
      new Request("http://inbox.test/api/evaluate", {
        method: "POST",
        body: JSON.stringify({ state: { title: "Hi" } }),
        headers: { "Content-Type": "application/json" },
      }),
      { getApiKey: () => "secret-test-key-should-never-leak" },
    );
    const text = await response.text();
    expect(response.status).toBe(400);
    expect(text).not.toContain("secret-test-key-should-never-leak");
  });
});
