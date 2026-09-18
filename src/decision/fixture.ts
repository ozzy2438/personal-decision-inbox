import type { DemoItem } from "../data/demo-corpus";
import { DEMO_ITEMS } from "../data/demo-corpus";
import { answersFromPartial } from "./answers";
import type { Answers, ItemState } from "./types";

const FIXTURE_BY_ID = new Map(
  DEMO_ITEMS.map((item: DemoItem) => [item.id, item.fixture] as const),
);

export function fixtureAnswers(state: ItemState): Answers {
  if (state.demoId && FIXTURE_BY_ID.has(state.demoId)) {
    return FIXTURE_BY_ID.get(state.demoId)!;
  }
  return heuristicAnswers(state);
}

function textOf(state: ItemState): string {
  return `${state.title}\n${state.body}\n${state.from ?? ""}`.toLowerCase();
}

function heuristicAnswers(state: ItemState): Answers {
  const text = textOf(state);

  if (
    /\b(newsletter|unsubscribe|receipt|noreply|no-reply|promotional)\b/.test(
      text,
    )
  ) {
    return answersFromPartial({
      bucket: "noise",
      domain: "other",
      needs_my_decision: 0.08,
      needs_reply: 0.04,
      is_time_sensitive: 0.05,
      waiting_on_other: 0.03,
      safe_to_auto_file: 0.93,
      stakes: 0.12,
      urgency: 0.1,
      bucketConfidence: 0.88,
    });
  }

  if (
    /\b(waiting on|pending|i'll send|i will send|still reviewing|blocked on)\b/.test(
      text,
    )
  ) {
    return answersFromPartial({
      bucket: "waiting",
      domain: "work",
      needs_my_decision: 0.22,
      needs_reply: 0.15,
      is_time_sensitive: 0.25,
      waiting_on_other: 0.86,
      safe_to_auto_file: 0.35,
      stakes: 0.7,
      urgency: 0.6,
      bucketConfidence: 0.8,
    });
  }

  if (
    /\b(sign|approve|offer|deadline|rsvp|choose|decision|contract|invoice)\b/.test(
      text,
    )
  ) {
    return answersFromPartial({
      bucket: "decide",
      domain: /\b(invoice|offer|\$|pay)\b/.test(text) ? "money" : "work",
      needs_my_decision: 0.86,
      needs_reply: 0.72,
      is_time_sensitive: /\b(friday|today|asap|deadline)\b/.test(text)
        ? 0.9
        : 0.55,
      waiting_on_other: 0.12,
      safe_to_auto_file: 0.08,
      stakes: /\b(sign|contract|invoice|offer)\b/.test(text) ? 1.7 : 1.1,
      urgency: /\b(friday|today|asap|deadline)\b/.test(text) ? 1.8 : 1.1,
      bucketConfidence: 0.83,
    });
  }

  return answersFromPartial({
    bucket: "fyi",
    domain: "work",
    needs_my_decision: 0.48,
    needs_reply: 0.44,
    is_time_sensitive: 0.31,
    waiting_on_other: 0.22,
    safe_to_auto_file: 0.51,
    stakes: 0.8,
    urgency: 0.7,
    bucketConfidence: 0.46,
  });
}
