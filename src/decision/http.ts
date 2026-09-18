import { evaluateState } from "./evaluate";
import type { ItemState, SourceKind } from "./types";

const SOURCES: SourceKind[] = [
  "email",
  "calendar",
  "slack",
  "meeting",
  "paste",
  "demo",
];

export type EvaluateEnv = {
  getApiKey: () => string | undefined;
};

export function defaultGetApiKey(): string | undefined {
  try {
    const fromNetlify = (
      globalThis as { Netlify?: { env?: { get: (key: string) => string | undefined } } }
    ).Netlify?.env?.get("TYPESAFE_API_KEY");
    if (fromNetlify && fromNetlify.trim()) return fromNetlify.trim();
  } catch {
    // Netlify.env is unavailable outside Functions.
  }
  const fromProcess = (globalThis as { process?: { env?: Record<string, string | undefined> } })
    .process?.env?.TYPESAFE_API_KEY;
  return fromProcess?.trim() || undefined;
}

export async function handleEvaluateRequest(
  req: Request,
  env: EvaluateEnv = { getApiKey: defaultGetApiKey },
): Promise<Response> {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Request body must be JSON" }, 400);
  }

  const state = parseState(body);
  if (!state) {
    return json(
      { error: "Body must include state.title and state.body" },
      400,
    );
  }

  const apiKey = env.getApiKey();
  try {
    const evaluation = await evaluateState(state, { apiKey });
    return json({
      answers: evaluation.answers,
      policy: evaluation.policy,
      mode: evaluation.mode,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Evaluation failed";
    if (/api key|authorization|401/i.test(message)) {
      return json({ error: "TypeSafe rejected the configured key" }, 401);
    }
    return json({ error: "TypeSafe evaluation failed" }, 502);
  }
}

function parseState(body: unknown): ItemState | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  const raw = (record.state ?? record) as Record<string, unknown>;
  if (typeof raw.title !== "string" || typeof raw.body !== "string") return null;
  if (!raw.title.trim() || !raw.body.trim()) return null;
  const source = SOURCES.includes(raw.source as SourceKind)
    ? (raw.source as SourceKind)
    : "paste";
  const participants = Array.isArray(raw.participants)
    ? raw.participants.filter((entry): entry is string => typeof entry === "string")
    : undefined;
  return {
    source,
    title: raw.title.trim(),
    body: raw.body.trim(),
    from: typeof raw.from === "string" ? raw.from : undefined,
    receivedAt: typeof raw.receivedAt === "string" ? raw.receivedAt : undefined,
    participants,
    demoId: typeof raw.demoId === "string" ? raw.demoId : undefined,
  };
}

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
