import { useState, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import type { Queue } from "../decision/types";
import { useInbox, openItemsInQueue } from "../store/inbox-context";
import { CaptureModal } from "./CaptureModal";

const NAV: { to: string; label: string; queue?: Queue }[] = [
  { to: "/", label: "Decide", queue: "decide" },
  { to: "/confirm", label: "Confirm", queue: "confirm" },
  { to: "/waiting", label: "Waiting", queue: "waiting" },
  { to: "/filed", label: "Filed", queue: "filed" },
  { to: "/log", label: "Log" },
  { to: "/settings", label: "Settings" },
];

export function AppShell() {
  const { items, ready, modeLabel, error, busy } = useInbox();
  const [captureOpen, setCaptureOpen] = useState(false);
  const location = useLocation();
  const decideCount = openItemsInQueue(items, "decide").length;

  return (
    <div className="min-h-dvh bg-ink text-paper">
      <div className="mx-auto flex min-h-dvh max-w-[1400px] flex-col lg:flex-row">
        <aside className="hidden w-[220px] shrink-0 border-r border-rule lg:flex lg:flex-col">
          <div className="px-5 pb-6 pt-7">
            <p className="font-display text-[11px] uppercase tracking-[0.22em] text-mute">
              Personal
            </p>
            <h1 className="mt-1 font-display text-[28px] leading-none text-paper">
              Decision
              <br />
              Inbox
            </h1>
          </div>
          <nav className="flex flex-1 flex-col gap-0.5 px-3">
            {NAV.map((entry) => (
              <NavItem
                key={entry.to}
                to={entry.to}
                label={entry.label}
                count={
                  entry.queue ? openItemsInQueue(items, entry.queue).length : undefined
                }
              />
            ))}
          </nav>
          <div className="px-5 py-5 text-[12px] text-mute">
            <ModeChip mode={modeLabel} />
            <p className="mt-2 leading-relaxed">
              Jev classifies. Code routes. You decide.
            </p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between gap-3 border-b border-rule px-4 py-3 lg:px-8">
            <div>
              <p className="font-display text-[13px] text-mute lg:hidden">Decision Inbox</p>
              <p className="text-[13px] text-paper-2">
                {ready
                  ? `${decideCount} call${decideCount === 1 ? "" : "s"} waiting`
                  : "Opening the desk…"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="lg:hidden">
                <ModeChip mode={modeLabel} />
              </span>
              <button
                type="button"
                onClick={() => setCaptureOpen(true)}
                className="rounded-full bg-ember px-4 py-2 text-[13px] font-semibold text-ink hover:bg-ember-2"
              >
                Capture
              </button>
            </div>
          </header>

          {error ? (
            <div className="border-b border-ember/40 bg-ember/10 px-4 py-2 text-[13px] text-ember-2 lg:px-8">
              {error}
            </div>
          ) : null}
          {busy ? (
            <div className="border-b border-rule px-4 py-2 text-[12px] uppercase tracking-[0.16em] text-mute lg:px-8">
              Classifying…
            </div>
          ) : null}

          <main className="min-h-0 flex-1 pb-20 lg:pb-0" data-path={location.pathname}>
            {ready ? <Outlet /> : <LoadingDesk />}
          </main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-6 border-t border-rule bg-ink-2 lg:hidden">
        {NAV.map((entry) => (
          <NavLink
            key={entry.to}
            to={entry.to}
            end={entry.to === "/"}
            className={({ isActive }) =>
              `py-3 text-center text-[11px] ${isActive ? "text-ember-2" : "text-mute"}`
            }
          >
            {entry.label}
          </NavLink>
        ))}
      </nav>

      {captureOpen ? <CaptureModal onClose={() => setCaptureOpen(false)} /> : null}
    </div>
  );
}

function NavItem({
  to,
  label,
  count,
}: {
  to: string;
  label: string;
  count?: number;
}) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        `flex items-baseline justify-between rounded-md px-3 py-2 text-[14px] ${
          isActive ? "bg-ink-3 text-paper" : "text-mute hover:bg-ink-2 hover:text-paper"
        }`
      }
    >
      <span>{label}</span>
      {typeof count === "number" ? (
        <span className="font-display text-[15px] tabular-nums">{count}</span>
      ) : null}
    </NavLink>
  );
}

function ModeChip({ mode }: { mode: "fixture" | "live" | "mixed" }) {
  const label =
    mode === "live" ? "Live Jev" : mode === "mixed" ? "Live + fixture" : "Fixture mode";
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-rule px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-paper-2">
      <span
        className={`size-1.5 rounded-full ${mode === "live" ? "bg-wait-2" : "bg-confirm"}`}
      />
      {label}
    </span>
  );
}

function LoadingDesk() {
  return (
    <div className="flex h-full items-center justify-center px-6 py-20 text-mute">
      Opening the desk…
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.16em] text-mute">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-md border border-rule bg-ink-2 px-3 py-2 text-paper outline-none focus:border-ember"
    />
  );
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="min-h-32 w-full rounded-md border border-rule bg-ink-2 px-3 py-2 text-paper outline-none focus:border-ember"
    />
  );
}

