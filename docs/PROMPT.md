# Agency prompt — Personal Decision Inbox

This is the reconstructed build prompt for a **Personal Decision Inbox** powered by TypeSafe AI (Jev). The original prompt file was never committed to the empty repository; this document is the agency-ready spec the product implements.

## Outcome

Ship a working personal operating inbox. Incoming items (emails, calendar notes, Slack-like messages, meeting notes, pasted text) become a **decision queue**, not another mail client.

Jev never writes replies and never executes side effects. It returns typed judgments. Application code owns routing, thresholds, and persistence. A human owns every irreversible call.

## Queues

| Queue | Meaning |
|---|---|
| Decide now | The user must choose |
| Confirm | Jev is only moderately sure; show the proposed action |
| Waiting | Blocked on someone else |
| Filed | High-confidence noise or FYI; auto-filed and reversible |

Human actions: **Decide**, **Confirm**, **Snooze**, **Delegate**, **Undo file**. Every action writes an audit row.

## Architecture

- Vite + React + TypeScript SPA on Netlify
- One Netlify Function, `POST /api/evaluate`, is the only place `TYPESAFE_API_KEY` may exist (`Netlify.env.get`)
- Personal items live in IndexedDB in the browser. PII is not stored on the host
- When no API key is configured, a fixture evaluator returns labeled answers so the product is usable in CI and as a public demo

## Jev contract

One speculative fan-out per item against `jev-latest` (`POST https://api.typesafe.ai/v1/systemone`).

| ID | Type | Purpose |
|---|---|---|
| `bucket` | Choice | `decide` / `fyi` / `noise` / `waiting` / `commitment` |
| `needs_my_decision` | Noul | User must choose |
| `needs_reply` | Noul | Expects a response |
| `is_time_sensitive` | Noul | Deadline or ASAP |
| `waiting_on_other` | Noul | Blocked on someone else |
| `safe_to_auto_file` | Noul | Reversible file-away |
| `domain` | Choice | `work` / `personal` / `money` / `health` / `legal` / `social` / `other` |
| `stakes` | Score | Reversible → moderate → hard to undo |
| `urgency` | Score | Can wait → this week → today |

Questions live in one file. Policy and thresholds live in adjacent files. Changing a threshold re-runs **policy only**.

### Policy (code, not the model)

- High stakes (`stakes.score >= 0.7`) never auto-file
- `needs_my_decision.noul >= 0.7` or (`bucket === decide` and `confidence >= 0.6`) → Decide now
- `bucket === waiting` or `waiting_on_other.noul >= 0.7` → Waiting
- `bucket === noise` (or low-stakes FYI) and `safe_to_auto_file.noul >= 0.85` and `stakes.score < 0.7` → Filed
- `bucket.confidence < 0.6` or a noul near `0.5` → Confirm
- Jev is never treated as permission to send mail, spend money, or delete data

## UI

Editorial productivity UI: ranked cards, original item, full answer map, policy explanation, threshold sliders, empty/error/fixture banners. Desktop list + detail; mobile stacked with a bottom nav.

## Integrations (v1)

Demo corpus, paste/drop text or JSON, classify-then-store helper. Connector interface so a Gmail adapter can be added later. No live OAuth in v1.

## Out of scope

Live Gmail/Calendar/Slack OAuth, LLM reply drafting, multi-tenant SaaS/billing, hosted database.
