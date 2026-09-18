import type { AuditRow, InboxItem } from "../decision/types";
import { DEFAULT_THRESHOLDS, type Thresholds } from "../decision/thresholds";

const DB_NAME = "personal-decision-inbox";
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("items")) {
        db.createObjectStore("items", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("audit")) {
        db.createObjectStore("audit", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function reqToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function listItems(): Promise<InboxItem[]> {
  const db = await openDb();
  const rows = await reqToPromise(
    db.transaction("items").objectStore("items").getAll(),
  );
  db.close();
  return rows as InboxItem[];
}

export async function putItem(item: InboxItem): Promise<void> {
  const db = await openDb();
  await reqToPromise(db.transaction("items", "readwrite").objectStore("items").put(item));
  db.close();
}

export async function putItems(items: InboxItem[]): Promise<void> {
  const db = await openDb();
  const tx = db.transaction("items", "readwrite");
  const store = tx.objectStore("items");
  for (const item of items) store.put(item);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function listAudit(): Promise<AuditRow[]> {
  const db = await openDb();
  const rows = await reqToPromise(
    db.transaction("audit").objectStore("audit").getAll(),
  );
  db.close();
  return (rows as AuditRow[]).sort((a, b) => (a.at < b.at ? 1 : -1));
}

export async function putAudit(row: AuditRow): Promise<void> {
  const db = await openDb();
  await reqToPromise(db.transaction("audit", "readwrite").objectStore("audit").put(row));
  db.close();
}

export async function loadThresholds(): Promise<Thresholds> {
  const db = await openDb();
  const row = (await reqToPromise(
    db.transaction("settings").objectStore("settings").get("thresholds"),
  )) as { key: string; value: Thresholds } | undefined;
  db.close();
  return row?.value ? { ...DEFAULT_THRESHOLDS, ...row.value } : DEFAULT_THRESHOLDS;
}

export async function saveThresholds(value: Thresholds): Promise<void> {
  const db = await openDb();
  await reqToPromise(
    db
      .transaction("settings", "readwrite")
      .objectStore("settings")
      .put({ key: "thresholds", value }),
  );
  db.close();
}

export async function loadFlag(key: string): Promise<boolean> {
  const db = await openDb();
  const row = (await reqToPromise(
    db.transaction("settings").objectStore("settings").get(key),
  )) as { key: string; value: boolean } | undefined;
  db.close();
  return Boolean(row?.value);
}

export async function saveFlag(key: string, value: boolean): Promise<void> {
  const db = await openDb();
  await reqToPromise(
    db.transaction("settings", "readwrite").objectStore("settings").put({ key, value }),
  );
  db.close();
}
