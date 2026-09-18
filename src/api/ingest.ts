import type { Evaluation, ItemState } from "../decision/types";
import { DEFAULT_THRESHOLDS, type Thresholds } from "../decision/thresholds";
import { classifyItem } from "./evaluate-client";

/**
 * POST /api/ingest-shaped client helper.
 * Classifies via `/api/evaluate` (fixture fallback) and returns an evaluation
 * the inbox store persists in IndexedDB. Nothing is written on the host.
 */
export async function ingestItem(
  state: ItemState,
  thresholds: Thresholds = DEFAULT_THRESHOLDS,
): Promise<Evaluation> {
  return classifyItem(state, thresholds);
}
