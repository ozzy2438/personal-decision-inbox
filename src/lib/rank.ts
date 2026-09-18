import type { InboxItem } from "../decision/types";

export function rankItem(item: InboxItem, now = Date.now()): number {
  if (item.snoozeUntil && Date.parse(item.snoozeUntil) > now) return -1;
  if (item.resolvedAt) return 0;
  const urgency = item.answers.urgency.score;
  const stakes = item.answers.stakes.score;
  const decision = item.answers.needs_my_decision.noul;
  const time = item.answers.is_time_sensitive.noul;
  return urgency * 10 + stakes * 5 + decision * 4 + time * 3;
}

export function isSnoozed(item: InboxItem, now = Date.now()): boolean {
  return Boolean(item.snoozeUntil && Date.parse(item.snoozeUntil) > now);
}

export function sortQueue(items: InboxItem[], now = Date.now()): InboxItem[] {
  return [...items].sort((a, b) => rankItem(b, now) - rankItem(a, now));
}
