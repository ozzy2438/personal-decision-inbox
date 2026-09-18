import { useState } from "react";
import type { ItemState, SourceKind } from "../decision/types";
import { useInbox } from "../store/inbox-context";
import { Field, TextArea, TextInput } from "./AppShell";

const SOURCES: SourceKind[] = ["paste", "email", "calendar", "slack", "meeting"];

export function CaptureModal({ onClose }: { onClose: () => void }) {
  const { capture, loadDemo, busy } = useInbox();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [from, setFrom] = useState("");
  const [source, setSource] = useState<SourceKind>("paste");
  const [dropHint, setDropHint] = useState("Drop a .json or .txt file, or paste below.");

  async function submit() {
    const state: ItemState = {
      source,
      title: title.trim() || body.trim().slice(0, 80) || "Untitled item",
      body: body.trim(),
      from: from.trim() || undefined,
    };
    if (!state.body) return;
    const item = await capture(state);
    if (item) onClose();
  }

  function onDrop(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      try {
        const parsed = JSON.parse(text) as Record<string, unknown>;
        setTitle(String(parsed.title ?? parsed.subject ?? ""));
        setBody(String(parsed.body ?? parsed.text ?? text));
        setFrom(String(parsed.from ?? parsed.sender ?? ""));
        setDropHint(`Loaded ${file.name}`);
      } catch {
        setBody(text);
        setTitle(file.name.replace(/\.[^.]+$/, ""));
        setDropHint(`Loaded ${file.name} as text`);
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-ink/70 p-0 sm:items-center sm:p-6">
      <div className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-2xl border border-rule bg-ink-2 p-5 sm:rounded-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-mute">Capture</p>
            <h2 className="font-display text-2xl">Put something on the desk</h2>
          </div>
          <button type="button" onClick={onClose} className="text-mute hover:text-paper">
            Close
          </button>
        </div>

        <div
          className="mt-4 rounded-xl border border-dashed border-rule px-4 py-6 text-center text-[13px] text-mute"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const file = event.dataTransfer.files[0];
            if (file) onDrop(file);
          }}
        >
          {dropHint}
          <label className="mt-2 block cursor-pointer text-ember-2">
            Choose a file
            <input
              type="file"
              accept=".json,.txt,.md,.eml"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onDrop(file);
              }}
            />
          </label>
        </div>

        <div className="mt-4 space-y-3">
          <Field label="Source">
            <select
              value={source}
              onChange={(event) => setSource(event.target.value as SourceKind)}
              className="w-full rounded-md border border-rule bg-ink px-3 py-2"
            >
              {SOURCES.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Title">
            <TextInput value={title} onChange={(event) => setTitle(event.target.value)} />
          </Field>
          <Field label="From">
            <TextInput value={from} onChange={(event) => setFrom(event.target.value)} />
          </Field>
          <Field label="Body">
            <TextArea value={body} onChange={(event) => setBody(event.target.value)} />
          </Field>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy || !body.trim()}
            onClick={() => void submit()}
            className="rounded-full bg-ember px-4 py-2 text-[13px] font-semibold text-ink disabled:opacity-40"
          >
            Classify
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void loadDemo().then(onClose)}
            className="rounded-full border border-rule px-4 py-2 text-[13px] text-paper-2"
          >
            Reload demo corpus
          </button>
        </div>
      </div>
    </div>
  );
}
