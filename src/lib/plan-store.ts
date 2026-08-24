"use client";

/**
 * Plan persistence.
 *
 * The build prompt names TheThread.app as the backend but marks the entities
 * OPEN ("if an entity is missing, propose it before building"). The Thread has
 * no festival or plan entity — it holds threads, enrolments, tickets and
 * certificates — so there is nothing to write to yet. See
 * docs/planner-persistence.md for the proposal.
 *
 * Modelled as an external store rather than component state so the browser is
 * the source of truth, not a render pass: reading storage inside an effect and
 * calling setState is the pattern React now warns about. When the platform
 * entities land, `read` and `persist` change and no screen touches storage.
 */

import { emptyPlanFor, type PlanState } from "./plan-state";

export type { PlanState, StepState } from "./plan-state";

const KEY = "fot.plan.v1";
// Placeholder until runs come from the platform, where the festival arrives
// as the run's subject_label. Kept in step with src/app/plan/planner.tsx.
const MARKER = "example";

let cache: PlanState | null = null;
const listeners = new Set<() => void>();

function read(): PlanState {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as PlanState;
  } catch {
    // Unreadable or blocked storage: fall through to a fresh plan.
  }
  return emptyPlanFor(MARKER, "communities");
}

function persist(plan: PlanState) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(plan));
  } catch {
    // Storage full or blocked. The spec forbids a save button, so there is
    // nothing to retry against; losing a keystroke beats a dialog.
  }
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Must return a stable reference while nothing has changed. */
export function getSnapshot(): PlanState {
  cache ??= read();
  return cache;
}

/** No storage on the server; the screen renders its loading state instead. */
export function getServerSnapshot(): null {
  return null;
}

export function setPlan(next: PlanState): void {
  cache = { ...next, updatedAt: new Date().toISOString() };
  persist(cache);
  listeners.forEach((l) => l());
}
