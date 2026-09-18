import type { InboxItem, Queue } from "../decision/types";
import { formatPercent, formatWhen } from "../lib/format";

const QUEUE_TONE: Record<Queue, string> = {
  decide: "text-ember-2",
  confirm: "text-confirm",
  waiting: "text-wait-2",
  filed: "text-filed",
};

export function ItemCard({
  item,
  active,
  onSelect,
}: {
  item: InboxItem;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-xl border px-4 py-3 text-left transition ${
        active ? "border-ember bg-ink-3" : "border-rule bg-ink-2 hover:border-mute"
      }`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-display text-[17px] leading-snug text-paper">{item.state.title}</p>
        <span className={`shrink-0 text-[11px] uppercase tracking-[0.14em] ${QUEUE_TONE[item.queue]}`}>
          {item.answers.domain.choice}
        </span>
      </div>
      <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-mute">
        {item.state.body}
      </p>
      <p className="mt-2 text-[13px] text-paper-2">{item.recommendedAction}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-paper-2">
        <span>{item.state.source}</span>
        {item.state.from ? <span>{item.state.from}</span> : null}
        <span>{formatWhen(item.state.receivedAt ?? item.createdAt)}</span>
        <span>decide {formatPercent(item.answers.needs_my_decision.noul)}</span>
        <span>file {formatPercent(item.answers.safe_to_auto_file.noul)}</span>
        <span className={QUEUE_TONE[item.queue]}>{item.queue}</span>
      </div>
    </button>
  );
}

export function EmptyQueue({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-dashed border-rule px-5 py-12 text-center">
      <p className="font-display text-2xl">{title}</p>
      <p className="mt-2 text-[14px] text-mute">{body}</p>
    </div>
  );
}
