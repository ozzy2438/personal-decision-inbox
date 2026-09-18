const RELATIVE = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function formatWhen(iso?: string): string {
  if (!iso) return "";
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return iso;
  const deltaSec = Math.round((then - Date.now()) / 1000);
  const abs = Math.abs(deltaSec);
  if (abs < 60) return RELATIVE.format(Math.round(deltaSec), "second");
  if (abs < 3600) return RELATIVE.format(Math.round(deltaSec / 60), "minute");
  if (abs < 86400) return RELATIVE.format(Math.round(deltaSec / 3600), "hour");
  if (abs < 86400 * 14) return RELATIVE.format(Math.round(deltaSec / 86400), "day");
  return new Date(then).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
  });
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function formatScore(value: number): string {
  return value.toFixed(2);
}

export function newId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}
