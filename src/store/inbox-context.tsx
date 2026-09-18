import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ingestItem } from "../api/ingest";
import { DEMO_ITEMS } from "../data/demo-corpus";
import { applyPolicy } from "../decision/policy";
import { DEFAULT_THRESHOLDS, type Thresholds } from "../decision/thresholds";
import type { AuditRow, HumanAction, InboxItem, ItemState } from "../decision/types";
import { newId } from "../lib/format";
import { isSnoozed } from "../lib/rank";
import {
  listAudit,
  listItems,
  loadFlag,
  loadThresholds,
  putAudit,
  putItem,
  putItems,
  saveFlag,
  saveThresholds,
} from "./db";

type InboxContextValue = {
  ready: boolean;
  items: InboxItem[];
  audit: AuditRow[];
  thresholds: Thresholds;
  selectedId: string | null;
  selected: InboxItem | null;
  busy: boolean;
  error: string | null;
  modeLabel: "fixture" | "live" | "mixed";
  setSelectedId: (id: string | null) => void;
  loadDemo: () => Promise<void>;
  capture: (state: ItemState) => Promise<InboxItem | null>;
  decide: (id: string, decision: string) => Promise<void>;
  confirm: (id: string) => Promise<void>;
  snooze: (id: string, until: string) => Promise<void>;
  delegate: (id: string, to: string) => Promise<void>;
  undoFile: (id: string) => Promise<void>;
  updateThresholds: (next: Thresholds) => Promise<void>;
};

const InboxContext = createContext<InboxContextValue | null>(null);

export function InboxProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState<InboxItem[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [thresholds, setThresholds] = useState<Thresholds>(DEFAULT_THRESHOLDS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const storedItems = await listItems();
      const storedAudit = await listAudit();
      const storedThresholds = await loadThresholds();
      const seeded = await loadFlag("demoLoaded");
      setThresholds(storedThresholds);
      setAudit(storedAudit);
      if (storedItems.length === 0 && !seeded) {
        const seededItems = DEMO_ITEMS.map((demo) =>
          itemFromDemo(demo.id, demo.state, demo.fixture, storedThresholds),
        );
        await putItems(seededItems);
        const row = auditRow("load_demo", seededItems[0]?.id ?? "corpus", "Loaded seeded corpus");
        await putAudit(row);
        await saveFlag("demoLoaded", true);
        setItems(seededItems);
        setAudit([row]);
        setSelectedId(seededItems[0]?.id ?? null);
      } else {
        setItems(storedItems);
        setSelectedId(storedItems[0]?.id ?? null);
      }
      setReady(true);
    })();
  }, []);

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  const modeLabel = useMemo(() => {
    const modes = new Set(items.map((item) => item.evaluationMode));
    if (modes.size === 1) return [...modes][0] as "fixture" | "live";
    if (modes.size === 0) return "fixture";
    return "mixed";
  }, [items]);

  const appendAudit = useCallback(async (action: HumanAction, itemId: string, detail?: string) => {
    const row = auditRow(action, itemId, detail);
    await putAudit(row);
    setAudit((current) => [row, ...current]);
  }, []);

  const loadDemo = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const seededItems = DEMO_ITEMS.map((demo) =>
        itemFromDemo(demo.id, demo.state, demo.fixture, thresholds),
      );
      await putItems(seededItems);
      setItems((current) => {
        const kept = current.filter((item) => !item.id.startsWith("demo_"));
        return [...seededItems, ...kept];
      });
      setSelectedId(seededItems[0]?.id ?? null);
      await saveFlag("demoLoaded", true);
      await appendAudit("load_demo", seededItems[0]?.id ?? "corpus", "Reloaded seeded corpus");
    } finally {
      setBusy(false);
    }
  }, [appendAudit, thresholds]);

  const capture = useCallback(
    async (state: ItemState) => {
      setBusy(true);
      setError(null);
      try {
        const evaluation = await ingestItem(state, thresholds);
        const item = toItem(newId("item"), state, evaluation);
        await putItem(item);
        setItems((current) => [item, ...current]);
        setSelectedId(item.id);
        await appendAudit("ingest", item.id, `${state.source}: ${state.title}`);
        return item;
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not classify that item");
        return null;
      } finally {
        setBusy(false);
      }
    },
    [appendAudit, thresholds],
  );

  const patchItem = useCallback(async (id: string, mutate: (item: InboxItem) => InboxItem) => {
    let next: InboxItem | null = null;
    setItems((current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        next = mutate(item);
        return next;
      }),
    );
    if (next) await putItem(next);
  }, []);

  const decide = useCallback(
    async (id: string, decision: string) => {
      const text = decision.trim();
      if (!text) return;
      await patchItem(id, (item) => ({
        ...item,
        decision: text,
        resolvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      await appendAudit("decide", id, text);
    },
    [appendAudit, patchItem],
  );

  const confirm = useCallback(
    async (id: string) => {
      await patchItem(id, (item) => ({
        ...item,
        queue: "filed",
        resolvedAt: undefined,
        updatedAt: new Date().toISOString(),
        decision: item.recommendedAction,
      }));
      await appendAudit("confirm", id, "Accepted the proposed action and filed it");
    },
    [appendAudit, patchItem],
  );

  const snooze = useCallback(
    async (id: string, until: string) => {
      await patchItem(id, (item) => ({
        ...item,
        snoozeUntil: until,
        updatedAt: new Date().toISOString(),
      }));
      await appendAudit("snooze", id, until);
    },
    [appendAudit, patchItem],
  );

  const delegate = useCallback(
    async (id: string, to: string) => {
      const who = to.trim();
      if (!who) return;
      await patchItem(id, (item) => ({
        ...item,
        delegateTo: who,
        queue: "waiting",
        updatedAt: new Date().toISOString(),
      }));
      await appendAudit("delegate", id, who);
    },
    [appendAudit, patchItem],
  );

  const undoFile = useCallback(
    async (id: string) => {
      await patchItem(id, (item) => ({
        ...item,
        queue: "decide",
        resolvedAt: undefined,
        updatedAt: new Date().toISOString(),
      }));
      await appendAudit("undo_file", id, "Moved back to Decide now");
    },
    [appendAudit, patchItem],
  );

  const updateThresholds = useCallback(
    async (next: Thresholds) => {
      setThresholds(next);
      await saveThresholds(next);
      setItems((current) => {
        const updated = current.map((item) => {
          const policy = applyPolicy(item.answers, next);
          return {
            ...item,
            queue: item.resolvedAt ? item.queue : policy.queue,
            recommendedAction: policy.recommendedAction,
            policyReason: policy.reason,
            updatedAt: new Date().toISOString(),
          };
        });
        void putItems(updated);
        return updated;
      });
      await appendAudit("refile", "thresholds", "Re-ran policy with new thresholds");
    },
    [appendAudit],
  );

  const value: InboxContextValue = {
    ready,
    items,
    audit,
    thresholds,
    selectedId,
    selected,
    busy,
    error,
    modeLabel,
    setSelectedId,
    loadDemo,
    capture,
    decide,
    confirm,
    snooze,
    delegate,
    undoFile,
    updateThresholds,
  };

  return <InboxContext.Provider value={value}>{children}</InboxContext.Provider>;
}

export function useInbox(): InboxContextValue {
  const value = useContext(InboxContext);
  if (!value) throw new Error("useInbox must be used inside InboxProvider");
  return value;
}

export function openItemsInQueue(
  items: InboxItem[],
  queue: InboxItem["queue"],
  now = Date.now(),
): InboxItem[] {
  return items.filter(
    (item) => item.queue === queue && !item.resolvedAt && !isSnoozed(item, now),
  );
}

function auditRow(action: HumanAction, itemId: string, detail?: string): AuditRow {
  return { id: newId("audit"), itemId, action, at: new Date().toISOString(), detail };
}

function itemFromDemo(
  demoId: string,
  state: ItemState,
  answers: InboxItem["answers"],
  thresholds: Thresholds,
): InboxItem {
  const policy = applyPolicy(answers, thresholds);
  const now = new Date().toISOString();
  return {
    id: `demo_${demoId}`,
    state: { ...state, demoId },
    answers,
    queue: policy.queue,
    recommendedAction: policy.recommendedAction,
    policyReason: policy.reason,
    createdAt: now,
    updatedAt: now,
    evaluationMode: "fixture",
  };
}

function toItem(
  id: string,
  state: ItemState,
  evaluation: {
    answers: InboxItem["answers"];
    policy: { queue: InboxItem["queue"]; recommendedAction: string; reason: string };
    mode: InboxItem["evaluationMode"];
  },
): InboxItem {
  const now = new Date().toISOString();
  return {
    id,
    state,
    answers: evaluation.answers,
    queue: evaluation.policy.queue,
    recommendedAction: evaluation.policy.recommendedAction,
    policyReason: evaluation.policy.reason,
    createdAt: now,
    updatedAt: now,
    evaluationMode: evaluation.mode,
  };
}
