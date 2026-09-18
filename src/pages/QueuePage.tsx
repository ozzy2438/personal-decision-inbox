import { useEffect } from "react";
import type { Queue } from "../decision/types";
import { sortQueue } from "../lib/rank";
import { openItemsInQueue, useInbox } from "../store/inbox-context";
import { EmptyQueue, ItemCard } from "../ui/ItemCard";
import { ItemDetail } from "../ui/ItemDetail";

const COPY: Record<Queue, { title: string; empty: string }> = {
  decide: {
    title: "Decide now",
    empty: "Nothing needs a personal call. Capture something, or check Confirm.",
  },
  confirm: {
    title: "Confirm",
    empty: "No uncertain items. Jev is either sure enough to file, or sure enough to decide.",
  },
  waiting: {
    title: "Waiting",
    empty: "Nothing is parked on someone else.",
  },
  filed: {
    title: "Filed",
    empty: "No auto-filed noise or FYI yet.",
  },
};

export function QueuePage({ queue }: { queue: Queue }) {
  const { items, selected, selectedId, setSelectedId } = useInbox();
  const visible = sortQueue(openItemsInQueue(items, queue));

  useEffect(() => {
    if (visible.length === 0) return;
    if (!selectedId || !visible.some((item) => item.id === selectedId)) {
      setSelectedId(visible[0].id);
    }
  }, [queue, selectedId, setSelectedId, visible]);

  const copy = COPY[queue];
  const selectedInQueue = selected && selected.queue === queue ? selected : visible[0] ?? null;

  return (
    <div className="grid min-h-[calc(100dvh-57px)] lg:grid-cols-[minmax(280px,420px)_1fr]">
      <section className="border-b border-rule lg:border-b-0 lg:border-r">
        <div className="px-4 py-4 lg:px-5">
          <h2 className="font-display text-2xl">{copy.title}</h2>
          <p className="text-[13px] text-mute">{visible.length} open</p>
        </div>
        <div className="space-y-2 px-3 pb-6">
          {visible.length === 0 ? (
            <EmptyQueue title="Clear" body={copy.empty} />
          ) : (
            visible.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                active={item.id === selectedInQueue?.id}
                onSelect={() => setSelectedId(item.id)}
              />
            ))
          )}
        </div>
      </section>
      <section className={selectedInQueue ? "" : "hidden lg:block"}>
        {selectedInQueue ? (
          <ItemDetail key={selectedInQueue.id} item={selectedInQueue} />
        ) : (
          <div className="hidden h-full items-center justify-center p-10 text-mute lg:flex">
            Select an item.
          </div>
        )}
      </section>
    </div>
  );
}
