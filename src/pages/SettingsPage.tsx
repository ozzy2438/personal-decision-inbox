import { useEffect, useRef, useState } from "react";
import { THRESHOLD_META, type Thresholds } from "../decision/thresholds";
import { useInbox } from "../store/inbox-context";

export function SettingsPage() {
  const { thresholds, updateThresholds, loadDemo, items } = useInbox();
  const liveCount = items.filter((item) => item.evaluationMode === "live").length;
  const [draft, setDraft] = useState(thresholds);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDraft(thresholds);
  }, [thresholds]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function setKey<K extends keyof Thresholds>(key: K, value: number) {
    const next = { ...draft, [key]: value };
    setDraft(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void updateThresholds(next);
    }, 250);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 lg:px-8">
      <h2 className="font-display text-3xl">Thresholds</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-mute">
        These numbers live in code, not in Jev. Moving a slider re-buckets stored
        answers without another model call. {liveCount} item
        {liveCount === 1 ? " was" : "s were"} classified live.
      </p>

      <div className="mt-6 space-y-5">
        {THRESHOLD_META.map((meta) => (
          <label key={meta.key} className="block rounded-xl border border-rule bg-ink-2 p-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-display text-lg">{meta.label}</span>
              <span className="tabular-nums text-ember-2">
                {draft[meta.key].toFixed(2)}
              </span>
            </div>
            <p className="mt-1 text-[13px] text-mute">{meta.hint}</p>
            <input
              type="range"
              min={meta.min}
              max={meta.max}
              step={meta.step}
              value={draft[meta.key]}
              onChange={(event) => setKey(meta.key, Number(event.target.value))}
              className="mt-3 w-full accent-ember"
            />
          </label>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-rule p-4">
        <p className="font-display text-xl">Demo corpus</p>
        <p className="mt-1 text-[13px] text-mute">
          Reloads the seeded items. Captured items stay put.
        </p>
        <button
          type="button"
          onClick={() => void loadDemo()}
          className="mt-3 rounded-full border border-rule px-4 py-2 text-[13px]"
        >
          Reload demo corpus
        </button>
      </div>
    </div>
  );
}
