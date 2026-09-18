# Personal Decision Inbox

A personal operating inbox powered by [TypeSafe AI](https://typesafe.ai) **Jev**. Incoming items become a queue of decisions a human can resolve. Jev classifies; code routes; you decide.

The original agency prompt was missing from this repository. The reconstructed spec lives in [docs/PROMPT.md](docs/PROMPT.md). This app implements that spec end to end.

## What it does

Jev is a System One model: state in, typed Choice / Score / Noul answers out. It does not generate text. This product uses one speculative fan-out per item, then a deterministic policy that buckets the item into:

- **Decide now** — you have a call to make
- **Confirm** — the model is only moderately sure
- **Waiting** — blocked on someone else
- **Filed** — high-confidence noise or FYI, reversible

Human actions (Decide, Confirm, Snooze, Delegate, Undo file) write an audit log. Threshold changes re-run policy on stored answers without another model call.

Jev is never treated as permission to send mail, spend money, or delete data.

## Architecture

```
ingest (demo / paste / JSON)
        │
        ▼
  POST /api/evaluate     ← Netlify Function; only place TYPESAFE_API_KEY exists
        │
        ├─ live: TypeSafeClient.systemOne (jev-latest)
        └─ no key: fixture evaluator
        │
        ▼
  answers (Choice / Noul / Score)
        │
        ▼
  policy engine (browser)  ← thresholds live here
        │
        ▼
  IndexedDB inbox + audit log
        │
        ▼
  Inbox UI
```

Personal data stays in the browser. The function sees item state only long enough to classify it.

Questions: [`src/decision/questions.ts`](src/decision/questions.ts)
Policy: [`src/decision/policy.ts`](src/decision/policy.ts)
Thresholds: [`src/decision/thresholds.ts`](src/decision/thresholds.ts)

## Fixture vs live

| Mode | When | What happens |
|---|---|---|
| Fixture | `TYPESAFE_API_KEY` unset, or `/api/evaluate` unreachable | Deterministic labeled answers for the demo corpus; heuristics for pasted text |
| Live | Key set on the Netlify Function | `POST https://api.typesafe.ai/v1/systemone` via `@typesafe-ai/sdk` |

The UI banner shows which mode classified the selected item. Demo corpus items keep their fixture answers so the four queues are never empty.

## Run locally

Node 22+.

```sh
npm install
cp .env.example .env
npm test
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). The Netlify Vite plugin serves `POST /api/evaluate` during `npm run dev`. Without a key, every classify call uses the fixture evaluator.

To classify with Jev, put a TypeSafe key in `.env` as `TYPESAFE_API_KEY` (never `VITE_…`). Restart the dev server.

## Deploy on Netlify

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"
```

1. Create a Netlify site from this repo.
2. Set the environment variable `TYPESAFE_API_KEY` on the site (Functions, not a `VITE_` public var).
3. Deploy. The SPA fallback is already in `netlify.toml`; `/api/evaluate` is the function path.

Without the key, the production site still runs in fixture mode.

## Tests

```sh
npm test
npm run typecheck
npm run build
```

CI runs the same three commands. The policy matrix covers auto-file, uncertain confirm, high-stakes never auto-file, and waiting.

## Scope

v1 does not include live Gmail/Calendar/Slack OAuth, LLM reply drafting, multi-tenant billing, or a hosted database. The connector interface in `src/connectors/` is the extension point for a later mail adapter.
