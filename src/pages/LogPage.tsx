import { formatWhen } from "../lib/format";
import { useInbox } from "../store/inbox-context";

export function LogPage() {
  const { audit, items, setSelectedId } = useInbox();
  const byId = new Map(items.map((item) => [item.id, item]));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 lg:px-8">
      <h2 className="font-display text-3xl">Decision log</h2>
      <p className="mt-2 text-[14px] text-mute">
        Every capture, call, snooze, and threshold refile. Nothing leaves without a row.
      </p>
      <ol className="mt-6 space-y-2">
        {audit.length === 0 ? (
          <li className="rounded-xl border border-dashed border-rule px-4 py-10 text-center text-mute">
            The log is empty.
          </li>
        ) : (
          audit.map((row) => {
            const item = byId.get(row.itemId);
            return (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => item && setSelectedId(item.id)}
                  className="w-full rounded-xl border border-rule bg-ink-2 px-4 py-3 text-left hover:border-mute"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[11px] uppercase tracking-[0.16em] text-ember-2">
                      {row.action.replace("_", " ")}
                    </span>
                    <span className="text-[12px] text-mute">{formatWhen(row.at)}</span>
                  </div>
                  <p className="mt-1 font-display text-lg">
                    {item?.state.title ?? row.itemId}
                  </p>
                  {row.detail ? (
                    <p className="mt-1 text-[13px] text-paper-2">{row.detail}</p>
                  ) : null}
                </button>
              </li>
            );
          })
        )}
      </ol>
    </div>
  );
}
