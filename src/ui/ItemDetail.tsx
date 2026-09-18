import { useState } from "react";
import type { Answers, InboxItem } from "../decision/types";
import { formatPercent, formatScore, formatWhen } from "../lib/format";
import { useInbox } from "../store/inbox-context";
import { Field, TextInput } from "./AppShell";

export function ItemDetail({ item }: { item: InboxItem }) {
  const { decide, confirm, snooze, delegate, undoFile, busy } = useInbox();
  const [decision, setDecision] = useState(item.decision ?? "");
  const [delegateTo, setDelegateTo] = useState(item.delegateTo ?? "");

  const snoozeUntil = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();

  return (
    <article className="flex h-full flex-col overflow-y-auto px-4 py-5 lg:px-6">
      <p className="text-[11px] uppercase tracking-[0.18em] text-mute">
        {item.state.source}
        {item.state.from ? ` · ${item.state.from}` : ""}
        {item.evaluationMode === "live" ? " · live Jev" : " · fixture"}
      </p>
      <h2 className="mt-2 font-display text-[32px] leading-tight">{item.state.title}</h2>
      <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-paper-2">
        {item.state.body}
      </p>

      <div className="mt-6 rounded-xl border border-rule bg-ink-2 p-4">
        <p className="text-[11px] uppercase tracking-[0.16em] text-mute">Policy</p>
        <p className="mt-1 font-display text-xl">{item.recommendedAction}</p>
        <p className="mt-2 text-[13px] leading-relaxed text-mute">{item.policyReason}</p>
      </div>

      <AnswerMap answers={item.answers} />

      {item.resolvedAt ? (
        <p className="mt-5 text-[13px] text-wait-2">
          Recorded {formatWhen(item.resolvedAt)}
          {item.decision ? ` — ${item.decision}` : ""}
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          <Field label="Your call">
            <TextInput
              value={decision}
              placeholder="Yes / no / the option you picked"
              onChange={(event) => setDecision(event.target.value)}
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void decide(item.id, decision || item.recommendedAction)}
              className="rounded-full bg-ember px-4 py-2 text-[13px] font-semibold text-ink"
            >
              Decide
            </button>
            {item.queue === "confirm" ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void confirm(item.id)}
                className="rounded-full border border-confirm px-4 py-2 text-[13px] text-confirm"
              >
                Confirm
              </button>
            ) : null}
            {item.queue === "filed" ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void undoFile(item.id)}
                className="rounded-full border border-rule px-4 py-2 text-[13px]"
              >
                Undo file
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => void snooze(item.id, snoozeUntil)}
                className="rounded-full border border-rule px-4 py-2 text-[13px]"
              >
                Snooze 1 day
              </button>
            )}
          </div>
          <Field label="Delegate">
            <div className="flex gap-2">
              <TextInput
                value={delegateTo}
                placeholder="Name of the person who owns the next step"
                onChange={(event) => setDelegateTo(event.target.value)}
              />
              <button
                type="button"
                disabled={busy || !delegateTo.trim()}
                onClick={() => void delegate(item.id, delegateTo)}
                className="shrink-0 rounded-full border border-wait px-3 py-2 text-[13px] text-wait-2"
              >
                Park
              </button>
            </div>
          </Field>
        </div>
      )}
    </article>
  );
}

function AnswerMap({ answers }: { answers: Answers }) {
  const nouls = [
    ["Needs my decision", answers.needs_my_decision.noul],
    ["Needs a reply", answers.needs_reply.noul],
    ["Time-sensitive", answers.is_time_sensitive.noul],
    ["Waiting on someone", answers.waiting_on_other.noul],
    ["Safe to auto-file", answers.safe_to_auto_file.noul],
  ] as const;

  return (
    <section className="mt-6">
      <p className="text-[11px] uppercase tracking-[0.16em] text-mute">Jev answers</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <ChoiceBlock label="Bucket" answer={answers.bucket} />
        <ChoiceBlock label="Domain" answer={answers.domain} />
        <ScoreBlock label="Stakes" answer={answers.stakes} />
        <ScoreBlock label="Urgency" answer={answers.urgency} />
      </div>
      <div className="mt-4 space-y-3">
        {nouls.map(([label, value]) => (
          <NoulBar key={label} label={label} value={value} />
        ))}
      </div>
    </section>
  );
}

function ChoiceBlock({
  label,
  answer,
}: {
  label: string;
  answer: Answers["bucket"];
}) {
  return (
    <div className="rounded-lg border border-rule p-3">
      <p className="text-[11px] uppercase tracking-[0.14em] text-mute">{label}</p>
      <p className="mt-1 font-display text-xl">{answer.choice}</p>
      <p className="text-[12px] text-mute">confidence {formatPercent(answer.confidence)}</p>
      <div className="mt-2 space-y-1">
        {Object.entries(answer.probabilities)
          .sort((a, b) => b[1] - a[1])
          .map(([key, value]) => (
            <div key={key} className="flex items-center gap-2 text-[12px]">
              <span className="w-24 truncate text-mute">{key}</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-3">
                <span
                  className="block h-full bg-ember-2"
                  style={{ width: `${Math.round(value * 100)}%` }}
                />
              </span>
              <span className="w-10 text-right tabular-nums">{formatPercent(value)}</span>
            </div>
          ))}
      </div>
    </div>
  );
}

function ScoreBlock({
  label,
  answer,
}: {
  label: string;
  answer: Answers["stakes"];
}) {
  return (
    <div className="rounded-lg border border-rule p-3">
      <p className="text-[11px] uppercase tracking-[0.14em] text-mute">{label}</p>
      <p className="mt-1 font-display text-xl">{formatScore(answer.score)}</p>
      <p className="text-[12px] text-mute">confidence {formatPercent(answer.confidence)}</p>
      <p className="mt-2 text-[12px] leading-relaxed text-paper-2">
        {answer.legend[String(Math.round(answer.score))] ??
          Object.values(answer.legend)[0]}
      </p>
    </div>
  );
}

function NoulBar({ label, value }: { label: string; value: number }) {
  const uncertain = value >= 0.4 && value <= 0.6;
  return (
    <div>
      <div className="flex justify-between text-[12px]">
        <span className="text-mute">{label}</span>
        <span className={uncertain ? "text-confirm" : "text-paper"}>{formatPercent(value)}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-3">
        <span
          className={`block h-full ${uncertain ? "bg-confirm" : "bg-wait-2"}`}
          style={{ width: `${Math.round(value * 100)}%` }}
        />
      </div>
    </div>
  );
}
